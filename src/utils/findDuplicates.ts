import * as THREE from 'three';

export function findDuplicateGeometries(scene: THREE.Group) {
  const meshes: THREE.Mesh[] = [];

  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      meshes.push(object);
    }
  });

  const vertexCounts: { [key: number]: THREE.Mesh[] } = {};

  meshes.forEach(mesh => {
    const vertexCount = (mesh.geometry as THREE.BufferGeometry).getAttribute('position').count;
    if (!vertexCounts[vertexCount]) {
      vertexCounts[vertexCount] = [];
    }
    vertexCounts[vertexCount].push(mesh);
  });

  console.log(
    `
    Will check ${meshes.length} meshes for duplicates...
    `,
    vertexCounts
  );

  const duplicateGroups: THREE.Mesh[][] = [];
  
  let ii = 0;
  Object.keys(vertexCounts).forEach(vertexCountKey => {
    const similarMeshes = vertexCounts[parseInt(vertexCountKey, 10)];
    if (similarMeshes.length > 1) {
      for (let i = 0; i < similarMeshes.length; i++) {
        for (let j = i + 1; j < similarMeshes.length; j++) {
          const meshA = similarMeshes[i];
          const meshB = similarMeshes[j];
          const verticesA = (meshA.geometry as THREE.BufferGeometry).getAttribute('position').array;
          const verticesB = (meshB.geometry as THREE.BufferGeometry).getAttribute('position').array;

          // Compare vertices assuming they're in the same order
          const areVerticesEqual = verticesA.every((val, index) => val === verticesB[index]);
          if (areVerticesEqual) {
            if (!duplicateGroups.find(group => group.includes(meshA))) {
              duplicateGroups.push([meshA, meshB]);
            } else {
              const group = duplicateGroups.find(group => group.includes(meshA));
              group?.push(meshB);
            }

            console.log(`Meshes "${meshA.name}" and "${meshB.name}" have identical geometry.`, ii++);
            if (ii > 400) return console.log('Stopping at 400 duplicates');
          }
        }
      }
    }
  });

  return duplicateGroups;
}

function createInstancedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  instances: THREE.Object3D[]
): THREE.InstancedMesh {
  const instancedMesh = new THREE.InstancedMesh(geometry, material, instances.length);

  const matrix = new THREE.Matrix4();

  for (let i = 0; i < instances.length; ++i) {
    const instance = instances[i];

    matrix.compose(instance.position, instance.quaternion, instance.scale);

    instancedMesh.setMatrixAt(i, matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;

  return instancedMesh;
}

export function optimizeScene(scene: THREE.Group): void {
  const duplicateGroups = findDuplicateGeometries(scene);

  duplicateGroups.forEach(group => {
    // Assuming all meshes in the group share the same material.
    // If not, you'll need to handle this differently.
    const material = group[0].material as THREE.Material;
    const geometry = group[0].geometry as THREE.BufferGeometry;

    // Create an InstancedMesh from the group of duplicate meshes
    const instancedMesh = createInstancedMesh(geometry, material, group);

    // Remove the original meshes from the scene and add the InstancedMesh
    group.forEach(mesh => {
      scene.remove(mesh);
    });

    scene.add(instancedMesh);
  });
}
