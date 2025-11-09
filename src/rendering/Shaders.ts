/**
 * Custom shaders for GridPulse
 * Modernized from bkcore.threejs.Shaders
 *
 * Includes:
 * - Additive blending shader
 * - Hexagonal vignette shader
 * - Normal map shaders (per-pixel and per-vertex)
 * - Cube map shader for skybox
 *
 * @author Originally by Thibaut Despoulain, alteredq, mr.doob
 */

import * as THREE from 'three';

/**
 * Shader definition interface
 */
export interface ShaderDefinition {
  uniforms: { [uniform: string]: THREE.IUniform };
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Additive blending shader
 * Combines two textures with additive blending
 */
export const AdditiveShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tAdd: { value: null },
    fCoeff: { value: 1.0 },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tAdd;
    uniform float fCoeff;

    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      vec4 add = texture2D( tAdd, vUv );
      gl_FragColor = texel + add * fCoeff * add.a;
    }
  `,
};

/**
 * Hexagonal vignette shader
 * Custom vignette effect with hexagonal pattern overlay
 */
export const HexVignetteShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tHex: { value: null },
    size: { value: 512.0 },
    rx: { value: 1024.0 },
    ry: { value: 768.0 },
    color: { value: new THREE.Color(0x458ab1) },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

  fragmentShader: `
    uniform float size;
    uniform float rx;
    uniform float ry;
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform sampler2D tHex;

    varying vec2 vUv;

    void main() {
      vec4 vcolor = vec4(color, 1.0);

      vec2 hexuv;
      hexuv.x = mod(vUv.x * rx, size) / size;
      hexuv.y = mod(vUv.y * ry, size) / size;
      vec4 hex = texture2D( tHex, hexuv );

      float tolerance = 0.2;
      float vignette_size = 0.6;
      vec2 powers = pow(abs(vec2(vUv.x - 0.5, vUv.y - 0.5)), vec2(2.0));
      float radiusSqrd = vignette_size * vignette_size;
      float gradient = smoothstep(radiusSqrd - tolerance, radiusSqrd + tolerance, powers.x + powers.y);

      vec2 uv = ( vUv - vec2( 0.5 ) );
      vec2 sample = uv * gradient * 0.5 * (1.0 - hex.r);

      vec4 texel = texture2D( tDiffuse, vUv - sample );
      gl_FragColor = (((1.0 - hex.r) * vcolor) * 0.5 * gradient) + vec4( mix( texel.rgb, vcolor.xyz * 0.7, dot( uv, uv ) ), texel.a );
    }
  `,
};

/**
 * Cube map shader for skybox
 * Renders a cube-mapped environment
 */
export const CubeShader: ShaderDefinition = {
  uniforms: {
    tCube: { value: null },
    tFlip: { value: -1 },
  },

  vertexShader: `
    varying vec3 vViewPosition;

    void main() {
      vec4 mPosition = modelMatrix * vec4( position, 1.0 );
      vViewPosition = cameraPosition - mPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

  fragmentShader: `
    uniform samplerCube tCube;
    uniform float tFlip;

    varying vec3 vViewPosition;

    void main() {
      vec3 wPos = cameraPosition - vViewPosition;
      gl_FragColor = textureCube( tCube, vec3( tFlip * wPos.x, wPos.yz ) );
    }
  `,
};

/**
 * Normal map shader configuration for material creation
 */
export interface NormalMaterialConfig {
  diffuse?: THREE.Texture;
  specular?: THREE.Texture;
  normal?: THREE.Texture;
  ao?: THREE.Texture;
  cube?: THREE.CubeTexture;
  normalScale?: number;
  reflectivity?: number;
  ambient?: number;
  shininess?: number;
  metal?: boolean;
  perPixel?: boolean;
}

/**
 * Create a normal-mapped material
 * Modern replacement for bkcore.Utils.createNormalMaterial
 *
 * For modern Three.js, we use MeshStandardMaterial which has built-in
 * normal mapping, PBR, and better performance than custom shaders.
 */
export function createNormalMaterial(config: NormalMaterialConfig): THREE.Material {
  // For now, use MeshStandardMaterial as it provides similar functionality
  // with better performance and modern PBR workflow
  const material = new THREE.MeshStandardMaterial({
    map: config.diffuse || null,
    normalMap: config.normal || null,
    normalScale: config.normalScale ? new THREE.Vector2(config.normalScale, config.normalScale) : new THREE.Vector2(1, 1),
    roughnessMap: config.specular || null,
    aoMap: config.ao || null,
    envMap: config.cube || null,
    envMapIntensity: config.reflectivity || 0.5,
    metalness: config.metal ? 0.7 : 0.1,
    roughness: config.shininess ? 1.0 - config.shininess / 100 : 0.5,
  });

  // Note: 'ambient' is now handled by scene ambient light in modern Three.js
  // The old shader's ambient parameter would be converted to scene lighting

  return material;
}

/**
 * Legacy normal map shader (per-pixel lighting)
 * NOTE: This uses deprecated Three.js shader chunk API and is kept for reference.
 * Modern code should use createNormalMaterial() instead.
 *
 * @deprecated Use createNormalMaterial() with MeshStandardMaterial instead
 */
export const NormalMapShader: Partial<ShaderDefinition> = {
  // NOTE: This shader is complex and relies on old Three.js shader chunks
  // that have changed significantly. It's kept here for reference but should
  // not be used directly. Use MeshStandardMaterial instead.

  uniforms: {
    enableAO: { value: 0 },
    enableDiffuse: { value: 0 },
    enableSpecular: { value: 0 },
    enableReflection: { value: 0 },
    tDiffuse: { value: null },
    tCube: { value: null },
    tNormal: { value: null },
    tSpecular: { value: null },
    tAO: { value: null },
    uNormalScale: { value: 1.0 },
    uDiffuseColor: { value: new THREE.Color(0xffffff) },
    uSpecularColor: { value: new THREE.Color(0x111111) },
    uAmbientColor: { value: new THREE.Color(0xffffff) },
    uShininess: { value: 30 },
    uOpacity: { value: 1 },
    uReflectivity: { value: 0.5 },
  },

  // Vertex and fragment shaders omitted as they use deprecated shader chunks
  // Use MeshStandardMaterial for modern normal mapping instead
};

/**
 * Shader collection
 */
export const Shaders = {
  additive: AdditiveShader,
  hexvignette: HexVignetteShader,
  cube: CubeShader,
  normal: NormalMapShader,
};
