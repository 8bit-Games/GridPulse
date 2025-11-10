/**
 * CameraChase - Third-person camera that follows the ship
 * Modernized from bkcore.gridpulse.CameraChase
 *
 * Two modes:
 * - CHASE: Follows behind the ship with speed-based offset
 * - ORBIT: Orbits around the ship (for replays/cutscenes)
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';

/**
 * Camera modes
 */
export enum CameraMode {
  CHASE = 0,
  ORBIT = 1,
}

/**
 * Camera chase configuration
 */
export interface CameraChaseOptions {
  camera: THREE.Camera;
  target: THREE.Object3D;
  cameraCube?: THREE.Camera;
  yoffset?: number;
  zoffset?: number;
  viewOffset?: number;
  lerp?: number;
}

/**
 * Chase camera controller
 */
export class CameraChase {
  // Direction vectors
  private dir: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private target: THREE.Vector3 = new THREE.Vector3();

  // Speed-based offset
  private speedOffset: number = 0;
  private speedOffsetMax: number = 10;
  private speedOffsetStep: number = 0.05;

  // Camera mode
  public mode: CameraMode = CameraMode.CHASE;

  // References
  private camera: THREE.Camera;
  private targetObject: THREE.Object3D;
  private cameraCube: THREE.Camera | null;

  // Offset parameters
  private yoffset: number;
  private zoffset: number;
  private viewOffset: number;
  private orbitOffset: number = 12;
  private lerp: number;

  // Time for orbit mode
  private time: number = 0.0;

  constructor(options: CameraChaseOptions) {
    this.camera = options.camera;
    this.targetObject = options.target;
    this.cameraCube = options.cameraCube || null;

    this.yoffset = options.yoffset ?? 8.0;
    this.zoffset = options.zoffset ?? 10.0;
    this.viewOffset = options.viewOffset ?? 10.0;
    this.lerp = options.lerp ?? 0.5;
  }

  /**
   * Update camera position
   * @param dt - Delta time
   * @param ratio - Speed ratio (0-1) for dynamic offset
   */
  update(dt: number, ratio: number): void {
    if (this.mode === CameraMode.CHASE) {
      // Reset direction vectors
      this.dir.set(0, 0, 1);
      this.up.set(0, 1, 0);

      // Apply ship's rotation to direction vectors
      this.dir.applyMatrix4(this.targetObject.matrix);
      this.up.applyMatrix4(this.targetObject.matrix);

      // Calculate speed-based offset (camera moves back when going faster)
      this.speedOffset +=
        (this.speedOffsetMax * ratio - this.speedOffset) * Math.min(1, 0.3 * dt);

      // Calculate camera position behind the ship
      this.target.copy(this.targetObject.position);
      this.target.sub(this.dir.clone().multiplyScalar(this.zoffset + this.speedOffset));
      this.target.add(this.up.clone().multiplyScalar(this.yoffset));
      this.target.y += -this.up.y + this.yoffset;

      this.camera.position.copy(this.target);

      // Look at point ahead of the ship
      const lookAtTarget = this.dir
        .clone()
        .normalize()
        .multiplyScalar(this.viewOffset)
        .add(this.targetObject.position);
      this.camera.lookAt(lookAtTarget);
    } else if (this.mode === CameraMode.ORBIT) {
      // Orbit around the ship
      this.time += dt * 0.008;
      this.dir.set(
        Math.cos(this.time) * this.orbitOffset,
        this.yoffset / 2,
        Math.sin(this.time) * this.orbitOffset
      );

      this.target.copy(this.targetObject.position).add(this.dir);
      this.camera.position.copy(this.target);
      this.camera.lookAt(this.targetObject.position);
    }

    // Update cube camera if present (for reflections/skybox)
    if (this.cameraCube !== null) {
      this.cameraCube.rotation.copy(this.camera.rotation);
    }
  }

  /**
   * Set camera mode
   */
  setMode(mode: CameraMode): void {
    this.mode = mode;
    if (mode === CameraMode.ORBIT) {
      this.time = 0.0;
    }
  }

  /**
   * Get current mode
   */
  getMode(): CameraMode {
    return this.mode;
  }
}
