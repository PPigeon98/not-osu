import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Settings from "./Settings";
import MenuButton from "./MenuButton";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const handleOpenSettings = () => setOpenSettings(true);
  const navigate = useNavigate();
  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <span className="text-4xl">Not Osu!</span>
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
