/**
 * RenderManager - Manages multiple scenes, cameras, and render loops
 * Modernized from bkcore.threejs.RenderManager
 *
 * Allows switching between different render setups (e.g., menu scene vs game scene)
 * Each setup has its own scene, camera, and render function.
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';

/**
 * Render setup configuration
 */
export interface RenderSetup {
  id: string;
  scene: THREE.Scene;
  camera: THREE.Camera;
  render?: RenderFunction;
  objects?: Record<string, any>;
}

/**
 * Render function signature
 * Called in the context of the RenderSetup
 */
export type RenderFunction = (
  this: RenderSetup,
  delta: number,
  renderer: THREE.WebGLRenderer
) => void;

/**
 * Manages multiple render setups and switches between them
 *
 * @example
 * ```typescript
 * const manager = new RenderManager(renderer);
 *
 * manager.add('menu', menuScene, menuCamera, function(delta, renderer) {
 *   this.objects.rotation += delta * 0.001;
 *   this.scene.rotation.y = this.objects.rotation;
 *   renderer.render(this.scene, this.camera);
 * }, { rotation: 0 });
 *
 * manager.add('game', gameScene, gameCamera, function(delta, renderer) {
 *   // Game render logic
 *   renderer.render(this.scene, this.camera);
 * });
 *
 * manager.setCurrent('menu');
 *
 * // In animation loop
 * manager.renderCurrent();
 * ```
 */
export class RenderManager {
  public renderer: THREE.WebGLRenderer;
  private time: number;
  private renders: Map<string, RenderSetup>;
  private current: RenderSetup | null;
  private defaultRenderMethod: RenderFunction;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.time = performance.now();
    this.renders = new Map();
    this.current = null;

    // Default render method if none provided
    this.defaultRenderMethod = function (
      this: RenderSetup,
      delta: number,
      renderer: THREE.WebGLRenderer
    ) {
      renderer.render(this.scene, this.camera);
    };
  }

  /**
   * Add a new render setup
   * @param id - Unique identifier for this setup
   * @param scene - Three.js scene
   * @param camera - Three.js camera
   * @param render - Optional custom render function
   * @param objects - Optional object storage for the render function
   */
  add(
    id: string,
    scene: THREE.Scene,
    camera: THREE.Camera,
    render?: RenderFunction,
    objects?: Record<string, any>
  ): void {
    const setup: RenderSetup = {
      id,
      scene,
      camera,
      render: render || this.defaultRenderMethod,
      objects: objects || {},
    };

    this.renders.set(id, setup);

    // Set as current if this is the first setup
    if (this.renders.size === 1) {
      this.current = setup;
    }
  }

  /**
   * Get a render setup by ID
   */
  get(id: string): RenderSetup | undefined {
    return this.renders.get(id);
  }

  /**
   * Remove a render setup
   */
  remove(id: string): void {
    if (this.renders.has(id)) {
      const setup = this.renders.get(id);

      // If removing the current setup, clear current
      if (this.current === setup) {
        this.current = null;
      }

      this.renders.delete(id);
    }
  }

  /**
   * Render the current setup
   * Call this in your animation loop
   */
  renderCurrent(): void {
    if (!this.current || !this.current.render) {
      console.warn('RenderManager: No current render defined.');
      return;
    }

    const now = performance.now();
    const delta = now - this.time;
    this.time = now;

    // Call render function with setup as context
    this.current.render.call(this.current, delta, this.renderer);
  }

  /**
   * Set the active render setup
   */
  setCurrent(id: string): void {
    const setup = this.renders.get(id);

    if (setup) {
      this.current = setup;
    } else {
      console.warn(`RenderManager: Render "${id}" not found.`);
    }
  }

  /**
   * Get the currently active setup
   */
  getCurrent(): RenderSetup | null {
    return this.current;
  }

  /**
   * Get all render setup IDs
   */
  getIds(): string[] {
    return Array.from(this.renders.keys());
  }

  /**
   * Get the number of render setups
   */
  size(): number {
    return this.renders.size;
  }

  /**
   * Check if a render setup exists
   */
  has(id: string): boolean {
    return this.renders.has(id);
  }

  /**
   * Clear all render setups
   */
  clear(): void {
    this.renders.clear();
    this.current = null;
  }
}
