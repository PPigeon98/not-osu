import { useCallback, useRef, useState } from 'react';
import {
  calculateAccuracyPercent,
  cloneJudgementCounts,
  createEmptyJudgementCounts,
  type HitObject,
  type JudgementName,
  type UserData,
} from './CommonGame';

export type JudgingState = {
  judgementCounts: Record<JudgementName, number>;
  lastJudgement: { type: JudgementName; diff: number } | null;
  score: number;
  combo: number;
  highestCombo: number;
  life: number;
  displayAccuracy: number;
};

export type JudgingControls = {
  judgeHit: (column: number, nowMs: number) => void;
  judgeTaiko: (isKat: boolean, nowMs: number, hitObjects: HitObject[]) => void;
  markMiss: (diffMs: number) => void;
  resetJudging: (noteCount: number) => void;
};

export const Judger = (
  userData: UserData,
  hitObjects: HitObject[],
  precomputedColumnsRef: React.MutableRefObject<number[] | null>,
  sortedTimesRef: React.MutableRefObject<number[] | null>,
  judgedNotesRef: React.MutableRefObject<boolean[]>,
) => {
  const [judgementCounts, setJudgementCounts] = useState<Record<JudgementName, number>>(createEmptyJudgementCounts);
  const judgementCountsRef = useRef<Record<JudgementName, number>>(createEmptyJudgementCounts());
  const [lastJudgement, setLastJudgement] = useState<{ type: JudgementName; diff: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [life, setLife] = useState<number>(100);
  const lifeRef = useRef<number>(100);
  const comboRef = useRef<number>(0);
  const highestComboRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const currentAccuracyJudgementCountRef = useRef<number>(0);

  const activeJudgementWindow = userData.JudgementWindow[userData.Judgment];
  const scoreValues = userData.ScoreValues;
  const maxCombo = hitObjects.length;
  const TotalNotes = maxCombo;

  const calculateJudgement = (absDiff: number, windowConfig: UserData['JudgementWindow'][string]): JudgementName => {
    if (absDiff <= windowConfig.Marvelous) return 'Marvelous';
    if (absDiff <= windowConfig.Perfect) return 'Perfect';
    if (absDiff <= windowConfig.Great) return 'Great';
    if (absDiff <= windowConfig.Good) return 'Good';
    if (absDiff <= windowConfig.Okay) return 'Okay';
    return 'Miss';
  };

  const applyJudgementEffects = useCallback((result: JudgementName) => {
    if (result === 'Miss') {
      comboRef.current = 0;
    } else {
      comboRef.current += 1;
    }

    if (comboRef.current > highestComboRef.current) {
      highestComboRef.current = comboRef.current;
    }

    setCombo(comboRef.current);
    setHighestCombo(highestComboRef.current);

    const lifeChange = userData.Life[result] || 0;
    lifeRef.current = Math.max(0, Math.min(100, lifeRef.current + lifeChange));
    setLife(lifeRef.current);

    currentAccuracyJudgementCountRef.current += 1;

    const HitValue = scoreValues[result];
    const hitScore = (1000000 * 0.5 / TotalNotes) * (HitValue / scoreValues.Marvelous);
    scoreRef.current += hitScore;

    setScore(Math.round(scoreRef.current));
  }, [maxCombo, userData.Life, scoreValues]);

  const updateJudgementCounts = useCallback((result: JudgementName, diff: number) => {
    setJudgementCounts(prev => {
      const newCounts: Record<JudgementName, number> = {
        Marvelous: prev.Marvelous,
        Perfect: prev.Perfect,
        Great: prev.Great,
        Good: prev.Good,
        Okay: prev.Okay,
        Miss: prev.Miss,
      };
      newCounts[result] += 1;
      judgementCountsRef.current = cloneJudgementCounts(newCounts);
      return newCounts;
    });
    setLastJudgement({ type: result, diff });
    applyJudgementEffects(result);
  }, [applyJudgementEffects]);

  const judgeHit = useCallback((column: number, nowMs: number) => {
    const windowConfig = activeJudgementWindow;
    if (!windowConfig) return;

    const times = sortedTimesRef.current;
    const columns = precomputedColumnsRef.current;
    const judged = judgedNotesRef.current;
    if (!times || !columns || !judged) return;

    const maxWindow = windowConfig.Miss;
    if (maxWindow <= 0) return;

    let bestIndex = -1;
    let bestAbsDiff = Number.POSITIVE_INFINITY;
    let bestSignedDiff = 0;

    for (let i = 0; i < times.length; i++) {
      if (judged[i]) continue;
      if (columns[i] !== column) continue;

      const diff = times[i] - nowMs;
      const absDiff = Math.abs(diff);

      if (absDiff > maxWindow && diff > 0) {
        break;
      }

      if (absDiff < bestAbsDiff) {
        bestAbsDiff = absDiff;
        bestSignedDiff = diff;
        bestIndex = i;
      }
    }

    if (bestIndex === -1 || bestAbsDiff > maxWindow) {
      return;
    }

    const result = calculateJudgement(bestAbsDiff, windowConfig);
    judged[bestIndex] = true;
    updateJudgementCounts(result, bestSignedDiff);
  }, [activeJudgementWindow, judgedNotesRef, precomputedColumnsRef, sortedTimesRef, updateJudgementCounts]);

  const judgeTaiko = useCallback((isKat: boolean, nowMs: number, hitObjects: HitObject[]) => {
    const windowConfig = activeJudgementWindow;
    if (!windowConfig) return;

    const times = sortedTimesRef.current;
    const judged = judgedNotesRef.current;
    if (!times || !judged) return;

    const maxWindow = windowConfig.Miss;
    if (maxWindow <= 0) return;

    let bestIndex = -1;
    let bestAbsDiff = Number.POSITIVE_INFINITY;
    let bestSignedDiff = 0;

    for (let i = 0; i < times.length; i++) {
      if (judged[i]) continue;

      const hitObject = hitObjects[i];
      const hitSound = hitObject.hitSound;
      const noteIsKat = (hitSound & 2) !== 0 || (hitSound & 8) !== 0;

      if (noteIsKat !== isKat) continue;

      const diff = times[i] - nowMs;
      const absDiff = Math.abs(diff);

      if (absDiff > maxWindow && diff > 0) {
        break;
      }

      if (absDiff < bestAbsDiff) {
        bestAbsDiff = absDiff;
        bestSignedDiff = diff;
        bestIndex = i;
      }
    }

    if (bestIndex === -1 || bestAbsDiff > maxWindow) {
      return;
    }

    const result = calculateJudgement(bestAbsDiff, windowConfig);
    judged[bestIndex] = true;
    updateJudgementCounts(result, bestSignedDiff);
  }, [activeJudgementWindow, judgedNotesRef, sortedTimesRef, updateJudgementCounts]);

  const markMiss = useCallback((diffMs: number) => {
    setJudgementCounts(prev => {
      const newCounts: Record<JudgementName, number> = {
        Marvelous: prev.Marvelous,
        Perfect: prev.Perfect,
        Great: prev.Great,
        Good: prev.Good,
        Okay: prev.Okay,
        Miss: prev.Miss + 1,
      };
      judgementCountsRef.current = cloneJudgementCounts(newCounts);
      return newCounts;
    });
    setLastJudgement({ type: 'Miss', diff: diffMs });
    applyJudgementEffects('Miss');
  }, [applyJudgementEffects]);

  const resetJudging = useCallback((noteCount: number) => {
    const resetCounts = createEmptyJudgementCounts();
    setJudgementCounts(resetCounts);
    judgementCountsRef.current = cloneJudgementCounts(resetCounts);
    setLastJudgement(null);
    judgedNotesRef.current = new Array(noteCount).fill(false);
    comboRef.current = 0;
    highestComboRef.current = 0;
    scoreRef.current = 0;
    currentAccuracyJudgementCountRef.current = 0;
    setCombo(0);
    setHighestCombo(0);
    setScore(0);
    setLife(100);
    lifeRef.current = 100;
  }, [judgedNotesRef]);

  const rawAccuracy = calculateAccuracyPercent(judgementCounts, userData.Accuracy);
  const displayAccuracy = Math.min(100, Math.max(0, rawAccuracy));

  const state: JudgingState = {
    judgementCounts,
    lastJudgement,
    score,
    combo,
    highestCombo,
    life,
    displayAccuracy,
  };

  const controls: JudgingControls = {
    judgeHit,
    judgeTaiko,
    markMiss,
    resetJudging,
  };

  return { state, controls };
};

export default Judger;

