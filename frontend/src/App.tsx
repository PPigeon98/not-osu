import {
  BrowserRouter as Router,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Pages from './Pages';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Pages />
      </Router>
    </>
  )
}

export default App
