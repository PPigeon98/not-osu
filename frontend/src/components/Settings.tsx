// import React from "react";
import { Button, Modal, Slider, Typography } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
// import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
// import { useState, useEffect, useRef } from "react";
// import PlayerLoader from "./PlayerLoader";
import MenuButton from "./MenuButton";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const Settings = ({ open, onClose }: SettingsProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <div className="flex flex-col bg-stone-800 bg-opacity-80 rounded-xl w-[500px] h-[600px] p-8 gap-4">
          <div className="flex justify-center text-xl">Settings</div>
          <div className="flex flex-col gap-3">
            <div className="flex w-full items-center gap-4">
              <div className="w-[50px]">
                <Typography>Master</Typography>
              </div>
              <VolumeUpIcon></VolumeUpIcon>
              <Slider></Slider>
            </div>
            <div className="flex w-full gap-3">
              <div className="w-[60px]">
                <Typography>Music</Typography>
              </div>
              <VolumeUpIcon></VolumeUpIcon>
              <Slider></Slider>
            </div>
            <div className="flex w-full gap-3">
              <div className="w-[50px]">
                <Typography>Sound</Typography>
              </div>
              <VolumeUpIcon></VolumeUpIcon>
              <Slider></Slider>
            </div>
          </div>
          <div>
            <Typography>Keyboard</Typography>
            <Button>keybinds</Button>
          </div>
          <div>
            <Typography>Gameplay</Typography>
          </div>
          <div className="flex mt-auto justify-center">
            <MenuButton onClick={onClose}>close awesome settings</MenuButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Settings;
