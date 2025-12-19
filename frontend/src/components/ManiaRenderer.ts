import { useEffect, useRef } from 'react';
import { type HitObject, type SongInfo, type UserData } from './CommonGame';

type RendererArgs = {
  songInfo: SongInfo;
  userData: UserData;
  hitObjects: HitObject[];
  activeJudgementWindow: UserData['JudgementWindow'][string];
  musicTimeRef: React.MutableRefObject<HTMLAudioElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  currentTimeRef: React.MutableRefObject<number>;
  precomputedColumnsRef: React.MutableRefObject<number[] | null>;
  sortedTimesRef: React.MutableRefObject<number[] | null>;
  judgedNotesRef: React.MutableRefObject<boolean[]>;
  laneWidthPxRef: React.MutableRefObject<number>;
  noteHeightPxRef: React.MutableRefObject<number>;
  pressedKeysRef: React.MutableRefObject<Set<string>>;
  markMiss: (diffMs: number) => void;
  resetJudging: (noteCount: number) => void;
};

export const ManiaRenderer = ({
  songInfo,
  userData,
  hitObjects,
  activeJudgementWindow,
  musicTimeRef,
  canvasRef,
  setCurrentTime,
  currentTimeRef,
  precomputedColumnsRef,
  sortedTimesRef,
  judgedNotesRef,
  laneWidthPxRef,
  noteHeightPxRef,
  pressedKeysRef,
  markMiss,
  resetJudging,
}: RendererArgs) => {
  const lastUiUpdateRef = useRef<number>(0);
  const smoothedNowMsRef = useRef<number>(0);
  const lastRafTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    resetJudging(hitObjects.length);

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

    const columns: number[] = new Array(hitObjects.length);
    for (let i = 0; i < hitObjects.length; i++) {
      columns[i] = getColumn(hitObjects[i].x);
    }
    precomputedColumnsRef.current = columns;

    const times = hitObjects.map(o => o.time);
    sortedTimesRef.current = times;

    smoothedNowMsRef.current = musicTimeRef.current ? musicTimeRef.current.currentTime * 1000 : 0;
    lastRafTimeRef.current = performance.now();

    const animate = (rafTime?: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const audioNowMs = musicTimeRef.current ? musicTimeRef.current.currentTime * 1000 : currentTimeRef.current;
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
      const baseHeight = 1080;
      const scrollSpeedScale = window.innerHeight / baseHeight;
      const pixelsPerMs = userData.ScrollSpeed * scrollSpeedScale;

      const receptorOffsetPercent = parseFloat(userData.ReceptorOffset);
      const receptorOffsetPx = (receptorOffsetPercent / 100) * window.innerHeight;
      const receptorY = canvas.height - receptorOffsetPx;
      
      const circleSize = songInfo['CircleSize'];
      const maniaWidthKey = String(circleSize);
      const keybinds = userData.Keybinds[maniaWidthKey];
      const pressedColumns = new Set<number>();
      for (const key of pressedKeysRef.current) {
        const column = keybinds.findIndex(k => k.toLowerCase() === key.toLowerCase());
        if (column !== -1) {
          pressedColumns.add(column);
        }
      }

      for (const column of pressedColumns) {
        const laneX = column * laneWidthPxRef.current;
        const laneWidth = laneWidthPxRef.current;
        const width = laneWidth * 0.9;
        const x = laneX + (laneWidth - width) / 2;
        const gradientStartY = receptorY - noteHeightPxRef.current * 8;
        const gradientEndY = receptorY;
        
        const gradient = ctx.createLinearGradient(x, gradientStartY, x, gradientEndY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, gradientStartY, width, gradientEndY - gradientStartY);
      }
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, receptorY, canvas.width, 2);

      ctx.fillStyle = '#FFFFFF';
      const timesArr = sortedTimesRef.current || [];
      const colsArr = precomputedColumnsRef.current || [];
      const judgedArr = judgedNotesRef.current || [];

      const missWindow = activeJudgementWindow.Miss;

      let lo = 0, hi = timesArr.length;
      const lowerBoundTime = now - visibleWindowMsPast;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
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
          markMiss(dt);
          continue;
        }
        const y = receptorY - noteHeightPxRef.current - dt * pixelsPerMs;
        if (y + noteHeightPxRef.current < 0 || y > canvas.height) continue;
        
        const numColumns = parseInt(String(circleSize));
        const isOdd = numColumns % 2 === 1;
        const centerPoint = (numColumns - 1) / 2;
        const distanceFromCenter = Math.abs(column - centerPoint);
        const roundedDistance = Math.round(distanceFromCenter);
        
        if (numColumns >= 10) {
          const middleCol1 = Math.floor(centerPoint);
          const middleCol2 = Math.ceil(centerPoint);
          if (column === middleCol1 || column === middleCol2) {
            ctx.fillStyle = '#934AB3';
          } else if (roundedDistance % 2 === 1) {
            ctx.fillStyle = '#EF4444';
          } else {
            ctx.fillStyle = '#60A5FA';
          }
        } else {
          if (isOdd && roundedDistance === 0) {
            ctx.fillStyle = '#934AB3';
          } else if (roundedDistance % 2 === 1) {
            ctx.fillStyle = '#EF4444';
          } else {
            ctx.fillStyle = '#60A5FA';
          }
        }
        
        const width = laneWidthPxRef.current;
        const height = noteHeightPxRef.current;
        const radius = Math.min(width, height) * 0.1;
        
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const circleSizeVal = songInfo['CircleSize'];
      const maniaWidthKeyVal = String(circleSizeVal);
      const laneWidthPercentVal = parseFloat(userData.ManiaWidth[maniaWidthKeyVal]);
      const laneWidthPxVal = (laneWidthPercentVal / 100) * window.innerWidth;
      const noteHeightPercentVal = parseFloat(userData.ManiaHeight[maniaWidthKeyVal]);
      const noteHeightPxVal = (noteHeightPercentVal / 100) * window.innerHeight;
      
      laneWidthPxRef.current = laneWidthPxVal;
      noteHeightPxRef.current = noteHeightPxVal;
      canvasEl.width = laneWidthPxVal * parseInt(String(circleSizeVal));
      canvasEl.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [
    activeJudgementWindow,
    canvasRef,
    currentTimeRef,
    hitObjects,
    judgedNotesRef,
    laneWidthPxRef,
    markMiss,
    musicTimeRef,
    noteHeightPxRef,
    precomputedColumnsRef,
    resetJudging,
    setCurrentTime,
    songInfo,
    sortedTimesRef,
    userData,
  ]);
};

export default ManiaRenderer;
