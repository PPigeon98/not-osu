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

  const { score, highestCombo, life, displayAccuracy } = judgingState;
  const { judgeHit, markMiss, resetJudging } = judgingControls;

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

    const circleSize = songInfo['CircleSize'];
    const maniaWidthKey = String(circleSize);
    const keybinds = userData.Keybinds[maniaWidthKey].map(k => k.toLowerCase());
    const column = keybinds.indexOf(key);

      if (column !== -1) {
        const now = musicTime.current ? musicTime.current.currentTime * 1000 : currentTimeRef.current;
        judgeHit(column, now);
      }
  }, [judgeHit, songInfo, userData]);

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
        <p>Accuracy: {`${displayAccuracy.toFixed(2)}%`}</p>
        <p>Score: {score}</p>
        <p>Combo: {highestCombo}</p>
      </div>



      <main className="absolute top-0 flex justify-center items-center w-screen h-screen text-[#FFFFFF] pointer-events-none">
        <canvas
          ref={canvasRef}
          className="bg-black"
        />
      </main>
      <Keypresses onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
    </>
  )
}

export default Game
