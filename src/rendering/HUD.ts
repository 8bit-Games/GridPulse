/**
 * HUD - Heads-Up Display for the racing game
 * Modernized from bkcore.gridpulse.HUD
 *
 * Displays:
 * - Speed bar and numeric value
 * - Shield bar and numeric value
 * - Lap counter (current/total)
 * - Race time
 * - Messages (countdown, finish, etc.)
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

/**
 * Time format from Timer
 */
export interface TimeFormat {
  m: string;
  s: string;
  ms: string;
}

/**
 * HUD configuration options
 */
export interface HUDOptions {
  width: number;
  height: number;
  font?: string;
  bg: HTMLImageElement;
  speed: HTMLImageElement;
  shield: HTMLImageElement;
}

/**
 * HUD class - renders game information on a 2D canvas overlay
 */
export class HUD {
  // Visibility
  public visible: boolean = true;
  public messageOnly: boolean = false;

  // Canvas
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  // Background images
  private bg: HTMLImageElement;
  private fgspeed: HTMLImageElement;
  private fgshield: HTMLImageElement;

  // Layout ratios (relative to screen width)
  private speedFontRatio: number = 24;
  private speedBarRatio: number = 2.91;
  private shieldFontRatio: number = 64;
  private shieldBarYRatio: number = 34;
  private shieldBarWRatio: number = 18.3;
  private shieldBarHRatio: number = 14.3;
  private timeMarginRatio: number = 18;
  private timeFontRatio: number = 19.2;

  // Font
  private font: string;

  // Time display
  private time: string = '';
  private timeSeparators: string[] = ['', "'", "''", ''];

  // Message system
  private message: string = '';
  private previousMessage: string = '';
  private messageTiming: number = 0;
  private messagePos: number = 0.0;
  private messagePosTarget: number = 0.0;
  private messagePosTargetRatio: number = 12;
  private messageA: number = 1.0;
  private messageAS: number = 1.0;
  private messageDuration: number = 2 * 60;
  private messageDurationD: number = 2 * 60;
  private messageDurationS: number = 30;
  private messageYRatio: number = 34;
  private messageFontRatio: number = 10;
  private messageFontRatioStart: number = 6;
  private messageFontRatioEnd: number = 10;
  private messageFontLerp: number = 0.4;
  private messageLerp: number = 0.4;
  private messageFontAlpha: number = 0.8;

  // Lap display
  private lapMarginRatio: number = 14;
  private lap: string = '';
  private lapSeparator: string = '/';

  // Rendering step (two-pass rendering)
  private step: number = 0;
  private maxStep: number = 2;

  constructor(options: HUDOptions) {
    this.width = options.width;
    this.height = options.height;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for HUD canvas');
    }
    this.ctx = ctx;
    this.ctx.textAlign = 'center';

    // Store images
    this.bg = options.bg;
    this.fgspeed = options.speed;
    this.fgshield = options.shield;

