import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";
import ShaderParkBackground from "./ShaderParkBackground";
import logo from "../../public/not_osu_logo.svg";
import wiiMusic from "../../public/sounds/Wi Fi Menu Medley Looped - Mario Kart Wii Music Extended (128kbit_AAC).m4a";
import InitUserData from "./InitUserData";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const handleOpenSettings = () => setOpenSettings(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    const userData = stored ? JSON.parse(stored) : InitUserData();
    const musicVolume = userData.MusicVolume / 100;

    const audio = new Audio(wiiMusic);
    audio.loop = true;
    audio.volume = musicVolume;
    audioRef.current = audio;

    // Handle audio play with error handling for autoplay restrictions
    const playAudio = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.warn("Audio autoplay prevented:", error);
        // Audio will play on user interaction
      }
    };

    playAudio();

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    // Resume AudioContext if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }

    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    setAudioAnalyser(analyser);

    const frequencyBufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(frequencyBufferLength);

    let currAnimationFrame: number | null = null;

    function pulse() {
      currAnimationFrame = requestAnimationFrame(pulse);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < frequencyBufferLength; i++) {
        sum += dataArray[i];
      }
      const volume = (sum / frequencyBufferLength) / 128;
      
      const scale = 1 + volume * 0.4; // 1 is base size changed depending on volume
      setLogoScale(scale);
    }

    pulse();

    // Resume audio on user interaction (for browsers that block autoplay)
    const handleUserInteraction = async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch (error) {
          console.warn("Audio play failed:", error);
        }
      }
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (error) {
          console.warn("AudioContext resume failed:", error);
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      audio.pause();
      if (currAnimationFrame !== null) {
        cancelAnimationFrame(currAnimationFrame);
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
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
            style={{ 
              width: "100%",
              height: "auto",
              transform: `scale(${logoScale})`,
              transformOrigin: "center",
              transition: "transform 0.05s ease-out"
            }}
          />
        </div>
        <MenuButton onClick={() => navigate("/select")}>Start!</MenuButton>
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
