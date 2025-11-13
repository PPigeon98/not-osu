import { useState, useEffect, useRef } from 'react';

type SongInfo = Record<string, string | number>;

type HitObject = {
  x: number;
  y: number;
  time: number;
  type: number;
  hitSound: number;
};

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
  JudgementWindow: Record<
    string,
    {
      Marvelous: number;
      Perfect: number;
      Great: number;
      Good: number;
      Bad: number;
      Miss: number;
    }
  >;
};

type GameProps = {
  songInfo: SongInfo;
  userData: UserData;
  mapPath: string;
  hitObjects: HitObject[];
};

const Game = ({ songInfo, userData, mapPath, hitObjects }: GameProps) => {  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const musicTime = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);
  const smoothedNowMsRef = useRef<number>(0);
  const lastRafTimeRef = useRef<number>(0);
  const precomputedColumnsRef = useRef<number[] | null>(null);
  const sortedTimesRef = useRef<number[] | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(event.key));
      console.log(`Key DOWN: ${event.key} at ${musicTime.current ? musicTime.current.currentTime * 1000 : 0}ms`);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(event.key);
        console.log(`Key UP: ${event.key} at ${musicTime.current ? musicTime.current.currentTime * 1000 : 0}ms`);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
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

      let lo = 0, hi = timesArr.length;
      const lowerBoundTime = now - visibleWindowMsPast;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (timesArr[mid] < lowerBoundTime) lo = mid + 1; else hi = mid;
      }
      const upperBoundTime = now + visibleWindowMsFuture;
      for (let i = lo; i < timesArr.length && timesArr[i] <= upperBoundTime; i++) {
        const time = timesArr[i];
        const dt = time - now;
        const column = colsArr[i] ?? getColumn(hitObjects[i].x);
        const x = column * laneWidthPx;
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
