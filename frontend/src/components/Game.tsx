import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type SongInfo = Record<string, string | number>;

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  hitSound: number;
};

type JudgementName = 'Marvelous' | 'Perfect' | 'Great' | 'Good' | 'Okay' | 'Miss';

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
  ScoreValues: Record<JudgementName, number>;
  JudgementWindow: Record<
    string,
    Record<JudgementName, number>
  >;
};

type GameProps = {
  songInfo: SongInfo;
  userData: UserData;
  mapPath: string;
  hitObjects: HitObject[];
};

const JUDGEMENT_NAMES: JudgementName[] = ['Marvelous', 'Perfect', 'Great', 'Good', 'Okay', 'Miss'];
const COMBO_EXPONENT = 0.5;

const createEmptyJudgementCounts = (): Record<JudgementName, number> => {
  const counts: Record<JudgementName, number> = {
    Marvelous: 0,
    Perfect: 0,
    Great: 0,
    Good: 0,
    Okay: 0,
    Miss: 0,
  };
  return counts;
};

const cloneJudgementCounts = (source: Record<JudgementName, number>): Record<JudgementName, number> => {
  const copy = createEmptyJudgementCounts();
  for (const name of JUDGEMENT_NAMES) {
    copy[name] = source[name];
  }
  return copy;
};

const calculateAccuracyPercent = (
  counts: Record<JudgementName, number>,
  weights: Record<string, number>,
) => {
  const total = JUDGEMENT_NAMES.reduce((sum, type) => sum + counts[type], 0);
  if (total === 0) return 100;
  const weightedSum = JUDGEMENT_NAMES.reduce((sum, type) => sum + (weights[type] ?? 0) * counts[type], 0);
  return weightedSum / total;
};

