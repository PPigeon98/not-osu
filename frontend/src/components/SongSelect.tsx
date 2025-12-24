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
import InitUserData from "./InitUserData";
import { backendUrl } from "./CommonGame";

type BeatmapSongInfo = {
  AudioFilename: string;
  PreviewTime: number;
  Mode: number;
  Title: string;
  Artist: string;
  Version: string;
  CircleSize: number;
  StarRating?: number;
};

type Beatmap = {
  id: string;
  setId: string;
  name: string;
  songInfo: BeatmapSongInfo;
};

type SortType = "Artist" | "Length" | "Title" | "Difficulty";
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
      const response = await fetch(`${backendUrl}/beatmaps`);
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

    const stored = localStorage.getItem("userData");
    const userData = stored ? JSON.parse(stored) : InitUserData();
    const musicVolume = userData.MusicVolume / 100;

    // Use backend API so it works for both public/beatmaps and /tmp/beatmaps on Vercel
    const audioPath = encodeURI(`${backendUrl}/beatmaps/${beatmap.setId}/${beatmap.songInfo.AudioFilename}`);
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
    audio.volume = musicVolume;

    audio.play()

    audioRef.current = audio;
  };

  return (
    <>
      <main className="flex flex-col items-center w-screen h-screen text-[#FFFFFF] pl-4">
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
                transition: "all 0.6s ease",
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
                transition: "all 0.6s ease",
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
            <MenuItem value={"Difficulty"}>Difficulty</MenuItem>
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

        <div className="flex w-full h-[80%] relative">
          {/* Left: song cards (2/3 width) */}
          <div className="flex flex-col w-2/3 h-full overflow-y-auto text-left gap-2 custom-scrollbar py-[20vh] pr-4">
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
                case "Difficulty": {
                  const aStar = a.songInfo.StarRating ?? 0;
                  const bStar = b.songInfo.StarRating ?? 0;
                  // Higher star rating first
                  if (bStar !== aStar) return bStar - aStar;
                  // Tie-break by title for stable ordering
                  return a.songInfo.Title.localeCompare(b.songInfo.Title);
                }
                default:
                  return 0;
              }
            })
            .map((beatmap, i) => (
              <Link
                key={i}
                to="/game"
                state={{ beatmapId: beatmap.id, beatmapSetId: beatmap.setId, beatmapName: beatmap.name }}
                className="w-full px-4"
                onMouseEnter={() => handleMouseEnter(beatmap)}
                onClick={() => { playClickSound(); audioRef.current?.pause(); audioRef.current = null; audioPathRef.current = null; }}
              >
                <div
                  className="cursor-pointer flex items-center gap-4 w-full rounded-2xl bg-[#1E1E2E]/80 border border-[#313244] shadow-lg hover:bg-[#313244] hover:shadow-xl hover:-translate-y-[2px] transition-all duration-300 p-4"
                >
                  <div className="text-[3vh] flex items-center justify-center gap-1 min-w-[4rem]">
                    {beatmap.songInfo.Mode === 1 && <GiDrumKit />}
                    {beatmap.songInfo.Mode === 3 && (
                      <>
                        <GiGrandPiano />
                        <span className="text-[2vh]">{beatmap.songInfo.CircleSize}K</span>
                      </>
                    )}
                    {beatmap.songInfo.Mode !== 1 && beatmap.songInfo.Mode !== 3 && <VscWarning />}
                  </div>

                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-[2.4vh]">
                      {beatmap.songInfo.Title}
                    </span>
                    <span className="text-[1.8vh] opacity-80">
                      by {beatmap.songInfo.Artist}
                    </span>
                    <span className="font-bold text-[1.8vh] mt-1">
                      {beatmap.songInfo.Version}
                    </span>
                  </div>

                  <div className="flex flex-col items-end min-w-[5rem]">
                    <span className="text-[1.8vh] font-semibold">
                      {(beatmap.songInfo.StarRating ?? 0).toFixed(2)}★
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Right: song select artwork (1/3 width) */}
          <div className="flex items-center justify-center w-1/3 h-full pointer-events-none">
            <img 
              src={text} 
              alt="Text saying 'Select your song!' on the right hand side" 
              className="max-h-[70%]"
            />
          </div>

          {/* Top gradient overlay - covers mapped items area */}
          <div 
            className="absolute top-0 left-0 w-full h-20 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, #11111b, transparent)'
            }}
          />

          {/* Bottom gradient overlay - covers mapped items area */}
          <div 
            className="absolute bottom-0 left-0 w-full h-20 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, #11111b, transparent)'
            }}
          />
        </div>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton aria-label="back" 
            sx={{
              backgroundColor: '#934AB3',
              marginTop: 1,
              color: 'white',
              transition: "all 0.6s ease",
              '&:hover': {backgroundColor: '#6A2C85'}
            }}
            onClick={() => { navigate("/"); audioRef.current?.pause(); audioRef.current = null; audioPathRef.current = null; }}>
              <FirstPageRoundedIcon />
          </IconButton>
          <UploadBeatmap onUploadSuccess={fetchBeatmaps} />
        </Box>
      </main>
    </>
  )
}

export default SongSelect
