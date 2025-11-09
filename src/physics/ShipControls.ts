/**
 * ShipControls - Physics simulation and control system for the ship
 * Modernized from bkcore.gridpulse.ShipControls
 *
 * Handles:
 * - Ship physics (thrust, speed, drift, air resistance)
 * - Collision detection and response
 * - Height mapping (following track terrain)
 * - Input handling (keyboard, touch, gamepad, orientation)
 * - Shield and boost mechanics
 * - Visual effects (roll, tilt, gradient)
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';
import type { ImageData } from '../utils/ImageData';

/**
 * Key state for ship controls
 */
export interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  ltrigger: boolean;
  rtrigger: boolean;
  use: boolean;
}

/**
 * Collision state
 */
export interface CollisionState {
  front: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Ship controls configuration
 */
export interface ShipControlsConfig {
  document: Document;
  width: number;
  height: number;
  controlType: number;
  restart?: () => void;
}

/**
 * Ship physics and control system
 */
export class ShipControls {
  // State
  public active: boolean = true;
  public destroyed: boolean = false;
  public falling: boolean = false;

  // Configuration
  private dom: Document;
  public mesh: THREE.Mesh | null = null;

  // Physics constants
  private epsilon: number = 0.00000001;
  private zero: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private airResist: number = 0.02;
  private airDrift: number = 0.1;
  private thrust: number = 0.02;
  private airBrake: number = 0.02;
  private maxSpeed: number = 7.0;
  private boosterSpeed: number;
  private boosterDecay: number = 0.01;
  private angularSpeed: number = 0.005;
  private airAngularSpeed: number = 0.0065;
  private repulsionRatio: number = 0.5;
  private repulsionCap: number = 2.5;
  private repulsionLerp: number = 0.1;
  private collisionSpeedDecrease: number = 0.8;
  private collisionSpeedDecreaseCoef: number = 0.8;
  private maxShield: number = 1.0;
  private shieldDelay: number = 60;
  private shieldTiming: number = 0;
  private shieldDamage: number = 0.25;
  private driftLerp: number = 0.35;
  private angularLerp: number = 0.35;

  // Movement and rotation
  private movement: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private rotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private roll: number = 0.0;
  private rollAxis: THREE.Vector3 = new THREE.Vector3();
  public drift: number = 0.0;
  public speed: number = 0.0;
  public speedRatio: number = 0.0;
  public boost: number = 0.0;
  public shield: number = 1.0;
  private angular: number = 0.0;

  private currentVelocity: THREE.Vector3 = new THREE.Vector3();
  private quaternion: THREE.Quaternion = new THREE.Quaternion();

  // Dummy object for physics calculations
  public dummy: THREE.Object3D = new THREE.Object3D();

  // Collision detection
  public collisionMap: ImageData | null = null;
  public collisionPixelRatio: number = 1.0;
  public collisionDetection: boolean = false;
  private collisionPreviousPosition: THREE.Vector3 = new THREE.Vector3();

  // Height mapping
  public heightMap: ImageData | null = null;
  public heightPixelRatio: number = 1.0;
  public heightBias: number = 0.0;
  private heightLerp: number = 0.4;
  private heightScale: number = 1.0;

  // Roll effect
  private rollAngle: number = 0.6;
  private rollLerp: number = 0.08;
  private rollDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  // Gradient (pitch) effect
  private gradient: number = 0.0;
  private gradientTarget: number = 0.0;
  private gradientLerp: number = 0.05;
  private gradientScale: number = 4.0;
  private gradientVector: THREE.Vector3 = new THREE.Vector3(0, 0, 5);
  private gradientAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);

  // Tilt (banking) effect
  private tilt: number = 0.0;
  private tiltTarget: number = 0.0;
  private tiltLerp: number = 0.05;
  private tiltScale: number = 4.0;
  private tiltVector: THREE.Vector3 = new THREE.Vector3(5, 0, 0);
  private tiltAxis: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  // Repulsion forces
  private repulsionVLeft: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  private repulsionVRight: THREE.Vector3 = new THREE.Vector3(-1, 0, 0);
  private repulsionVFront: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private repulsionVScale: number = 4.0;
  private repulsionAmount: number = 0.0;
  private repulsionForce: THREE.Vector3 = new THREE.Vector3();

