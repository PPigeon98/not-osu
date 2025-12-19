import { Modal, Button } from "@mui/material";

type PauseProps = {
  open: boolean;
  onClose: () => void;
  onQuit: () => void;
};

const Pause = ({ open, onClose, onQuit }: PauseProps) => {
  return (
    <Modal open={open} onClose={onClose} disableEscapeKeyDown={false}>
      <div className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-8">
          <div className="text-[8vw] font-bold">Paused</div>
        </div>
        <div className="flex flex-col gap-4">
          <Button
            onClick={onClose}
            variant="contained"
            className="px-6 py-3 rounded-lg transition-colors cursor-pointer text-[#FFFFFF]"
            style={{ backgroundColor: '#11111B', fontSize: '2vw', fontWeight: 'bold' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#11111B'}
          >
            Continue
          </Button>
          <Button
            onClick={onQuit}
            variant="contained"
            className="px-6 py-3 rounded-lg transition-colors cursor-pointer text-[#FFFFFF]"
            style={{ backgroundColor: '#11111B', fontSize: '2vw', fontWeight: 'bold' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#11111B'}
          >
            Quit
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Pause;

