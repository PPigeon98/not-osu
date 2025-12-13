import { type ButtonHTMLAttributes } from "react";
import useSound from "use-sound";
import buttonHover1 from "../../public/sounds/button_hover_1.wav";
import buttonClick1 from "../../public/sounds/button_click_1.wav";

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function MenuButton({
  children,
  className,
  ...props
}: MenuButtonProps) {
  const [playHoverSound] = useSound(buttonHover1);
  const [playClickSound] = useSound(buttonClick1);

  return (
    <button
      className={[
        "bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-4 w-[370px] px-8 rounded-xl text-2xl ring-2 ring-neutral-900 shadow-xl",
        className,
      ].join(" ")}
      type="button"
      {...props}
      onMouseEnter={(e) => {
        playHoverSound();
        props.onMouseEnter?.(e);
      }}
      onMouseDown={(e) => {
        playClickSound();
        props.onMouseDown?.(e);
      }}
    >
      {children}
    </button>
  );
}
