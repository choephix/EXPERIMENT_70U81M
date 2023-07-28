import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Model from './Model';
import Dropzone from './Dropzone';
import { useState } from 'react';

const Viewer = () => {
  const [url, setUrl] = useState<string>('');

  const handleDrop = (file: File) => {
    setUrl(URL.createObjectURL(file));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {url.length === 0 ? (
        <Dropzone onDrop={handleDrop} />
      ) : (
        <Canvas>
          <OrbitControls />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Model url={url} />
          <Environment preset='dawn' background />
        </Canvas>
      )}
    </div>
  );
};

export default Viewer;
