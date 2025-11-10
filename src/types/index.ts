/**
 * Type definitions for GridPulse game engine
 */

import * as THREE from 'three';

// Game Configuration Types
export interface GridPulseOptions {
  document: Document;
  width: number;
  height: number;
  container: HTMLElement;
  overlay?: HTMLElement;
  gameover?: HTMLElement;
  quality: QualityLevel;
  difficulty: number;
  hud: boolean;
  controlType: ControlType;
  godmode?: boolean;
  track: string;
}

export type QualityLevel = 0 | 1 | 2 | 3; // LOW, MID, HIGH, VERY HIGH
export type ControlType = 0 | 1 | 2 | 3; // KEYBOARD, TOUCH, LEAP, GAMEPAD

// Loading Callbacks
export interface LoadCallbacks {
  onLoad?: () => void;
  onError?: (url: string) => void;
  onProgress?: (progress: ProgressEvent, type: string, name: string) => void;
}

// Ship Physics State
export interface ShipState {
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  shield: number;
  speed: number;
  boost: number;
  destroyed: boolean;
}

// Track Data
export interface TrackData {
  name: string;
  checkpoints: Checkpoint[];
  startPosition: THREE.Vector3;
  startRotation: THREE.Euler;
  collisionMap?: HTMLImageElement;
  heightMap?: HTMLImageElement;
}

export interface Checkpoint {
  position: THREE.Vector3;
  index: number;
}

// Race Data
export interface RaceState {
  lap: number;
  checkpoint: number;
  totalLaps: number;
  raceTime: number;
  lapTime: number;
  bestLap: number;
  finished: boolean;
}

// Quality Settings
export interface QualitySettings {
  shadowMapEnabled: boolean;
  shadowMapSize: number;
  antialias: boolean;
  anisotropicFiltering: number;
  particlesEnabled: boolean;
  postProcessing: boolean;
}

// Input State
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

// HUD Configuration
export interface HUDConfig {
  width: number;
  height: number;
  speedGaugeSize: number;
  shieldGaugeSize: number;
}

// Audio Configuration
export interface AudioConfig {
  enabled: boolean;
  volume: number;
  bgMusicVolume: number;
  sfxVolume: number;
}

// Camera Configuration
export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  offset: THREE.Vector3;
  lookAtOffset: THREE.Vector3;
  dampingFactor: number;
}

// Gameplay Mode
export enum GameMode {
  TIME_ATTACK = 'time_attack',
  SURVIVAL = 'survival',
  REPLAY = 'replay',
}

// Asset Loader Types
export interface AssetManifest {
  geometries: Record<string, string>;
  textures: Record<string, string>;
  audio: Record<string, string>;
}

export interface LoadedAssets {
  geometries: Map<string, THREE.BufferGeometry>;
  textures: Map<string, THREE.Texture>;
  audio: Map<string, AudioBuffer>;
}
