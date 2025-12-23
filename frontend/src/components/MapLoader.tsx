import { useState, useEffect } from 'react';
import PlayerLoader from './PlayerLoader';
import { useLocation } from 'react-router-dom';

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
  const { beatmapId, beatmapSetId, beatmapName } = location.state;

  const mapPath = `./beatmaps/${beatmapSetId}/`;
  const wysiFileName = `${beatmapId}.wysi`;

  useEffect(() => {
    const theMap = encodeURI(mapPath + wysiFileName);
    const loadMap = async () => {
      const file = await fetch(theMap);
      const parsed = await file.json();
      setHitObjects(parsed.hitObjects);
      setSongInfo(parsed.songInfo);
    };

    loadMap();
  }, [beatmapId, beatmapSetId, mapPath, wysiFileName]);


  // can use a loading screen here instead of null
  if (!hitObjects || !songInfo) {
    return null;
  }

  return <PlayerLoader songInfo={songInfo} hitObjects={hitObjects} mapPath={mapPath} />;
};

export default MapLoader;

