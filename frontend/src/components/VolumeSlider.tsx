import React from "react";
import "./Settings.css";
import { type UserData } from "./CommonGame";
import { Slider } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
import { useState, useEffect } from "react";
import useSound from "use-sound";
import blip from "../../public/sounds/blip.wav";

type VolumeSliderProps = {
  label: string;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
};

const VolumeSlider = ({ label, userData, setUserData }: VolumeSliderProps) => {
  const [volume, setVolume] = useState(userData?.MusicVolume ?? 50);
  const [playTestVol, { sound }] = useSound(blip);

  useEffect(() => {
    if (userData?.MusicVolume !== undefined) {
      setVolume(userData.MusicVolume);
    }
  }, [userData?.MusicVolume]);

  useEffect(() => {
    if (sound) {
      sound.volume(volume / 100);
    }
  }, [volume, sound]);

  const testVolume = () => {
    playTestVol();
  };

  return (
    <div className="volumeContainer">
      <div className="volumeLabel">{label}</div>
      <div>{volume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}</div>
      <div className="flex-1">
        <Slider
          color="secondary"
          value={volume}
          onChange={(_, value) => {
            const newVolume = Array.isArray(value) ? value[0] : value;
            setVolume(newVolume);
            setUserData((prev) =>
              prev ? { ...prev, MusicVolume: newVolume } : prev
            );
          }}
          onMouseUp={testVolume}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
};

export default VolumeSlider;
