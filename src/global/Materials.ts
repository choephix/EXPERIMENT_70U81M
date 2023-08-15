import { MeshLambertMaterial, ShaderMaterial } from 'three';

export module Materials {
  export const VERTEX_COLOR_MATERIAL = new MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: true,
  });

  export const DISPLAY_MATERIAL = new ShaderMaterial({
    uniforms: {
      selectedSourceMeshIndex: { value: [0, 0, 0] },
      lightColor: { value: [1, 1, 1] },
      lightDirection: { value: [0.5, 1, 1] },
    },
    vertexShader: `
    precision highp float;

    attribute vec3 color;
    attribute vec3 sourceMeshIndex;

    uniform vec3 selectedSourceMeshIndex;
    uniform vec3 lightColor;
    uniform vec3 lightDirection;

    varying vec3 vColor;

    bool vec3Equal(vec3 a, vec3 b, float tolerance) {
      return length(a - b) < tolerance;
    }

    void main() {
      // Calculate base color depending on whether the mesh is selected
      bool selected = vec3Equal(sourceMeshIndex, selectedSourceMeshIndex, .5);
      vColor = selected ? vec3(0.129, 0.508, 0.822) : vec3(0.5);

      // Diffuse Lambertian lighting
      vec3 normLightDirection = normalize(lightDirection);
      vec3 negNormLightDirection = -normLightDirection;
      vec3 normal = normalize(normalMatrix * normal);

      // Calculate the diffuse component for both lights
      float diffLight1 = max(dot(normal, normLightDirection), 0.0);
      float diffLight2 = max(dot(normal, negNormLightDirection), 0.0);

      float diffLightsTotal = diffLight1 + diffLight2;
      float diffLightsWithAmbient = 0.5 + diffLightsTotal;

      vColor = vColor * diffLightsWithAmbient * lightColor;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    precision highp float;

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
    precision highp float;

    attribute vec3 sourceMeshIndex;

    varying vec3 vColor;

    void main() {
      vColor = sourceMeshIndex / 255.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    precision highp float;

    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }`,
  });
}

Object.assign(window, { Materials });

// TODO: lowp, mediump, highp
