import { Link } from "react-router-dom";
import { Button, Modal } from "@mui/material";
import { useState, useEffect, useRef } from "react";

const StartMenu = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <span className="text-4xl">Not Osu!</span>
        <Button variant="contained">
          <Link to="/select">Start!</Link>
        </Button>
        <Button onClick={handleOpen}>Settings</Button>
        <Modal onClose={handleClose} open={open}>
          <h2 className="text-[#FFFFFF]">hello settings here</h2>
        </Modal>
      </main>
    </>
  );
};

export default StartMenu;
