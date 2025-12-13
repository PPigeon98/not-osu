import { useState, useEffect } from 'react';
import Game from './Game';

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  endTime?: number;
};

type SongInfo = Record<string, string | number>;

type UserData = {
  Keybinds: Record<string, string[]>;
  ManiaWidth: Record<string, string>;
  ManiaHeight: Record<string, string>;
  ScrollSpeed: number;
  ReceptorOffset: string;
  BackgroundBlur: number;
  BackgroundOpacity: number;
  Accuracy: Record<string, number>;
  Life: Record<string, number>;
  Judgment: string;
  MusicSpeed: number;
  MusicVolume: number;
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
      Keybinds: {
        '1': ['space'],
        '2': ['d', 'k'],
        '3': ['d', 'f', 'j'],
        '4': ['d', 'f', 'j', 'k'],
        '5': ['d', 'f', 'space', 'j', 'k'],
        '6': ['d', 'f', 'g', 'h', 'j', 'k'],
        '7': ['s', 'd', 'f', 'space', 'j', 'k', 'l'],
        '8': ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        '9': ['a', 's', 'd', 'f', 'space', 'j', 'k', 'l', ';'],
        '10': ['s', 'd', 'f', 'g', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadAdd'],
        '12': ['s', 'd', 'f', 'g', 'x', 'c', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadAdd'],
        '14': ['s', 'd', 'f', 'g', 'x', 'c', 'v', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadAdd', 'Numpad1'],
        '16': ['s', 'd', 'f', 'g', 'x', 'c', 'v', 'b', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadAdd', 'Numpad1', 'Numpad2'],
        '18': ['s', 'd', 'f', 'g', 'x', 'c', 'v', 'b', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadAdd', 'Numpad1', 'Numpad2', 'Numpad3'],
        '20': ['s', 'd', 'f', 'g', 't', 'x', 'c', 'v', 'b', 'space', 'Numpad0', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'NumpadAdd', 'Numpad1', 'Numpad2', 'Numpad3'],
      },
      ManiaWidth: {
        '1': '12.70',
        '2': '12.70',
        '3': '12.70',
        '4': '8.00',
        '5': '8.00',
        '6': '6.86',
        '7': '6.86',
        '8': '6.10',
        '9': '6.10',
        '10': '5.34',
        '12': '5.08',
        '14': '4.82',
        '16': '4.58',
        '18': '3.82',
        '20': '3.82',
      },
      ManiaHeight: {
        '1': '4.00',
        '2': '4.00',
        '3': '4.00',
        '4': '4.00',
        '5': '4.00',
        '6': '4.00',
        '7': '4.00',
        '8': '4.00',
        '9': '4.00',
        '10': '4.00',
        '12': '4.00',
        '14': '4.00',
        '16': '4.00',
        '18': '4.00',
        '20': '4.00',
      },
      ScrollSpeed: 2.5,
      ReceptorOffset: '11.11',
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
      Life: { Marvelous: 2.5, Perfect: 2, Great: 1, Good: 0, Okay: -0.5, Miss: -2 },
      Judgment: 'Standard',
      MusicSpeed: 1,
      MusicVolume: 100,
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

