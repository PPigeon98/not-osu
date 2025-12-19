import { Link, useLocation } from "react-router-dom";
import { type LeaderboardScore } from "./CommonGame";

const PassedMap = () => {
  const location = useLocation();
  const { 
    score = 0, 
    accuracy = 0, 
    highestCombo = 0, 
    scores = [] 
  } = (location.state as {
    score: number;
    accuracy: number;
    highestCombo: number;
    scores: LeaderboardScore[];
  }) || {};

  return (
    <main className="flex flex-col items-center w-screen h-screen text-[#FFFFFF]">
      <div className="text-[8vw] font-bold mt-10">You Passed!</div>

      <div className="flex w-full h-full justify-between">
        <div className="flex flex-col w-full gap-4 justify-center items-center mb-8">
          <div className="text-[2vw] font-bold">
            <span>Final Score: </span>
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="text-[2vw] font-bold">
            <span>Accuracy: </span>
            <span>{accuracy.toFixed(2)}%</span>
          </div>
          <div className="text-[2vw] font-bold">
            <span>Highest Combo: </span>
            <span>{highestCombo}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4 justify-center items-center mb-8 text-[1.5vw] font-bold">
          <span>Top Scores</span>
          {[...scores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((leaderboardScore, i) => (
              <div
                key={i}
                className={`flex w-[50%] p-2 gap-5 bg-opacity-50 ${
                  leaderboardScore.score === score &&
                  leaderboardScore.highestCombo === highestCombo &&
                  Math.abs(leaderboardScore.accuracy - accuracy) < 0.001
                    ? "bg-yellow-500"
                    : ""
                }`}
              >
                <span>{i + 1}</span>
                <span className="opacity-60">
                  {leaderboardScore.score.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        <Link 
          to="/select" 
          className="px-6 py-3 rounded-lg transition-colors cursor-pointer text-[#FFFFFF] text-center"
          style={{ backgroundColor: '#11111B', fontSize: '2vw', fontWeight: 'bold' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#11111B'}
        >
          Play Another
        </Link>
      </div>
    </main>
  );
};

export default PassedMap;

