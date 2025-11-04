import { Routes, Route } from 'react-router-dom';

import './App.css';
import StartMenu from './components/StartMenu';
import SongSelect from './components/SongSelect';
import Game from './components/Game';

const Pages = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<StartMenu />} />
        <Route path="/select" element={<SongSelect />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </>
  )
}

export default Pages
