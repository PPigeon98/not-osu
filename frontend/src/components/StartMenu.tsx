import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";
import FunkyBackground from "./FunkyBackground";
import logo from "../../public/not_osu_logo.svg";
import wiiMusic from "../../public/sounds/Wi Fi Menu Medley Looped - Mario Kart Wii Music Extended (128kbit_AAC).m4a";
import InitUserData from "./InitUserData";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const handleOpenSettings = () => setOpenSettings(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    const userData = stored ? JSON.parse(stored) : InitUserData();
    const musicVolume = userData.MusicVolume / 100;

    const audio = new Audio(wiiMusic);
    audio.loop = true;
    audio.volume = musicVolume;
    audio.play();

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const frequencyBufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(frequencyBufferLength);

    // https://github.com/thecodedose/audio-visualiser-js/blob/main/index.js

    let currAnimationFrame : number;

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

    return () => {
      audio.pause();
      cancelAnimationFrame(currAnimationFrame);
      audioContext.close();
    };
  }, []);

  return (
    <>
      <FunkyBackground />
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
