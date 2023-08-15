import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Model from './Model';
import { useGlobalStore } from '../hooks/useGlobalStore';

const Scene: React.FC<{ url: string }> = ({ url }) => {
  const { camera } = useThree();
  const { model } = useGlobalStore();

  return (
    <>
      <Model url={url} camera={camera} />
      <Environment preset={!model ? 'dawn' : 'night'} background />
    </>
  );
};

export default Scene;
