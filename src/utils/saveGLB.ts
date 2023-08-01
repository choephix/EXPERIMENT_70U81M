import { DRACOExporter } from 'three/addons/exporters/DRACOExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { Group } from 'three';

export function saveGLB(scene: THREE.Group) {
  // Instantiate a exporter
  const exporter = new GLTFExporter();

  // Parse the input and generate the glTF output
  // exporter.parse(
  //   scene,
  //   // called when the gltf has been generated
  //   function (gltf) {
  //     console.log(gltf);
  //     downloadJSON(gltf);
  //   },
  //   // called when there is an error in the generation
  //   function (error) {
  //     console.log('An error happened');
  //   },
  //   options
  // );

  console.log({ scene });

  exporter.parse(
    scene,
    gltf => {
      if (gltf instanceof ArrayBuffer) {

        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'scene.glb';
        link.click();
      }
    },
    error => console.error(error),
    { binary: true }
  );
}

/** *

export function saveGLB(scene: Group) {
  // const exporter = new GLTFExporter();

  // const options = {
  //   binary: true, // Binary glTF
  //   dracoOptions: {
  //     // Draco compression
  //     encoderMethod: DRACOExporter.EncoderMethod.EDGEBREAKER,
  //     encoderSpeed: DRACOExporter.EncoderSpeed.BEST_SPEED,
  //   },
  // };

  // exporter.parse(
  //   scene,
  //   gltf => {
  //     const blob = new Blob([gltf], { type: 'application/octet-stream' });
  //     const url = URL.createObjectURL(blob);
  //     // Use the URL for the file here
  //     console.log(url);
  //   },
  //   options
  // );

  // const exporter = new GLTFExporter();

  // // Optional: Configure DRACO compression
  // const dracoExporter = new DRACOExporter();
  // const dracoCompression = dracoExporter.parse(scene, {
  //   // Higher values = better compression, longer time
  //   compressionLevel: 6,
  // });
  // exporter.setDRACOExporter(dracoExporter);

  // // Parse the scene
  // exporter.parse(scene, gltf => {
  //   const output = JSON.stringify(gltf, null, 2);
  //   console.log(output);
  //   // Download the resulting file
  //   const blob = new Blob([output], { type: 'text/plain' });
  //   const link = document.createElement('a');
  //   link.href = URL.createObjectURL(blob);
  //   link.download = 'scene.glb';
  //   link.click();
  // });

  const exporter = new DRACOExporter();
  const mesh = scene;

  function exportFile() {
    const result = exporter.parse(mesh);
    saveArrayBuffer(result, 'file.drc');
  }

  function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  }

  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);

  function save(blob, filename) {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  exportFile();
}

/**  */
