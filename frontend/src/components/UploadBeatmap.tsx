import { useRef } from 'react';

const backendUrl = 'http://localhost:5000'; // change this when deploying to vercel

const UploadBeatmap = () => {
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
      <button
        onClick={handleButtonClick}
        className="px-4 py-2 rounded transition-colors"
        style={{ backgroundColor: '#60A5FA', color: '#11111B' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#60A5FA'}
      >
        Upload Beatmap (.osz)
      </button>
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


