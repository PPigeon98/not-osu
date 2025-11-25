import { Link, useLocation } from "react-router-dom";

const GameOver = () => {
  const location = useLocation();
  const { score = 0, accuracy = 0, highestCombo = 0 } = location.state || {};
  return (
    <main className="flex flex-col justify-center items-center w-screen h-screen text-[#FFFFFF] bg-black">
      <h1 className="text-6xl font-bold mb-8">Game Over</h1>
      
      <div className="flex flex-col gap-4 text-2xl mb-8">
        <div>
          <span className="font-semibold">Final Score: </span>
          <span>{score.toLocaleString()}</span>
        </div>
        <div>
          <span className="font-semibold">Accuracy: </span>
          <span>{accuracy.toFixed(2)}%</span>
        </div>
        <div>
          <span className="font-semibold">Highest Combo: </span>
          <span>{highestCombo}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link 
          to="/select" 
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        >
          Rage Quit?
        </Link>
      </div>
    </main>
  );
};

export default GameOver;

