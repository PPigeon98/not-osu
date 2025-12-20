import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";
import logo from "../../public/not_osu_logo.svg";
import wiiMusic from "../../public/sounds/Wi Fi Menu Medley Looped - Mario Kart Wii Music Extended (128kbit_AAC).m4a";
import InitUserData from "./InitUserData";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
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

    return () => {
      audio.pause();
    };
  }, []);

  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <img 
          src={logo} 
          alt="Not~Osu! start screen logo" 
          style={{ height: "auto", width: "30%" }}
        />
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
