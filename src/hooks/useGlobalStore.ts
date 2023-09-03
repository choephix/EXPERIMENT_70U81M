import { createStoreWrappedWithProxy } from '../store/createStoreWrappedWithProxy';
import type { StateCreator } from 'zustand';

import * as THREE from 'three';
import type { ArcballControls, OrbitControls } from 'three-stdlib';

type Model = THREE.Group;
type CameraControls = ArcballControls | OrbitControls;

function createStateObject(
  ...args: Parameters<
    StateCreator<{
      model: Model | null;
      controls: CameraControls | null;
    }>
  >
) {
  const [set, get] = args;

  return {
    model: null as Model | null,
    setModel: (model: Model | null) => {
      set({ model });
    },
    controls: null as CameraControls | null,
    setControls: (controls: CameraControls | null) => {
      set({ controls });
    },
  };
}

export const useGlobalStore =
  createStoreWrappedWithProxy<ReturnType<typeof createStateObject>>(createStateObject);
