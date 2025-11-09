/**
 * RaceData - Replay system for recording and playing back races
 * Records ship position and rotation over time for ghost racing and replays
 * Modernized from bkcore.gridpulse.RaceData
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';

/**
 * Race data frame format: [time, x, y, z, qx, qy, qz, qw]
 */
export type RaceDataFrame = [
  number, // time
  number, number, number, // position x, y, z
  number, number, number, number // quaternion x, y, z, w
];

/**
 * ShipControls interface (stub until ShipControls is migrated)
 */
export interface IShipControls {
  getPosition(): THREE.Vector3;
  getQuaternion(): THREE.Quaternion;
  teleport(position: THREE.Vector3, quaternion: THREE.Quaternion): void;
}

/**
 * RaceData records ship movement for replay/ghost racing
 */
export class RaceData {
  private track: any; // TODO: Type when Track module is migrated
  private mode: string;
  private shipControls: IShipControls;

  private rate: number; // Recording rate (1 / rate frames)
  private rateState: number;

  private data: RaceDataFrame[];
  private last: number; // Index of last frame
  private seek: number; // Current playback position

  // Temporary vectors/quaternions for interpolation
  private _p: THREE.Vector3;
  private _pp: THREE.Vector3;
  private _np: THREE.Vector3;
  private _q: THREE.Quaternion;
  private _pq: THREE.Quaternion;
  private _nq: THREE.Quaternion;

  constructor(track: any, mode: string, shipControls: IShipControls) {
    this.track = track;
    this.mode = mode;
    this.shipControls = shipControls;

    this.rate = 2; // Record every 2nd frame (1 / rate)
    this.rateState = 1;

    this.data = [];
    this.last = -1;
    this.seek = 0;

    // Preallocate vectors and quaternions for performance
    this._p = new THREE.Vector3();
    this._pp = new THREE.Vector3();
    this._np = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._pq = new THREE.Quaternion();
    this._nq = new THREE.Quaternion();
  }

  /**
   * Record a frame of race data
   * @param time - Current race time in milliseconds
   */
  tick(time: number): void {
    if (this.rateState === 1) {
      const p = this.shipControls.getPosition();
      const q = this.shipControls.getQuaternion();

      this.data.push([
        time,
        p.x, p.y, p.z,
        q.x, q.y, q.z, q.w,
      ]);

      ++this.last;
    } else if (this.rateState === this.rate) {
      this.rateState = 0;
    }

    this.rateState++;
  }

  /**
   * Apply interpolated replay data to ship at given time
   * @param time - Time to seek to in replay
   */
  applyInterpolated(time: number): void {
    // Seek forward to find the right frame
    while (this.seek < this.last && this.data[this.seek + 1][0] < time) {
      ++this.seek;
    }

    if (this.seek < 0) {
      console.warn('Bad race data.');
      return;
    }

    const prev = this.data[this.seek];
    this._pp.set(prev[1], prev[2], prev[3]);
    this._pq.set(prev[4], prev[5], prev[6], prev[7]);

    // No interpolation for first or last frame
    if (this.seek === this.last || this.seek === 0) {
      this.shipControls.teleport(this._pp, this._pq);
      return;
    }

    // Interpolate between current and next frame
    const next = this.data[this.seek + 1];
    this._np.set(next[1], next[2], next[3]);
    this._nq.set(next[4], next[5], next[6], next[7]);

    // Calculate interpolation factor
    const t = (time - prev[0]) / (next[0] - prev[0]);

    // Lerp position, Slerp rotation
    this._p.lerpVectors(this._pp, this._np, t);
    this._q.slerpQuaternions(this._pq, this._nq, t);

    this.shipControls.teleport(this._p, this._q);
  }

  /**
   * Reset playback to start
   */
  reset(): void {
    this.seek = 0;
  }

  /**
   * Export race data for saving
   */
  export(): RaceDataFrame[] {
    return this.data;
  }

  /**
   * Import race data from saved replay
   * @param data - Previously exported race data
   */
  import(data: RaceDataFrame[]): void {
    this.data = data;
    this.last = this.data.length - 1;
    console.log('Imported race data with', this.data.length, 'frames');
  }

  /**
   * Get the number of recorded frames
   */
  getFrameCount(): number {
    return this.data.length;
  }

  /**
   * Get total recording duration
   */
  getDuration(): number {
    if (this.data.length === 0) return 0;
    return this.data[this.data.length - 1][0];
  }

  /**
   * Clear all recorded data
   */
  clear(): void {
    this.data = [];
    this.last = -1;
    this.seek = 0;
  }
}
