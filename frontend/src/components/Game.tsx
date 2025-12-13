import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Keypresses from './Keypresses';
import {
  type HitObject,
  type SongInfo,
  type UserData,
} from './CommonGame';
import { Judger } from './Judger';
import { ManiaRenderer } from './ManiaRenderer';
import { TaikoRenderer } from './TaikoRenderer';

type GameProps = {
  songInfo: SongInfo;
  userData: UserData;
  mapPath: string;
  hitObjects: HitObject[];
};

const Game = ({ songInfo, userData, mapPath, hitObjects }: GameProps) => {  
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<number>(0);
  const musicTime = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentTimeRef = useRef<number>(0);
  const precomputedColumnsRef = useRef<number[] | null>(null);
  const sortedTimesRef = useRef<number[] | null>(null);
  const judgedNotesRef = useRef<boolean[]>([]);
  const laneWidthPxRef = useRef<number>(0);
  const noteHeightPxRef = useRef<number>(0);

  const musicVolume = userData.MusicVolume;

  const { state: judgingState, controls: judgingControls } = Judger(
    userData,
    hitObjects,
    precomputedColumnsRef,
    sortedTimesRef,
    judgedNotesRef,
  );

  const { score, highestCombo, life, displayAccuracy, lastJudgement, combo } = judgingState;
  const { judgeHit, judgeTaiko, markMiss, resetJudging } = judgingControls;

  const activeJudgementWindow = userData.JudgementWindow[userData.Judgment];

  useEffect(() => {
    if (life <= 0) {
      const audio = musicTime.current;
      const currentTimeMs = audio ? audio.currentTime * 1000 : currentTimeRef.current;
      const durationMs = audio && audio.duration ? audio.duration * 1000 : 0;
      const completionPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;
      
      navigate('/gameover', {
        state: {
          completionPercent: completionPercent,
        },
      });
    }
  }, [life, navigate]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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

    const isTaikoMode = songInfo['Mode'] === 1 || songInfo['Mode'] === '1';

    if (isTaikoMode) {
      const taikoKeybinds = userData.Keybinds['taiko'].map(k => k.toLowerCase());
      const keyIndex = taikoKeybinds.indexOf(key);

      if (keyIndex !== -1) {
        const now = musicTime.current ? musicTime.current.currentTime * 1000 : currentTimeRef.current;
        const isKat = keyIndex === 0 || keyIndex === 3;
        judgeTaiko(isKat, now, hitObjects);
      }
    } else {
      const circleSize = songInfo['CircleSize'];
      const maniaWidthKey = String(circleSize);
      const keybinds = userData.Keybinds[maniaWidthKey].map(k => k.toLowerCase());
      const column = keybinds.indexOf(key);

      if (column !== -1) {
        const now = musicTime.current ? musicTime.current.currentTime * 1000 : currentTimeRef.current;
        judgeHit(column, now);
      }
    }
  }, [judgeHit, judgeTaiko, songInfo, userData, hitObjects]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setPressedKeys(prev => {
      const newKeys = new Set(prev);
      newKeys.delete(event.key.toLowerCase());
      return newKeys;
    });
  }, []);

  useEffect(() => {
    if (musicTime.current) {
      musicTime.current.playbackRate = userData.MusicSpeed;
    }
  }, [userData.MusicSpeed]);

  useEffect(() => {
    if (!musicTime.current) return;
    musicTime.current.volume = musicVolume / 100;
  }, [musicVolume]);

  useEffect(() => {
    const updateProgress = () => {
      const audio = musicTime.current;
      if (audio && audio.duration) {
        const currentProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(currentProgress);
      }
    };

    const audio = musicTime.current;
    if (audio) {
      audio.addEventListener('timeupdate', updateProgress);
      return () => audio.removeEventListener('timeupdate', updateProgress);
    }
  }, []);

  if (songInfo['Mode'] === '1') {
    TaikoRenderer({
      songInfo,
      userData,
      hitObjects,
      activeJudgementWindow,
      musicTimeRef: musicTime,
      canvasRef,
      setCurrentTime,
      currentTimeRef,
      sortedTimesRef,
      judgedNotesRef,
      markMiss,
      resetJudging,
    });
  } else {
    ManiaRenderer({
      songInfo,
      userData,
      hitObjects,
      activeJudgementWindow,
      musicTimeRef: musicTime,
      canvasRef,
      setCurrentTime,
      currentTimeRef,
      precomputedColumnsRef,
      sortedTimesRef,
      judgedNotesRef,
      laneWidthPxRef,
      noteHeightPxRef,
      markMiss,
      resetJudging,
    });
  }

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
        onEnded={() => {
          navigate('/passedmap', {
            state: {
              score,
              accuracy: displayAccuracy,
              highestCombo: highestCombo,
            },
          });
        }}
      />



      <main className="absolute top-0 flex justify-center items-center w-screen h-screen text-[#FFFFFF] pointer-events-none">
        <canvas
          ref={canvasRef}
          className="bg-black"
        />
        {lastJudgement && lastJudgement.type !== 'Miss' && (
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
            <div className="text-[4vw] font-bold mb-0">{lastJudgement.type}</div>
            <div className="text-[1.8vw]">{Math.round(lastJudgement.diff)}ms</div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 text-[8vw] font-bold pointer-events-none">
          {combo}x
        </div>
        <div className="absolute top-4 left-4 w-[20vw] h-[2vw] bg-black-800 border-2 border-white pointer-events-none">
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${life}%` }}
          />
        </div>
        <div className="absolute top-0 right-4 text-right pointer-events-none">
          <div className="text-[4vw] font-bold">{score.toLocaleString()}</div>
          <div className="text-[2vw] font-bold">{displayAccuracy.toFixed(2)}%</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1vw] bg-gray-800 pointer-events-none">
          <div 
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </main>
      <Keypresses onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
    </>
  )
}

export default Game
