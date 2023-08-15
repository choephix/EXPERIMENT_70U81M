import { useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useGlobalStore } from '../hooks/useGlobalStore';
import { mergeGeometriesInScene } from '../utils/findDuplicates';
import { saveGLB } from '../utils/saveGLB';

import { Color } from 'three';
import { Materials } from '../global/Materials';
import { createBoxGrid } from '../debug/createBoxGrid';

type ModelProps = {
  url: string;
  camera: THREE.Camera;
};

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

const Model: React.FC<ModelProps> = ({ url, camera }: ModelProps) => {
  const { model, setModel } = useGlobalStore();

  const ref = useRef<THREE.Object3D | null>(null);

  const { gl, controls, invalidate } = useThree();

  const canvas = gl.getContext().canvas as HTMLCanvasElement;

  useEffect(() => {
    if (!model) return;

    // if (1) return;

    // Save original materials so that we can non-destructively assign picking materials
    const originalMaterials = new Map<THREE.Mesh, THREE.Material>();
    const renderer = new THREE.WebGLRenderer();
    const pickingTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    renderer.setRenderTarget(pickingTarget);

    function getColorAtPoint(model: THREE.Group, x: number, y: number) {
      model.traverse(child => {
        if (child instanceof THREE.Mesh) {
          originalMaterials.set(child, child.material);
          child.material = Materials.PICKING_MATERIAL;
          // child.geometry.computeVertexNormals();
          // child.geometry.computeBoundingBox();
        }
      });

      renderer.render(model, camera); // Assuming scene and camera are defined in your scope

      const pixelBuffer = new Uint8Array(4);
      renderer.readRenderTargetPixels(
        pickingTarget,
        x,
        pickingTarget.height - y,
        1,
        1,
        pixelBuffer
      );
      const integer = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
      
      console.log({ integer, pixelBuffer }, [...pixelBuffer.values()]);;

      model.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material = originalMaterials.get(child);
        }
      });

      const vec3 = new THREE.Color(integer).toArray() as [number, number, number];
      Materials.DISPLAY_MATERIAL.uniforms.selectedSourceMeshIndex = { value: vec3 };
      invalidate();

      if (integer === 0) {
        return null;
      }

      return Math.round(integer);
    }

    function onDocumentMouseDown(ev: any) {
      const scene = model! as ReturnType<typeof mergeGeometriesInScene>;

      const cx = ev.clientX * window.devicePixelRatio;
      const cy = ev.clientY * window.devicePixelRatio;

      const c = getColorAtPoint(scene, cx, cy);
      
      if (!c) {
        console.log(null)
        return;
      }

      const hex = `#${c.toString(16).padStart(6, '0')}`;

      const info = scene.userData.uuidFromColorMap[c];

      if (info) {
        console.log(
          '🚁',
          hex,
          info,
          `Comparison:\n`,
          info?._c,
          Materials.DISPLAY_MATERIAL.uniforms.selectedSourceMeshIndex.value
        );
      } else {
        console.log('🚁🔥', hex, info);
      }

      // camera.lookAt(...info.xyz);
    }
    canvas.addEventListener('click', onDocumentMouseDown);

    return () => {
      canvas.removeEventListener('click', onDocumentMouseDown);
      pickingTarget.dispose();
    };
  }, [model]);

  useEffect(() => {
    if (!url) return;
    if (model?.userData.url === url) return;

    console.log('Loading model:', url);

    loader.load(url, gltf => {
      console.log('Loaded gltf model', gltf);

      // testIdempotency(canvas, camera, gltf.scene);

      // updateProperties(gltf.scene);
      // flattenHierarchy(gltf.scene);
      gltf.scene = createBoxGrid();

      // const model = gltf.scene;
      const model = mergeGeometriesInScene(gltf.scene);

      // model.userData.url = url;

      // function getModelCenterAndSize(model: THREE.Object3D) {
      //   const bbox = new THREE.Box3().setFromObject(model);
      //   const center = bbox.getCenter(new THREE.Vector3());
      //   const size = bbox.getSize(new THREE.Vector3());
      //   return [center, size] as const;
      // }
      // const [modelCenter, modelSize] = getModelCenterAndSize(model);
      // if (!(controls instanceof OrbitControls)) {
      //   console.warn('Controls not instance of OrbitControls', controls);
      // } else {
      //   console.warn('Setting controls target to model center', modelCenter);
      //   // controls.target.copy(modelCenter);
      //   // controls.update();
      // }

      Object.assign(window, { model, saveGLB: () => saveGLB(model) });

      {
        const s = new THREE.Box3().setFromObject(model);
        const center = s.getCenter(new THREE.Vector3());
        const size = s.getSize(new THREE.Vector3());

        //Look at the center of the model
        camera.position.copy(center);
        camera.position.x += 0.1 * size.length(); //Move camera to some distance
        camera.lookAt(center);
      }

      // findDuplicateGeometries(gltf.scene);
      // optimizeScene(gltf.scene);

      console.log('Done optimizing model');

      setModel(model);
    });
  }, [url, camera, controls]);

  if (!model) {
    return null;
  }

  return (
    <>
      <ModelOptimizer model={model} camera={camera} />
      <primitive
        object={model}
        ref={ref}
        // onPointerClick={() => console.log('Clicked model')}
      />
    </>
  );
};

type ModelOptimizerProps = {
  model: THREE.Object3D;
  camera: THREE.Camera;
};

const ModelOptimizer: React.FC<ModelOptimizerProps> = ({ model, camera }: ModelOptimizerProps) => {
  const handleClick = (child: THREE.Mesh) => {
    console.log('Clicked object:', child.userData);
  };

  useEffect(() => {
    model.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const bbox = new THREE.Box3().setFromObject(child);
        const size = bbox.getSize(new THREE.Vector3());
        child.userData.size = [size.x, size.y, size.z];
        child.userData.sizeMax = Math.max(size.x, size.y, size.z);

        child.addEventListener('click', () => handleClick(child));
      }
    });
  }, [model]);

  /** *
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

      distances.forEach((item, index) => {
        updateObjectVisibility(item, index);
      });
    }
  });
  /** */

  return null;
};

function updateObjectVisibility(
  item: {
    distance: number;
    object: THREE.Mesh;
  },
  index: number
) {
  // item.object.visible = index < 1000;

  const sizeMax = item.object.userData.sizeMax as number;
  const distanceFromCamera = item.distance as number;
  // const ratio = distanceFromCamera / sizeMax;

  // item.object.visible = sizeMax > 0.5 || distanceFromCamera < 20; //
  // item.object.visible = distanceFromCamera < 80; //
  // item.object.visible = index < 50; //
  // item.object.visible = distanceFromCamera < 120; //
}

export default Model;
