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
const defaultTaikoScrollSpeed = 1.2;
const defaultReceptorOffset = 11.11;
const defaultTaikoReceptorOffset = 25;
const defaultBackgroundBlur = 5;
const defaultBackgroundOpacity = 0.6;

const Settings = ({ open, onClose }: SettingsProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [judgementWindowIndex, setJudgementWindowIndex] = useState<number>(3);
  const [scrollSpeed, setScrollSpeed] = useState<number>(defaultScrollSpeed);
  const [taikoScrollSpeed, setTaikoScrollSpeed] = useState<number>(defaultTaikoScrollSpeed);
  const [receptorOffset, setReceptorOffset] = useState<number>(defaultReceptorOffset);
  const [taikoReceptorOffset, setTaikoReceptorOffset] = useState<number>(defaultTaikoReceptorOffset);
  const [backgroundBlur, setBackgroundBlur] = useState<number>(defaultBackgroundBlur);
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(defaultBackgroundOpacity);

  const changeScrollSpeed = (offset: number) => {
    let newOffset = scrollSpeed + offset;
    if (newOffset < 0.1) {
      newOffset = 0.1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setScrollSpeed(newOffset);
  };

  const changeTaikoScrollSpeed = (offset: number) => {
    let newOffset = taikoScrollSpeed + offset;
    if (newOffset < 0.1) {
      newOffset = 0.1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setTaikoScrollSpeed(newOffset);
  };

  const changeReceptorOffset = (offset: number) => {
    let newOffset = receptorOffset + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setReceptorOffset(newOffset);
  };

  const changeTaikoReceptorOffset = (offset: number) => {
    let newOffset = taikoReceptorOffset + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setTaikoReceptorOffset(newOffset);
  };

  const changeBackgroundBlur = (offset: number) => {
    let newOffset = backgroundBlur + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setBackgroundBlur(newOffset);
  };

  const changeBackgroundOpacity = (offset: number) => {
    let newOffset = backgroundOpacity + offset;
    if (newOffset < 0) {
      newOffset = 0;
    } else if (newOffset > 1) {
      newOffset = 1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setBackgroundOpacity(newOffset);
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

  useEffect(() => {
    if (userData?.TaikoScrollSpeed === undefined) return;

    const speed = userData.TaikoScrollSpeed;

    setTaikoScrollSpeed(speed);
  }, [userData?.TaikoScrollSpeed]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, TaikoScrollSpeed: taikoScrollSpeed } : prev
    );
  }, [taikoScrollSpeed]);

  useEffect(() => {
    if (userData?.ReceptorOffset === undefined) return;

    const offset = parseFloat(userData.ReceptorOffset);

    setReceptorOffset(isNaN(offset) ? defaultReceptorOffset : offset);
  }, [userData?.ReceptorOffset]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, ReceptorOffset: receptorOffset.toString() } : prev
    );
  }, [receptorOffset]);

  useEffect(() => {
    if (userData?.TaikoReceptorOffset === undefined) return;

    const offset = parseFloat(userData.TaikoReceptorOffset);

    setTaikoReceptorOffset(isNaN(offset) ? defaultTaikoReceptorOffset : offset);
  }, [userData?.TaikoReceptorOffset]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, TaikoReceptorOffset: taikoReceptorOffset.toString() } : prev
    );
  }, [taikoReceptorOffset]);

  useEffect(() => {
    if (userData?.BackgroundBlur === undefined) return;

    const blur = userData.BackgroundBlur;

    setBackgroundBlur(blur);
  }, [userData?.BackgroundBlur]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, BackgroundBlur: backgroundBlur } : prev
    );
  }, [backgroundBlur]);

  useEffect(() => {
    if (userData?.BackgroundOpacity === undefined) return;

    const opacity = userData.BackgroundOpacity;

    setBackgroundOpacity(opacity);
  }, [userData?.BackgroundOpacity]);

  useEffect(() => {
    setUserData((prev) =>
      prev ? { ...prev, BackgroundOpacity: backgroundOpacity } : prev
    );
  }, [backgroundOpacity]);

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
                    1k
                    <div className="keyBindContainer">
                      {userData.Keybinds["1"].map((_, idx) => (
                        <KeybindSet
                          keysNum={1}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    2k
                    <div className="keyBindContainer">
                      {userData.Keybinds["2"].map((_, idx) => (
                        <KeybindSet
                          keysNum={2}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    3k
                    <div className="keyBindContainer">
                      {userData.Keybinds["3"].map((_, idx) => (
                        <KeybindSet
                          keysNum={3}
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
                    5k
                    <div className="keyBindContainer">
                      {userData.Keybinds["5"].map((_, idx) => (
                        <KeybindSet
                          keysNum={5}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    6k
                    <div className="keyBindContainer">
                      {userData.Keybinds["6"].map((_, idx) => (
                        <KeybindSet
                          keysNum={6}
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
                    8k
                    <div className="keyBindContainer">
                      {userData.Keybinds["8"].map((_, idx) => (
                        <KeybindSet
                          keysNum={8}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    9k
                    <div className="keyBindContainer">
                      {userData.Keybinds["9"].map((_, idx) => (
                        <KeybindSet
                          keysNum={9}
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
                  <div className="p-3">
                    12k
                    <div className="keyBindContainer">
                      {userData.Keybinds["12"].map((_, idx) => (
                        <KeybindSet
                          keysNum={12}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    14k
                    <div className="keyBindContainer">
                      {userData.Keybinds["14"].map((_, idx) => (
                        <KeybindSet
                          keysNum={14}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    16k
                    <div className="keyBindContainer">
                      {userData.Keybinds["16"].map((_, idx) => (
                        <KeybindSet
                          keysNum={16}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    18k
                    <div className="keyBindContainer">
                      {userData.Keybinds["18"].map((_, idx) => (
                        <KeybindSet
                          keysNum={18}
                          keysIndex={idx}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    20k
                    <div className="keyBindContainer">
                      {userData.Keybinds["20"].map((_, idx) => (
                        <KeybindSet
                          keysNum={20}
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
                      className="judgementAdjust"
                    >
                      &lt;
                    </div>
                    {JudgementWindows[judgementWindowIndex]}
                    <div
                      onClick={() => changeJudgementIndex(1)}
                      className="judgementAdjust"
                    >
                      &gt;
                    </div>
                  </div>
                  <div className="p-3">Scroll Speed</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeScrollSpeed(-1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(-0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{scrollSpeed}</div>
                    <div
                      onClick={() => changeScrollSpeed(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeScrollSpeed(1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                  <div className="p-3">Taiko Scroll Speed</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeTaikoScrollSpeed(-1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeTaikoScrollSpeed(-0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeTaikoScrollSpeed(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{taikoScrollSpeed}</div>
                    <div
                      onClick={() => changeTaikoScrollSpeed(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeTaikoScrollSpeed(0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeTaikoScrollSpeed(1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                  <div className="p-3">Receptor Offset</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeReceptorOffset(-1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeReceptorOffset(-0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeReceptorOffset(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{receptorOffset}</div>
                    <div
                      onClick={() => changeReceptorOffset(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeReceptorOffset(0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeReceptorOffset(1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                  <div className="p-3">Taiko Receptor Offset</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeTaikoReceptorOffset(-1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeTaikoReceptorOffset(-0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeTaikoReceptorOffset(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{taikoReceptorOffset}</div>
                    <div
                      onClick={() => changeTaikoReceptorOffset(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeTaikoReceptorOffset(0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeTaikoReceptorOffset(1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                  <div className="p-3">Background Blur</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeBackgroundBlur(-1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -1
                    </div>
                    <div
                      onClick={() => changeBackgroundBlur(-0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.5
                    </div>
                    <div
                      onClick={() => changeBackgroundBlur(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div>{backgroundBlur}</div>
                    <div
                      onClick={() => changeBackgroundBlur(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
                    </div>
                    <div
                      onClick={() => changeBackgroundBlur(0.5)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.5
                    </div>
                    <div
                      onClick={() => changeBackgroundBlur(1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +1
                    </div>
                  </div>
                  <div className="p-3">Background Opacity</div>
                  <div className="flex gap-2 justify-center place-items-center">
                    <div
                      onClick={() => changeBackgroundOpacity(-0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.1
                    </div>
                    <div
                      onClick={() => changeBackgroundOpacity(-0.05)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.05
                    </div>
                    <div
                      onClick={() => changeBackgroundOpacity(-0.01)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      -0.01
                    </div>
                    <div>{backgroundOpacity}</div>
                    <div
                      onClick={() => changeBackgroundOpacity(0.01)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.01
                    </div>
                    <div
                      onClick={() => changeBackgroundOpacity(0.05)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.05
                    </div>
                    <div
                      onClick={() => changeBackgroundOpacity(0.1)}
                      className="scrollSpeedAdjust"
                    >
                      {" "}
                      +0.1
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
