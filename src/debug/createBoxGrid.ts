import * as THREE from 'three';

export function createBoxGrid(): THREE.Group {
  const group = new THREE.Group();

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const gridSize = 20;
  const spacing = 1.2;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      // Position the box in the grid
      box.position.set(-i * spacing + spacing / 2, -j * spacing + spacing / 2, 0);
      group.add(box);
    }
  }

  return group;
}
