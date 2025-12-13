import { useEffect } from 'react';
import { type HitObject, type SongInfo, type UserData } from './CommonGame';

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
  useEffect(() => {
    resetJudging(hitObjects.length);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.2;

    let animationFrameId: number | null = null;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const taikoReceptorOffsetPercent = parseFloat(userData.TaikoReceptorOffset);
      const taikoReceptorOffsetPx = (taikoReceptorOffsetPercent / 100) * canvas.width;
      const receptorX = taikoReceptorOffsetPx;

      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(receptorX, 0);
      ctx.lineTo(receptorX, canvas.height);
      ctx.stroke();

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


