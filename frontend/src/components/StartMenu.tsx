import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";
import logo from "../../public/not_osu_logo.svg";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const handleOpenSettings = () => setOpenSettings(true);
  const navigate = useNavigate();
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
        {/* all the settings are in playerloader.tsx but it could be split into more components */}
        <Settings
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        ></Settings>
      </main>
    </>
  );
};

export default StartMenu;
