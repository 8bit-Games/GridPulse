/**
 * Asset Loader for loading textures, geometries, images, and sounds
 * Modernized from bkcore.threejs.Loader with Three.js r160 API
 */

import * as THREE from 'three';
import { ImageData } from '../utils/ImageData';

export interface LoadProgress {
  total: number;
  remaining: number;
  loaded: number;
  finished: boolean;
}

export interface LoaderCallbacks {
  onLoad?: () => void;
  onError?: (name: string) => void;
  onProgress?: (progress: LoadProgress, type?: string, name?: string) => void;
}

export interface AssetData {
  textures?: Record<string, string>;
  texturesCube?: Record<string, string>;
  geometries?: Record<string, string>;
  analysers?: Record<string, string>;
  images?: Record<string, string>;
  sounds?: Record<string, { src: string; loop: boolean; usePanner?: boolean }>;
}

type AssetType = 'textures' | 'texturesCube' | 'geometries' | 'analysers' | 'images' | 'sounds';

/**
 * Modern asset loader with progress tracking
 */
export class Loader {
  private textureLoader: THREE.TextureLoader;
  private cubeTextureLoader: THREE.CubeTextureLoader;
  private objectLoader: THREE.ObjectLoader;

  private errorCallback: (name: string) => void;
  private loadCallback: () => void;
  private progressCallback: (progress: LoadProgress, type?: string, name?: string) => void;

  private states: Record<AssetType, Record<string, boolean>>;
  private data: {
    textures: Record<string, THREE.Texture>;
    texturesCube: Record<string, THREE.CubeTexture>;
    geometries: Record<string, THREE.BufferGeometry | null>;
    analysers: Record<string, ImageData>;
    images: Record<string, HTMLImageElement>;
    sounds: Record<string, any>; // Will be properly typed when Audio module is migrated
  };

  public progress: LoadProgress;

  constructor(callbacks: LoaderCallbacks = {}) {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.objectLoader = new THREE.ObjectLoader();

    this.errorCallback =
      callbacks.onError ||
      ((name) => console.warn(`Error while loading ${name}`));

    this.loadCallback = callbacks.onLoad || (() => console.log('Loaded.'));

    this.progressCallback = callbacks.onProgress || (() => {});

    // Initialize state tracking
    this.states = {
      textures: {},
      texturesCube: {},
      geometries: {},
      analysers: {},
      images: {},
      sounds: {},
    };

    this.data = {
      textures: {},
      texturesCube: {},
      geometries: {},
      analysers: {},
      images: {},
      sounds: {},
    };

    this.progress = {
      total: 0,
      remaining: 0,
      loaded: 0,
      finished: false,
    };
  }

  /**
   * Load all specified assets
   */
  async load(assetData: AssetData): Promise<void> {
    // Calculate total assets to load
    for (const key in assetData) {
      const assetType = key as AssetType;
      if (assetData[assetType]) {
        const count = Object.keys(assetData[assetType]!).length;
        this.progress.total += count;
        this.progress.remaining += count;
      }
    }

    // Load textures
    if (assetData.textures) {
      for (const [name, url] of Object.entries(assetData.textures)) {
        this.loadTexture(name, url);
      }
    }

    // Load cube textures
    if (assetData.texturesCube) {
      for (const [name, url] of Object.entries(assetData.texturesCube)) {
        this.loadTextureCube(name, url);
      }
    }

    // Load geometries
    if (assetData.geometries) {
      for (const [name, url] of Object.entries(assetData.geometries)) {
        this.loadGeometry(name, url);
      }
    }

    // Load analysers (image data for collision/height maps)
    if (assetData.analysers) {
      for (const [name, url] of Object.entries(assetData.analysers)) {
        this.loadAnalyser(name, url);
      }
    }

    // Load images
    if (assetData.images) {
      for (const [name, url] of Object.entries(assetData.images)) {
        this.loadImage(name, url);
      }
    }

    // Load sounds
    if (assetData.sounds) {
      for (const [name, soundData] of Object.entries(assetData.sounds)) {
        await this.loadSound(soundData.src, name, soundData.loop, soundData.usePanner);
      }
    }

    this.progressCallback(this.progress);
  }

  /**
   * Update loading state and progress
   */
  private updateState(type: AssetType, name: string, state: boolean): void {
    if (state === true) {
      this.progress.remaining--;
      this.progress.loaded++;
      this.progressCallback(this.progress, type, name);
    }

    this.states[type][name] = state;

    if (this.progress.loaded === this.progress.total) {
      this.progress.finished = true;
      this.loadCallback();
    }
  }

