import { Link } from "react-router-dom";
import CD from "../../public/CD.svg";
import '../App.css'; 
import UploadBeatmap from "./UploadBeatmap";
import { useState, useEffect } from "react";

const backendUrl = 'http://localhost:5000';

type Beatmap = {
  id: number;
  name: string;
};

const SongSelect = () => {  
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);

  useEffect(() => {
    fetchBeatmaps();
  }, []);

  const fetchBeatmaps = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/beatmaps`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data: Beatmap[] = await response.json();
      setBeatmaps(data);
    } catch (error) {
      console.log('Beatmaps fetch failed:', error);
    }
  };

  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen text-[#FFFFFF]">

        <span className="text-3xl">Select a song!</span>

        {/* use maploader to parse the data */}
        <div className="flex flex-col w-full h-[70%] overflow-y-auto text-center gap-2 mt-5">
          {beatmaps.map((beatmap, i) => (
            <Link
              key={i}
              to="/game"
              state={{ beatmapId: beatmap.id, beatmapName: beatmap.name }}
              className="cursor-pointer hover:underline"
            >
              {beatmap.name}
            </Link>
          ))}
        </div>

        <img src={CD} alt="" />

        {/* this button is temporary, u make it look nicer later */}
        <UploadBeatmap />

      </main>
    </>
  )
}

export default SongSelect
