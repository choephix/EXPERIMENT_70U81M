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
  const controlsRef = useRef<any>(null);

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

  const handleZoom = () => {
    if (!controlsRef.current) return;
    
    const distance = controlsRef.current?.getDistance() || 0;
    const zoomSpeed = distance > 10 ? 1 : distance / 200;
    controlsRef.current.zoomSpeed = zoomSpeed;
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
            gl={{
              // antialias: !isDragging,
              antialias: false,
              powerPreference: 'high-performance',
              precision: 'lowp', // Can be "highp", "mediump", "lowp"
            }}
          >
            <OrbitControls //
              ref={controlsRef}
              dampingFactor={0.5}
              enableZoom
              panSpeed={0.15}
              onStart={handleStart}
              onEnd={handleEnd}
              onChange={handleZoom}
            />
            <Scene url={url} />
          </Canvas>
        </>
      )}
    </div>
  );
};

export default Viewer;
