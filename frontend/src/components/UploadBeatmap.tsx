import Button from '@mui/material/Button';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { useRef } from 'react';

const backendUrl = 'http://localhost:5000'; // change this when deploying to vercel

const UploadBeatmap = ({ onUploadSuccess }: { onUploadSuccess: () => void; }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('beatmap', file);

    try {
      const response = await fetch(`${backendUrl}/api/beatmaps/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      onUploadSuccess?.();
    } catch (error) {
      console.log('Beatmap upload failed:', error);
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mt-2 flex flex-col items-center gap-2 text-white">
      <Button
        onClick={handleButtonClick}
        variant="contained"
        startIcon={<LibraryMusicIcon />}
        sx={{
          backgroundColor: '#934AB3',
          color: 'white',
          '&:hover': {
            backgroundColor: '#6A2C85',
          },
        }}
      >
        Upload Beatmap (.osz)
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".osz"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadBeatmap;


