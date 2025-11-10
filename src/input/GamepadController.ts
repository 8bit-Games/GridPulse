/**
 * GamepadController - Gamepad API wrapper
 * Modernized from bkcore.controllers.GamepadController
 *
 * Supports standard gamepad layout:
 * - Left stick for steering
 * - Face button for acceleration
 * - Triggers for air brakes
 * - Select for restart
 *
 * @author Originally by Mahesh Kulkarni
 */

/**
 * Gamepad state passed to callback
 */
export interface GamepadState {
  lstickx: number;
  acceleration: number | boolean;
  ltrigger: number | boolean;
  rtrigger: number | boolean;
  select: boolean;
}

/**
 * Callback for gamepad updates
 */
export type GamepadCallback = (state: GamepadState) => void;

/**
 * Gamepad controller
 */
export class GamepadController implements GamepadState {
  public active: boolean = true;

  // Gamepad state
  public lstickx: number = 0;
  public acceleration: number | boolean = 0;
  public ltrigger: number | boolean = 0;
  public rtrigger: number | boolean = 0;
  public select: boolean = false;

  // Callback
  private buttonPressCallback: GamepadCallback;

  /**
   * Check if Gamepad API is supported
   */
  static isCompatible(): boolean {
    return 'getGamepads' in navigator;
  }

  /**
   * Create a new GamepadController
   * @param buttonPressCallback - Callback for gamepad state updates
   */
  constructor(buttonPressCallback: GamepadCallback) {
    this.buttonPressCallback = buttonPressCallback;
  }

  /**
   * Update gamepad state and call callback
   * Returns true if gamepad is connected and updated
   */
  updateAvailable(): boolean {
    if (!this.active) {
      return false;
    }

    // Get gamepads
    const gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads[0]) {
      return false;
    }

    const gp = gamepads[0];
    if (!gp.buttons || !gp.axes) {
      return false;
    }

    // Read axes
    this.lstickx = gp.axes[0] || 0;

    // Read buttons (standard gamepad mapping)
    const accelButton = gp.buttons[0]; // A button
    const ltButton = gp.buttons[6]; // Left trigger
    const rtButton = gp.buttons[7]; // Right trigger
    const selectButton = gp.buttons[8]; // Select/Back

    // Handle button values (can be GamepadButton object or number)
    this.acceleration = this.getButtonValue(accelButton);
    this.ltrigger = this.getButtonValue(ltButton);
    this.rtrigger = this.getButtonValue(rtButton);
    this.select = this.getButtonValue(selectButton) > 0;

    // Call callback with current state
    this.buttonPressCallback(this);

    return true;
  }

  /**
   * Extract button value (handles both object and number)
   */
  private getButtonValue(button: GamepadButton | number): number | boolean {
    if (typeof button === 'number') {
      return button;
    }
    if (typeof button === 'object' && button !== null) {
      return button.pressed !== undefined ? button.pressed : button.value;
    }
    return 0;
  }

  /**
   * Get all connected gamepads
   */
  static getGamepads(): Gamepad[] {
    const gamepads = navigator.getGamepads();
    const result: Gamepad[] = [];

    if (gamepads) {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          result.push(gamepads[i]!);
        }
      }
    }

    return result;
  }

  /**
   * Check if any gamepad is connected
   */
  static isConnected(): boolean {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return false;

    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) return true;
    }

    return false;
  }
}
