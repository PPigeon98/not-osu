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

    setUserData((prev) =>
      prev ? { ...prev, ScrollSpeed: newOffset } : prev
    );
  };

  const changeJudgementIndex = (offset: number) => {
    let newOffset = judgementWindowIndex + offset;
    if (newOffset < 0) {
      newOffset = 7;
    } else if (newOffset > 7) {
      newOffset = 0;
    }

    const newJudgement = JudgementWindows[newOffset];
    setUserData((prev) => (prev ? { ...prev, Judgment: newJudgement } : prev));
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
    if (!userData) return;

    const index = JudgementWindows.indexOf(userData.Judgment);
    setJudgementWindowIndex(index !== -1 ? index : 3);
    setScrollSpeed(userData.ScrollSpeed);
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
                  <div>
                    <div className="p-3">4K</div>
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
                  <div>
                    <div className="p-3">7K</div>
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
                  <div>
                    <div className="p-3">10K</div>
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
                  <div>
                    <div className="p-3">20K</div>
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
                    {JudgementWindows[judgementWindowIndex]}
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
