import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";
import ShaderParkBackground from "./ShaderParkBackground";
import logo from "../../public/not_osu_logo.svg";
import wiiMusic from "../../public/sounds/Wi Fi Menu Medley Looped - Mario Kart Wii Music Extended (128kbit_AAC).m4a";
import InitUserData from "./InitUserData";
import { backendUrl } from "./CommonGame";

type Beatmap = {
  id: string;
  setId: string;
  name: string;
  songInfo: {
    AudioFilename: string;
    PreviewTime: number;
  };
};

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const handleOpenSettings = () => setOpenSettings(true);
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Beatmap[]>([]);
  const shuffledPlaylistRef = useRef<Beatmap[]>([]);
  const currentIndexRef = useRef<number>(0); // Start at 0 (Wii music)

  // Shuffle array function (Fisher-Yates) - but keep first item (Wii music)
  const shufflePlaylist = (playlist: Beatmap[]): Beatmap[] => {
    if (playlist.length <= 1) return playlist;
    
    const wiiMusic = playlist[0]; // Keep Wii music at index 0
    const rest = playlist.slice(1);
    
    // Shuffle the rest
    const shuffled = [...rest];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return [wiiMusic, ...shuffled];
  };

  // Fetch playlist on mount
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`${backendUrl}/songs`);
        if (response.ok) {
          const data: Beatmap[] = await response.json();
          setPlaylist(data);
          // Initialize shuffled playlist (Wii music stays at 0, rest shuffled)
          shuffledPlaylistRef.current = shufflePlaylist(data);
          currentIndexRef.current = 0; // Start at Wii music
        }
      } catch (error) {
        console.log('Playlist fetch failed:', error);
      }
    };
    fetchPlaylist();
  }, []);

  const playSong = async (song: Beatmap) => {
    const stored = localStorage.getItem("userData");
    const userData = stored ? JSON.parse(stored) : InitUserData();
    const musicVolume = userData.MusicVolume / 100;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Close old audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
    }

    // Determine if it's Wii music (id === 'wii')
    const isWii = song.id === 'wii';
    let audio: HTMLAudioElement;

    if (isWii) {
      audio = new Audio(wiiMusic);
      audio.loop = true;
      audio.volume = musicVolume;
    } else {
      const audioPath = encodeURI(`${backendUrl}/beatmaps/${song.setId}/${song.songInfo.AudioFilename}`);
      audio = new Audio(audioPath);
      audio.loop = true;
      audio.volume = musicVolume;
      audio.currentTime = 3; // Start all beatmap songs at 3 seconds
    }
    
    try {
      await audio.play();
      audioRef.current = audio;

      // Create new audio context and analyser
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyserRef.current = analyser;
      setAudioAnalyser(analyser);
    } catch (error) {
      console.warn("Failed to play audio:", error);
    }
  };

  const handleLogoClick = async (e: React.MouseEvent) => {
    if (shuffledPlaylistRef.current.length === 0) return;

    // Right click - go to previous song
    if (e.button === 2 || e.ctrlKey) {
      e.preventDefault();
      if (currentIndexRef.current > 0) {
        currentIndexRef.current--;
        const previousSong = shuffledPlaylistRef.current[currentIndexRef.current];
        await playSong(previousSong);
      }
      return;
    }

    // Left click - go to next song
    let nextIndex = currentIndexRef.current + 1;
    
    // If we've reached the end, loop back to index 0
    if (nextIndex >= shuffledPlaylistRef.current.length) {
      nextIndex = 0;
    }

    currentIndexRef.current = nextIndex;
    const nextSong = shuffledPlaylistRef.current[nextIndex];
    await playSong(nextSong);
  };

  const handleLogoContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default right-click menu
    handleLogoClick(e);
  };

  // Pulse animation effect - uses ref so it always uses current analyser
  useEffect(() => {
    if (!analyserRef.current) return;

    let currAnimationFrame: number | null = null;

    function pulse() {
      currAnimationFrame = requestAnimationFrame(pulse);
      
      if (!analyserRef.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const volume = (sum / dataArray.length) / 128;
      
      const scale = 1 + volume * 0.4;
      setLogoScale(scale);
    }

    pulse();

    return () => {
      if (currAnimationFrame !== null) {
        cancelAnimationFrame(currAnimationFrame);
      }
    };
  }, [audioAnalyser]);

  // Play initial Wii music when playlist is loaded
  useEffect(() => {
    if (shuffledPlaylistRef.current.length > 0) {
      const wiiSong = shuffledPlaylistRef.current[0];
      if (wiiSong && wiiSong.id === 'wii') {
        playSong(wiiSong).catch(console.error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  // Handle user interaction to resume audio (for autoplay restrictions)
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (audioRef.current?.paused) {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.warn("Audio play failed:", error);
        }
      }
      if (audioContextRef.current?.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          console.warn("AudioContext resume failed:", error);
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
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
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  return (
    <>
      <ShaderParkBackground audioAnalyser={audioAnalyser} />
      <main className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF] relative z-10">
        <div className="w-[25%] mb-20">
          <img
            src={logo}
            alt="Not~Osu! start screen logo"
            onClick={handleLogoClick}
            onContextMenu={handleLogoContextMenu}
            style={{ 
              width: "100%",
              height: "auto",
              transform: `scale(${logoScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s ease-out",
              cursor: "pointer"
            }}
          />
        </div>
        <MenuButton onClick={() => {
          // Stop audio before navigating
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
          }
          navigate("/select");
        }}>Start!</MenuButton>
        <MenuButton onClick={handleOpenSettings}>Settings</MenuButton>
        <Settings
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        ></Settings>
      </main>
    </>
  );
};

export default StartMenu;
