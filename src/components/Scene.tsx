import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Model from './Model';
import { useGlobalStore } from '../hooks/useGlobalStore';

const Scene: React.FC<{ url: string }> = ({ url }) => {
  const { camera } = useThree();
  const { model } = useGlobalStore();

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <directionalLight color='white' intensity={2.5} position={[1, 1, 1]} />
      <directionalLight color='blue' intensity={2.5} position={[-1, -1, -1]} />

      <Model url={url} camera={camera} />
      <Environment preset={!model ? 'dawn' : 'night'} background />
    </>
  );
};

export default Scene;
