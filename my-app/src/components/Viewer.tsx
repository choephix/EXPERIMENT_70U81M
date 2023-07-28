import { Canvas } from '@react-three/fiber';
import { Button } from 'antd';
import { useRef, useState } from 'react';
import Dropzone from './Dropzone';
import Scene from './Scene';
import { OrbitControls } from '@react-three/drei';

const Viewer = () => {
  const [url, setUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrop = (file: File) => {
    setUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setUrl('');
    URL.revokeObjectURL(url);
  };

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {url.length === 0 ? (
        <Dropzone onDrop={handleDrop} />
      ) : (
        <>
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1 }}>
            <Button onClick={handleClear}>Clear Model</Button>
          </div>
          <Canvas
            style={{ width: '100%', height: '100%' }}
            dpr={isDragging ? 0.5 : 1}
            ref={canvasRef}
          >
            <OrbitControls onStart={handleStart} onEnd={handleEnd} />
            {/* <OrbitControls enablePan enableZoom zoomSpeed={1.2} /> */}
            <Scene url={url} />
          </Canvas>
        </>
      )}
    </div>
  );
};

export default Viewer;
