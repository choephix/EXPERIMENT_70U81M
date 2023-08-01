import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Model from './Model';

const Scene: React.FC<{ url: string }> = ({ url }) => {
  const { camera } = useThree();

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Model url={url} camera={camera} />
      <Environment preset='night' background />
    </>
  );
};

export default Scene;
