import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

type ModelProps = {
  url: string;
};

const Model: React.FC<ModelProps> = ({ url }: ModelProps) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const ref = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    new GLTFLoader().load(url, gltf => {
      setModel(gltf.scene);
    });
  }, [url]);

  useFrame(({ camera }) => {
    if (ref.current) {
      camera.lookAt(ref.current.position);
    }
  });

  return model ? <primitive object={model} ref={ref} /> : null;
};

export default Model;
