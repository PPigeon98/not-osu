import { useEffect, useRef, useState } from 'react';

export type SongInfo = Record<string, string | number>;

export type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  endTime?: number;
};

export type JudgementName = 'Marvelous' | 'Perfect' | 'Great' | 'Good' | 'Okay' | 'Miss';

export type UserData = {
  Keybinds: Record<string, string[]>;
  ManiaWidth: Record<string, string>;
  ManiaHeight: Record<string, string>;
  ScrollSpeed: number;
  ReceptorOffset: string;
  TaikoReceptorOffset: string;
  BackgroundBlur: number;
  BackgroundOpacity: number;
  Accuracy: Record<string, number>;
  Life: Record<string, number>;
  Judgment: string;
  MusicSpeed: number;
  MusicVolume: number;
  ScoreValues: Record<JudgementName, number>;
  JudgementWindow: Record<string, Record<JudgementName, number>>;
};

export const JUDGEMENT_NAMES: JudgementName[] = ['Marvelous', 'Perfect', 'Great', 'Good', 'Okay', 'Miss'];

export const createEmptyJudgementCounts = (): Record<JudgementName, number> => ({
  Marvelous: 0,
  Perfect: 0,
  Great: 0,
  Good: 0,
  Okay: 0,
  Miss: 0,
});

export const cloneJudgementCounts = (source: Record<JudgementName, number>): Record<JudgementName, number> => {
  const copy = createEmptyJudgementCounts();
  for (const name of JUDGEMENT_NAMES) {
    copy[name] = source[name];
  }
  return copy;
};

export const calculateAccuracyPercent = (
  counts: Record<JudgementName, number>,
  weights: Record<string, number>,
) => {
  const total = JUDGEMENT_NAMES.reduce((sum, type) => sum + counts[type], 0);
  if (total === 0) return 100;
  const weightedSum = JUDGEMENT_NAMES.reduce((sum, type) => sum + (weights[type] ?? 0) * counts[type], 0);
  return weightedSum / total;
};

// Audio/Time utilities
export type UseAudioTimeProps = {
  musicSpeed: number;
  musicVolume: number;
  audioSrc: string;
};

export const useAudioTime = ({ musicSpeed, musicVolume, audioSrc }: UseAudioTimeProps) => {
  const musicTimeRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (musicTimeRef.current) {
      musicTimeRef.current.playbackRate = musicSpeed;
    }
  }, [musicSpeed]);

  useEffect(() => {
    if (!musicTimeRef.current) return;
    musicTimeRef.current.volume = musicVolume / 100;
  }, [musicVolume]);

  const getCurrentTimeMs = (): number => {
    return musicTimeRef.current ? musicTimeRef.current.currentTime * 1000 : currentTimeRef.current;
  };

  const getDurationMs = (): number => {
    return musicTimeRef.current && musicTimeRef.current.duration
      ? musicTimeRef.current.duration * 1000
      : 0;
  };

  return {
    musicTimeRef,
    currentTime,
    setCurrentTime,
    currentTimeRef,
    getCurrentTimeMs,
    getDurationMs,
    audioSrc,
  };
};

// Time windowing utilities
export const findVisibleObjectsRange = (
  times: number[],
  now: number,
  pastWindowMs: number,
  futureWindowMs: number,
): { startIndex: number; endIndex: number } => {
  const lowerBoundTime = now - pastWindowMs;
  const upperBoundTime = now + futureWindowMs;

  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (times[mid] < lowerBoundTime) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const startIndex = lo;

  let endIndex = startIndex;
  while (endIndex < times.length && times[endIndex] <= upperBoundTime) {
    endIndex++;
  }

  return { startIndex, endIndex };
};

export const smoothTime = (
  audioTimeMs: number,
  smoothedRef: React.MutableRefObject<number>,
  lastRafTimeRef: React.MutableRefObject<number>,
  rafTime: number,
): number => {
  const deltaMs = rafTime - lastRafTimeRef.current;
  lastRafTimeRef.current = rafTime;

  let smoothed = smoothedRef.current + (deltaMs > 0 && deltaMs < 100 ? deltaMs : 0);
  const diff = audioTimeMs - smoothed;

  if (Math.abs(diff) > 120) {
    smoothed = audioTimeMs;
  } else {
    smoothed += diff * 0.12;
  }

  smoothedRef.current = smoothed;
  return smoothed;
};

