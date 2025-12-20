// import React from "react";
import { Modal, IconButton, Slide } from "@mui/material";
import { useState, useEffect } from "react";
// import PlayerLoader from "./PlayerLoader";
import "./Settings.css";
import { type UserData } from "./CommonGame";
// import InitUserData from "./InitUserData";
import KeybindSet from "./KeybindSet";
import CloseIcon from "@mui/icons-material/Close";
import VolumeSlider from "./VolumeSlider";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const JudgementWindows = [
  "Peaceful",
  "Chill",
  "Lenient",
  "Standard",
  "Strict",
  "Tough",
  "Extreme",
  "Impossible",
];

const defaultScrollSpeed = 2.5;

const Settings = ({ open, onClose }: SettingsProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [judgementWindowIndex, setJudgementWindowIndex] = useState<number>(3);
  const [scrollSpeed, setScrollSpeed] = useState<number>(defaultScrollSpeed);

  const changeScrollSpeed = (offset: number) => {
    let newOffset = scrollSpeed + offset;
    if (newOffset < 0.1) {
      newOffset = 0.1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setScrollSpeed(newOffset);
  };

  const changeJudgementIndex = (offset: number) => {
    let newOffset = judgementWindowIndex + offset;
    if (newOffset < 0) {
      newOffset = 7;
    } else if (newOffset > 7) {
      newOffset = 0;
    }

    setJudgementWindowIndex(newOffset);
  };

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) {
      setUserData(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }, [userData]);

  useEffect(() => {
    if (!userData?.Judgment) return;

    const index = JudgementWindows.indexOf(userData.Judgment);

    setJudgementWindowIndex(index !== -1 ? index : 3);
  }, [userData?.Judgment]);

  useEffect(() => {
    if (!userData) return;

    const newJudgement = JudgementWindows[judgementWindowIndex];

    setUserData((prev) => (prev ? { ...prev, Judgment: newJudgement } : prev));
  }, [judgementWindowIndex]);

  useEffect(() => {
    if (userData?.ScrollSpeed === undefined) return;

    const speed = userData.ScrollSpeed;

    setScrollSpeed(speed);
  }, [userData?.ScrollSpeed]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, ScrollSpeed: scrollSpeed } : prev
    );
  }, [scrollSpeed]);

  if (!userData) return null;
  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Slide in={open} direction="up" timeout={300}>
        <div className="settingsPage">
          <div className="flex flex-col bg-stone-900 bg-opacity-90 rounded-xl w-[600px] h-[800px] p-8 gap-4 overflow-auto">
            <div className="flex items-center text-3xl">
              <div>Settings</div>
              <div className="ml-auto">
                <IconButton sx={{ color: "white" }} onClick={onClose}>
                  <CloseIcon></CloseIcon>
                </IconButton>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 p-3">
                <VolumeSlider
                  label={"Music"}
                  userData={userData}
                  setUserData={setUserData}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xl">Keyboard</div>
                <div>
                  <div className="p-3">
                    taiko
                    <div className="keyBindContainer">
                      {userData.Keybinds.taiko.map((_, idx) => (
                        <KeybindSet
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    4k
                    <div className="keyBindContainer">
                      {userData.Keybinds["4"].map((_, idx) => (
                        <KeybindSet
                          keysNum={4}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    7k
                    <div className="keyBindContainer">
                      {userData.Keybinds["7"].map((_, idx) => (
                        <KeybindSet
                          keysNum={7}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    10k
                    <div className="keyBindContainer">
                      {userData.Keybinds["10"].map((_, idx) => (
                        <KeybindSet
                          keysNum={10}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xl">Gameplay</div>
                <div>
                  <div className="p-3">Judgement</div>

                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeJudgementIndex(-1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      &lt;
                    </div>
                    {JudgementWindows[judgementWindowIndex]}
                    <div
                      onClick={() => changeJudgementIndex(1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      &gt;
                    </div>
                  </div>
                  <div className="p-3">Scroll Speed</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeScrollSpeed(-1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(-0.5)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(-0.1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{scrollSpeed}</div>
                    <div
                      onClick={() => changeScrollSpeed(0.1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(0.5)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(1)}
                      className="bg-stone-700 rounded p-1 text-sm"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Slide>
    </Modal>
  );
};

export default Settings;
