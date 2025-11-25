import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <>
      <nav className="h-4 w-full absolute bottom-0 -translate-y-4 flex gap-4 p-4 text-[#FFFFFF]">
        <Link to="/" className="cursor-pointer hover:underline">
          Start Menu
        </Link>

        <Link to="/select" className="cursor-pointer hover:underline">
          Song Select
        </Link>

        <Link to="/game" className="cursor-pointer hover:underline">
          Game
        </Link>

        <Link to="/gameover" className="cursor-pointer hover:underline">
          Game Over
        </Link>
      </nav>
    </>
  )
}

export default Navbar
