import { Canvas, useThree } from '@react-three/fiber';
import { Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Dropzone from './Dropzone';
import Scene from './Scene';
import { OrbitControls } from '@react-three/drei';
import { useGlobalStore } from '../hooks/useGlobalStore';

const Controls = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { invalidate, camera } = useThree(); // Get the `invalidate` function from `useThree` hook
  const { setControls } = useGlobalStore();

  const controlsRef = useRef<any>(null);
  useEffect(() => setControls(controlsRef.current), [setControls, controlsRef.current]);

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleChange = () => {
    invalidate(); // Force a re-render
    
    if (!controlsRef.current) return;
    
    controlsRef.current.enableZoom = true;
    controlsRef.current.zoomToCursor = true;

    const distance = controlsRef.current?.getDistance() || 0;
    // const zoomSpeed = distance > 10 ? 1 : distance / 200;
    const zoomSpeed = 2;
    controlsRef.current.zoomSpeed = zoomSpeed;
  };

  camera.near = 0.0001;

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom
      dampingFactor={0.5}
      panSpeed={0.15}
      zoomSpeed={0.5}
      onStart={handleStart}
      onEnd={handleEnd}
      onChange={handleChange} // Use the `handleChange` function here
      
    />
  );
};

const Viewer = () => {
  const [url, setUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrop = (file: File) => {
    setUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setUrl('');
    URL.revokeObjectURL(url);
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
            // dpr={isDragging ? 0.5 : 1}
            ref={canvasRef}
            gl={{
              // antialias: !isDragging,
              // antialias: false,
              antialias: true,
              powerPreference: 'high-performance',
              precision: 'mediump', // Can be "highp", "mediump", "lowp"
            }}
            frameloop='demand' // Disable automatic rendering
          >
            <Controls />
            <Scene url={url} />
          </Canvas>
        </>
      )}
    </div>
  );
};

export default Viewer;
