/**
 * OrientationController - Device orientation for mobile tilt controls
 * Modernized from bkcore.controllers.OrientationController
 *
 * Uses DeviceOrientation API for gyroscope control
 * Automatically calibrates on first orientation event
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

/**
 * Touch callback signature
 */
export type OrientationTouchCallback = (
  state: boolean,
  touch: Touch,
  event: TouchEvent
) => void;

/**
 * Orientation controller using device gyroscope
 */
export class OrientationController {
  public active: boolean = true;
  public touches: TouchList | null = null;

  // Orientation values (calibrated)
  public alpha: number = 0.0;
  public beta: number = 0.0;
  public gamma: number = 0.0;

  // Calibration offsets
  private dalpha: number | null = null;
  private dbeta: number | null = null;
  private dgamma: number | null = null;

  // Configuration
  private dom: HTMLElement;
  private registerTouch: boolean;
  private touchCallback: OrientationTouchCallback | null;

  // Bound event handlers
  private orientationChangeBound: (e: DeviceOrientationEvent) => boolean;
  private touchStartBound: (e: TouchEvent) => boolean;
  private touchEndBound: (e: TouchEvent) => boolean;

  /**
   * Check if DeviceOrientation is supported
   */
  static isCompatible(): boolean {
    return 'DeviceOrientationEvent' in window;
  }

  /**
   * Request permission for iOS 13+
   */
  static async requestPermission(): Promise<boolean> {
    // iOS 13+ requires explicit permission
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.warn('DeviceOrientation permission denied:', error);
        return false;
      }
    }
    // Other browsers don't need permission
    return true;
  }

  /**
   * Create a new OrientationController
   * @param dom - DOM element for touch events
   * @param registerTouch - Enable touch detection (default: true)
   * @param touchCallback - Callback for touch events
   */
  constructor(
    dom: HTMLElement,
    registerTouch: boolean = true,
    touchCallback: OrientationTouchCallback | null = null
  ) {
    this.dom = dom;
    this.registerTouch = registerTouch;
    this.touchCallback = touchCallback;

    // Bind event handlers
    this.orientationChangeBound = this.orientationChange.bind(this);
    this.touchStartBound = this.touchStart.bind(this);
    this.touchEndBound = this.touchEnd.bind(this);

    // Add orientation listener
    window.addEventListener('deviceorientation', this.orientationChangeBound as any, false);

    // Add touch listeners if enabled
    if (this.registerTouch) {
      this.dom.addEventListener('touchstart', this.touchStartBound as any, false);
      this.dom.addEventListener('touchend', this.touchEndBound as any, false);
    }
  }

  /**
   * Handle orientation change event
   */
  private orientationChange(event: DeviceOrientationEvent): boolean {
    if (!this.active) return false;

    // Calibrate on first event
    if (this.dalpha === null && event.alpha !== null && event.beta !== null && event.gamma !== null) {
      console.log('Orientation calibrated:', event.beta);
      this.dalpha = event.alpha;
      this.dbeta = event.beta;
      this.dgamma = event.gamma;
    }

    // Update calibrated values
    if (event.alpha !== null && this.dalpha !== null) {
      this.alpha = event.alpha - this.dalpha;
    }
    if (event.beta !== null && this.dbeta !== null) {
      this.beta = event.beta - this.dbeta;
    }
    if (event.gamma !== null && this.dgamma !== null) {
      this.gamma = event.gamma - this.dgamma;
    }

    return false;
  }

  /**
   * Handle touch start
   */
  private touchStart(event: TouchEvent): boolean {
    if (!this.active) return false;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (this.touchCallback) {
        this.touchCallback(true, touch, event);
      }
    }

    this.touches = event.touches;
    return false;
  }

  /**
   * Handle touch end
   */
  private touchEnd(event: TouchEvent): boolean {
    if (!this.active) return false;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (this.touchCallback) {
        this.touchCallback(false, touch, event);
      }
    }

    this.touches = event.touches;
    return false;
  }

  /**
   * Reset calibration
   */
  resetCalibration(): void {
    this.dalpha = null;
    this.dbeta = null;
    this.dgamma = null;
    console.log('Orientation calibration reset');
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy(): void {
    window.removeEventListener('deviceorientation', this.orientationChangeBound as any, false);

    if (this.registerTouch) {
      this.dom.removeEventListener('touchstart', this.touchStartBound as any, false);
      this.dom.removeEventListener('touchend', this.touchEndBound as any, false);
    }
  }
}