  // Fall vector
  private fallVector: THREE.Vector3 = new THREE.Vector3(0, -20, 0);

  // Reset position and rotation
  private resetPos: THREE.Vector3 | null = null;
  private resetRot: THREE.Vector3 | null = null;

  // Input state
  public key: KeyState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    ltrigger: false,
    rtrigger: false,
    use: false,
  };

  public collision: CollisionState = {
    front: false,
    left: false,
    right: false,
  };

  // Controllers (TODO: Implement when controller modules are migrated)
  private touchController: any = null;
  private orientationController: any = null;
  private gamepadController: any = null;

  // Event handlers (bound for cleanup)
  private onKeyDownBound: (event: KeyboardEvent) => void;
  private onKeyUpBound: (event: KeyboardEvent) => void;

  // Config for restart callback
  private restartCallback?: () => void;

  constructor(config: ShipControlsConfig) {
    this.dom = config.document;
    this.restartCallback = config.restart;
    this.boosterSpeed = this.maxSpeed * 0.2;

    // Bind event handlers for cleanup
    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);

    // Setup keyboard controls
    this.dom.addEventListener('keydown', this.onKeyDownBound, false);
    this.dom.addEventListener('keyup', this.onKeyUpBound, false);

    // TODO: Setup touch controller when TouchController module is migrated
    // if (config.controlType === 1 && TouchController.isCompatible()) {
    //   this.touchController = new TouchController(...);
    // }

    // TODO: Setup orientation controller when OrientationController module is migrated
    // if (config.controlType === 4 && OrientationController.isCompatible()) {
    //   this.orientationController = new OrientationController(...);
    // }

    // TODO: Setup gamepad controller when GamepadController module is migrated
    // if (config.controlType === 3 && GamepadController.isCompatible()) {
    //   this.gamepadController = new GamepadController(...);
    // }

    console.log('ShipControls initialized with control type:', config.controlType);
  }

  /**
   * Keyboard down event handler
   */
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case 38: // Up arrow
        this.key.forward = true;
        break;
      case 40: // Down arrow
        this.key.backward = true;
        break;
      case 37: // Left arrow
        this.key.left = true;
        break;
      case 39: // Right arrow
        this.key.right = true;
        break;
      case 81: // Q
      case 65: // A
        this.key.ltrigger = true;
        break;
      case 68: // D
      case 69: // E
        this.key.rtrigger = true;
        break;
    }
  }

  /**
   * Keyboard up event handler
   */
  private onKeyUp(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case 38: // Up arrow
        this.key.forward = false;
        break;
      case 40: // Down arrow
        this.key.backward = false;
        break;
      case 37: // Left arrow
        this.key.left = false;
        break;
      case 39: // Right arrow
        this.key.right = false;
        break;
      case 81: // Q
      case 65: // A
        this.key.ltrigger = false;
        break;
      case 68: // D
      case 69: // E
        this.key.rtrigger = false;
        break;
    }
  }

  /**
   * Attach ship mesh to controls
   */
  control(threeMesh: THREE.Mesh): void {
    this.mesh = threeMesh;
    // Note: matrixAutoUpdate is the correct property name (not martixAutoUpdate from original)
    this.mesh.matrixAutoUpdate = false;
    this.dummy.position.copy(this.mesh.position);
  }

  /**
   * Reset ship to initial position and state
   */
  reset(position: THREE.Vector3, rotation: THREE.Vector3): void {
    this.resetPos = position.clone();
    this.resetRot = rotation.clone();
    this.movement.set(0, 0, 0);
    this.rotation.copy(rotation);
    this.roll = 0.0;
    this.drift = 0.0;
    this.speed = 0.0;
    this.speedRatio = 0.0;
    this.boost = 0.0;
    this.shield = this.maxShield;
    this.destroyed = false;

    this.dummy.position.copy(position);
    this.quaternion.set(rotation.x, rotation.y, rotation.z, 1).normalize();
    this.dummy.quaternion.set(0, 0, 0, 1);
    this.dummy.quaternion.multiply(this.quaternion);

    this.dummy.updateMatrix();

    if (this.mesh) {
      this.mesh.matrix.identity();
      this.mesh.applyMatrix4(this.dummy.matrix);
    }
  }

  /**
   * Terminate and cleanup
   */
  terminate(): void {
    this.destroy();

    // Remove event listeners
    this.dom.removeEventListener('keydown', this.onKeyDownBound, false);
    this.dom.removeEventListener('keyup', this.onKeyUpBound, false);

    // TODO: Cleanup controllers when implemented
    // if (this.touchController) this.touchController.destroy();
    // if (this.orientationController) this.orientationController.destroy();
    // if (this.gamepadController) this.gamepadController.destroy();
  }

  /**
   * Destroy the ship
   */
  destroy(): void {
    // TODO: Audio integration when AudioManager is migrated
    // Audio.play('destroyed');
    // Audio.stop('bg');
    // Audio.stop('wind');
    console.log('Ship destroyed!');

    this.active = false;
    this.destroyed = true;
    this.collision.front = false;
    this.collision.left = false;
    this.collision.right = false;
  }

  /**
   * Make ship fall (out of bounds)
   */
  fall(): void {
    this.active = false;
    this.collision.front = false;
    this.collision.left = false;
    this.collision.right = false;
    this.falling = true;

    setTimeout(() => {
      this.destroyed = true;
    }, 1500);
  }

  /**
   * Main update loop for physics simulation
   */
  update(dt: number): void {
    if (this.falling) {
      if (this.mesh) {
        this.mesh.position.add(this.fallVector);
      }
      return;
    }

    this.rotation.y = 0;
    this.movement.set(0, 0, 0);
    this.drift += (0.0 - this.drift) * this.driftLerp;
    this.angular += (0.0 - this.angular) * this.angularLerp * 0.5;

    let rollAmount = 0.0;
    let angularAmount = 0.0;
    const yawLeap = 0.0;

    // TODO: Leap Motion support when needed
    // if (this.leapBridge && this.leapBridge.hasHands) { ... }

    if (this.active) {
      // Touch controller input
      if (this.touchController !== null) {
        // TODO: Implement when TouchController is migrated
        // angularAmount -= this.touchController.stickVector.x / 100 * this.angularSpeed * dt;
        // rollAmount += this.touchController.stickVector.x / 100 * this.rollAngle;
      }
      // Orientation controller input
      else if (this.orientationController !== null) {
        // TODO: Implement when OrientationController is migrated
        // angularAmount += this.orientationController.beta / 45 * this.angularSpeed * dt;
        // rollAmount -= this.orientationController.beta / 45 * this.rollAngle;
      }
      // Gamepad controller input
      else if (this.gamepadController !== null) {
        // TODO: Implement when GamepadController is migrated
        // if (this.gamepadController.updateAvailable()) {
        //   angularAmount -= this.gamepadController.lstickx * this.angularSpeed * dt;
        //   rollAmount += this.gamepadController.lstickx * this.rollAngle;
        // }
      }
      // Keyboard input (default)
      else {
        if (this.key.left) {
          angularAmount += this.angularSpeed * dt;
          rollAmount -= this.rollAngle;
        }
        if (this.key.right) {
          angularAmount -= this.angularSpeed * dt;
          rollAmount += this.rollAngle;
        }
      }

      // Forward/backward thrust
      if (this.key.forward) {
        this.speed += this.thrust * dt;
      } else {
        this.speed -= this.airResist * dt;
      }

      // Left air brake + drift
      if (this.key.ltrigger) {
        if (this.key.left) {
          angularAmount += this.airAngularSpeed * dt;
        } else {
          angularAmount += this.airAngularSpeed * 0.5 * dt;
        }
        this.speed -= this.airBrake * dt;
        this.drift += (this.airDrift - this.drift) * this.driftLerp;
        this.movement.x += this.speed * this.drift * dt;
        if (this.drift > 0.0) {
          this.movement.z -= this.speed * this.drift * dt;
        }
        rollAmount -= this.rollAngle * 0.7;
      }

      // Right air brake + drift
      if (this.key.rtrigger) {
        if (this.key.right) {
          angularAmount -= this.airAngularSpeed * dt;
        } else {
          angularAmount -= this.airAngularSpeed * 0.5 * dt;
        }
        this.speed -= this.airBrake * dt;
        this.drift += (-this.airDrift - this.drift) * this.driftLerp;
        this.movement.x += this.speed * this.drift * dt;
        if (this.drift < 0.0) {
          this.movement.z += this.speed * this.drift * dt;
        }
        rollAmount += this.rollAngle * 0.7;
      }
    }

    // Apply angular movement
    this.angular += (angularAmount - this.angular) * this.angularLerp;
    this.rotation.y = this.angular;

    // Clamp speed
    this.speed = Math.max(0.0, Math.min(this.speed, this.maxSpeed));
    this.speedRatio = this.speed / this.maxSpeed;
    this.movement.z += this.speed * dt;

    // Apply repulsion force
    if (this.repulsionForce.lengthSq() < this.epsilon) {
      this.repulsionForce.set(0, 0, 0);
    } else {
      if (this.repulsionForce.z !== 0.0) this.movement.z = 0;
      this.movement.add(this.repulsionForce);
      this.repulsionForce.lerp(
        this.zero,
        dt > 1.5 ? this.repulsionLerp * 2 : this.repulsionLerp
      );
    }

    this.collisionPreviousPosition.copy(this.dummy.position);

    // Check for boost pads
    this.boosterCheck(dt);

    // Apply movement
    this.dummy.translateX(this.movement.x);
    this.dummy.translateZ(this.movement.z);

    // Check height and adjust Y position
    this.heightCheck(dt);
    this.dummy.translateY(this.movement.y);

    // Calculate current velocity
    this.currentVelocity.copy(this.dummy.position).sub(this.collisionPreviousPosition);

    // Check collisions
    this.collisionCheck(dt);

    // Apply rotation
    this.quaternion.set(this.rotation.x, this.rotation.y, this.rotation.z, 1).normalize();
    this.dummy.quaternion.multiply(this.quaternion);

    // Update dummy matrix
    this.dummy.updateMatrix();

    // Check shield
    if (this.shield <= 0.0) {
      this.shield = 0.0;
      this.destroy();
    }

    // Update mesh with visual effects
    if (this.mesh !== null) {
      this.mesh.matrix.identity();

      // Apply gradient (pitch) effect
      const gradientDelta = (this.gradientTarget - (yawLeap + this.gradient)) * this.gradientLerp;
      if (Math.abs(gradientDelta) > this.epsilon) {
        this.gradient += gradientDelta;
      }
      if (Math.abs(this.gradient) > this.epsilon) {
        this.mesh.matrix.multiply(
          new THREE.Matrix4().makeRotationAxis(this.gradientAxis, this.gradient)
        );
      }

      // Apply tilt (banking) effect
      const tiltDelta = (this.tiltTarget - this.tilt) * this.tiltLerp;
      if (Math.abs(tiltDelta) > this.epsilon) {
        this.tilt += tiltDelta;
      }
      if (Math.abs(this.tilt) > this.epsilon) {
        this.mesh.matrix.multiply(
          new THREE.Matrix4().makeRotationAxis(this.tiltAxis, this.tilt)
        );
      }

      // Apply roll effect
      const rollDelta = (rollAmount - this.roll) * this.rollLerp;
      if (Math.abs(rollDelta) > this.epsilon) {
        this.roll += rollDelta;
      }
      if (Math.abs(this.roll) > this.epsilon) {
        this.rollAxis.copy(this.rollDirection);
        this.mesh.matrix.multiply(
          new THREE.Matrix4().makeRotationAxis(this.rollAxis, this.roll)
        );
      }

      // Apply physics matrix
      this.mesh.applyMatrix4(this.dummy.matrix);
      this.mesh.updateMatrixWorld(true);
    }

    // TODO: Update audio listener position when AudioManager is migrated
    // Audio.setListenerPos(this.movement);
    // Audio.setListenerVelocity(this.currentVelocity);
  }

  /**
   * Teleport ship to position (for replay)
   */
  teleport(pos: THREE.Vector3, quat: THREE.Quaternion): void {
    this.quaternion.copy(quat);
    this.dummy.quaternion.copy(this.quaternion);
    this.dummy.position.copy(pos);
    this.dummy.updateMatrix();

    if (this.mesh !== null) {
      this.mesh.matrix.identity();

      // Apply gradient
      const gradientDelta = (this.gradientTarget - this.gradient) * this.gradientLerp;
      if (Math.abs(gradientDelta) > this.epsilon) {
        this.gradient += gradientDelta;
      }
      if (Math.abs(this.gradient) > this.epsilon) {
        this.mesh.matrix.multiply(
          new THREE.Matrix4().makeRotationAxis(this.gradientAxis, this.gradient)
        );
      }

      // Apply tilt
      const tiltDelta = (this.tiltTarget - this.tilt) * this.tiltLerp;
      if (Math.abs(tiltDelta) > this.epsilon) {
        this.tilt += tiltDelta;
      }
      if (Math.abs(this.tilt) > this.epsilon) {
        this.mesh.matrix.multiply(
          new THREE.Matrix4().makeRotationAxis(this.tiltAxis, this.tilt)
        );
      }

      this.mesh.applyMatrix4(this.dummy.matrix);
      this.mesh.updateMatrixWorld(true);
    }
  }

  /**
   * Check for boost pads on the track
   */
  private boosterCheck(dt: number): void {
    if (!this.collisionMap || !this.collisionMap.loaded) {
      return;
    }

    this.boost -= this.boosterDecay * dt;
    if (this.boost < 0) {
      this.boost = 0.0;
      // TODO: Audio integration
      // Audio.stop('boost');
    }

    const x = Math.round(
      this.collisionMap.pixels!.width / 2 + this.dummy.position.x * this.collisionPixelRatio
    );
    const z = Math.round(
      this.collisionMap.pixels!.height / 2 + this.dummy.position.z * this.collisionPixelRatio
    );

    const color = this.collisionMap.getPixel(x, z);

    // Boost pad color: red (255, <127, <127)
    if (color.r === 255 && color.g < 127 && color.b < 127) {
      // TODO: Audio integration
      // Audio.play('boost');
      this.boost = this.boosterSpeed;
    }

    this.movement.z += this.boost * dt;
  }

  /**
   * Check for collisions with track walls
   */
  private collisionCheck(dt: number): boolean {
    if (!this.collisionDetection || !this.collisionMap || !this.collisionMap.loaded) {
      return false;
    }

    if (this.shieldDelay > 0) {
      this.shieldDelay -= dt;
    }

    this.collision.left = false;
    this.collision.right = false;
    this.collision.front = false;

    const x = Math.round(
      this.collisionMap.pixels!.width / 2 + this.dummy.position.x * this.collisionPixelRatio
    );
    const z = Math.round(
      this.collisionMap.pixels!.height / 2 + this.dummy.position.z * this.collisionPixelRatio
    );
    const pos = new THREE.Vector3(x, 0, z);

    const collision = this.collisionMap.getPixelBilinear(x, z);

    // Collision detected (r < 255 means wall)
    if (collision.r < 255) {
      // TODO: Audio integration
      // Audio.play('crash');
      console.log('Collision detected at', x, z, 'color:', collision);

      // Calculate shield damage based on speed
      const sr = this.getRealSpeed() / this.maxSpeed;
      this.shield -= sr * sr * 0.8 * this.shieldDamage;

      // Calculate repulsion direction
      this.repulsionVLeft.set(1, 0, 0);
      this.repulsionVRight.set(-1, 0, 0);
      this.repulsionVLeft.applyMatrix4(this.dummy.matrix);
      this.repulsionVRight.applyMatrix4(this.dummy.matrix);
      this.repulsionVLeft.multiplyScalar(this.repulsionVScale);
      this.repulsionVRight.multiplyScalar(this.repulsionVScale);

      const lPos = this.repulsionVLeft.clone().add(pos);
      const rPos = this.repulsionVRight.clone().add(pos);
      const lCol = this.collisionMap.getPixel(Math.round(lPos.x), Math.round(lPos.z)).r;
      const rCol = this.collisionMap.getPixel(Math.round(rPos.x), Math.round(rPos.z)).r;

      this.repulsionAmount = Math.max(
        0.8,
        Math.min(this.repulsionCap, this.speed * this.repulsionRatio)
      );

      if (rCol > lCol) {
        // Repulse right
        this.repulsionForce.x += -this.repulsionAmount;
        this.collision.left = true;
      } else if (rCol < lCol) {
        // Repulse left
        this.repulsionForce.x += this.repulsionAmount;
        this.collision.right = true;
      } else {
        // Front collision
        this.repulsionForce.z += -this.repulsionAmount * 4;
        this.collision.front = true;
        this.speed = 0;
      }

      // Check for out of bounds (game over)
      if (rCol < 128 && lCol < 128) {
        const fCol = this.collisionMap.getPixel(
          Math.round(pos.x + 2),
          Math.round(pos.z + 2)
        ).r;
        if (fCol < 128) {
          console.log('GAMEOVER - Ship out of bounds');
          this.fall();
        }
      }

      // Reduce speed on collision
      this.speed *= this.collisionSpeedDecrease;
      this.speed *= 1 - this.collisionSpeedDecreaseCoef * (1 - collision.r / 255);
      this.boost = 0;

      return true;
    }

    return false;
  }

  /**
   * Check height map and adjust ship altitude
   */
  private heightCheck(dt: number): void {
    if (!this.heightMap || !this.heightMap.loaded) {
      return;
    }

    const x =
      this.heightMap.pixels!.width / 2 + this.dummy.position.x * this.heightPixelRatio;
    const z =
      this.heightMap.pixels!.height / 2 + this.dummy.position.z * this.heightPixelRatio;
    const height =
      this.heightMap.getPixelFBilinear(x, z) / this.heightScale + this.heightBias;

    if (height < 16777) {
      const delta = height - this.dummy.position.y;

      if (delta > 0) {
        this.movement.y += delta;
      } else {
        this.movement.y += delta * this.heightLerp;
      }
    }

    // Calculate gradient (pitch) based on terrain slope ahead
    this.gradientVector.set(0, 0, 5);
    const gv = this.gradientVector.clone().applyMatrix4(this.dummy.matrix);

    const gx = this.heightMap.pixels!.width / 2 + gv.x * this.heightPixelRatio;
    const gz = this.heightMap.pixels!.height / 2 + gv.z * this.heightPixelRatio;
    const nheight = this.heightMap.getPixelFBilinear(gx, gz) / this.heightScale + this.heightBias;

    if (nheight < 16777) {
      this.gradientTarget = -Math.atan2(nheight - height, 5.0) * this.gradientScale;
    }

    // Calculate tilt (banking) based on terrain slope to the side
    this.tiltVector.set(5, 0, 0);
    const tv = this.tiltVector.clone().applyMatrix4(this.dummy.matrix);

    let tx = this.heightMap.pixels!.width / 2 + tv.x * this.heightPixelRatio;
    let tz = this.heightMap.pixels!.height / 2 + tv.z * this.heightPixelRatio;
    let theight = this.heightMap.getPixelFBilinear(tx, tz) / this.heightScale + this.heightBias;

    // If right projection out of bounds, try left projection
    if (theight >= 16777) {
      const tvLeft = tv.clone().sub(this.dummy.position).multiplyScalar(-1).add(this.dummy.position);
      tx = this.heightMap.pixels!.width / 2 + tvLeft.x * this.heightPixelRatio;
      tz = this.heightMap.pixels!.height / 2 + tvLeft.z * this.heightPixelRatio;
      theight = this.heightMap.getPixelFBilinear(tx, tz) / this.heightScale + this.heightBias;
    }

    if (theight < 16777) {
      this.tiltTarget = Math.atan2(theight - height, 5.0) * this.tiltScale;
    }
  }

  /**
   * Get real speed including boost
   */
  getRealSpeed(scale: number = 1): number {
    return Math.round((this.speed + this.boost) * scale);
  }

  /**
   * Get real speed ratio (clamped to max)
   */
  getRealSpeedRatio(): number {
    return Math.min(this.maxSpeed, this.speed + this.boost) / this.maxSpeed;
  }

  /**
   * Get speed ratio (unclamped)
   */
  getSpeedRatio(): number {
    return (this.speed + this.boost) / this.maxSpeed;
  }

  /**
   * Get boost ratio
   */
  getBoostRatio(): number {
    return this.boost / this.boosterSpeed;
  }

  /**
   * Get shield ratio
   */
  getShieldRatio(): number {
    return this.shield / this.maxShield;
  }

  /**
   * Get shield value
   */
  getShield(scale: number = 1): number {
    return Math.round(this.shield * scale);
  }

  /**
   * Get current position
   */
  getPosition(): THREE.Vector3 {
    return this.dummy.position;
  }

  /**
   * Get current quaternion
   */
  getQuaternion(): THREE.Quaternion {
    return this.dummy.quaternion;
  }
}
