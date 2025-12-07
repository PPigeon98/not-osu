import React from "react";
import { Button, Modal } from "@mui/material";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const Settings = ({ open, onClose }: SettingsProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col justify-center items-center w-screen h-screen gap-3 text-[#FFFFFF]">
        <div>Hello awesome Settings here</div>
        <div>
          <Button onClick={onClose} variant="contained">
            {" "}
            close awesome settings
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Settings;
