/**
 * Particle System
 * Modernized from bkcore.threejs.Particles
 *
 * Efficient particle system for visual effects (boost trails, sparks, etc.)
 * Uses BufferGeometry for optimal performance
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';

/**
 * Single particle data
 */
class Particle {
  public position: THREE.Vector3 = new THREE.Vector3(-10000, -10000, -10000);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public force: THREE.Vector3 = new THREE.Vector3();
  public color: THREE.Color = new THREE.Color(0x000000);
  public basecolor: THREE.Color = new THREE.Color(0x000000);
  public life: number = 0.0;
  public available: boolean = true;

  /**
   * Reset particle to initial state
   */
  reset(): void {
    this.position.set(0, -100000, 0);
    this.velocity.set(0, 0, 0);
    this.force.set(0, 0, 0);
    this.color.setRGB(0, 0, 0);
    this.basecolor.setRGB(0, 0, 0);
    this.life = 0.0;
    this.available = true;
  }
}

/**
 * Particle system configuration
 */
export interface ParticlesOptions {
  max?: number;
  spawnRate?: number;
  spawn?: THREE.Vector3;
  velocity?: THREE.Vector3;
  randomness?: THREE.Vector3;
  force?: THREE.Vector3;
  spawnRadius?: THREE.Vector3;
  life?: number;
  friction?: number;
  color?: number;
  color2?: number;
  tint?: number;
  texture?: THREE.Texture;
  size?: number;
  blending?: THREE.Blending;
  depthTest?: boolean;
  transparent?: boolean;
  opacity?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  sort?: boolean;
}

/**
 * Particle system
 */
export class Particles {
  // Material and rendering
  private material: THREE.PointsMaterial;
  public system: THREE.Points;
  private geometry: THREE.BufferGeometry;

  // Particle management
  private pool: Particle[] = [];
  private buffer: Particle[] = [];
  private max: number;
  private spawnRate: number;

  // Spawn parameters
  private spawn: THREE.Vector3;
  private velocity: THREE.Vector3;
  private randomness: THREE.Vector3;
  private force: THREE.Vector3;
  private spawnRadius: THREE.Vector3;

  // Particle lifecycle
  private life: number;
  private ageing: number;
  private friction: number;

  // Colors
  private color: THREE.Color;
  private color2: THREE.Color | null;

  // Transform
  private position: THREE.Vector3;
  private rotation: THREE.Euler;
  private sort: boolean;

  constructor(options: ParticlesOptions = {}) {
    // Initialize parameters
    this.max = options.max ?? 1000;
    this.spawnRate = options.spawnRate ?? 0;
    this.spawn = options.spawn ?? new THREE.Vector3();
    this.velocity = options.velocity ?? new THREE.Vector3();
    this.randomness = options.randomness ?? new THREE.Vector3();
    this.force = options.force ?? new THREE.Vector3();
    this.spawnRadius = options.spawnRadius ?? new THREE.Vector3();
    this.life = options.life ?? 60;
    this.ageing = 1 / this.life;
    this.friction = options.friction ?? 1.0;
    this.color = new THREE.Color(options.color ?? 0xffffff);
    this.color2 = options.color2 !== undefined ? new THREE.Color(options.color2) : null;
    this.position = options.position ?? new THREE.Vector3();
    this.rotation = options.rotation ?? new THREE.Euler();
    this.sort = options.sort ?? false;

    // Create material (ParticleBasicMaterial → PointsMaterial)
    this.material = new THREE.PointsMaterial({
      color: options.tint ?? 0xffffff,
      map: options.texture ?? null,
      size: options.size ?? 4,
      blending: options.blending ?? THREE.AdditiveBlending,
      depthTest: options.depthTest ?? false,
      transparent: options.transparent ?? true,
      vertexColors: true,
      opacity: options.opacity ?? 1.0,
      sizeAttenuation: true,
    });

    // Initialize geometry and system
    this.geometry = new THREE.BufferGeometry();
    this.system = new THREE.Points(this.geometry, this.material);

    this.build();
  }

  /**
   * Build the particle system
   */
  private build(): void {
    this.pool = [];
    this.buffer = [];

    // Create particle pool
    const positions = new Float32Array(this.max * 3);
    const colors = new Float32Array(this.max * 3);

    for (let i = 0; i < this.max; i++) {
      const p = new Particle();
      this.pool.push(p);
      this.buffer.push(p);

      // Initialize buffer attributes
      const i3 = i * 3;
      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;
      colors[i3] = p.color.r;
      colors[i3 + 1] = p.color.g;
      colors[i3 + 2] = p.color.b;
    }

    // Set buffer attributes
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Set transform
    this.system.position.copy(this.position);
    this.system.rotation.copy(this.rotation);
    if (this.sort) {
      // Note: sortParticles is deprecated, but we can set it for compatibility
      // Modern Three.js handles particle sorting differently
    }
  }

  /**
   * Emit particles
   */
  emit(count: number): void {
    const emitable = Math.min(count, this.pool.length);

    for (let i = 0; i < emitable; i++) {
      const p = this.pool.pop();
      if (!p) continue;

      p.available = false;
      p.position
        .copy(this.spawn)
        .add(this.randomVector().multiply(this.spawnRadius));
      p.velocity
        .copy(this.velocity)
        .add(this.randomVector().multiply(this.randomness));
      p.force.copy(this.force);
      p.basecolor.copy(this.color);
      if (this.color2) {
        p.basecolor.lerp(this.color2, Math.random());
      }
      p.life = 1.0;
    }
  }

  /**
   * Generate random vector (-1 to 1 in each axis)
   */
  private randomVector(): THREE.Vector3 {
    return new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
  }

  /**
   * Update particles
   * @param dt - Delta time (typically ~1.0 for 60fps)
   */
  update(dt: number): void {
    const df = new THREE.Vector3();
    const dv = new THREE.Vector3();

    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.buffer.length; i++) {
      const p = this.buffer[i];

      if (p.available) continue;

      // Age particle
      p.life -= this.ageing;

      // Return to pool if dead
      if (p.life <= 0) {
        p.reset();
        this.pool.push(p);
        continue;
      }

      // Fade color based on life
      const l = p.life > 0.5 ? 1.0 : p.life + 0.5;
      p.color.setRGB(l * p.basecolor.r, l * p.basecolor.g, l * p.basecolor.b);

      // Apply friction
      if (this.friction !== 1.0) {
        p.velocity.multiplyScalar(this.friction);
      }

      // Apply force
      df.copy(p.force).multiplyScalar(dt);
      p.velocity.add(df);

      // Update position
      dv.copy(p.velocity).multiplyScalar(dt);
      p.position.add(dv);

      // Update buffer
      const i3 = i * 3;
      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;
      colors[i3] = p.color.r;
      colors[i3 + 1] = p.color.g;
      colors[i3 + 2] = p.color.b;
    }

    // Auto-emit if spawn rate is set
    if (this.spawnRate > 0) {
      this.emit(this.spawnRate);
    }

    // Mark buffers for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Get the Points object to add to scene
   */
  getSystem(): THREE.Points {
    return this.system;
  }

  /**
   * Update spawn position
   */
  setSpawn(position: THREE.Vector3): void {
    this.spawn.copy(position);
  }

  /**
   * Update velocity
   */
  setVelocity(velocity: THREE.Vector3): void {
    this.velocity.copy(velocity);
  }

  /**
   * Update force
   */
  setForce(force: THREE.Vector3): void {
    this.force.copy(force);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
