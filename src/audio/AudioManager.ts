/**
 * AudioManager - Web Audio API wrapper for game sounds
 * Modernized from bkcore.Audio
 *
 * Features:
 * - Sound loading and buffering
 * - Play/stop/volume control
 * - 3D positional audio with panning
 * - Looping support
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';

/**
 * Sound configuration
 */
export interface SoundConfig {
  src: string;
  loop: boolean;
  usePanner?: boolean;
}

/**
 * Internal sound data
 */
interface SoundData {
  buffer: AudioBuffer;
  gainNode: GainNode;
  source: AudioBufferSourceNode | null;
  loop: boolean;
  usePanner: boolean;
}

/**
 * Audio manager for game sounds
 */
export class AudioManager {
  private static context: AudioContext | null = null;
  private static listener: AudioListener | null = null;
  private static panner: PannerNode | null = null;
  private static sounds: Map<string, SoundData> = new Map();
  private static posMultiplier: number = 1.5;

  /**
   * Initialize audio context
   */
  static init(): void {
    if (typeof AudioContext !== 'undefined') {
      this.context = new AudioContext();

      // Create panner for 3D audio
      this.panner = this.context.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'linear';
      this.panner.refDistance = 1;
      this.panner.maxDistance = 10000;
      this.panner.rolloffFactor = 1;
      this.panner.coneInnerAngle = 360;
      this.panner.coneOuterAngle = 0;
      this.panner.coneOuterGain = 0;
      this.panner.connect(this.context.destination);

      console.log('AudioManager initialized with Web Audio API');
    } else {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Load and add a sound
   */
  static async addSound(
    id: string,
    src: string,
    loop: boolean = false,
    usePanner: boolean = false
  ): Promise<void> {
    if (!this.context) {
      console.warn('AudioContext not initialized');
      return;
    }

    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      // Create gain node
      const gainNode = this.context.createGain();

      if (usePanner && this.panner) {
        gainNode.connect(this.panner);
      } else {
        gainNode.connect(this.context.destination);
      }

      const soundData: SoundData = {
        buffer: audioBuffer,
        gainNode,
        source: null,
        loop,
        usePanner,
      };

      this.sounds.set(id, soundData);
      console.log(`Sound loaded: ${id}`);
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error);
    }
  }

  /**
   * Play a sound
   */
  static play(id: string): void {
    if (!this.context) return;

    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return;
    }

    // Stop existing source if playing
    if (sound.source) {
      try {
        sound.source.stop();
      } catch (e) {
        // Ignore errors from stopping already-stopped sources
      }
    }

    // Create new buffer source
    const source = this.context.createBufferSource();
    source.buffer = sound.buffer;
    source.loop = sound.loop;
    source.connect(sound.gainNode);

    // Start playback
    source.start(0);

    // Store reference
    sound.source = source;

    // Clear reference when done (if not looping)
    if (!sound.loop) {
      source.onended = () => {
        if (sound.source === source) {
          sound.source = null;
        }
      };
    }
  }

  /**
   * Stop a sound
   */
  static stop(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound || !sound.source) return;

    try {
      sound.source.stop();
      sound.source = null;
    } catch (e) {
      console.warn(`Error stopping sound ${id}:`, e);
    }
  }

  /**
   * Set volume for a sound
   */
  static volume(id: string, volume: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set listener position (for 3D audio)
   */
  static setListenerPos(position: THREE.Vector3): void {
    if (!this.context || !this.panner) return;

    const normalized = position.clone().normalize();
    this.panner.setPosition(
      normalized.x * this.posMultiplier,
      normalized.y * this.posMultiplier,
      normalized.z * this.posMultiplier
    );
  }

  /**
   * Set listener velocity (for doppler effect)
   * Note: Modern Web Audio API deprecated velocity methods
   */
  static setListenerVelocity(velocity: THREE.Vector3): void {
    // This method is deprecated in modern Web Audio API
    // Kept for compatibility but does nothing
  }

  /**
   * Resume audio context (needed for autoplay policies)
   */
  static async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
      console.log('AudioContext resumed');
    }
  }

  /**
   * Check if a sound is playing
   */
  static isPlaying(id: string): boolean {
    const sound = this.sounds.get(id);
    return sound?.source !== null;
  }

  /**
   * Get current audio context state
   */
  static getState(): AudioContextState | null {
    return this.context?.state || null;
  }

  /**
   * Pause all sounds
   */
  static pauseAll(): void {
    this.sounds.forEach((sound, id) => {
      if (sound.source) {
        this.stop(id);
      }
    });
  }

  /**
   * Set master volume
   */
  static setMasterVolume(volume: number): void {
    this.sounds.forEach((sound) => {
      sound.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    });
  }
}

// Auto-initialize
AudioManager.init();
