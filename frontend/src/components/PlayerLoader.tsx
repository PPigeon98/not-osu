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
  ScrollSpeed: number;
  ReceptorOffset: number;
  BackgroundBlur: number;
  BackgroundOpacity: number;
  Accuracy: Record<string, number>;
  Life: Record<string, number>;
  Judgment: string;
  MusicSpeed: number;
  ScoreValues: Record<'Marvelous' | 'Perfect' | 'Great' | 'Good' | 'Okay' | 'Miss', number>;
  JudgementWindow: Record<
    string,
    {
      Marvelous: number;
      Perfect: number;
      Great: number;
      Good: number;
      Okay: number;
      Miss: number;
    }
  >;
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
      ManiaHeight: {'4': '30'},
      ScrollSpeed: 2,
      ReceptorOffset: 120,
      BackgroundBlur: 5,
      BackgroundOpacity: 0.6,
      JudgementWindow: {
        Peaceful: {
          Marvelous: 23,
          Perfect: 57,
          Great: 101,
          Good: 141,
          Okay: 169,
          Miss: 218,
        },
        Lenient: {
          Marvelous: 21,
          Perfect: 52,
          Great: 91,
          Good: 128,
          Okay: 153,
          Miss: 198,
        },
        Chill: {
          Marvelous: 19,
          Perfect: 47,
          Great: 83,
          Good: 116,
          Okay: 139,
          Miss: 180,
        },
        Standard: {
          Marvelous: 18,
          Perfect: 43,
          Great: 76,
          Good: 106,
          Okay: 127,
          Miss: 164,
        },
        Strict: {
          Marvelous: 16,
          Perfect: 39,
          Great: 69,
          Good: 96,
          Okay: 115,
          Miss: 164,
        },
        Tough: {
          Marvelous: 14,
          Perfect: 35,
          Great: 62,
          Good: 87,
          Okay: 100,
          Miss: 164,
        },
        Extreme: {
          Marvelous: 13,
          Perfect: 32,
          Great: 57,
          Good: 79,
          Okay: 94,
          Miss: 164,
        },
        Impossible: {
          Marvelous: 8,
          Perfect: 20,
          Great: 35,
          Good: 49,
          Okay: 69,
          Miss: 164,
        },
      },
      Accuracy: { Marvelous: 100, Perfect: 98.25, Great: 65, Good: 25, Okay: -50, Miss: -100 },
      Life: { Marvelous: 0.8, Perfect: 0.8, Great: 0.4, Good: 0, Okay: -0.4, Miss: -0.8 },
      Judgment: 'Standard',
      MusicSpeed: 1,
      ScoreValues: { Marvelous: 300, Perfect: 300, Great: 200, Good: 100, Okay: 50, Miss: 0 },
    });
  }, []);

  // can use a loading screen here instead of null
  if (!userData) {
    return null;
  }

  return <Game songInfo={songInfo} userData={userData} mapPath={mapPath} hitObjects={hitObjects} />;
};

export default PlayerLoader;

