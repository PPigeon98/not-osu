// import React from "react";
import { Modal, Slider, Typography } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
// import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
// import { useState, useEffect, useRef } from "react";
// import PlayerLoader from "./PlayerLoader";
import "./Settings.css";
import MenuButton from "./MenuButton";
// import { type UserData } from "./CommonGame";
// import InitUserData from "./InitUserData";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const Settings = ({ open, onClose }: SettingsProps) => {
  const keybindButtonFocus = () => {
    console.log("is active");
  };

  const keybindButtonBlur = () => {
    console.log("is blur");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <div className="flex flex-col bg-stone-900 bg-opacity-80 rounded-xl w-[500px] h-[600px] p-8 gap-4">
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
            <div>
              <div>
                4k
                <div className="flex justify-center place-items-center">
                  <div
                    className="keyBox"
                    tabIndex={0}
                    onFocus={keybindButtonFocus}
                    onBlur={keybindButtonBlur}
                  >
                    spc
                  </div>
                  <div className="keyBox" tabIndex={0}>
                    f
                  </div>
                  <div className="keyBox" tabIndex={0}>
                    j
                  </div>
                  <div className="keyBox" tabIndex={0}>
                    k
                  </div>
                </div>
              </div>
              <div>
                7k
                <div className="flex justify-center place-items-center">
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                  <div className="keyBox" tabIndex={0}></div>
                </div>
              </div>
            </div>
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
