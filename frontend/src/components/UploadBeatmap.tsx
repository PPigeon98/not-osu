import Button from '@mui/material/Button';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { useRef } from 'react';
import { backendUrl } from './CommonGame';

const UploadBeatmap = ({ onUploadSuccess }: { onUploadSuccess: () => void; }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('beatmap', file);

        const response = await fetch(`${backendUrl}/beatmaps/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        return response;
      });

      await Promise.all(uploadPromises);
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
        Upload Beatmap(s) (.osz)
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".osz"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadBeatmap;


