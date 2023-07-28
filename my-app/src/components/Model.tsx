import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

type ModelProps = {
  url: string;
  camera: THREE.Camera;
};

const Model: React.FC<ModelProps> = ({ url, camera }: ModelProps) => {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const ref = useRef<THREE.Object3D | null>(null);

  // const { set, gl } = useThree();
  // useEffect(() => {
  //   // This will set the pixel ratio to 1/4th its original value
  //   gl.setPixelRatio(window.devicePixelRatio * 0.5);
  // }, [gl]);

  // useEffect(() => {
  //   new GLTFLoader().load(url, gltf => {
  //     setModel(gltf.scene);
  //   });
  // }, [url]);

  useEffect(() => {
    new GLTFLoader().load(url, gltf => {
      setModel(gltf.scene);
      const s = new THREE.Box3().setFromObject(gltf.scene);
      const center = s.getCenter(new THREE.Vector3());
      const size = s.getSize(new THREE.Vector3());

      //Look at the center of the model
      camera.position.copy(center);
      camera.position.x += size.length(); //Move camera to some distance
      camera.lookAt(center);

      // Log dimensions of all objects
      gltf.scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          const bbox = new THREE.Box3().setFromObject(child);
          const size = bbox.getSize(new THREE.Vector3());
          console.log([size.x, size.y, size.z]);
          child.userData.size = [size.x, size.y, size.z];
          child.userData.sizeMax = Math.max(size.x, size.y, size.z);
        }
      });
    });
  }, [url, camera]);

  useFrame(() => {
    // This assumes that the model is an Object3D (or derived class) instance.
    if (model) {
      const objects: THREE.Mesh[] = [];
      model.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.visible = true; //reset all objects to visible before computation
          objects.push(child);
        }
      });

      // Calculate distances
      const pos = new THREE.Vector3();
      const distances = objects.map(object => {
        object.getWorldPosition(pos);
        return { distance: pos.distanceTo(camera.position), object };
      });

      // Sort by ascending distance
      distances.sort((a, b) => a.distance - b.distance);

      Object.assign(window, { _dist: distances[0].distance });

      // Only the first 100 closest should be visible
      distances.forEach((item, index) => {
        // item.object.visible = index < 1000;
        item.object.visible = true;

        const sizeMax = item.object.userData.sizeMax as number;
        const distanceFromCamera = item.distance as number;
        // const ratio = distanceFromCamera / sizeMax;

        item.object.visible = sizeMax > 0.5 || distanceFromCamera < 15; //
      });
    }
  });

  return model ? <primitive object={model} ref={ref} /> : null;
};

export default Model;
