import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { Mesh, Object3D, BufferGeometry } from 'three';
import { Materials } from '../global/Materials';
import { getBoxCenterAndSize } from './getBoxCenterAndSize';

const geometriesMaxCount = 10000;

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

const uuidFromColorMap = //
  {} as Record<number, any> &
    Partial<
      Record<
        number,
        {
          uuid: string;
          boxSize: number;
          center: [number, number, number];
        }
      >
    >;

export function mergeGeometriesInScene(scene: THREE.Group) {
  scene.updateMatrixWorld(true);

  const useVertexColors = true;
  const defaultMaterials = [
    new THREE.MeshLambertMaterial({ color: 0x6090c0, vertexColors: useVertexColors }),
    new THREE.MeshLambertMaterial({ color: 0xc06090, vertexColors: useVertexColors }),
    new THREE.MeshLambertMaterial({ color: 0xc0c0c0, vertexColors: useVertexColors }),
  ];

  type ProperMesh = Mesh & { geometry: BufferGeometry };
  const originalMeshGroups: ProperMesh[][] = [[], [], []];

  scene.traverse(mesh => {
    if (mesh instanceof Mesh && mesh.geometry instanceof BufferGeometry) {
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox!;
      const boxSize = box.getSize(new THREE.Vector3()).length();
      mesh.userData.boxSize = boxSize;

      if (boxSize < 0.025) {
        originalMeshGroups[0].push(mesh);
        mesh.userData.color = 0x6090c0;
      } else if (boxSize < 0.05) {
        originalMeshGroups[1].push(mesh);
        mesh.userData.color = 0xc06090;
      } else {
        originalMeshGroups[2].push(mesh);
        mesh.userData.color = 0xc0c0c0;
      }
    }
  });

  let uuidIndexCounter = 0;

  const mergedMeshes: ProperMesh[] = [];
  function populateMergedMeshes(
    meshes: ProperMesh[],
    material: THREE.Material,
    smallFlag: boolean
  ) {
    const geometries: BufferGeometry[] = [];

    function convertColorToBufferAttribute(color: number, vertexCount: number) {
      const colors = new Float32Array(vertexCount * 3);
      const colorObject = new THREE.Color(color);

      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = colorObject.r;
        colors[i + 1] = colorObject.g;
        colors[i + 2] = colorObject.b;
      }

      return new THREE.BufferAttribute(colors, 3);
    }

    function convertColorToBufferAttribute2(color: number, vertexCount: number) {
      const colors = new Float32Array(vertexCount * 3);

      const colorObject255 = {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
      };

      // const colorObject = new THREE.Color(color);

      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = colorObject255.r;
        colors[i + 1] = colorObject255.g;
        colors[i + 2] = colorObject255.b;
      }

      return new THREE.BufferAttribute(colors, 3);
    }

    function commitGeometries() {
      if (geometries.length <= 0) {
        return null;
      }

      const mergedGeometry = BufferGeometryUtils.mergeGeometries([...geometries], false);
      mergedGeometry.deleteAttribute('uv');

      const mergedMesh = new Mesh(mergedGeometry, material);
      mergedMesh.name = `MergedObject${mergedMeshes.length}`;
      mergedMesh.userData.isSmall = smallFlag;

      mergedMesh.uuid;

      mergedMesh.frustumCulled = false;
      mergedMesh.matrixAutoUpdate = false;

      geometries.length = 0;

      console.log(mergedGeometry, mergedMesh);

      return mergedMesh;
    }

    const __boxesCOunt = meshes.length;
    const a = new Array(__boxesCOunt)
      .fill(0)
      .map((_, i) => new THREE.Color().setHSL(i / __boxesCOunt, 1, 0.5).getHex());

    // const idDelta = ~~(0xf0f0f0 / meshes.length);
    const idDelta = 1;
    for (const mesh of meshes) {
      uuidIndexCounter += idDelta;

      const clonedGeometry = mesh.geometry.clone();
      clonedGeometry.applyMatrix4(mesh.matrixWorld);

      const sourceMeshIndexBufferAttribute = convertColorToBufferAttribute2(
        uuidIndexCounter,
        clonedGeometry.attributes.position.count
      );
      clonedGeometry.setAttribute('sourceMeshIndex', sourceMeshIndexBufferAttribute);

      const colorBufferAttribute = convertColorToBufferAttribute(
        // mesh.userData.color,
        // uuidIndexCounter * 255,
        a[uuidIndexCounter % a.length],
        clonedGeometry.attributes.position.count
      );
      clonedGeometry.setAttribute('color', colorBufferAttribute);

      const { center, size } = getBoxCenterAndSize(mesh);

      uuidFromColorMap[uuidIndexCounter] = {
        uuid: mesh.uuid,
        boxCenter: center.toArray(),
        boxSize: size,
      };

      geometries.push(clonedGeometry);

      if (geometries.length >= geometriesMaxCount) {
        commitGeometries();
      }
    }

    const mergedMesh = commitGeometries();
    if (mergedMesh) {
      mergedMeshes.push(mergedMesh);
    }
  }

  for (let i = 0; i < originalMeshGroups.length; i++) {
    console.log(`Merging group ${i}...`, originalMeshGroups[i].length);

    // const material = defaultMaterials[i];
    const material = Materials.DISPLAY_MATERIAL;
    const meshes = originalMeshGroups[i];

    populateMergedMeshes(meshes, material, i === 0);
  }

  // for (const mesh of mergedMeshes) {
  //   for (const group of mesh.geometry.groups) {
  //     group.materialIndex = mesh.userData.isSmall ? 0 : 1;
  //   }
  //   mesh.material = defaultMaterials;
  // }

  console.log({ mergedMeshes }, originalMeshGroups);

  const newScene = new THREE.Group();
  newScene.matrix.copy(scene.matrix);
  newScene.add(...mergedMeshes);
  // newScene.rotateX(-0.5 * Math.PI); // Rotate to compensate for flipped Z and Y axis
  newScene.updateMatrixWorld(true);
  newScene.userData = {
    uuidFromColorMap,
  };
  return newScene as Omit<THREE.Group, 'userData'> & {
    userData: { uuidFromColorMap: typeof uuidFromColorMap };
  };

  // scene.children = [];
  // scene.add(...mergedMeshes);
  // return scene;

  /**
   * TODO
   *
   * [z] Test oindex -> uuid mapping
   * [z] Shader to colorize selected oindex/uuid
   * [ ] Move this shit server-side
   *
   */
}

export function testIdempotency(
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  scene: THREE.Group
) {
  console.log('Testing idempotency...', { canvas, camera, scene });

  const raycaster = new THREE.Raycaster();

  // And then when you handle a click event...
  canvas.addEventListener('click', event => {
    // Normalize mouse position to [-1, 1]
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      // Assuming you have your vertex colors in the face
      const color = intersects[0].faceIndex!;

      // Look up the original mesh ID using the color.

      const originalMeshID = uuidFromColorMap[color];

      // Do something with the original mesh ID...
      console.log('Clicked, intersected', { face: intersects[0].face, intersects, originalMeshID });
    }
  });
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