const Game = ({ songInfo, userData, mapPath, hitObjects }: GameProps) => {  
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [judgementCounts, setJudgementCounts] = useState<Record<JudgementName, number>>(createEmptyJudgementCounts);
  const judgementCountsRef = useRef<Record<JudgementName, number>>(createEmptyJudgementCounts());
  const [lastJudgement, setLastJudgement] = useState<{ type: JudgementName; diff: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [life, setLife] = useState<number>(100);
  const lifeRef = useRef<number>(100);
  const musicTime = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);
  const smoothedNowMsRef = useRef<number>(0);
  const lastRafTimeRef = useRef<number>(0);
  const precomputedColumnsRef = useRef<number[] | null>(null);
  const sortedTimesRef = useRef<number[] | null>(null);
  const judgedNotesRef = useRef<boolean[]>([]);
  const laneWidthPxRef = useRef<number>(0);
  const noteHeightPxRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const highestComboRef = useRef<number>(0);
  const currentBaseScoreRef = useRef<number>(0);
  const currentMaximumBaseScoreRef = useRef<number>(0);
  const currentAccuracyJudgementCountRef = useRef<number>(0);
  const currentComboPortionRef = useRef<number>(0);

  const activeJudgementWindow = userData.JudgementWindow[userData.Judgment];
  const scoreValues = userData.ScoreValues;

  const maxBaseScorePerHit = useMemo(() => {
    let max = 0;
    for (const name of JUDGEMENT_NAMES) {
      const value = scoreValues[name];
      if (value > max) {
        max = value;
      }
    }
    return max;
  }, [scoreValues]);

  const maxCombo = hitObjects.length;
  const maxComboPortion = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= maxCombo; i++) {
      total += maxBaseScorePerHit * Math.pow(i, COMBO_EXPONENT);
    }
    return total;
  }, [maxCombo, maxBaseScorePerHit]);
  const rawAccuracy = calculateAccuracyPercent(judgementCounts, userData.Accuracy);
  const displayAccuracy = Math.min(100, Math.max(0, rawAccuracy));

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
    currentMaximumBaseScoreRef.current += maxBaseScorePerHit;
    currentBaseScoreRef.current += scoreValues[result];
    currentComboPortionRef.current += maxBaseScorePerHit * Math.pow(comboRef.current, COMBO_EXPONENT);

    const accuracyPercent = calculateAccuracyPercent(judgementCountsRef.current, userData.Accuracy);
    const accuracyValue = Math.min(100, Math.max(0, accuracyPercent)) / 100;
    const comboProgress = maxComboPortion > 0 ? currentComboPortionRef.current / maxComboPortion : 1;
    const accuracyProgress = maxCombo > 0 ? currentAccuracyJudgementCountRef.current / maxCombo : 1;

    const computedScore = Math.round(
      500000 * accuracyValue * comboProgress +
      500000 * Math.pow(accuracyValue, 5) * accuracyProgress
    );

    setScore(computedScore);

    // check if life is <= 0 and navigate to game over
    if (lifeRef.current <= 0) {
      const finalAccuracy = Math.min(100, Math.max(0, accuracyPercent));
      navigate('/gameover', {
        state: {
          score: computedScore,
          accuracy: finalAccuracy,
          highestCombo: highestComboRef.current,
        },
      });
    }
  }, [maxCombo, maxComboPortion, userData.Accuracy, userData.Life, maxBaseScorePerHit, scoreValues, navigate]);

  const judgeHit = useCallback((column: number) => {
    const windowConfig = activeJudgementWindow;
    if (!windowConfig) {
      return;
    }

    const times = sortedTimesRef.current;
    const columns = precomputedColumnsRef.current;
    const judged = judgedNotesRef.current;

    if (!times || !columns || !judged) {
      return;
    }

    const maxWindow = windowConfig.Miss;
    if (maxWindow <= 0) {
      return;
    }

    const now = musicTime.current ? musicTime.current.currentTime * 1000 : currentTimeRef.current;

    let bestIndex = -1;
    let bestAbsDiff = Number.POSITIVE_INFINITY;
    let bestSignedDiff = 0;

    for (let i = 0; i < times.length; i++) {
      if (judged[i]) continue;
      if (columns[i] !== column) continue;

      const diff = times[i] - now;
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

    let result: JudgementName;
    if (bestAbsDiff <= windowConfig.Marvelous) {
      result = 'Marvelous';
    } else if (bestAbsDiff <= windowConfig.Perfect) {
      result = 'Perfect';
    } else if (bestAbsDiff <= windowConfig.Great) {
      result = 'Great';
    } else if (bestAbsDiff <= windowConfig.Good) {
      result = 'Good';
    } else if (bestAbsDiff <= windowConfig.Okay) {
      result = 'Okay';
    } else {
      result = 'Miss';
    }

    judged[bestIndex] = true;

    setJudgementCounts(prev => {
      const newCounts: Record<JudgementName, number> = {
        Marvelous: prev.Marvelous,
        Perfect: prev.Perfect,
        Great: prev.Great,
        Good: prev.Good,
        Okay: prev.Okay,
        Miss: prev.Miss,
      };

      if (result === 'Marvelous') newCounts.Marvelous += 1;
      else if (result === 'Perfect') newCounts.Perfect += 1;
      else if (result === 'Great') newCounts.Great += 1;
      else if (result === 'Good') newCounts.Good += 1;
      else if (result === 'Okay') newCounts.Okay += 1;
      else newCounts.Miss += 1;

      judgementCountsRef.current = cloneJudgementCounts(newCounts);
      return newCounts;
    });
    setLastJudgement({ type: result, diff: bestSignedDiff });
    applyJudgementEffects(result);
  }, [activeJudgementWindow, applyJudgementEffects]);

  useEffect(() => {
    if (musicTime.current) {
      musicTime.current.playbackRate = userData.MusicSpeed;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

       if (key === 'escape') {
         const audio = musicTime.current;
         if (audio) {
           if (audio.paused) audio.play();
           else audio.pause();
         }
         return;
       }

      setPressedKeys(prev => new Set(prev).add(key));

      const circleSize = songInfo['CircleSize'];
      const maniaWidthKey = String(circleSize);
      const keybinds = userData.Keybinds[maniaWidthKey].map(k => k.toLowerCase());
      const column = keybinds.indexOf(key);

      if (column !== -1) {
        judgeHit(column);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(event.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [judgeHit, songInfo, userData]);

  useEffect(() => {
    const resetCounts = createEmptyJudgementCounts();
    setJudgementCounts(resetCounts);
    judgementCountsRef.current = cloneJudgementCounts(resetCounts);
    setLastJudgement(null);
    judgedNotesRef.current = new Array(hitObjects.length).fill(false);
    comboRef.current = 0;
    highestComboRef.current = 0;
    currentBaseScoreRef.current = 0;
    currentMaximumBaseScoreRef.current = 0;
    currentAccuracyJudgementCountRef.current = 0;
    currentComboPortionRef.current = 0;
    setCombo(0);
    setHighestCombo(0);
    setScore(0);
    setLife(100);
    lifeRef.current = 100;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const circleSize = songInfo['CircleSize'];
    const maniaWidthKey = String(circleSize);
    const laneWidthPercent = parseFloat(userData.ManiaWidth[maniaWidthKey]);
    const laneWidthPx = (laneWidthPercent / 100) * window.innerWidth;
    const noteHeightPercent = parseFloat(userData.ManiaHeight[maniaWidthKey]);
    const noteHeightPx = (noteHeightPercent / 100) * window.innerHeight;
    
    laneWidthPxRef.current = laneWidthPx;
    noteHeightPxRef.current = noteHeightPx;
    
    canvas.width = laneWidthPx * parseInt(String(circleSize));
    canvas.height = window.innerHeight;

    const getColumn = (xValue: number) => {
      return Math.floor(xValue * Number(songInfo['CircleSize']) / 512);
    };

    // precompute columns and sorted times
    const columns: number[] = new Array(hitObjects.length);
    for (let i = 0; i < hitObjects.length; i++) {
      columns[i] = getColumn(hitObjects[i].x);
    }
    precomputedColumnsRef.current = columns;

    const times = hitObjects.map(o => o.time);
    sortedTimesRef.current = times;

    smoothedNowMsRef.current = musicTime.current ? musicTime.current.currentTime * 1000 : 0;
    lastRafTimeRef.current = performance.now();

    const animate = (rafTime?: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const audioNowMs = musicTime.current ? musicTime.current.currentTime * 1000 : currentTimeRef.current;
      currentTimeRef.current = audioNowMs;

      const nowPerf = typeof rafTime === 'number' ? rafTime : performance.now();
      if (nowPerf - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = nowPerf;
        setCurrentTime(Math.floor(audioNowMs));
      }

      const deltaMs = nowPerf - lastRafTimeRef.current;
      lastRafTimeRef.current = nowPerf;
      let smoothed = smoothedNowMsRef.current + (deltaMs > 0 && deltaMs < 100 ? deltaMs : 0);
      const diff = audioNowMs - smoothed;
      if (Math.abs(diff) > 120) {
        smoothed = audioNowMs;
      } else {
        smoothed += diff * 0.12;
      }
      smoothedNowMsRef.current = smoothed;

      const now = smoothedNowMsRef.current;
      const visibleWindowMsPast = 200;
      const visibleWindowMsFuture = 4000;
      const pixelsPerMs = userData.ScrollSpeed;

      // receptor line
      const receptorY = canvas.height - userData.ReceptorOffset;
      ctx.fillStyle = '#444444';
      ctx.fillRect(0, receptorY, canvas.width, 2);

      // draw each upcoming object
      ctx.fillStyle = '#FFFFFF';
      const timesArr = sortedTimesRef.current || [];
      const colsArr = precomputedColumnsRef.current || [];
      const judgedArr = judgedNotesRef.current || [];

      const missWindow = activeJudgementWindow.Miss;

      let lo = 0, hi = timesArr.length;
      const lowerBoundTime = now - visibleWindowMsPast;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (timesArr[mid] < lowerBoundTime) lo = mid + 1;
        else hi = mid;
      }
      const upperBoundTime = now + visibleWindowMsFuture;
      for (let i = lo; i < timesArr.length && timesArr[i] <= upperBoundTime; i++) {
        if (judgedArr[i]) continue;

        const time = timesArr[i];
        const dt = time - now;
        const column = colsArr[i];
        const x = column * laneWidthPxRef.current;
        if (dt < -missWindow) {
          judgedArr[i] = true;
          setJudgementCounts(prev => {
            const newCounts: Record<JudgementName, number> = {
              Marvelous: prev.Marvelous,
              Perfect: prev.Perfect,
              Great: prev.Great,
              Good: prev.Good,
              Okay: prev.Okay,
              Miss: prev.Miss,
            };
            newCounts.Miss += 1;
            judgementCountsRef.current = cloneJudgementCounts(newCounts);
            return newCounts;
          });
          setLastJudgement({ type: 'Miss', diff: dt });
          applyJudgementEffects('Miss');
          continue;
        }
        const y = receptorY - noteHeightPxRef.current - dt * pixelsPerMs;
        if (y + noteHeightPxRef.current < 0 || y > canvas.height) continue;
        ctx.fillRect(x, y, laneWidthPxRef.current, noteHeightPxRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const circleSize = songInfo['CircleSize'];
      const maniaWidthKey = String(circleSize);
      const laneWidthPercent = parseFloat(userData.ManiaWidth[maniaWidthKey]);
      const laneWidthPx = (laneWidthPercent / 100) * window.innerWidth;
      const noteHeightPercent = parseFloat(userData.ManiaHeight[maniaWidthKey]);
      const noteHeightPx = (noteHeightPercent / 100) * window.innerHeight;
      
      laneWidthPxRef.current = laneWidthPx;
      noteHeightPxRef.current = noteHeightPx;
      canvas.width = laneWidthPx * parseInt(String(circleSize));
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [songInfo, userData, hitObjects, applyJudgementEffects]);

  return (
    <>
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{
          backgroundImage: `url(${mapPath + String(songInfo['BackgroundFilename'])})`,
          filter: `blur(${userData.BackgroundBlur}px)`,
        }}
      />
      <div
        className="fixed inset-0 -z-10 bg-black pointer-events-none"
        style={{ opacity: userData.BackgroundOpacity }}
      />
      <audio
        ref={musicTime}
        src={mapPath + songInfo['AudioFilename']}
        autoPlay
        controls
      />

      <h1>hi</h1>

      <div>
        Current Time: {currentTime}ms
      </div>

      <div>
        <p>Currently pressed keys: {Array.from(pressedKeys).join(', ') || 'None'}</p>
        <p>Number of keys pressed: {pressedKeys.size}</p>
      </div>

      <div>
        <p>Life: {life.toFixed(1)}</p>
      </div>

      <div>
        <p>
          Last judgement: {lastJudgement
            ? `${lastJudgement.type} (${lastJudgement.diff.toFixed(2)}ms)`
            : 'None'}
        </p>
        {JUDGEMENT_NAMES.map(type => (
          <p key={type}>
            {type}: {judgementCounts[type]}
          </p>
        ))}
        <p>Accuracy: {`${displayAccuracy.toFixed(2)}%`}</p>
        <p>Score: {score}</p>
        <p>Combo: {combo}</p>
        <p>Highest combo: {highestCombo}</p>
      </div>



      <main className="absolute top-0 flex justify-center items-center w-screen h-screen text-[#FFFFFF] pointer-events-none">
        <canvas
          ref={canvasRef}
          className="bg-black"
        />
      </main>
    </>
  )
}

export default Game
