import * as THREE from 'three';
import { Mesh, Object3D, Scene } from 'three';
import { BufferGeometry, Matrix4, MeshBasicMaterial } from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function updateProperties(scene: Object3D): void {
  const material = new THREE.MeshBasicMaterial({ color: 0xf0f030 });

  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      const mesh = object;

      const prevMaterial = mesh.material as THREE.Material;
      prevMaterial.dispose();
      mesh.material = material;
    }

    object.frustumCulled = false;
    object.matrixAutoUpdate = false;
  });
}

export function flattenHierarchy(scene: Object3D): void {
  const meshes: Mesh[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      meshes.push(object);
    }
  });

  const group = new THREE.Group();
  for (const mesh of meshes) {
    group.add(mesh);
  }

  scene.children = [];
  scene.add(group);
  scene.updateWorldMatrix(true, true);
}

export function mergeGeometriesInScene(scene: THREE.Group): void {
  // Create an array to hold the geometries to merge
  const geometries: BufferGeometry[] = [];

  scene.traverse(node => {
    if (node instanceof Mesh && node.geometry instanceof BufferGeometry) {
      // Apply the world matrix to the geometry
      const clonedGeometry = node.geometry.clone();
      clonedGeometry.applyMatrix4(node.matrixWorld);

      // Add the geometry to the array
      geometries.push(clonedGeometry);
    }
  });

  // Merge the geometries
  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  // Create a new mesh with the merged geometry and a basic material
  const mergedMesh = new Mesh(mergedGeometry, new MeshBasicMaterial({ color: 0x00ff00 }));

  // Clear the scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // Add the merged mesh to the scene
  scene.add(mergedMesh);
}

export function findDuplicateGeometries(scene: THREE.Group) {
  const meshesByVertexCount: { [key: number]: THREE.Mesh[] } = {};

  function registerMesh(mesh: THREE.Mesh) {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const vertexCount = geometry.getAttribute('position').count;
    if (!meshesByVertexCount[vertexCount]) {
      meshesByVertexCount[vertexCount] = [];
    }
    meshesByVertexCount[vertexCount].push(mesh);
  }

  let totalMeshesCount = 0;
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      registerMesh(object);
      totalMeshesCount++;
    }
  });

  console.log(
    `
    Will check ${totalMeshesCount} meshes for duplicates...
    `,
    { meshesByVertexCount }
  );

  function compareVertices(verticesA: THREE.TypedArray, verticesB: THREE.TypedArray) {
    return verticesA.length === verticesB.length;
    return verticesA.every((val, index) => val === verticesB[index]);
  }

  // const duplicateGroups: THREE.Mesh[][] = [];
  const duplicateGroups: { sample: THREE.Mesh; duplicates: THREE.Mesh[]; vertexCount: number }[] =
    [];
  function addMeshToDuplicateGroups(mesh: THREE.Mesh, vertexCount: number) {
    for (const group of duplicateGroups) {
      if (group.vertexCount !== vertexCount) continue;

      const sampleGeometry = group.sample.geometry as THREE.BufferGeometry;
      const sampleVertices = sampleGeometry.getAttribute('position').array;

      const meshGeometry = mesh.geometry as THREE.BufferGeometry;
      const meshVertices = meshGeometry.getAttribute('position').array;

      const areVerticesEqual = compareVertices(sampleVertices, meshVertices);
      if (areVerticesEqual) {
        group.duplicates.push(mesh);
        return;
      }
    }

    // console.log(`Found a new duplicate group with ${vertexCount} vertices.`);
    duplicateGroups.push({ sample: mesh, duplicates: [], vertexCount });
  }

  for (const vertexCountString in meshesByVertexCount) {
    // console.log(`Checking meshes with ${vertexCountString} vertices...`);

    const vertexCount = parseInt(vertexCountString);

    const similarMeshes = meshesByVertexCount[vertexCount];
    const similarMeshesCount = similarMeshes.length;
    if (similarMeshesCount <= 1) {
      continue;
    }

    for (let i = 0; i < similarMeshesCount; i++) {
      const mesh = similarMeshes[i];
      addMeshToDuplicateGroups(mesh, vertexCount);
    }
  }

  for (const group of duplicateGroups) {
    if (group.duplicates.length === 0) {
      duplicateGroups.splice(duplicateGroups.indexOf(group), 1);
    }
  }

  console.log({ duplicateGroups });

  // let ii = 0;
  // for (const similarMeshes of Object.values(vertexCounts)) {
  //   if (similarMeshes.length > 1) {
  //     for (let i = 0; i < similarMeshes.length; i++) {
  //       for (let j = i + 1; j < similarMeshes.length; j++) {
  //         const meshA = similarMeshes[i];
  //         const meshB = similarMeshes[j];
  //         const verticesA = (meshA.geometry as THREE.BufferGeometry).getAttribute('position').array;
  //         const verticesB = (meshB.geometry as THREE.BufferGeometry).getAttribute('position').array;

  //         // Compare vertices assuming they're in the same order
  //         const areVerticesEqual = verticesA.every((val, index) => val === verticesB[index]);
  //         if (areVerticesEqual) {
  //           if (!duplicateGroups.find(group => group.includes(meshA))) {
  //             duplicateGroups.push([meshA, meshB]);
  //           } else {
  //             const group = duplicateGroups.find(group => group.includes(meshA));
  //             group?.push(meshB);
  //           }

  //           // console.log(
  //           //   `Meshes "${meshA.name}" and "${meshB.name}" have identical geometry.`,
  //           //   ii++
  //           // );
  //           // if (ii > 4000) return console.log('Stopping at 4000 duplicates');
  //         }
  //       }
  //     }
  //   }
  // }

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
  const duplicateGroups = findDuplicateGeometries(scene) ?? [];

  duplicateGroups.forEach(group => {
    const { sample, duplicates } = group;
    const allMeshes = [sample, ...duplicates];

    // Assuming all meshes in the group share the same material.
    // If not, you'll need to handle this differently.
    const material = sample.material as THREE.Material;
    const geometry = sample.geometry as THREE.BufferGeometry;

    // Create an InstancedMesh from the group of duplicate meshes
    const instancedMesh = createInstancedMesh(geometry, material, allMeshes);

    // Remove the original meshes from the scene and add the InstancedMesh
    allMeshes.forEach(mesh => scene.remove(mesh));
    for (const duplicate of duplicates) {
      duplicate.geometry.dispose();

      const materials = Array.isArray(duplicate.material)
        ? duplicate.material
        : [duplicate.material];
      for (const material of materials) {
        material.dispose();
      }
    }

    scene.add(instancedMesh);
  });
}
