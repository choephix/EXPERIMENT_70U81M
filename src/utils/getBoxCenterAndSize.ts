import * as THREE from 'three';

export function getBoxCenterAndSize(o: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(o);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  return { center, size, box };
}
