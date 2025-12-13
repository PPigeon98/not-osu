import { useEffect, useRef } from 'react';
import { type HitObject, type SongInfo, type UserData, smoothTime } from './CommonGame';

type TaikoRendererArgs = {
  songInfo: SongInfo;
  userData: UserData;
  hitObjects: HitObject[];
  activeJudgementWindow: UserData['JudgementWindow'][string];
  musicTimeRef: React.MutableRefObject<HTMLAudioElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  currentTimeRef: React.MutableRefObject<number>;
  sortedTimesRef: React.MutableRefObject<number[] | null>;
  judgedNotesRef: React.MutableRefObject<boolean[]>;
  markMiss: (diffMs: number) => void;
  resetJudging: (noteCount: number) => void;
};

export const TaikoRenderer = ({
  songInfo,
  userData,
  hitObjects,
  activeJudgementWindow,
  musicTimeRef,
  canvasRef,
  setCurrentTime,
  currentTimeRef,
  sortedTimesRef,
  judgedNotesRef,
  markMiss,
  resetJudging,
}: TaikoRendererArgs) => {
  const lastUiUpdateRef = useRef<number>(0);
  const smoothedNowMsRef = useRef<number>(0);
  const lastRafTimeRef = useRef<number>(0);

  useEffect(() => {
    resetJudging(hitObjects.length);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.2;

    const times = hitObjects.map(o => o.time);
    sortedTimesRef.current = times;

    smoothedNowMsRef.current = musicTimeRef.current ? musicTimeRef.current.currentTime * 1000 : 0;
    lastRafTimeRef.current = performance.now();

    let animationFrameId: number | null = null;

    const animate = (rafTime?: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const audioNowMs = musicTimeRef.current ? musicTimeRef.current.currentTime * 1000 : currentTimeRef.current;
      currentTimeRef.current = audioNowMs;

      const nowPerf = typeof rafTime === 'number' ? rafTime : performance.now();
      if (nowPerf - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = nowPerf;
        setCurrentTime(Math.floor(audioNowMs));
      }

      const smoothed = smoothTime(audioNowMs, smoothedNowMsRef, lastRafTimeRef, nowPerf);
      const now = smoothed;

      const visibleWindowMsPast = 200;
      const visibleWindowMsFuture = 4000;
      const baseHeight = 1080;
      const scrollSpeedScale = window.innerHeight / baseHeight;
      const pixelsPerMs = userData.TaikoScrollSpeed * scrollSpeedScale;

      const taikoReceptorOffsetPercent = parseFloat(userData.TaikoReceptorOffset);
      const taikoReceptorOffsetPx = (taikoReceptorOffsetPercent / 100) * canvas.width;
      const receptorX = taikoReceptorOffsetPx;

      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(receptorX, 0);
      ctx.lineTo(receptorX, canvas.height);
      ctx.stroke();

      const timesArr = sortedTimesRef.current || [];
      const judgedArr = judgedNotesRef.current || [];
      const missWindow = activeJudgementWindow.Miss;

      const centerY = canvas.height / 2;

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

        if (dt < -missWindow) {
          judgedArr[i] = true;
          markMiss(dt);
          continue;
        }

        const approachDistance = dt * pixelsPerMs;
        const x = receptorX + approachDistance;

        if (x < -50 || x > canvas.width + 50) continue;

        const hitObject = hitObjects[i];
        const hitSound = hitObject.hitSound;
        const isKat = (hitSound & 2) !== 0 || (hitSound & 8) !== 0;

        ctx.fillStyle = isKat ? '#4A90E2' : '#FF6B6B';
        ctx.beginPath();
        ctx.arc(x, centerY, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight * 0.2;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [
    activeJudgementWindow,
    canvasRef,
    currentTimeRef,
    hitObjects,
    judgedNotesRef,
    markMiss,
    musicTimeRef,
    resetJudging,
    setCurrentTime,
    songInfo,
    sortedTimesRef,
    userData,
  ]);
};

export default TaikoRenderer;


