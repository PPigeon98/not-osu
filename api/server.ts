import dotenv from 'dotenv';
import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import multer from 'multer';
import unzipper from 'unzipper';
import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import { MongoClient, Db } from 'mongodb';
import { echo } from './echo';

const execAsync = promisify(exec);

interface ErrorObject {
  error: string;
}

dotenv.config();

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

const PORT: number = parseInt(process.env.PORT || '5000');
const HOST: string = process.env.IP || '127.0.0.1';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';
let db: Db | null = null;

const connectToMongoDB = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set, MongoDB features will be disabled');
    return;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    db = null;
  }
};

// Connect to MongoDB on startup
connectToMongoDB();

// In Vercel, write beatmaps into /tmp (the only writable area).
// Locally, keep using the public/beatmaps* folders so the frontend can read them directly.
const IS_VERCEL = process.env.VERCEL === '1';

// Where raw .osz contents are extracted
const BEATMAPS_RAW_DIR = IS_VERCEL
  ? path.resolve('/tmp/beatmapsRaw')
  : path.resolve(__dirname, '../frontend/public/beatmapsRaw');

// Parsed beatmaps (.wysi, song.mp3, bg.*)
const BEATMAPS_PARSED_DIR_PUBLIC = path.resolve(__dirname, '../frontend/public/beatmaps');
const BEATMAPS_PARSED_DIR_TMP = path.resolve('/tmp/beatmaps');

// Primary parsed-dir used for writing new beatmaps
const BEATMAPS_PARSED_DIR = IS_VERCEL ? BEATMAPS_PARSED_DIR_TMP : BEATMAPS_PARSED_DIR_PUBLIC;

// Directories we read from when listing beatmaps (SongSelect should see both)
const BEATMAPS_PARSED_DIRS = IS_VERCEL
  ? [BEATMAPS_PARSED_DIR_PUBLIC, BEATMAPS_PARSED_DIR_TMP]
  : [BEATMAPS_PARSED_DIR_PUBLIC];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100mb
  },
});

// ====================================================================

function handleFunction(func: () => unknown, res: Response) {
  try {
    res.status(200).json(func());
  } catch (error) {
    const errorObj : ErrorObject = {
      error: error instanceof Error ? error.message : String(error)
    };
    return res.status(400).json(errorObj);
  }
}

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const value = req.query.value as string;

  handleFunction(() => echo(value), res);
});

// ====================================================================

// --------------------- ADD NEW ROUTES BELOW -------------------------

interface ParsedBeatmap {
  songInfo: Record<string, string | number>;
  hitObjects: Array<{
    x: number;
    y: number;
    time: number;
    type: number;
    hitSound: number;
    endTime?: number;
  }>;
}

// Very simplified difficulty calculator inspired by osu!/Quaver style strain systems.
// Produces a "star" value based mainly on note density and peak bursts.
const calculateDifficulty = (beatmap: ParsedBeatmap): number => {
  const objects = [...beatmap.hitObjects];
  if (objects.length < 2) return 0;

  // Ensure sorted by time
  objects.sort((a, b) => a.time - b.time);

  const firstTime = objects[0].time;
  const lastTime = objects[objects.length - 1].time;
  const durationSec = Math.max((lastTime - firstTime) / 1000, 1);

  const totalNps = objects.length / durationSec;

  // Compute peak notes-per-second using a sliding 1s window
  let peakNps = 0;
  let startIdx = 0;
  for (let i = 0; i < objects.length; i++) {
    const windowStartTime = objects[i].time - 1000;
    while (startIdx < i && objects[startIdx].time < windowStartTime) {
      startIdx++;
    }
    const countInWindow = i - startIdx + 1;
    const nps = countInWindow; // 1s window → count == NPS
    if (nps > peakNps) {
      peakNps = nps;
    }
  }

  // Simple combination: peak bursts matter more than overall density.
  // Tuned loosely so "normal" maps end up around 1–8 stars.
  const difficultyRaw = 0.4 * totalNps + 0.8 * peakNps;

  // Mild compression so insane bursts don't explode the scale.
  const stars = Math.log1p(difficultyRaw) * 1.5;

  return Number(stars.toFixed(2));
};

