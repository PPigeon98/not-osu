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
  BackgroundFilename?: string;
};

type Beatmap = {
  id: string;
  setId: string;
  name: string;
  songInfo: BeatmapSongInfo;
};

type ScoreEntry = {
  score: number;
  highestCombo: number;
  accuracy: number;
};

type SortType = "Artist" | "Length" | "Title" | "Difficulty";
type ModeType = "Mania" | "Taiko" | null;

const SongSelect = () => {  
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [selectedBeatmap, setSelectedBeatmap] = useState<Beatmap | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
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

  // Update audio volume when MusicVolume changes in localStorage
  useEffect(() => {
    const updateVolume = () => {
      if (audioRef.current) {
        const stored = localStorage.getItem("userData");
        if (stored) {
          const userData = JSON.parse(stored);
          audioRef.current.volume = userData.MusicVolume / 100;
        }
      }
    };

    // Update volume immediately
    updateVolume();

    // Listen for storage changes (when settings are updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userData") {
        updateVolume();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also poll for changes (in case storage event doesn't fire for same-tab updates)
    const interval = setInterval(updateVolume, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioPathRef.current = null;
    };
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

    // Update leaderboard for hovered beatmap (always update, even if same song)
    try {
      const scoresRaw = userData.Scores?.[beatmap.id] ?? [];
      const scores: ScoreEntry[] = [...scoresRaw].sort((a, b) => b.score - a.score);
      setSelectedBeatmap(beatmap);
      setLeaderboard(scores.slice(0, 10));
    } catch {
      setSelectedBeatmap(beatmap);
      setLeaderboard([]);
    }

    // Update background image
    if (beatmap.songInfo.BackgroundFilename) {
      const bgPath = encodeURI(`${backendUrl}/beatmaps/${beatmap.setId}/${beatmap.songInfo.BackgroundFilename}`);
      setBackgroundImage(bgPath);
    } else {
      setBackgroundImage(null);
    }

    // Use backend API so it works for both public/beatmaps and /tmp/beatmaps on Vercel
    const audioPath = encodeURI(`${backendUrl}/beatmaps/${beatmap.setId}/${beatmap.songInfo.AudioFilename}`);
    
    if (audioPath === audioPathRef.current) {
      return;
    }

    const audio = new Audio(audioPath);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioPathRef.current = audioPath;
    audio.currentTime = beatmap.songInfo.PreviewTime / 1000;
    audio.volume = musicVolume;
    audio.loop = true; // Enable looping for song select preview

    audio.play();
    audioRef.current = audio;
  };

  return (
    <>
      {/* Background image */}
      {backgroundImage && (
        <div
          key={backgroundImage}
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `url("${backgroundImage}")`,
            filter: 'blur(10px)',
            zIndex: 0,
            opacity: 0,
            animation: 'fadeInBg 0.8s ease-in-out forwards',
          }}
        />
      )}
      <div 
        className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-700 ease-in-out"
        style={{ 
          opacity: backgroundImage ? 0.4 : 0.9,
          zIndex: 1,
        }}
      />
      <main className="flex flex-col items-center w-screen h-screen text-[#FFFFFF] pl-4 relative" style={{ zIndex: 2 }}>
        <div 
          className="flex w-screen justify-end items-center h-15 p-4 gap-4 -ml-4"
          style={{
            background: 'linear-gradient(to bottom, rgba(17, 17, 27, 0.7), rgba(17, 17, 27, 1.0))'
          }}
        >
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
                onClick={() => {
                  playClickSound();
                  // Stop preview audio before navigating to game
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  audioPathRef.current = null;
                }}
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

          {/* Right: song select artwork + leaderboard (1/3 width) */}
          <div className="flex flex-col w-1/3 h-full">
            {/* Top half: artwork */}
            <div className="flex items-center justify-center h-1/2 pointer-events-none">
              <img 
                src={text} 
                alt="Text saying 'Select your song!' on the right hand side" 
                className="max-h-[70%]"
              />
            </div>

            {/* Bottom half: leaderboard */}
            <div className="flex flex-col h-1/2 px-3 py-3 bg-[#11111b]/70 rounded-l-2xl overflow-hidden">
              <span className="font-bold text-[2vh] mb-2">Leaderboard</span>
              
              {!selectedBeatmap && (
                <span className="text-[1.6vh] opacity-70">
                  Hover a song to see your scores.
                </span>
              )}

              {selectedBeatmap && leaderboard.length === 0 && (
                <span className="text-[1.6vh] opacity-70">
                  No scores yet for this song.
                </span>
              )}

              {selectedBeatmap && leaderboard.length > 0 && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[1.6vh] py-0.5"
                    >
                      <span className="opacity-80">{idx + 1}.</span>
                      <span className="flex-1 px-2 text-right">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="w-[4rem] text-right opacity-80">
                        {entry.accuracy.toFixed
                          ? `${entry.accuracy.toFixed(2)}%`
                          : `${entry.accuracy}%`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top gradient overlay - covers mapped items area */}
          <div 
            className="absolute top-0 -left-4 w-[calc(100%+1rem)] h-20 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, #11111b, transparent)'
            }}
          />

          {/* Bottom gradient overlay - covers mapped items area */}
          <div 
            className="absolute bottom-0 -left-4 w-[calc(100%+1rem)] h-20 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, #11111b, transparent)'
            }}
          />
        </div>

        <div 
          style={{
            width: '100vw',
            marginLeft: '-1rem',
            paddingTop: '1rem',
            paddingBottom: 0,
            paddingLeft: '1rem',
            paddingRight: '1rem',
            background: 'linear-gradient(to bottom, rgba(17, 17, 27, 1.0), rgba(17, 17, 27, 0.7))',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
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
        </div>
      </main>
    </>
  )
}

export default SongSelect
