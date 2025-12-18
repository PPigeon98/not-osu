import { Link } from "react-router-dom";
import { Button, IconButton } from "@mui/material";
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded';
import { GiDrumKit, GiGrandPiano } from "react-icons/gi";
import { VscWarning } from "react-icons/vsc";
import text from "../../public/song_select_text.svg";
import '../App.css'; 
import UploadBeatmap from "./UploadBeatmap";
import { useState, useEffect, useRef } from "react";
import useSound from "use-sound";
import buttonHover1 from "../../public/sounds/button_hover_1.wav";
import buttonClick1 from "../../public/sounds/button_click_1.wav";

const backendUrl = 'http://localhost:5000';

type BeatmapSongInfo = {
  AudioFilename: string;
  PreviewTime: number;
  Mode: number;
  Title: string;
  Artist: string;
  Version: string;
  CircleSize: number;
};

type Beatmap = {
  id: number;
  name: string;
  songInfo: BeatmapSongInfo;
};

const SongSelect = () => {  
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [playHoverSound] = useSound(buttonHover1);
  const [playClickSound] = useSound(buttonClick1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPathRef = useRef<string | null>(null);

  useEffect(() => {
    fetchBeatmaps();
  }, []);

  const fetchBeatmaps = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/beatmaps`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data: Beatmap[] = await response.json();
      setBeatmaps(data);
    } catch (error) {
      console.log('Beatmaps fetch failed:', error);
    }
  };

  const handleMouseEnter = (beatmap: Beatmap) => {
    playHoverSound();

    const audioPath = `./beatmapsRaw/${beatmap.id}/${beatmap.songInfo.AudioFilename}`;
    const audio = new Audio(audioPath);

    if (audioPath === audioPathRef.current) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioPathRef.current = audioPath;
    audio.currentTime = beatmap.songInfo.PreviewTime / 1000;
    audio.volume = 0.2; // make this a setting later

    audio.play()

    audioRef.current = audio;
  };

  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen text-[#FFFFFF]">
        {/* use maploader to parse the data */}
        <div className="flex flex-col w-full h-[70%] w-[85%] overflow-y-auto text-left gap-2 mt-5">
          {beatmaps.map((beatmap, i) => (
            <Link
              key={i}
              to="/game"
              state={{ beatmapId: beatmap.id, beatmapName: beatmap.name }}
              className="cursor-pointer hover:underline hover:text-[#934AB3] flex items-center gap-3"
              onMouseEnter={() => handleMouseEnter(beatmap)}
              onClick={() => playClickSound()}
            >
              <span className="text-[3vh] flex items-center justify-center gap-1">
                {beatmap.songInfo.Mode === 1 && <GiDrumKit />}
                {beatmap.songInfo.Mode === 3 && (
                  <>
                    <GiGrandPiano />
                    <span className="text-[2vh]">{beatmap.songInfo.CircleSize}K</span>
                  </>
                )}
                {beatmap.songInfo.Mode !== 1 && beatmap.songInfo.Mode !== 3 && <VscWarning />}
              </span>
              <span>
                <span className="font-bold text-[2.4vh] block">
                  {beatmap.songInfo.Title}
                </span>
                <span className="text-[1.8vh] block">
                  {beatmap.songInfo.Artist}
                </span>
                <span className="font-bold text-[1.8vh] block">
                  {beatmap.songInfo.Version}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <img 
          src={text} 
          alt="Text saying 'Select your song!' on the right hand side" 
          className="fixed right-0 top-1/2 -translate-y-1/2 w-1/2"
        />

        {/* this button is temporary, u make it look nicer later */}
        <UploadBeatmap />

        <IconButton aria-label="back" 
          href="/"
          sx={{
            backgroundColor: '#934AB3',
            marginTop: 1,
            color: 'white','&:hover': {backgroundColor: 'secondary.dark'}
          }}>
            <FirstPageRoundedIcon />
        </IconButton>
      </main>
    </>
  )
}

export default SongSelect