const parseOsuFile = async (osuFilePath: string, fallbackSetId?: string): Promise<{ beatmapSetId: string; beatmapId: string; data: ParsedBeatmap } | null> => {
  try {
    const content = await fs.promises.readFile(osuFilePath, 'utf8');
    const lines = content.split('\n');

    let beatmapSetId = '';
    let beatmapId = '';
    const songInfo: Record<string, string | number> = {};
    const hitObjects: Array<{
      x: number;
      y: number;
      time: number;
      type: number;
      hitSound: number;
      endTime?: number;
    }> = [];

    const wantedKeys = {
      general: ['AudioFilename', 'AudioLeadIn', 'PreviewTime', 'Mode'],
      metadata: ['Title', 'TitleUnicode', 'Artist', 'ArtistUnicode', 'Creator', 'Version', 'BeatmapID', 'BeatmapSetID'],
      difficulty: ['CircleSize', 'ApproachRate']
    };

    let currentSection = '';
    let inHitObjects = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        inHitObjects = currentSection === 'HitObjects';
        continue;
      }

      if (!trimmed || trimmed.startsWith('//')) {
        continue;
      }

      if (currentSection === 'General') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.general.includes(key)) {
            if (key === 'AudioLeadIn' || key === 'PreviewTime' || key === 'Mode') {
              songInfo[key] = parseInt(value, 10) || 0;
            } else {
              songInfo[key] = value;
            }
          }
        }
      }

      else if (currentSection === 'Metadata') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.metadata.includes(key)) {
            if (key === 'BeatmapID' || key === 'BeatmapSetID') {
              songInfo[key] = parseInt(value, 10) || 0;
              if (key === 'BeatmapSetID') beatmapSetId = value;
              if (key === 'BeatmapID') beatmapId = value;
            } else {
              songInfo[key] = value;
            }
          }
        }
      }

      else if (currentSection === 'Difficulty') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.difficulty.includes(key)) {
            songInfo[key] = parseFloat(value) || 0;
          }
        }
      }

      else if (currentSection === 'Events') {
        if (trimmed.startsWith('0,0,')) {
          const parts = trimmed.split(',');
          let filename = parts[2].trim();

          if (filename.startsWith('"') && filename.endsWith('"')) {
            filename = filename.slice(1, -1);
          }

          songInfo['BackgroundFilename'] = filename;
          songInfo['BackgroundXOffset'] = parseInt(parts[3] || '0', 10);
          songInfo['BackgroundYOffset'] = parseInt(parts[4] || '0', 10);
        }
      }

      else if (inHitObjects) {
        if (trimmed && !trimmed.startsWith('[')) {
          const parts = trimmed.split(',');
          if (parts.length >= 5) {
            const type = parseInt(parts[3], 10);
            const hitSound = parseInt(parts[4] || '0', 10);
            let endTime: number | undefined;

            if (type === 7 && parts.length >= 6) {
              const endPart = parts[5].split(':')[0];
              const parsedEnd = parseInt(endPart, 10);
              if (!Number.isNaN(parsedEnd)) {
                endTime = parsedEnd;
              }
            }

            hitObjects.push({
              x: parseInt(parts[0], 10),
              y: parseInt(parts[1], 10),
              time: parseInt(parts[2], 10),
              type,
              hitSound,
              endTime,
            });
          }
        }
      }
    }

    // Use Unicode versions as fallback if non-Unicode versions don't exist
    if (!songInfo['Title'] && songInfo['TitleUnicode']) {
      songInfo['Title'] = songInfo['TitleUnicode'];
    }
    if (!songInfo['Artist'] && songInfo['ArtistUnicode']) {
      songInfo['Artist'] = songInfo['ArtistUnicode'];
    }

    // Fallback: use folder name as BeatmapSetID if missing
    if (!beatmapSetId) {
      if (fallbackSetId) {
        beatmapSetId = fallbackSetId;
        songInfo['BeatmapSetID'] = parseInt(fallbackSetId, 10) || 0;
      } else {
        const folderName = path.basename(path.dirname(osuFilePath));
        beatmapSetId = folderName;
        songInfo['BeatmapSetID'] = parseInt(folderName, 10) || 0;
      }
      console.log(`Using fallback BeatmapSetID: ${beatmapSetId}`);
    }

    // Fallback: generate BeatmapID from filename hash if missing
    if (!beatmapId) {
      const fileName = path.basename(osuFilePath, '.osu');
      const hash = createHash('md5').update(fileName).digest('hex');
      const first8 = parseInt(hash.substring(0, 8), 16);
      const last8 = parseInt(hash.substring(hash.length - 8), 16);
      const hashNum = first8 * last8;
      beatmapId = String(hashNum);
      songInfo['BeatmapID'] = hashNum;
      console.log(`Generated fallback BeatmapID: ${beatmapId} from filename: ${fileName}`);
    }

    // Only accept mode 1 (Taiko) or mode 3 (Mania)
    const mode = songInfo['Mode'] as number;
    if (mode !== 1 && mode !== 3) {
      console.warn(`Mode ${mode} not supported (only 1 or 3) in ${osuFilePath} - skipping`);
      return null;
    }

    return {
      beatmapSetId,
      beatmapId,
      data: { songInfo, hitObjects }
    };
  } catch (error) {
    console.error(`Failed to parse ${osuFilePath}:`, error);
    return null;
  }
};

