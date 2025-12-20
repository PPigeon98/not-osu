import { Link, useNavigate } from "react-router-dom";
import { IconButton, Box, Input, Select, MenuItem, ToggleButton, ToggleButtonGroup } from "@mui/material";
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

type SortType = "Artist" | "Length" | "Title";
type ModeType = "Mania" | "Taiko" | null;

const SongSelect = () => {  
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [playHoverSound] = useSound(buttonHover1);
  const [playClickSound] = useSound(buttonClick1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sort, setSort] = useState<SortType>("Title");
  const [mode, setMode] = useState<ModeType>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPathRef = useRef<string | null>(null);
  const navigate = useNavigate();

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

    const audioPath = encodeURI(`./beatmapsRaw/${beatmap.id}/${beatmap.songInfo.AudioFilename}`);
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
      <main className="flex flex-col items-center w-screen h-screen text-[#FFFFFF]">
        <div className="flex w-full justify-end items-center h-15 p-4 gap-4">
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              setMode(newMode);
            }}
            aria-label="gamemode"
          >
            <ToggleButton 
              value="Mania" 
              aria-label="mania"
              sx={{ 
                "&.Mui-selected": {
                  backgroundColor: "#6A2C85",
                    "&:hover": {
                      backgroundColor: "#6A2C85",
                    },
                  }, 
                "&:hover": { 
                  backgroundColor: "#934AB3" 
              }}}
            >
              <GiGrandPiano color={"#FFFFFF"} />
            </ToggleButton>
            <ToggleButton 
              value="Taiko" 
              aria-label="taiko" 
              sx={{ 
                "&.Mui-selected": {
                  backgroundColor: "#6A2C85",
                    "&:hover": {
                      backgroundColor: "#6A2C85",
                    },
                  }, 
                "&:hover": { 
                  backgroundColor: "#934AB3" 
              }}}
            >
              <GiDrumKit color={"#FFFFFF"} />
            </ToggleButton>
          </ToggleButtonGroup>

          <Select
            variant="standard"
            labelId="sort"
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            sx={{
              width: 150,
              color: "white",
              ".MuiSelect-icon": {
                color: "white",
              },
              ':before': { borderBottomColor: 'gray' },
              '&:hover:not(.Mui-disabled):before': { borderBottomColor: 'white' },
              ':after': { borderBottomColor: 'white' },
            }}
          >
            <MenuItem value={"Artist"}>Artist</MenuItem>
            <MenuItem value={"Length"}>Length</MenuItem>
            <MenuItem value={"Title"}>Title</MenuItem>
          </Select>

          <Input 
            placeholder="Search for a beatmap..." 
            inputProps={{ 'aria-label': 'search' }} 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            sx={{
              width: 300,
              color: "white",
              ':before': { borderBottomColor: 'gray' },
              '&:hover:not(.Mui-disabled):before': { borderBottomColor: 'white' },
              ':after': { borderBottomColor: 'white' },
            }}
          />
        </div>
        
        <div className="flex flex-col w-full h-[80%] overflow-y-auto text-left gap-2 relative">
          {beatmaps
            .filter((beatmap) => 
              !mode || 
              (mode === "Mania" && beatmap.songInfo.Mode === 3) || 
              (mode === "Taiko" && beatmap.songInfo.Mode === 1)
            )
            .filter((beatmap) => 
              beatmap.songInfo.Artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
              beatmap.songInfo.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              beatmap.songInfo.Version.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
              switch (sort) {
                case "Artist":
                  return a.songInfo.Artist.localeCompare(b.songInfo.Artist);
                case "Length":
                  return a.songInfo.PreviewTime - b.songInfo.PreviewTime;
                case "Title":
                  return a.songInfo.Title.localeCompare(b.songInfo.Title);
                default:
                  return 0;
              }
            })
            .map((beatmap, i) => (
              <Link
                key={i}
                to="/game"
                state={{ beatmapId: beatmap.id, beatmapName: beatmap.name }}
                className="cursor-pointer hover:underline hover:text-[#934AB3] flex items-center gap-3"
                onMouseEnter={() => handleMouseEnter(beatmap)}
                onClick={() => { playClickSound(); audioRef.current?.pause(); audioRef.current = null; audioPathRef.current = null; }}
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

          <div className="absolute w-full h-full flex items-center pointer-events-none">
            <img 
              src={text} 
              alt="Text saying 'Select your song!' on the right hand side" 
              className="fixed right-20 h-1/2"
            />
          </div>
        </div>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton aria-label="back" 
            sx={{
              backgroundColor: '#934AB3',
              marginTop: 1,
              color: 'white','&:hover': {backgroundColor: '#6A2C85'}
            }}
            onClick={() => { navigate("/"); audioRef.current?.pause(); audioRef.current = null; audioPathRef.current = null; }}>
              <FirstPageRoundedIcon />
          </IconButton>
          <UploadBeatmap />
        </Box>
      </main>
    </>
  )
}

export default SongSelect
