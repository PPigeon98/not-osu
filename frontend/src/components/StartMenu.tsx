import { Link } from "react-router-dom";
import { Button, Modal } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import Settings from "./Settings";

const StartMenu = () => {
  const [openSettings, setOpenSettings] = useState(false);
  const handleOpenSettings = () => setOpenSettings(true);
  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <span className="text-4xl">Not Osu!</span>
        <Button variant="contained">
          <Link to="/select">Start!</Link>
        </Button>
        <Button onClick={handleOpenSettings}>Settings</Button>
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
