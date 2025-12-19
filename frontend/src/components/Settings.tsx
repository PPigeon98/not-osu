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

const Settings = ({ open, onClose }: SettingsProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
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
          <div className="flex flex-col bg-stone-900 bg-opacity-90 rounded-xl w-[600px] h-[800px] p-8 gap-4">
            <div className="flex items-center text-2xl">
              <div>Settings</div>
              <div className="ml-auto">
                <IconButton sx={{ color: "white" }} onClick={onClose}>
                  <CloseIcon></CloseIcon>
                </IconButton>
              </div>
            </div>
            <div className="flex flex-col gap-3 overflow-auto">
              <div className="flex flex-col gap-3 p-3">
                <VolumeSlider
                  label={"Music"}
                  userData={userData}
                  setUserData={setUserData}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-xl">Keyboard</div>
                <div>
                  <div className="p-3">
                    4k
                    <div className="flex justify-center place-items-center">
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
                    <div className="flex justify-center place-items-center">
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
                    <div className="flex justify-center place-items-center">
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
              </div>
            </div>
          </div>
        </div>
      </Slide>
    </Modal>
  );
};

export default Settings;
