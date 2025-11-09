/**
 * Gameplay - Core game logic for race management
 * Handles lap tracking, checkpoints, countdown, and finish conditions
 * Modernized from bkcore.gridpulse.Gameplay
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import { Timer } from '../utils/Timer';
import { RaceData, IShipControls } from './RaceData';
import { ImageData } from '../utils/ImageData';

/**
 * HUD interface (stub until HUD is migrated)
 */
export interface IHUD {
  updateTime(timeString: string): void;
  updateLap(current: number, max: number): void;
  display(message: string, duration?: number): void;
  resetTime(): void;
  messageOnly: boolean;
}

/**
 * Camera controls interface (stub until CameraChase is migrated)
 */
export interface ICameraControls {
  mode: number;
  modes: {
    CHASE: number;
    ORBIT: number;
  };
}

/**
 * Track interface (stub until Track module is migrated)
 */
export interface ITrack {
  name: string;
  spawn: any; // THREE.Vector3
  spawnRotation: any; // THREE.Quaternion
  checkpoints: {
    start: number;
    last: number;
  };
}

/**
 * Gameplay configuration options
 */
export interface GameplayOptions {
  mode?: string;
  hud?: IHUD | null;
  shipControls: IShipControls & { active: boolean; destroyed: boolean; reset: (spawn: any, rotation: any) => void; dummy?: { position: any } };
  cameraControls: ICameraControls;
  analyser: ImageData;
  pixelRatio: number;
  track: ITrack;
  onFinish?: (this: Gameplay) => void;
}

/**
 * Game result types
 */
export enum GameResult {
  FINISH = 1,
  DESTROYED = 2,
  WRONGWAY = 3,
  REPLAY = 4,
  NONE = -1,
}

/**
 * Game mode type
 */
export type GameMode = 'timeattack' | 'survival' | 'replay';

/**
 * Core gameplay logic
 */
export class Gameplay {
  // Configuration
  private startDelay: number;
  private countDownDelay: number;

  // State
  public active: boolean;
  private timer: Timer;
  private mode: GameMode;
  private step: number;

  // Components
  private hud: IHUD | null;
  private shipControls: IShipControls & { active: boolean; destroyed: boolean; reset: (spawn: any, rotation: any) => void; dummy?: { position: any } };
  private cameraControls: ICameraControls;
  private track: ITrack;
  private analyser: ImageData;
  private pixelRatio: number;

  // Race state
  private previousCheckPoint: number;
  public result: GameResult;
  public lap: number;
  public lapTimes: number[];
  private lapTimeElapsed: number;
  private maxLaps: number;
  public score: string | null;
  public finishTime: number | null;
  private onFinish: (this: Gameplay) => void;

  // Race data for replay
  public raceData!: RaceData;

  // Game mode functions
  private modes: Record<GameMode, () => void>;
  public results = GameResult;

  constructor(options: GameplayOptions) {
    this.startDelay = options.hud == null ? 0 : 1000;
    this.countDownDelay = options.hud == null ? 1000 : 1500;

    this.active = false;
    this.timer = new Timer();
    this.mode = (options.mode || 'timeattack') as GameMode;
    this.step = 0;

    this.hud = options.hud || null;
    this.shipControls = options.shipControls;
    this.cameraControls = options.cameraControls;
    this.track = options.track;
    this.analyser = options.analyser;
    this.pixelRatio = options.pixelRatio;

    this.previousCheckPoint = -1;
    this.result = GameResult.NONE;

    this.lap = 1;
    this.lapTimes = [];
    this.lapTimeElapsed = 0;
    this.maxLaps = 3;
    this.score = null;
    this.finishTime = null;

    this.onFinish = options.onFinish || function (this: Gameplay) {
      console.log('FINISH');
    };

    // Setup game mode functions
    this.modes = {
      timeattack: this.timeAttackMode.bind(this),
      survival: this.survivalMode.bind(this),
      replay: this.replayMode.bind(this),
    };
  }

  /**
   * Time attack game mode logic
   */
  private timeAttackMode(): void {
    this.raceData.tick(this.timer.time.elapsed);

    // Update HUD time
    if (this.hud) {
      this.hud.updateTime(this.timer.getElapsedTime());
    }

    const cp = this.checkPoint();

    // Lap completed (crossed start line after last checkpoint)
    if (
      cp === this.track.checkpoints.start &&
      this.previousCheckPoint === this.track.checkpoints.last
    ) {
      this.previousCheckPoint = cp;
      const t = this.timer.time.elapsed;
      this.lapTimes.push(t - this.lapTimeElapsed);
      this.lapTimeElapsed = t;

      if (this.lap === this.maxLaps) {
        // Race complete!
        this.end(GameResult.FINISH);
      } else {
        // Next lap
        this.lap++;
        if (this.hud) {
          this.hud.updateLap(this.lap, this.maxLaps);
        }

        if (this.lap === this.maxLaps) {
          if (this.hud) {
            this.hud.display('Final lap', 0.5);
          }
        }
      }
    }
    // Regular checkpoint
    else if (cp !== -1 && cp !== this.previousCheckPoint) {
      this.previousCheckPoint = cp;
      // Could display checkpoint message here
      // if (this.hud) this.hud.display("Checkpoint", 0.5);
    }

    // Check if ship was destroyed
    if (this.shipControls.destroyed === true) {
      this.end(GameResult.DESTROYED);
    }
  }

