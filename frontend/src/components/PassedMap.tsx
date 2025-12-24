import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { type LeaderboardScore, backendUrl } from "./CommonGame";

const PassedMap = () => {
  const location = useLocation();
  const { 
    score = 0, 
    accuracy = 0, 
    highestCombo = 0, 
    scores = [],
    beatmapId = ""
  } = (location.state as {
    score: number;
    accuracy: number;
    highestCombo: number;
    scores: LeaderboardScore[];
    beatmapId: string;
  }) || {};

  const [username, setUsername] = useState("guest");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(true);

  const handleUpload = async () => {
    if (!beatmapId || isUploading || isUploaded) return;

    setIsUploading(true);
    try {
      const response = await fetch(`${backendUrl}/user/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim() || "guest",
          beatmapId,
          score,
          highestCombo,
          accuracy,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload score');
      }

      setIsUploaded(true);
      setShowUsernameInput(false);
    } catch (error) {
      console.error('Error uploading score:', error);
      alert('Failed to upload score. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getRank = (accuracy: number) => {
    let rank: string;
    let rankColor: string;

    switch (true) {
      case accuracy === 100:
        rank = "SS";
        rankColor = "#e9be8cff";
        break;
      case accuracy >= 95:
        rank = "S";
        rankColor = "#e9e48cff";
        break;
      case accuracy >= 90:
        rank = "A";
        rankColor = "#9ae98cff";
        break;
      case accuracy >= 80:
        rank = "B";
        rankColor = "#8cb1e9ff";
        break;
      case accuracy >= 70:
        rank = "C";
        rankColor = "#d58ce9ff";
        break;
      default:
        rank = "D";
        rankColor = "#e98c8cff";
    }

    return { rank, rankColor };
  }

  const { rank, rankColor } = getRank(accuracy);

  return (
    <main className="flex flex-col items-center w-screen h-screen text-[#FFFFFF]">
      <div className="text-[8vw] font-bold mt-10">You Passed!</div>

      <div className="flex w-full h-full justify-between">
        <div className="flex flex-col w-full gap-4 justify-center items-center mb-8">
          <span className="text-[5vw] font-bold" style={{ color: rankColor }}>
            {rank}
          </span>
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
            .map((leaderboardScore, i) => {
              const { rank, rankColor } = getRank(leaderboardScore.accuracy);

              return (
                <div
                  key={i}
                  className={`flex w-[50%] p-2 bg-opacity-50 justify-between ${
                    leaderboardScore.score === score &&
                    leaderboardScore.highestCombo === highestCombo &&
                    Math.abs(leaderboardScore.accuracy - accuracy) < 0.001
                      ? "bg-yellow-500"
                      : ""
                  }`}
                >
                  <div className="flex gap-5">
                    <span>{i + 1}</span>
                    <span className="opacity-60">
                      {leaderboardScore.score.toLocaleString()}
                    </span>
                  </div>
                  
                  <span style={{ color: rankColor }}>{rank}</span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {showUsernameInput && !isUploaded && (
          <div className="flex flex-col gap-3 items-center">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (default: guest)"
              className="px-4 py-2 rounded-lg text-[#FFFFFF] text-center"
              style={{ 
                backgroundColor: '#1a1a2e', 
                fontSize: '1.5vw', 
                fontWeight: 'bold',
                border: '2px solid #333',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpload();
                }
              }}
            />
            <button
              onClick={handleUpload}
              disabled={isUploading || isUploaded}
              className="px-6 py-3 rounded-lg transition-colors cursor-pointer text-[#FFFFFF] text-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isUploading ? '#444' : '#11111B', 
                fontSize: '2vw', 
                fontWeight: 'bold' 
              }}
              onMouseEnter={(e) => {
                if (!isUploading && !isUploaded) {
                  e.currentTarget.style.backgroundColor = '#1a1a2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading && !isUploaded) {
                  e.currentTarget.style.backgroundColor = '#11111B';
                }
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Score'}
            </button>
          </div>
        )}
        {isUploaded && (
          <div className="text-[1.5vw] font-bold text-green-400 mb-2">
            Score uploaded successfully!
          </div>
        )}
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

