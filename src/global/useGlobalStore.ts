import { createStoreWrappedWithProxy } from '../store/createStoreWrappedWithProxy';
import type { StateCreator } from 'zustand';

import * as THREE from 'three';

type Model = THREE.Group;

function createStateObject(
  ...args: Parameters<
    StateCreator<{
      model: Model | null;
    }>
  >
) {
  const [set, get] = args;

  return {
    model: null as Model | null,
    setModel: (model: Model | null) => {
      set({ model });
    },
  };
}

export const useGlobalStore =
  createStoreWrappedWithProxy<ReturnType<typeof createStateObject>>(createStateObject);
