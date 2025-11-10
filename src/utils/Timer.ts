/**
 * High-precision timer for game loop and time tracking
 * Modernized from bkcore.Timer using performance.now()
 */

export interface TimeState {
  start: number;
  current: number;
  previous: number;
  elapsed: number;
  delta: number;
}

export class Timer {
  public time: TimeState;
  public active: boolean;

  constructor() {
    this.time = {
      start: 0,
      current: 0,
      previous: 0,
      elapsed: 0,
      delta: 0,
    };
    this.active = false;
  }

  /**
   * Start or restart the timer
   */
  start(): void {
    const now = performance.now();
    this.time.start = now;
    this.time.current = now;
    this.time.previous = now;
    this.time.elapsed = 0;
    this.time.delta = 0;
    this.active = true;
  }

  /**
   * Pause or unpause the timer
   */
  pause(doPause: boolean): void {
    this.active = !doPause;
  }

  /**
   * Update the timer (call in game loop)
   */
  update(): void {
    if (!this.active) {
      return;
    }

    const now = performance.now();
    this.time.current = now;
    this.time.elapsed = this.time.current - this.time.start;
    this.time.delta = now - this.time.previous;
    this.time.previous = now;
  }

  /**
   * Get elapsed time as formatted string (MM:SS.mmm)
   */
  getElapsedTime(): string {
    return Timer.formatTime(this.time.elapsed);
  }

  /**
   * Convert milliseconds to formatted time string
   */
  static formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    const mmm = milliseconds.toString().padStart(3, '0');

    return `${mm}:${ss}.${mmm}`;
  }

  /**
   * Get the current time in milliseconds
   */
  static now(): number {
    return performance.now();
  }
}
