import * as THREE from 'three';

export function createDebugSphere(
  at: [number, number, number] = [0, 0, 0],
  radius: number = 100
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(at[0], at[1], at[2]);
  return sphere;
}
