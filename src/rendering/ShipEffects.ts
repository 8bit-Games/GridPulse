/**
 * ShipEffects - Visual effects for the ship
 * Modernized from bkcore.gridpulse.ShipEffects
 *
 * Manages:
 * - Booster glow and sprite effects
 * - Collision particle effects (sparks and clouds)
 * - Dynamic intensity based on speed and boost
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';
import { Particles } from './Particles';
import type { ShipControls } from '../physics/ShipControls';

/**
 * Ship effects configuration
 */
export interface ShipEffectsOptions {
  scene: THREE.Scene;
  shipControls: ShipControls;
  booster?: THREE.Mesh;
  boosterLight?: THREE.PointLight;
  boosterSprite?: any; // Legacy Sprite type
  useParticles?: boolean;
  textureSpark?: THREE.Texture;
  textureCloud?: THREE.Texture;
}

/**
 * Visual effects manager for the ship
 */
export class ShipEffects {
  private scene: THREE.Scene;
  private shipControls: ShipControls;

  // Booster effects
  private booster?: THREE.Mesh;
  private boosterLight?: THREE.PointLight;
  private boosterSprite?: any;

  // Particle system
  private useParticles: boolean;
  private particles?: {
    leftSparks: Particles;
    leftClouds: Particles;
    rightSparks: Particles;
    rightClouds: Particles;
  };

  // Particle configuration vectors
  private pVel: THREE.Vector3 = new THREE.Vector3(0.5, 0, 0);
  private pOffset: THREE.Vector3 = new THREE.Vector3(-3, -0.3, 0);
  private pRad: THREE.Vector3 = new THREE.Vector3(0, 0, 1.5);
  private shipVelocity: THREE.Vector3 = new THREE.Vector3();

  // Normalized particle parameters
  private pVelS: number;
  private pOffsetS: number;
  private pRadS: number;

  constructor(options: ShipEffectsOptions) {
    this.scene = options.scene;
    this.shipControls = options.shipControls;
    this.booster = options.booster;
    this.boosterLight = options.boosterLight;
    this.boosterSprite = options.boosterSprite;
    this.useParticles = options.useParticles ?? false;

    // Store lengths before normalizing
    this.pVelS = this.pVel.length();
    this.pOffsetS = this.pOffset.length();
    this.pRadS = this.pRad.length();

    // Normalize particle vectors
    this.pVel.normalize();
    this.pOffset.normalize();
    this.pRad.normalize();

    // Initialize particle systems if enabled
    if (this.useParticles && options.textureSpark && options.textureCloud) {
      this.initializeParticles(options.textureSpark, options.textureCloud);
    }
  }

  /**
   * Initialize particle systems for collision effects
   */
  private initializeParticles(textureSpark: THREE.Texture, textureCloud: THREE.Texture): void {
    this.particles = {
      // Right side sparks
      rightSparks: new Particles({
        randomness: new THREE.Vector3(0.4, 0.4, 0.4),
        tint: 0xffffff,
        color: 0xffc000,
        color2: 0xffffff,
        texture: textureSpark,
        size: 2,
        life: 60,
        max: 200,
      }),

      // Right side clouds
      rightClouds: new Particles({
        opacity: 0.8,
        tint: 0xffffff,
        color: 0x666666,
        color2: 0xa4f1ff,
        texture: textureCloud,
        size: 6,
        blending: THREE.NormalBlending,
        life: 60,
        max: 200,
        spawn: new THREE.Vector3(3, -0.3, 0),
        spawnRadius: new THREE.Vector3(1, 1, 2),
        velocity: new THREE.Vector3(0, 0, -0.4),
        randomness: new THREE.Vector3(0.05, 0.05, 0.1),
      }),

      // Left side sparks
      leftSparks: new Particles({
        randomness: new THREE.Vector3(0.4, 0.4, 0.4),
        tint: 0xffffff,
        color: 0xffc000,
        color2: 0xffffff,
        texture: textureSpark,
        size: 2,
        life: 60,
        max: 200,
      }),

      // Left side clouds
      leftClouds: new Particles({
        opacity: 0.8,
        tint: 0xffffff,
        color: 0x666666,
        color2: 0xa4f1ff,
        texture: textureCloud,
        size: 6,
        blending: THREE.NormalBlending,
        life: 60,
        max: 200,
        spawn: new THREE.Vector3(-3, -0.3, 0),
        spawnRadius: new THREE.Vector3(1, 1, 2),
        velocity: new THREE.Vector3(0, 0, -0.4),
        randomness: new THREE.Vector3(0.05, 0.05, 0.1),
      }),
    };

    // Add particle systems to scene
    if (this.shipControls.mesh) {
      this.shipControls.mesh.add(this.particles.leftClouds.getSystem());
      this.shipControls.mesh.add(this.particles.rightClouds.getSystem());
    }
    this.scene.add(this.particles.leftSparks.getSystem());
    this.scene.add(this.particles.rightSparks.getSystem());
  }

