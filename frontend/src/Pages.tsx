import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import './App.css';
import StartMenu from './components/StartMenu';
import SongSelect from './components/SongSelect';
import MapLoader from './components/MapLoader';
import GameOver from './components/GameOver';
import PassedMap from './components/PassedMap';

const Pages = () => {
  const location = useLocation();

  // Clean up ShaderParkBackground canvas when not on start menu
  useEffect(() => {
    if (location.pathname !== '/') {
      const canvas = document.getElementById('shader-park-background');
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<StartMenu />} />
        <Route path="/select" element={<SongSelect />} />
        <Route path="/game" element={<MapLoader />} />
        <Route path="/gameover" element={<GameOver open={false} completionPercent={0} />} />
        <Route path="/passedmap" element={<PassedMap />} />
      </Routes>
    </>
  )
}

export default Pages