  /**
   * Get loaded asset
   */
  get<T>(type: AssetType, name: string): T | null {
    const typeData = this.data[type] as any;
    if (!typeData || !(name in typeData)) {
      console.warn(`Unknown file: ${name} of type: ${type}`);
      return null;
    }
    return typeData[name] as T;
  }

  /**
   * Check if asset is loaded
   */
  loaded(type: AssetType, name: string): boolean {
    if (!(name in this.states[type])) {
      console.warn(`Unknown file: ${name}`);
      return false;
    }
    return this.states[type][name];
  }

  /**
   * Load a texture
   */
  private loadTexture(name: string, url: string): void {
    this.updateState('textures', name, false);

    this.textureLoader.load(
      url,
      (texture) => {
        this.data.textures[name] = texture;
        this.updateState('textures', name, true);
      },
      undefined,
      () => {
        this.errorCallback(name);
      }
    );
  }

  /**
   * Load a cube texture (skybox)
   */
  private loadTextureCube(name: string, urlPattern: string): void {
    const urls = [
      urlPattern.replace('%1', 'px'),
      urlPattern.replace('%1', 'nx'),
      urlPattern.replace('%1', 'py'),
      urlPattern.replace('%1', 'ny'),
      urlPattern.replace('%1', 'pz'),
      urlPattern.replace('%1', 'nz'),
    ];

    this.updateState('texturesCube', name, false);

    this.cubeTextureLoader.load(
      urls,
      (texture) => {
        texture.mapping = THREE.CubeRefractionMapping;
        this.data.texturesCube[name] = texture;
        this.updateState('texturesCube', name, true);
      },
      undefined,
      () => {
        this.errorCallback(name);
      }
    );
  }

  /**
   * Load a geometry (JSON format - legacy Three.js format)
   * Note: This uses the deprecated JSONLoader format but still works
   * Consider converting to GLTF in the future
   */
  private loadGeometry(name: string, url: string): void {
    this.data.geometries[name] = null;
    this.updateState('geometries', name, false);

    // Use fetch to load JSON geometry manually since JSONLoader is deprecated
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        // Convert legacy JSON geometry to BufferGeometry
        const geometry = this.parseJSONGeometry(json);
        this.data.geometries[name] = geometry;
        this.updateState('geometries', name, true);
      })
      .catch(() => {
        this.errorCallback(name);
      });
  }

  /**
   * Parse legacy Three.js JSON geometry format
   * This is a simplified parser - may need enhancement for complex geometries
   */
  private parseJSONGeometry(json: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    if (json.data) {
      // Use ObjectLoader for newer format
      const loader = new THREE.ObjectLoader();
      return loader.parseGeometries([json.data])[json.data.uuid];
    }

    // Legacy format - manual parsing
    if (json.vertices) {
      const vertices = new Float32Array(json.vertices);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    }

    if (json.normals) {
      const normals = new Float32Array(json.normals);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    }

    if (json.uvs && json.uvs[0]) {
      const uvs = new Float32Array(json.uvs[0]);
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    if (json.faces) {
      // Convert faces to indices
      // This is simplified - full implementation would handle different face types
      const indices: number[] = [];
      for (let i = 0; i < json.faces.length; i += 3) {
        indices.push(json.faces[i], json.faces[i + 1], json.faces[i + 2]);
      }
      geometry.setIndex(indices);
    }

    geometry.computeBoundingSphere();
    return geometry;
  }

  /**
   * Load an analyser (image data for collision/height maps)
   */
  private loadAnalyser(name: string, url: string): void {
    this.updateState('analysers', name, false);

    this.data.analysers[name] = new ImageData(url, () => {
      this.updateState('analysers', name, true);
    });
  }

  /**
   * Load an image
   */
  private loadImage(name: string, url: string): void {
    this.updateState('images', name, false);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.updateState('images', name, true);
    };

    img.onerror = () => {
      this.errorCallback(name);
    };

    img.src = url;
    this.data.images[name] = img;
  }

  /**
   * Load a sound
   * TODO: Implement proper audio loading when AudioManager is migrated
   */
  private async loadSound(
    src: string,
    name: string,
    loop: boolean,
    usePanner?: boolean
  ): Promise<void> {
    this.updateState('sounds', name, false);

    // Placeholder - will be implemented when AudioManager is migrated
    console.warn('Audio loading not yet implemented in modern build');

    this.data.sounds[name] = {
      play: () => console.log(`Play sound: ${name}`),
      stop: () => console.log(`Stop sound: ${name}`),
      volume: (vol: number) => console.log(`Set volume: ${name} = ${vol}`),
    };

    this.updateState('sounds', name, true);
  }
}
