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


const Settings = ({ open, onClose }: SettingsProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  const changeScrollSpeed = (offset: number) => {
    if (!userData) return;

    let newOffset = userData.ScrollSpeed + offset;
    if (newOffset < 0.1) {
      newOffset = 0.1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, ScrollSpeed: newOffset } : prev
    );
  };

  const changeTaikoScrollSpeed = (offset: number) => {
    if (!userData) return;

    let newOffset = userData.TaikoScrollSpeed + offset;
    if (newOffset < 0.1) {
      newOffset = 0.1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, TaikoScrollSpeed: newOffset } : prev
    );
  };

  const changeReceptorOffset = (offset: number) => {
    if (!userData) return;

    let newOffset = parseFloat(userData.ReceptorOffset) + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, ReceptorOffset: String(newOffset) } : prev
    );
  };

  const changeTaikoReceptorOffset = (offset: number) => {
    if (!userData) return;

    let newOffset = parseFloat(userData.TaikoReceptorOffset) + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, TaikoReceptorOffset: String(newOffset) } : prev
    );
  };

  const changeBackgroundBlur = (offset: number) => {
    if (!userData) return;

    let newOffset = userData.BackgroundBlur + offset;
    if (newOffset < 0) {
      newOffset = 0;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, BackgroundBlur: newOffset } : prev
    );
  };

  const changeBackgroundOpacity = (offset: number) => {
    if (!userData) return;
    
    let newOffset = userData.BackgroundOpacity + offset;
    if (newOffset < 0) {
      newOffset = 0;
    } else if (newOffset > 1) {
      newOffset = 1;
    }
    newOffset = Math.round(newOffset * 100) / 100;

    setUserData((prev) =>
      prev ? { ...prev, BackgroundOpacity: newOffset } : prev
    );
  };

  const changeJudgementIndex = (offset: number) => {
    if (!userData) return;

    let newOffset = JudgementWindows.indexOf(userData.Judgment) + offset;
    if (newOffset < 0) {
      newOffset = 7;
    } else if (newOffset > 7) {
      newOffset = 0;
    }

    const newJudgement = JudgementWindows[newOffset];
    setUserData((prev) => 
      prev ? { ...prev, Judgment: newJudgement } : prev
    );
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

  if (!userData) return null;

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Slide in={open} direction="up" timeout={300}>
        <div className="settingsPage">
          <div className="flex flex-col bg-stone-900 bg-opacity-90 rounded-xl w-[750px] h-[700px] py-8 px-5 gap-4">
            <div className="flex items-center text-3xl">
              <div>Settings</div>
              <div className="ml-auto">
                <IconButton sx={{ color: "white" }} onClick={onClose}>
                  <CloseIcon></CloseIcon>
                </IconButton>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden px-5">
               <div className="flex flex-col gap-1 mt-3">
                <div className="text-xl font-bold">Volume</div>
                <div className="p-3">
                  <VolumeSlider
                    label={"Music"}
                    userData={userData}
                    setUserData={setUserData}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xl font-bold">Keyboard</div>
                <div>
                  <div>
                    <div className="p-3">Taiko</div>
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
              </div>

              <div className="flex flex-col gap-1 mb-3">
                <div className="text-xl font-bold">Gameplay</div>
                <div>
                  <div className="p-3">Judgement</div>

                  <div className="flex gap-4 justify-center place-items-center">
                    <div
                      onClick={() => changeJudgementIndex(-1)}
                      className="judgementAdjust"
                    >
                      &lt;
                    </div>
                    {userData.Judgment}
                    <div
                      onClick={() => changeJudgementIndex(1)}
                      className="judgementAdjust"
                    >
                      &gt;
                    </div>
                  </div>
                  <div className="p-3">Scroll Speed</div>
                  <div className="flex gap-4 justify-center place-items-center">
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
                    <div>{userData.ScrollSpeed}</div>
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
                    <div>{userData.TaikoScrollSpeed}</div>
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
                    <div>{userData.ReceptorOffset}</div>
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
                    <div>{userData.TaikoReceptorOffset}</div>
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
                    <div>{userData.BackgroundBlur}</div>
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
                    <div>{userData.BackgroundOpacity}</div>
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

              <div className="flex flex-col gap-1 mb-3">
                <div className="text-xl font-bold">Mania Lane Dimensions</div>
                <div className="p-3">
                  <div className="text-sm mb-2 text-gray-300">Width</div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "14", "16", "18", "20"].map((keyCount) => (
                      <div key={`width-${keyCount}`} className="flex items-center gap-2">
                        <label className="text-sm w-8">{keyCount}k:</label>
                        <input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.01"
                          value={userData.ManiaWidth[keyCount] || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0.1 && value <= 100) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaWidth: {
                                        ...prev.ManiaWidth,
                                        [keyCount]: value.toFixed(2),
                                      },
                                    }
                                  : prev
                              );
                            } else if (e.target.value === "") {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaWidth: {
                                        ...prev.ManiaWidth,
                                        [keyCount]: "",
                                      },
                                    }
                                  : prev
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0.1) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaWidth: {
                                        ...prev.ManiaWidth,
                                        [keyCount]: "0.1",
                                      },
                                    }
                                  : prev
                              );
                            } else if (value > 100) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaWidth: {
                                        ...prev.ManiaWidth,
                                        [keyCount]: "100.00",
                                      },
                                    }
                                  : prev
                              );
                            } else {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaWidth: {
                                        ...prev.ManiaWidth,
                                        [keyCount]: value.toFixed(2),
                                      },
                                    }
                                  : prev
                              );
                            }
                          }}
                          className="w-20 px-2 py-1 bg-stone-800 text-white rounded border border-stone-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm mb-2 text-gray-300">Height</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "14", "16", "18", "20"].map((keyCount) => (
                      <div key={`height-${keyCount}`} className="flex items-center gap-2">
                        <label className="text-sm w-8">{keyCount}k:</label>
                        <input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.01"
                          value={userData.ManiaHeight[keyCount] || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0.1 && value <= 100) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaHeight: {
                                        ...prev.ManiaHeight,
                                        [keyCount]: value.toFixed(2),
                                      },
                                    }
                                  : prev
                              );
                            } else if (e.target.value === "") {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaHeight: {
                                        ...prev.ManiaHeight,
                                        [keyCount]: "",
                                      },
                                    }
                                  : prev
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0.1) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaHeight: {
                                        ...prev.ManiaHeight,
                                        [keyCount]: "0.1",
                                      },
                                    }
                                  : prev
                              );
                            } else if (value > 100) {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaHeight: {
                                        ...prev.ManiaHeight,
                                        [keyCount]: "100.00",
                                      },
                                    }
                                  : prev
                              );
                            } else {
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      ManiaHeight: {
                                        ...prev.ManiaHeight,
                                        [keyCount]: value.toFixed(2),
                                      },
                                    }
                                  : prev
                              );
                            }
                          }}
                          className="w-20 px-2 py-1 bg-stone-800 text-white rounded border border-stone-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    ))}
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