    // Set font
    this.font = options.font || 'Arial';
  }

  /**
   * Resize the HUD canvas
   */
  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  /**
   * Display a message (countdown, finish, etc.)
   */
  display(msg: string, duration?: number): void {
    this.messageTiming = 0;

    if (this.message !== '') {
      this.messageA = this.messageFontAlpha;
      this.messagePos = 0.0;
      this.messagePosTarget = this.width / this.messagePosTargetRatio;
      this.previousMessage = this.message;
    }

    this.messageFontRatio = this.messageFontRatioStart;
    this.messageAS = 0.0;
    this.message = msg;
    this.messageDuration = duration === undefined ? this.messageDurationD : duration * 60;
  }

  /**
   * Update lap counter display
   */
  updateLap(current: number, total: number): void {
    this.lap = current + this.lapSeparator + total;
  }

  /**
   * Reset lap display
   */
  resetLap(): void {
    this.lap = '';
  }

  /**
   * Update time display
   */
  updateTime(time: TimeFormat): void {
    this.time =
      this.timeSeparators[0] +
      time.m +
      this.timeSeparators[1] +
      time.s +
      this.timeSeparators[2] +
      time.ms +
      this.timeSeparators[3];
  }

  /**
   * Reset time display
   */
  resetTime(): void {
    this.time = '';
  }

  /**
   * Main update/render loop
   * @param speed - Current speed value to display
   * @param speedRatio - Speed ratio (0-1) for bar fill
   * @param shield - Current shield value to display
   * @param shieldRatio - Shield ratio (0-1) for bar fill
   */
  update(speed: number, speedRatio: number, shield: number, shieldRatio: number): void {
    const SCREEN_WIDTH = this.width;
    const SCREEN_HEIGHT = this.height;
    const SCREEN_HW = SCREEN_WIDTH / 2;
    const SCREEN_HH = SCREEN_HEIGHT / 2;

    if (!this.visible) {
      this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      return;
    }

    // Calculate background dimensions
    const w = this.bg.width;
    const h = this.bg.height;
    const r = h / w;
    const nw = SCREEN_WIDTH;
    const nh = nw * r;
    const oh = SCREEN_HEIGHT - nh;
    const o = 0;

    // Speed bar dimensions
    const ba = nh;
    const bl = SCREEN_WIDTH / this.speedBarRatio;
    const bw = bl * speedRatio;

    // Shield bar dimensions
    const sw = SCREEN_WIDTH / this.shieldBarWRatio;
    const sho = SCREEN_WIDTH / this.shieldBarHRatio;
    const sh = sho * shieldRatio;
    const sy = SCREEN_WIDTH / this.shieldBarYRatio + sho - sh;

    // Step 0: Render bottom HUD (speed, shield)
    if (this.step === 0) {
      this.ctx.clearRect(0, oh, SCREEN_WIDTH, nh);

      if (!this.messageOnly) {
        // Draw background
        this.ctx.drawImage(this.bg, o, oh, nw, nh);

        // Draw speed bar with clipping
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(bw + ba + SCREEN_HW, oh);
        this.ctx.lineTo(-(bw + ba) + SCREEN_HW, oh);
        this.ctx.lineTo(-bw + SCREEN_HW, SCREEN_HEIGHT);
        this.ctx.lineTo(bw + SCREEN_HW, SCREEN_HEIGHT);
        this.ctx.lineTo(bw + ba + SCREEN_HW, oh);
        this.ctx.clip();
        this.ctx.drawImage(this.fgspeed, o, oh, nw, nh);
        this.ctx.restore();

        // Draw shield bar with clipping
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(-sw + SCREEN_HW, oh + sy);
        this.ctx.lineTo(sw + SCREEN_HW, oh + sy);
        this.ctx.lineTo(sw + SCREEN_HW, oh + sh + sy);
        this.ctx.lineTo(-sw + SCREEN_HW, oh + sh + sy);
        this.ctx.lineTo(-sw + SCREEN_HW, oh + sh);
        this.ctx.clip();
        this.ctx.drawImage(this.fgshield, o, oh, nw, nh);
        this.ctx.restore();

        // Draw speed text
        this.ctx.font = SCREEN_WIDTH / this.speedFontRatio + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(speed.toString(), SCREEN_HW, SCREEN_HEIGHT - nh * 0.57);

        // Draw shield text
        this.ctx.font = SCREEN_WIDTH / this.shieldFontRatio + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillText(shield.toString(), SCREEN_HW, SCREEN_HEIGHT - nh * 0.44);
      }
    }
    // Step 1: Render top HUD (time, laps, messages)
    else if (this.step === 1) {
      this.ctx.clearRect(0, 0, SCREEN_WIDTH, oh);

      // Draw time
      if (this.time !== '') {
        this.ctx.font = SCREEN_WIDTH / this.timeFontRatio + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(this.time, SCREEN_HW, SCREEN_WIDTH / this.timeMarginRatio);
      }

      // Draw laps
      if (this.lap !== '') {
        this.ctx.font = SCREEN_WIDTH / this.timeFontRatio + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(
          this.lap,
          SCREEN_WIDTH - SCREEN_WIDTH / this.lapMarginRatio,
          SCREEN_WIDTH / this.timeMarginRatio
        );
      }

      // Message rendering
      const my = SCREEN_HH - SCREEN_WIDTH / this.messageYRatio;

      // Handle message timing and transitions
      if (this.messageTiming > this.messageDuration + 2000) {
        this.previousMessage = '';
        this.message = '';
        this.messageA = 0.0;
      } else if (this.messageTiming > this.messageDuration && this.message !== '') {
        this.previousMessage = this.message;
        this.message = '';
        this.messagePos = 0.0;
        this.messagePosTarget = SCREEN_WIDTH / this.messagePosTargetRatio;
        this.messageA = this.messageFontAlpha;
      }

      // Draw previous message (fading out)
      if (this.previousMessage !== '') {
        if (this.messageA < 0.001) {
          this.messageA = 0.0;
        } else {
          this.messageA += (0.0 - this.messageA) * this.messageLerp;
        }

        this.messagePos += (this.messagePosTarget - this.messagePos) * this.messageLerp;

        this.ctx.font = SCREEN_WIDTH / this.messageFontRatioEnd + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, ' + this.messageA + ')';
        this.ctx.fillText(this.previousMessage, SCREEN_HW, my + this.messagePos);
      }

      // Draw current message
      if (this.message !== '') {
        if (this.messageTiming < this.messageDurationS) {
          this.messageAS += (this.messageFontAlpha - this.messageAS) * this.messageFontLerp;
          this.messageFontRatio +=
            (this.messageFontRatioEnd - this.messageFontRatio) * this.messageFontLerp;
        } else {
          this.messageAS = this.messageFontAlpha;
          this.messageFontRatio = this.messageFontRatioEnd;
        }

        this.ctx.font = SCREEN_WIDTH / this.messageFontRatio + 'px ' + this.font;
        this.ctx.fillStyle = 'rgba(255, 255, 255, ' + this.messageAS + ')';
        this.ctx.fillText(this.message, SCREEN_HW, my);
      }
    }

    this.messageTiming++;

    // Cycle rendering steps
    this.step++;
    if (this.step === this.maxStep) {
      this.step = 0;
    }
  }
}
