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
import { echo } from './echo';

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
const BEATMAPS_RAW_DIR = path.resolve(__dirname, '../frontend/public/beatmapsRaw');
const BEATMAPS_PARSED_DIR = path.resolve(__dirname, '../frontend/public/beatmaps');
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

    for (const osuFile of osuFiles) {
      console.log(`Parsing: ${osuFile}`);
      const parsed = await parseOsuFile(osuFile, folderName);
      if (!parsed) {
        continue;
      }

      const { beatmapSetId, beatmapId, data } = parsed;
      const parsedFolder = path.join(BEATMAPS_PARSED_DIR, beatmapSetId);
      await fs.promises.mkdir(parsedFolder, { recursive: true });

      // Copy and rename audio file
      const audioFilename = String(data.songInfo['AudioFilename'] || '');
      let newAudioFilename = 'song';
      if (audioFilename) {
        const audioExt = path.extname(audioFilename);
        newAudioFilename = `song${audioExt}`;
        const sourceAudioPath = path.join(path.dirname(osuFile), audioFilename);
        const destAudioPath = path.join(parsedFolder, newAudioFilename);
        try {
          await fs.promises.copyFile(sourceAudioPath, destAudioPath);
          // Update songInfo with new filename
          data.songInfo['AudioFilename'] = newAudioFilename;
        } catch (error) {
          console.warn(`Failed to copy audio file ${audioFilename}:`, error);
        }
      }

      // Copy and rename background file
      const bgFilename = String(data.songInfo['BackgroundFilename'] || '');
      let newBgFilename = 'bg';
      if (bgFilename) {
        const bgExt = path.extname(bgFilename);
        newBgFilename = `bg${bgExt}`;
        const sourceBgPath = path.join(path.dirname(osuFile), bgFilename);
        const destBgPath = path.join(parsedFolder, newBgFilename);
        try {
          await fs.promises.copyFile(sourceBgPath, destBgPath);
          // Update songInfo with new filename
          data.songInfo['BackgroundFilename'] = newBgFilename;
        } catch (error) {
          console.warn(`Failed to copy background file ${bgFilename}:`, error);
        }
      }

      // Write .wysi file (with updated filenames)
      const wysiPath = path.join(parsedFolder, `${beatmapId}.wysi`);
      await fs.promises.writeFile(wysiPath, JSON.stringify(data, null, 2), 'utf8');
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
    const wysiFiles = await fg('**/*.wysi', { cwd: BEATMAPS_PARSED_DIR, absolute: true });

    const beatmaps = await Promise.all(
      wysiFiles.map(async (filePath) => {
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