  /**
   * Update visual effects
   */
  update(dt: number): void {
    let boostRatio: number;
    let opacity: number;
    let scale: number;
    let intensity: number;
    let random: number;

    // Calculate effect parameters based on ship state
    if (this.shipControls.destroyed) {
      opacity = 0;
      scale = 0;
      intensity = 0;
      random = 0;
    } else {
      boostRatio = this.shipControls.getBoostRatio();
      opacity = this.shipControls.key.forward ? 0.8 : 0.3 + boostRatio * 0.4;
      scale = (this.shipControls.key.forward ? 1.0 : 0.8) + boostRatio * 0.5;
      intensity = this.shipControls.key.forward ? 4.0 : 2.0;
      random = Math.random() * 0.2;
    }

    // Update booster visual effects
    if (this.booster && this.booster.material) {
      this.booster.rotation.z += 1;
      this.booster.scale.set(scale, scale, scale);

      // Type guard for material opacity
      if ('opacity' in this.booster.material) {
        (this.booster.material as THREE.MeshBasicMaterial).opacity = random + opacity;
      }
    }

    if (this.boosterSprite) {
      this.boosterSprite.opacity = random + opacity;
    }

    if (this.boosterLight) {
      this.boosterLight.intensity = intensity * (random + 0.8);
    }

    // Update particle effects
    if (this.useParticles && this.particles) {
      this.updateParticles(dt);
    }
  }

  /**
   * Update particle effects for collisions
   */
  private updateParticles(dt: number): void {
    if (!this.particles || !this.shipControls.mesh) return;

    // Copy ship velocity
    this.shipVelocity.copy(this.shipControls.currentVelocity).multiplyScalar(0.7);

    // Configure right side particles
    this.particles.rightSparks.setVelocity(this.pVel.clone());
    this.particles.rightSparks.setSpawn(this.pOffset.clone());

    // Configure left side particles (mirror X)
    const leftVel = this.pVel.clone();
    leftVel.x *= -1;
    this.particles.leftSparks.setVelocity(leftVel);

    const leftSpawn = this.pOffset.clone();
    leftSpawn.x *= -1;
    this.particles.leftSparks.setSpawn(leftSpawn);

    // Transform right side particles to world space
    const rightSpawn = this.pOffset.clone().applyMatrix4(this.shipControls.mesh.matrix);
    rightSpawn.multiplyScalar(this.pOffsetS).add(this.shipControls.dummy.position);
    this.particles.rightSparks.setSpawn(rightSpawn);

    const rightVel = this.pVel.clone().applyMatrix4(this.shipControls.mesh.matrix);
    rightVel.multiplyScalar(this.pVelS).add(this.shipVelocity);
    this.particles.rightSparks.setVelocity(rightVel);

    const rightRad = this.pRad.clone().applyMatrix4(this.shipControls.mesh.matrix);
    rightRad.multiplyScalar(this.pRadS);

    // Transform left side particles to world space
    const leftSpawnWorld = leftSpawn.applyMatrix4(this.shipControls.mesh.matrix);
    leftSpawnWorld.multiplyScalar(this.pOffsetS).add(this.shipControls.dummy.position);
    this.particles.leftSparks.setSpawn(leftSpawnWorld);

    const leftVelWorld = leftVel.applyMatrix4(this.shipControls.mesh.matrix);
    leftVelWorld.multiplyScalar(this.pVelS).add(this.shipVelocity);
    this.particles.leftSparks.setVelocity(leftVelWorld);

    // Emit particles on collision
    if (this.shipControls.collision.right) {
      this.particles.rightSparks.emit(10);
      this.particles.rightClouds.emit(5);
    }

    if (this.shipControls.collision.left) {
      this.particles.leftSparks.emit(10);
      this.particles.leftClouds.emit(5);
    }

    // Update all particle systems
    this.particles.rightSparks.update(dt);
    this.particles.rightClouds.update(dt);
    this.particles.leftSparks.update(dt);
    this.particles.leftClouds.update(dt);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.particles) {
      this.particles.leftSparks.dispose();
      this.particles.leftClouds.dispose();
      this.particles.rightSparks.dispose();
      this.particles.rightClouds.dispose();
    }
  }
}
