import { useState, useEffect } from 'react';
import PlayerLoader from './PlayerLoader';
import { useLocation } from 'react-router-dom';

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  endTime?: number;
};

type SongInfo = Record<string, string | number>;

const MapLoader = () => {
  const [hitObjects, setHitObjects] = useState<HitObject[] | null>(null);
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const location = useLocation();
  const { beatmapId, beatmapName } = location.state;

  const mapPath = `./beatmapsRaw/${beatmapId}/`;
  const mapFileName = `${beatmapName}.osu`;

  useEffect(() => {
    const theMap = mapPath + mapFileName;
    const loadMap = async () => {
      const file = await fetch(theMap);
      const fileString = await file.text();
      setHitObjects(getHitObjects(fileString));
      setSongInfo(getSongInfo(fileString));
    };

    loadMap();
  }, [beatmapId, beatmapName, mapPath, mapFileName]);

  const getHitObjects = (fileString: string): HitObject[] => {
    const lines = fileString.split('\n');
    const hitObjects: HitObject[] = [];
    let inSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '[HitObjects]') {
        inSection = true;
        continue;
      }

      if (inSection) {
        if (trimmed.startsWith('[')) break;

        if (trimmed && !trimmed.startsWith('//')) {
          const parts = trimmed.split(',');
          if (parts.length >= 4) {
            const type = parseInt(parts[3]);
            let endTime: number | undefined;

            if (type === 7 && parts.length >= 6) {
              const endPart = parts[5].split(':')[0];
              const parsedEnd = parseInt(endPart);
              if (!Number.isNaN(parsedEnd)) {
                endTime = parsedEnd;
              }
            }

            hitObjects.push({
              x: parseInt(parts[0]),
              y: parseInt(parts[1]),
              time: parseInt(parts[2]),
              type,
              endTime,
            });
          }
        }
      }
    }

    return hitObjects;
  };

  const getSongInfo = (fileString: string): SongInfo => {
    const lines = fileString.split('\n');
    const songInfo: SongInfo = {};

    const wantedKeys = {
      general: ['AudioFilename', 'AudioLeadIn', 'PreviewTime', 'Mode'],
      metadata: ['TitleUnicode', 'ArtistUnicode', 'Creator', 'Version', 'BeatmapID'],
      difficulty: ['CircleSize', 'ApproachRate']
    };
    
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
          
          if (wantedKeys.general.includes(key)) {
            songInfo[key] = value;
          }
        }
      }

      else if (currentSection === 'Metadata') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.metadata.includes(key)) {
            songInfo[key] = value;
          }
        }
      }

      else if (currentSection === 'Difficulty') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.difficulty.includes(key)) {
            songInfo[key] = value;
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
          songInfo['BackgroundXOffset'] = parseInt(parts[3]);
          songInfo['BackgroundYOffset'] = parseInt(parts[4]);
        }
      }
    }

    return songInfo;
  };

  // can use a loading screen here instead of null
  if (!hitObjects || !songInfo) {
    return null;
  }

  return <PlayerLoader songInfo={songInfo} hitObjects={hitObjects} mapPath={mapPath} />;
};

export default MapLoader;

