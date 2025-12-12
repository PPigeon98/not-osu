// import React from "react";
import { Button, Modal, Slider, Typography } from "@mui/material";
// import VolumeUpIcon from "@mui/icons-material/VolumeUp";
// import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
// import { useState, useEffect, useRef } from "react";
import useSound from "use-sound";
import buttonHover1 from "../../public/sounds/button_hover_1.wav";
import buttonClick1 from "../../public/sounds/button_click_1.wav";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const Settings = ({ open, onClose }: SettingsProps) => {
  const [playHoverSound] = useSound(buttonHover1);
  const [playClickSound] = useSound(buttonClick1);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <div className=" bg-purple-950 bg-opacity-80 rounded-xl p-8">
          <div>Hello awesome Settings here</div>
          <div>
            <div>
              <Typography>Master</Typography>
              <Typography>Music</Typography>
              <Typography>Sound</Typography>
            </div>
            <div>
              <Slider></Slider>
              <Slider></Slider>
              <Slider></Slider>
            </div>
          </div>
          <div>
            <Button
              onClick={onClose}
              onMouseEnter={() => {
                playHoverSound();
              }}
              onMouseDown={() => {
                playClickSound();
              }}
              variant="contained"
            >
              close awesome settings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Settings;
