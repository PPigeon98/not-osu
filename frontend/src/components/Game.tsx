import { useState, useEffect, useRef, useCallback } from 'react';

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

const judgementTypes: JudgementName[] = ['Marvelous', 'Perfect', 'Great', 'Good', 'Okay', 'Miss'];

const Game = ({ songInfo, userData, mapPath, hitObjects }: GameProps) => {  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [judgementCounts, setJudgementCounts] = useState<Record<JudgementName, number>>({
    Marvelous: 0,
    Perfect: 0,
    Great: 0,
    Good: 0,
    Okay: 0,
    Miss: 0,
  });
  const [lastJudgement, setLastJudgement] = useState<{ type: JudgementName; diff: number } | null>(null);
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

  const activeJudgementWindow = userData.JudgementWindow[userData.Judgment];

  const totalJudgements = judgementTypes.reduce(
    (sum, type) => sum + judgementCounts[type],
    0,
  );
  const weightedSum = judgementTypes.reduce((sum, type) => {
    const weight = userData.Accuracy[type];
    return sum + weight * judgementCounts[type];
  }, 0);
  const rawAccuracy = totalJudgements === 0 ? 100 : weightedSum / totalJudgements;
  const displayAccuracy = Math.min(100, Math.max(0, rawAccuracy));

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

      if (result === 'Marvelous') {
        newCounts.Marvelous += 1;
      } else if (result === 'Perfect') {
        newCounts.Perfect += 1;
      } else if (result === 'Great') {
        newCounts.Great += 1;
      } else if (result === 'Good') {
        newCounts.Good += 1;
      } else if (result === 'Okay') {
        newCounts.Okay += 1;
      } else {
        newCounts.Miss += 1;
      }

      return newCounts;
    });
    setLastJudgement({ type: result, diff: bestSignedDiff });
  }, [activeJudgementWindow]);

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
    setJudgementCounts({
      Marvelous: 0,
      Perfect: 0,
      Great: 0,
      Good: 0,
      Okay: 0,
      Miss: 0,
    });
    setLastJudgement(null);
    judgedNotesRef.current = new Array(hitObjects.length).fill(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const circleSize = songInfo['CircleSize'];
    const maniaWidthKey = String(circleSize);
    const laneWidthPx = parseInt(userData.ManiaWidth[maniaWidthKey]);
    const noteHeightPx = parseInt(userData.ManiaHeight[maniaWidthKey]);
    
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
        const x = column * laneWidthPx;
        if (missWindow !== null && dt < -missWindow) {
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
            return newCounts;
          });
          setLastJudgement({ type: 'Miss', diff: dt });
          continue;
        }
        const y = receptorY - noteHeightPx - dt * pixelsPerMs;
        if (y + noteHeightPx < 0 || y > canvas.height) continue;
        ctx.fillRect(x, y, laneWidthPx, noteHeightPx);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [songInfo, userData, hitObjects]);

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
        <p>
          Last judgement: {lastJudgement
            ? `${lastJudgement.type} (${lastJudgement.diff.toFixed(2)}ms)`
            : 'None'}
        </p>
        {judgementTypes.map(type => (
          <p key={type}>
            {type}: {judgementCounts[type]}
          </p>
        ))}
        <p>Accuracy: {`${displayAccuracy.toFixed(2)}%`}</p>
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
