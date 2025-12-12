import { useEffect } from 'react';

type KeypressesProps = {
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  active?: boolean;
};

const Keypresses = ({ onKeyDown, onKeyUp, active = true }: KeypressesProps) => {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown?.(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      onKeyUp?.(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active, onKeyDown, onKeyUp]);

  return null;
};

export default Keypresses;

