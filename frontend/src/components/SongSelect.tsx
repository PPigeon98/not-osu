import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import CD from "../../public/CD.svg";
import '../App.css'; 

const SongSelect = () => {  
  return (
    <>
      <main className="flex flex-col justify-center items-center w-screen h-screen text-[#FFFFFF]">

        <span className="text-3xl">Select a song!</span>

        {/* somehow read all .osu files in the beatmapsRaw folder and display them in a list */}
        {/* and send the file name to the game using location.state */}
        {/* parsing file data has been done in maploader.tsx */}
        {/* probs need to split that and make a component that would work in song select and maploader */}
        <Link to="/game" className="cursor-pointer hover:underline">
          Song 1 - Author 1 - difficulty 1
        </Link>
        
        <Link to="/game" className="cursor-pointer hover:underline">
          Song 1 - Author 1 - difficulty 2
        </Link>
        
        <Link to="/game" className="cursor-pointer hover:underline">
          Song 2 - Author 2 - difficulty 1
        </Link>

        <img src={CD} alt="" />

      </main>
    </>
  )
}

export default SongSelect