const parseBeatmapsFromFolder = async (folderPath: string): Promise<void> => {
  try {
    const osuFiles = await fg('**/*.osu', { cwd: folderPath, absolute: true });
    const folderName = path.basename(folderPath);
    
    console.log(`Parsing beatmaps from folder: ${folderPath}`);
    console.log(`Found ${osuFiles.length} .osu file(s)`);

    // Parse all files first to get the beatmapSetId
    const parsedFiles: Array<{ osuFile: string; parsed: { beatmapSetId: string; beatmapId: string; data: ParsedBeatmap } | null }> = [];
    for (const osuFile of osuFiles) {
      console.log(`Parsing: ${osuFile}`);
      const parsed = await parseOsuFile(osuFile, folderName);
      parsedFiles.push({ osuFile, parsed });
    }

    // Group by beatmapSetId and process shared resources once
    const beatmapSets = new Map<string, Array<{ osuFile: string; parsed: { beatmapSetId: string; beatmapId: string; data: ParsedBeatmap } }>>();
    for (const { osuFile, parsed } of parsedFiles) {
      if (!parsed) continue;
      const { beatmapSetId } = parsed;
      if (!beatmapSets.has(beatmapSetId)) {
        beatmapSets.set(beatmapSetId, []);
      }
      beatmapSets.get(beatmapSetId)!.push({ osuFile, parsed });
    }

    // Process each beatmap set
    for (const [beatmapSetId, files] of beatmapSets) {
      const parsedFolder = path.join(BEATMAPS_PARSED_DIR, beatmapSetId);
      await fs.promises.mkdir(parsedFolder, { recursive: true });

      // Collect all unique audio files from all beatmaps in the set
      const audioFilesMap = new Map<string, { sourcePath: string; originalFilename: string }>();
      const audioHasSilenceMap = new Map<string, boolean>();
      
      for (const file of files) {
        const audioFilename = String(file.parsed.data.songInfo['AudioFilename'] || '');
        if (audioFilename && !audioFilesMap.has(audioFilename)) {
          const sourceAudioPath = path.join(path.dirname(file.osuFile), audioFilename);
          audioFilesMap.set(audioFilename, {
            sourcePath: sourceAudioPath,
            originalFilename: audioFilename
          });
        }
      }

      // Process each unique audio file
      const audioFilenameMap = new Map<string, string>(); // original -> new filename
      let audioIndex = 1;
      for (const [originalAudioFilename, { sourcePath }] of audioFilesMap) {
        // Always output as MP3 so container/codec match and avoid OGG+MP3 issues
        const newAudioFilename = `song${audioIndex}.mp3`;
        const destAudioPath = path.join(parsedFolder, newAudioFilename);
        
        try {
          // Check if audio file already exists (skip if already processed)
          try {
            await fs.promises.access(destAudioPath);
            console.log(`Audio file already exists, skipping: ${destAudioPath}`);
            audioFilenameMap.set(originalAudioFilename, newAudioFilename);
            audioHasSilenceMap.set(originalAudioFilename, true); // Assume previously processed
          } catch {
            // File doesn't exist yet; use ffmpeg-static if available, otherwise fall back to copy.
            if (!ffmpegPath) {
              await fs.promises.copyFile(sourcePath, destAudioPath);
              console.warn('ffmpeg-static not available; copied audio without 3s silence:', destAudioPath);
              audioFilenameMap.set(originalAudioFilename, newAudioFilename);
              audioHasSilenceMap.set(originalAudioFilename, false);
            } else {
              const ffmpegCmd = `"${ffmpegPath}" -f lavfi -t 3 -i anullsrc=channel_layout=stereo:sample_rate=44100 -i "${sourcePath}" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" -acodec libmp3lame -y "${destAudioPath}"`;
              await execAsync(ffmpegCmd);
              console.log(`Processed audio file with 3s silence: ${destAudioPath}`);
              audioFilenameMap.set(originalAudioFilename, newAudioFilename);
              audioHasSilenceMap.set(originalAudioFilename, true);
            }
          }
        } catch (error) {
          console.warn(`Failed to process audio file ${originalAudioFilename}:`, error);
        }
        audioIndex++;
      }

      // Collect all unique background files from all beatmaps in the set
      const bgFilesMap = new Map<string, { sourcePath: string; originalFilename: string }>();
      
      for (const file of files) {
        const bgFilename = String(file.parsed.data.songInfo['BackgroundFilename'] || '');
        if (bgFilename && !bgFilesMap.has(bgFilename)) {
          const sourceBgPath = path.join(path.dirname(file.osuFile), bgFilename);
          bgFilesMap.set(bgFilename, {
            sourcePath: sourceBgPath,
            originalFilename: bgFilename
          });
        }
      }

      // Process each unique background file
      const bgFilenameMap = new Map<string, string>(); // original -> new filename
      let bgIndex = 1;
      for (const [originalBgFilename, { sourcePath }] of bgFilesMap) {
        const bgExt = path.extname(originalBgFilename);
        const newBgFilename = `bg${bgIndex}${bgExt}`;
        const destBgPath = path.join(parsedFolder, newBgFilename);
        
        try {
          await fs.promises.copyFile(sourcePath, destBgPath);
          console.log(`Copied background file: ${destBgPath}`);
          bgFilenameMap.set(originalBgFilename, newBgFilename);
        } catch (error) {
          console.warn(`Failed to copy background file ${originalBgFilename}:`, error);
        }
        bgIndex++;
      }

      // Write .wysi file for each beatmap
      for (const { parsed } of files) {
        const { beatmapId, data } = parsed;
        
        // Update songInfo with processed filenames
        const originalAudioFilename = String(data.songInfo['AudioFilename'] || '');
        if (originalAudioFilename && audioFilenameMap.has(originalAudioFilename)) {
          data.songInfo['AudioFilename'] = audioFilenameMap.get(originalAudioFilename)!;
        }
        
        const originalBgFilename = String(data.songInfo['BackgroundFilename'] || '');
        if (originalBgFilename && bgFilenameMap.has(originalBgFilename)) {
          data.songInfo['BackgroundFilename'] = bgFilenameMap.get(originalBgFilename)!;
        }

        // Add 3 second delay to timing values (3000ms) ONLY if we actually added 3s of silence
        const audioHasSilence = originalAudioFilename && audioHasSilenceMap.get(originalAudioFilename) === true;
        if (audioHasSilence) {
          const SILENCE_OFFSET_MS = 3000;
          
          // Offset PreviewTime and ensure it is never before the 3s silence
          if (data.songInfo['PreviewTime'] !== undefined) {
            let previewTime = data.songInfo['PreviewTime'] as number;

            // -1 or any negative value means "no explicit preview" in osu!
            // Treat that as 0 before adding our 3s offset.
            if (previewTime < 0) {
              previewTime = 0;
            }

            previewTime += SILENCE_OFFSET_MS;

            // Clamp so preview is never before the 3s silence block
            if (previewTime < SILENCE_OFFSET_MS) {
              previewTime = SILENCE_OFFSET_MS;
            }

            data.songInfo['PreviewTime'] = previewTime;
          }

          // Offset all hitObjects times
          for (const hitObject of data.hitObjects) {
            hitObject.time += SILENCE_OFFSET_MS;
            if (hitObject.endTime !== undefined) {
              hitObject.endTime += SILENCE_OFFSET_MS;
            }
          }
        }

        // Calculate and store a simple difficulty rating (star-like value)
        try {
          const difficulty = calculateDifficulty(data);
          data.songInfo['StarRating'] = difficulty;
        } catch (err) {
          console.warn(`Failed to calculate difficulty for beatmap ${beatmapId}:`, err);
        }

        const wysiPath = path.join(parsedFolder, `${beatmapId}.wysi`);
        try {
          await fs.promises.writeFile(wysiPath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Created .wysi file: ${wysiPath}`);
        } catch (error) {
          console.error(`Failed to write .wysi file ${wysiPath}:`, error);
        }
      }
    }

    // Remove the raw folder after successful parsing
    try {
      await fs.promises.rm(folderPath, { recursive: true, force: true });
      console.log(`Removed raw folder: ${folderPath}`);
    } catch (error) {
      console.warn(`Failed to remove raw folder ${folderPath}:`, error);
    }
  } catch (error) {
    console.error('Failed to parse beatmaps from folder:', error);
    throw error;
  }
};

// yo guys do i bother making a function for this just like 1531?
app.post('/api/beatmaps/upload', upload.single('beatmap'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    await fs.promises.mkdir(BEATMAPS_RAW_DIR, { recursive: true });
    const originalName = req.file.originalname.toLowerCase();

    if (!originalName.endsWith('.osz')) {
      return res.status(400).json({ error: 'Only .osz files are supported' });
    }

    const baseName = path.basename(originalName, path.extname(originalName)).trim();
    const folderName = baseName.split(/\s+/)[0];
    const targetRoot = path.join(BEATMAPS_RAW_DIR, folderName);

    await fs.promises.mkdir(targetRoot, { recursive: true });

    const directory = await unzipper.Open.buffer(req.file.buffer);
    await Promise.all(directory.files.map(async (file: any) => {
      const destinationPath = path.join(targetRoot, file.path);

      if (file.type === 'Directory') {
        await fs.promises.mkdir(destinationPath, { recursive: true });
        return;
      }

      await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
      const writeStream = fs.createWriteStream(destinationPath);
      await pipeline(file.stream(), writeStream);
    }));

    // Parse beatmaps after extraction
    await parseBeatmapsFromFolder(targetRoot);

    res.status(200).json({ message: 'Beatmap uploaded and extracted successfully' });
  } catch (error) {
    console.error('Beatmap upload failed:', error);
    res.status(500).json({ error: 'Failed to process beatmap archive' });
  }
});

const getMetadata = (fileString: string) => {
  const lines = fileString.split('\n');

  let audioFilename = '';
  let previewTime = 0;
  let mode = 0;
  let title = '';
  let artist = '';
  let version = '';
  let circleSize = 0;

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }

    if (!trimmed || trimmed.startsWith('//')) {
      continue;
    }

    if (currentSection === 'General') {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();

        if (key === 'AudioFilename') {
          audioFilename = value;
        } else if (key === 'PreviewTime') {
          previewTime = parseInt(value, 10);
        } else if (key === 'Mode') {
          mode = parseInt(value, 10);
        }
      }
    }

    else if (currentSection === 'Metadata') {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();

        if (key === 'Title') {
          title = value;
        } else if (key === 'Artist') {
          artist = value;
        } else if (key === 'Version') {
          version = value;
        }
      }
    }

    else if (currentSection === 'Difficulty') {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();

        if (key === 'CircleSize') {
          circleSize = parseFloat(value);
        }
      }
    }
  }

  return {
    AudioFilename: audioFilename,
    PreviewTime: previewTime,
    Mode: mode,
    Title: title,
    Artist: artist,
    Version: version,
    CircleSize: circleSize,
  };
};

app.get('/api/beatmaps', async (req: Request, res: Response) => {
  try {
    // Collect .wysi files from all configured beatmap directories.
    // On Vercel this will include both /tmp/beatmaps and public/beatmaps.
    let wysiFiles: string[] = [];

    for (const dir of BEATMAPS_PARSED_DIRS) {
      try {
        const dirFiles = await fg('**/*.wysi', { cwd: dir, absolute: true });
        wysiFiles = wysiFiles.concat(dirFiles);
      } catch (error) {
        // Ignore missing directories etc., just log for debugging.
        console.warn(`Failed to read beatmaps from ${dir}:`, error);
      }
    }

    // De-duplicate paths in case directories overlap
    const uniqueFiles = Array.from(new Set(wysiFiles));

    const beatmaps = await Promise.all(
      uniqueFiles.map(async (filePath) => {
        const beatmapId = path.basename(filePath, '.wysi');
        const beatmapSetId = path.basename(path.dirname(filePath));

        const content = await fs.promises.readFile(filePath, 'utf8');
        const parsed: ParsedBeatmap = JSON.parse(content);
        const songInfo = parsed.songInfo;

        // Get version name for display
        const name = String(songInfo['Version'] || '');

        return {
          id: beatmapId,
          setId: beatmapSetId,
          name,
          songInfo,
        };
      })
    );

    res.status(200).json(beatmaps);
  } catch (error) {
    console.error('Failed to fetch beatmaps:', error);
    res.status(500).json({ error: 'Failed to fetch beatmaps' });
  }
});

// Get all songs (audio files) recursively from beatmaps directories
app.get('/api/songs', async (req: Request, res: Response) => {
  try {
    // Audio file extensions to search for
    const audioExtensions = ['**/*.mp3', '**/*.m4a', '**/*.ogg', '**/*.wav'];
    let audioFiles: string[] = [];

    // Search for audio files in all beatmap directories
    for (const dir of BEATMAPS_PARSED_DIRS) {
      try {
        for (const pattern of audioExtensions) {
          const files = await fg(pattern, { cwd: dir, absolute: true });
          audioFiles = audioFiles.concat(files);
        }
      } catch (error) {
        console.warn(`Failed to read audio files from ${dir}:`, error);
      }
    }

    // De-duplicate paths
    const uniqueFiles = Array.from(new Set(audioFiles));

    // Create song entries from audio files
    const songs = uniqueFiles.map((filePath) => {
      const fileName = path.basename(filePath);
      const beatmapSetId = path.basename(path.dirname(filePath));
      
      // Generate a unique ID from the file path
      const fileId = createHash('md5').update(filePath).digest('hex').substring(0, 8);

      return {
        id: fileId,
        setId: beatmapSetId,
        name: path.basename(fileName, path.extname(fileName)),
        songInfo: {
          AudioFilename: fileName,
          PreviewTime: 0,
          Mode: 0,
          Title: path.basename(fileName, path.extname(fileName)),
          Artist: 'Unknown',
          Version: beatmapSetId,
        },
      };
    });

    // Add Wii music as the first item
    const playlist = [
      {
        id: 'wii',
        setId: 'wii',
        name: 'Wii Menu Music',
        songInfo: {
          AudioFilename: 'Wi Fi Menu Medley Looped - Mario Kart Wii Music Extended (128kbit_AAC).m4a',
          PreviewTime: 0,
          Mode: 0,
          Title: 'Wii Menu Music',
          Artist: 'Nintendo',
          Version: 'Menu',
        },
      },
      ...songs,
    ];

    res.status(200).json(playlist);
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Serve individual beatmap files (audio / background / .wysi) from either /tmp or public.
app.get('/api/beatmaps/:setId/:fileName', async (req: Request, res: Response) => {
  try {
    const { setId, fileName } = req.params;

    // Basic safety against path traversal
    if (fileName.includes('..') || setId.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    let foundPath: string | null = null;

    for (const dir of BEATMAPS_PARSED_DIRS) {
      const candidate = path.join(dir, setId, fileName);
      try {
        const stat = await fs.promises.stat(candidate);
        if (stat.isFile()) {
          foundPath = candidate;
          break;
        }
      } catch {
        // ignore and try next directory
      }
    }

    if (!foundPath) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(foundPath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3' || ext === '.m4a' || ext === '.ogg') {
      contentType = 'audio/mpeg';
    } else if (ext === '.wav') {
      contentType = 'audio/wav';
    } else if (ext === '.json' || ext === '.wysi') {
      contentType = 'application/json';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    }

    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(foundPath);
    stream.on('error', (err) => {
      console.error('Error streaming beatmap file:', err);
      if (!res.headersSent) {
        res.status(500).end('Failed to read file');
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Failed to serve beatmap file:', error);
    res.status(500).json({ error: 'Failed to serve beatmap file' });
  }
});

// MongoDB User Data Sync Endpoint
interface SyncUserDataRequest {
  username: string;
  beatmapId: string;
  score: number;
  highestCombo: number;
  accuracy: number;
}

app.post('/api/user/sync', async (req: Request, res: Response) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { username, beatmapId, score, highestCombo, accuracy }: SyncUserDataRequest = req.body;

    if (!username || !beatmapId || score === undefined || highestCombo === undefined || accuracy === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const usersCollection = db.collection('users');
    const scoreData = {
      score,
      highestCombo,
      accuracy,
      beatmapId,
      timestamp: new Date(),
    };

    // Upsert user document - create if doesn't exist, update if exists
    // First, get the user document to check if it exists
    const existingUser = await usersCollection.findOne({ username });
    
    if (existingUser) {
      // User exists, add score to scores array
      const updatedScores = [...(existingUser.scores || []), scoreData]
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 100); // Keep top 100 scores
      
      await usersCollection.updateOne(
        { username },
        {
          $set: {
            lastUpdated: new Date(),
            scores: updatedScores,
          },
        }
      );
    } else {
      // User doesn't exist, create new document
      await usersCollection.insertOne({
        username,
        scores: [scoreData],
        lastUpdated: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Score synced successfully',
      username,
    });
  } catch (error) {
    console.error('Failed to sync user data:', error);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
});

// --------------------- ADD NEW ROUTES ABOVE -------------------------

// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, HOST, () => {
    console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Shutting down server gracefully.');
      process.exit();
    });
  });
}

export default app;

