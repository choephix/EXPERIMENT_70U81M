import { createStoreWrappedWithProxy } from '../store/createStoreWrappedWithProxy';
import type { StateCreator } from 'zustand';

import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

type Model = THREE.Group;

function createStateObject(
  ...args: Parameters<
    StateCreator<{
      model: Model | null;
      controls: OrbitControls | null;
    }>
  >
) {
  const [set, get] = args;

  return {
    model: null as Model | null,
    setModel: (model: Model | null) => {
      set({ model });
    },
    controls: null as OrbitControls | null,
    setControls: (controls: OrbitControls | null) => {
      set({ controls });
    },
  };
}

export const useGlobalStore =
  createStoreWrappedWithProxy<ReturnType<typeof createStateObject>>(createStateObject);
