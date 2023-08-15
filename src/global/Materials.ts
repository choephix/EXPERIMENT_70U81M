import { MeshLambertMaterial, ShaderMaterial } from 'three';

export module Materials {
  export const SOURCE_MATERIAL = new MeshLambertMaterial({ color: 0xffffff, vertexColors: true });

  export const DISPLAY_MATERIAL = new ShaderMaterial({
    uniforms: { selectedSourceMeshIndex: { value: [0, 0, 0] } },
    vertexShader: `
    precision mediump float;

    uniform vec3 selectedSourceMeshIndex;
    
    attribute vec3 color;
    attribute vec3 sourceMeshIndex;

    varying vec3 vColor;
    
    bool vec3Equal(vec3 a, vec3 b, float tolerance) {
      // return length(a - b) < tolerance;
      return a.z == b.z;
    }
    
    void main() {
      bool selected = vec3Equal(sourceMeshIndex, selectedSourceMeshIndex, .025);
      vColor = selected ? vec3(0.129, 0.508, 0.822) : vec3(0.8);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    precision mediump float;

    varying vec3 vColor;
    
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }`,
  });

  /**
   * Assigned to meshes while picking.
   *
   * Uses GPU acceleration to improve performance of rendering 3D meshes in the scene.
   * This is achieved by utilizing the WebGL API and shaders to offload computations to the GPU.
   *
   * For more information, google "GPU picking"
   */
  export const PICKING_MATERIAL = new ShaderMaterial({
    vertexShader: `
    precision mediump float;
    
    attribute vec3 sourceMeshIndex;

    varying vec3 vColor;

    void main() {
      vColor = sourceMeshIndex;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    precision mediump float;

    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }`,
  });
}

Object.assign(window, { Materials });

// TODO: lowp, mediump, highp
