/**
 * TouchController - Virtual joystick for touch devices
 * Modernized from bkcore.controllers.TouchController
 *
 * Based on touch demo by Seb Lee-Delisle <http://seb.ly/>
 *
 * Features:
 * - Virtual stick on left side of screen
 * - Button detection on right side
 * - Multi-touch support
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

/**
 * Simple 2D vector for touch positions
 */
class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  subtract(vec: Vec2): this {
    this.x -= vec.x;
    this.y -= vec.y;
    return this;
  }

  copy(vec: Vec2): this {
    this.x = vec.x;
    this.y = vec.y;
    return this;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }
}

/**
 * Button callback signature
 */
export type ButtonCallback = (state: boolean, touch: Touch, event: TouchEvent) => void;

/**
 * Touch controller for virtual joystick
 */
export class TouchController {
  public active: boolean = true;
  public touches: TouchList | null = null;

  // Stick state
  private stickID: number = -1;
  public stickPos: Vec2 = new Vec2(0, 0);
  private stickStartPos: Vec2 = new Vec2(0, 0);
  public stickVector: Vec2 = new Vec2(0, 0);

  // Configuration
  private dom: HTMLElement;
  private stickMargin: number;
  private buttonCallback: ButtonCallback | null;

  // Bound event handlers
  private touchStartBound: (e: TouchEvent) => boolean;
  private touchMoveBound: (e: TouchEvent) => boolean;
  private touchEndBound: (e: TouchEvent) => boolean;

  /**
   * Check if touch is supported
   */
  static isCompatible(): boolean {
    return 'ontouchstart' in document.documentElement;
  }

  /**
   * Create a new TouchController
   * @param dom - DOM element to listen to touch events
   * @param stickMargin - Left margin in px for stick detection (default: 200)
   * @param buttonCallback - Callback for non-stick touches
   */
  constructor(
    dom: HTMLElement,
    stickMargin: number = 200,
    buttonCallback: ButtonCallback | null = null
  ) {
    this.dom = dom;
    this.stickMargin = stickMargin;
    this.buttonCallback = buttonCallback;

    // Bind event handlers
    this.touchStartBound = this.touchStart.bind(this);
    this.touchMoveBound = this.touchMove.bind(this);
    this.touchEndBound = this.touchEnd.bind(this);

    // Add event listeners
    this.dom.addEventListener('touchstart', this.touchStartBound as any, false);
    this.dom.addEventListener('touchmove', this.touchMoveBound as any, false);
    this.dom.addEventListener('touchend', this.touchEndBound as any, false);
  }

  /**
   * Handle touch start
   */
  private touchStart(event: TouchEvent): boolean {
    if (!this.active) return false;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Left side = virtual stick
      if (this.stickID < 0 && touch.clientX < this.stickMargin) {
        this.stickID = touch.identifier;
        this.stickStartPos.set(touch.clientX, touch.clientY);
        this.stickPos.copy(this.stickStartPos);
        this.stickVector.set(0, 0);
        continue;
      }
      // Right side = button
      else {
        if (this.buttonCallback) {
          this.buttonCallback(true, touch, event);
        }
      }
    }

    this.touches = event.touches;
    return false;
  }

  /**
   * Handle touch move
   */
  private touchMove(event: TouchEvent): boolean {
    event.preventDefault();

    if (!this.active) return false;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Update stick position
      if (this.stickID === touch.identifier && touch.clientX < this.stickMargin) {
        this.stickPos.set(touch.clientX, touch.clientY);
        this.stickVector.copy(this.stickPos).subtract(this.stickStartPos);
        break;
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

    this.touches = event.touches;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Release stick
      if (this.stickID === touch.identifier) {
        this.stickID = -1;
        this.stickVector.set(0, 0);
        break;
      }
      // Button release
      else {
        if (this.buttonCallback) {
          this.buttonCallback(false, touch, event);
        }
      }
    }

    return false;
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy(): void {
    this.dom.removeEventListener('touchstart', this.touchStartBound as any, false);
    this.dom.removeEventListener('touchmove', this.touchMoveBound as any, false);
    this.dom.removeEventListener('touchend', this.touchEndBound as any, false);
  }
}
