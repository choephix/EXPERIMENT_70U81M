import { useRef } from 'react';
import { extractFile } from '../utils/extractFile';

const Dropzone = ({ onDrop }: { onDrop: (file: File) => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    const file = await extractFile(e);
    onDrop(file);
  };

  return (
    <div
      ref={ref}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      style={{ width: '100%', height: '100%' }}
    >
      Drop .glb file here...
    </div>
  );
};

export default Dropzone;
