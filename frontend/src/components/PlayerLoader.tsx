import { useState, useEffect } from "react";
import Game from "./Game";
import { type HitObject, type SongInfo, type UserData } from "./CommonGame";
import InitUserData from "./InitUserData";

type PlayerLoaderProps = {
  songInfo: SongInfo;
  hitObjects: HitObject[];
  mapPath: string;
};

const PlayerLoader = ({ songInfo, hitObjects, mapPath }: PlayerLoaderProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    //moved default user data to InitUserData
    const stored = localStorage.getItem("userData");
    const data = stored ? JSON.parse(stored) : InitUserData();
    console.log(data);
    setUserData(data);
  }, []);

  // can use a loading screen here instead of null
  if (!userData) {
    return null;
  }

  return (
    <Game
      songInfo={songInfo}
      userData={userData}
      mapPath={mapPath}
      hitObjects={hitObjects}
    />
  );
};

export default PlayerLoader;
