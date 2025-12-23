import { useState, useEffect } from 'react';
import PlayerLoader from './PlayerLoader';
import { useLocation } from 'react-router-dom';
import { backendUrl } from './CommonGame';

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  hitSound: number;
  endTime?: number;
};

type SongInfo = Record<string, string | number>;

const MapLoader = () => {
  const [hitObjects, setHitObjects] = useState<HitObject[] | null>(null);
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const location = useLocation();
  const { beatmapId, beatmapSetId } = location.state;

  // Use API endpoint for beatmap files (works with /tmp on Vercel)
  const mapPath = `${backendUrl}/beatmaps/${beatmapSetId}/`;
  const wysiFileName = `${beatmapId}.wysi`;

  useEffect(() => {
    const theMap = `${backendUrl}/beatmaps/${beatmapSetId}/${beatmapId}.wysi`;
    const loadMap = async () => {
      try {
        const file = await fetch(theMap);
        const parsed = await file.json();
        setHitObjects(parsed.hitObjects);
        setSongInfo(parsed.songInfo);
      } catch (error) {
        console.error('Failed to load beatmap:', error);
      }
    };

    loadMap();
  }, [beatmapId, beatmapSetId]);


  // can use a loading screen here instead of null
  if (!hitObjects || !songInfo) {
    return null;
  }

  return <PlayerLoader songInfo={songInfo} hitObjects={hitObjects} mapPath={mapPath} />;
};

export default MapLoader;

