import { useState, useEffect } from 'react';
import Game from './Game';

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  hitSound: number;
};

type SongInfo = Record<string, string | number>;

type UserData = {
  Keybinds: Record<string, string[]>;
  ManiaWidth: Record<string, string>;
  ManiaHeight: Record<string, string>;
};

type PlayerLoaderProps = {
  songInfo: SongInfo;
  hitObjects: HitObject[];
  mapPath: string;
};

const PlayerLoader = ({ songInfo, hitObjects, mapPath }: PlayerLoaderProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // load user data (in the future, this could be from localStorage or API)
    setUserData({
      Keybinds: {'4': ['d', 'f', 'j', 'k']},
      ManiaWidth: {'4': '120'},
      ManiaHeight: {'4': '30'}
    });
  }, []);

  // can use a loading screen here instead of null
  if (!userData) {
    return null;
  }

  return <Game songInfo={songInfo} userData={userData} mapPath={mapPath} hitObjects={hitObjects} />;
};

export default PlayerLoader;