  /**
   * Survival mode logic (stub)
   */
  private survivalMode(): void {
    // TODO: Implement survival mode
    console.warn('Survival mode not yet implemented');
  }

  /**
   * Replay mode logic
   */
  private replayMode(): void {
    this.raceData.applyInterpolated(this.timer.time.elapsed);

    // Check if replay finished
    if (this.raceData.seek === this.raceData.last) {
      this.end(GameResult.REPLAY);
    }
  }

  /**
   * Simulate a finish for testing (debug mode)
   */
  simu(): void {
    this.lapTimes = [92300, 91250, 90365];
    this.finishTime = this.lapTimes[0] + this.lapTimes[1] + this.lapTimes[2];

    if (this.hud) {
      this.hud.display('Finish');
    }

    this.step = 100;
    this.result = GameResult.FINISH;
    this.shipControls.active = false;
  }

  /**
   * Start the race
   */
  start(options?: any): boolean {
    this.finishTime = null;
    this.score = null;
    this.lap = 1;

    // Reset ship to spawn point
    this.shipControls.reset(this.track.spawn, this.track.spawnRotation);
    this.shipControls.active = false;

    this.previousCheckPoint = this.track.checkpoints.start;

    // Initialize race data
    this.raceData = new RaceData(this.track.name, this.mode, this.shipControls);

    // Replay mode setup
    if (this.mode === 'replay') {
      this.cameraControls.mode = this.cameraControls.modes.ORBIT;
      if (this.hud) {
        this.hud.messageOnly = true;
      }

      try {
        const storageKey = `race-${this.track.name}-replay`;
        const data = localStorage.getItem(storageKey);

        if (!data) {
          console.error(`No replay data for ${storageKey}.`);
          return false;
        }

        this.raceData.import(JSON.parse(data));
      } catch (e) {
        console.error('Bad replay format:', e);
        return false;
      }
    }

    // Start the race
    this.active = true;
    this.step = 0;
    this.timer.start();

    if (this.hud) {
      this.hud.resetTime();
      this.hud.display('Get ready', 1);
      this.hud.updateLap(this.lap, this.maxLaps);
    }

    return true;
  }

  /**
   * End the race
   */
  end(result: GameResult): void {
    this.score = this.timer.getElapsedTime();
    this.finishTime = this.timer.time.elapsed;
    this.timer.start(); // Restart for end screen display timer
    this.result = result;

    this.shipControls.active = false;

    if (result === GameResult.FINISH) {
      if (this.hud) {
        this.hud.display('Finish');
      }
      this.step = 100;
    } else if (result === GameResult.DESTROYED) {
      if (this.hud) {
        this.hud.display('Destroyed');
      }
      this.step = 100;
    }
  }

  /**
   * Update gameplay logic (called every frame)
   */
  update(): void {
    if (!this.active) return;

    this.timer.update();

    // Countdown sequence
    if (this.step === 0 && this.timer.time.elapsed >= this.countDownDelay + this.startDelay) {
      if (this.hud) {
        this.hud.display('3');
      }
      this.step = 1;
    } else if (
      this.step === 1 &&
      this.timer.time.elapsed >= 2 * this.countDownDelay + this.startDelay
    ) {
      if (this.hud) {
        this.hud.display('2');
      }
      this.step = 2;
    } else if (
      this.step === 2 &&
      this.timer.time.elapsed >= 3 * this.countDownDelay + this.startDelay
    ) {
      if (this.hud) {
        this.hud.display('1');
      }
      this.step = 3;
    } else if (
      this.step === 3 &&
      this.timer.time.elapsed >= 4 * this.countDownDelay + this.startDelay
    ) {
      if (this.hud) {
        this.hud.display('Go', 0.5);
      }
      this.step = 4;
      this.timer.start(); // Restart timer for actual race time

      if (this.mode !== 'replay') {
        this.shipControls.active = true;
      }
    }
    // Active racing
    else if (this.step === 4) {
      this.modes[this.mode]();
    }
    // End screen display
    else if (this.step === 100 && this.timer.time.elapsed >= 2000) {
      this.active = false;
      this.onFinish.call(this);
    }
  }

  /**
   * Check which checkpoint the ship is at
   * Uses color-coded collision map
   */
  private checkPoint(): number {
    if (!this.shipControls.dummy) {
      return -1;
    }

    const x = Math.round(
      this.analyser.pixels!.width / 2 + this.shipControls.dummy.position.x * this.pixelRatio
    );
    const z = Math.round(
      this.analyser.pixels!.height / 2 + this.shipControls.dummy.position.z * this.pixelRatio
    );

    const color = this.analyser.getPixel(x, z);

    // Checkpoints are encoded as yellow pixels (R=255, G=255, B=checkpoint_number)
    if (color.r === 255 && color.g === 255 && color.b < 250) {
      return color.b;
    }

    return -1;
  }
}
