import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="h-4 w-full absolute bottom-0 -translate-y-4 flex gap-4 p-4 text-[#FFFFFF]">
        <div className="cursor-pointer hover:underline" onClick={() => navigate("/")}>
          Start
        </div>

        <div className="cursor-pointer hover:underline" onClick={() => navigate("/select")}>
          Select Game
        </div>

        <div className="cursor-pointer hover:underline" onClick={() => navigate("/game")}>
          Game Screen
        </div>
      </div>
    </>
  )
}

export default Navbar
