import { Link, useLocation } from "react-router-dom";

const GameOver = () => {
  const location = useLocation();
  const { completionPercent = 0 } = location.state || {};
  return (
    <main className="flex flex-col justify-center items-center w-screen h-screen text-[#FFFFFF]">
      <h1 className="text-6xl font-bold mb-8">Game Over</h1>
      
      <div className="flex flex-col gap-4 text-2xl mb-8">
        <div>
          <span className="font-semibold">Completion: </span>
          <span>{completionPercent.toFixed(2)}%</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link 
          to="/select" 
          className="px-6 py-3 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: '#EF4444', color: '#11111B' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
        >
          Rage Quit?
        </Link>
      </div>
    </main>
  );
};

export default GameOver;

