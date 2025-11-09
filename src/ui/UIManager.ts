/**
 * UIManager - Manages game UI states and menus
 *
 * Handles:
 * - Main menu
 * - Settings menu
 * - Pause menu
 * - Results screen
 * - Loading screen
 *
 * @author GridPulse modernization
 */

import type { QualityLevel, ControlType } from '../types';

/**
 * UI states
 */
export enum UIState {
  LOADING = 'loading',
  MAIN_MENU = 'main-menu',
  SETTINGS = 'settings',
  TRACK_SELECT = 'track-select',
  PLAYING = 'playing',
  PAUSED = 'paused',
  RESULTS = 'results',
}

/**
 * Game settings
 */
export interface GameSettings {
  quality: QualityLevel;
  controlType: ControlType;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

/**
 * UI Manager for game menus and states
 */
export class UIManager {
  private currentState: UIState = UIState.LOADING;
  private container: HTMLElement;
  private settings: GameSettings;

  // UI elements
  private mainMenu?: HTMLElement;
  private settingsMenu?: HTMLElement;
  private pauseMenu?: HTMLElement;
  private resultsScreen?: HTMLElement;
  private loadingScreen?: HTMLElement;

  // Callbacks
  private onStartGame?: () => void;
  private onRestartGame?: () => void;
  private onSettingsChanged?: (settings: GameSettings) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Default settings
    this.settings = {
      quality: 2,
      controlType: 0,
      soundEnabled: true,
      musicEnabled: true,
    };

    // Load settings from localStorage
    this.loadSettings();

    this.init();
  }

  /**
   * Initialize UI elements
   */
  private init(): void {
    this.createLoadingScreen();
    this.createMainMenu();
    this.createSettingsMenu();
    this.createPauseMenu();
    this.createResultsScreen();
  }

  /**
   * Create loading screen
   */
  private createLoadingScreen(): void {
    this.loadingScreen = document.createElement('div');
    this.loadingScreen.id = 'loading-screen';
    this.loadingScreen.className = 'ui-screen';
    this.loadingScreen.innerHTML = `
      <div class="loading-content">
        <h1>GridPulse</h1>
        <div class="loading-bar">
          <div class="loading-progress" id="loading-progress"></div>
        </div>
        <p class="loading-text">Loading...</p>
      </div>
    `;
    this.container.appendChild(this.loadingScreen);
  }

  /**
   * Create main menu
   */
  private createMainMenu(): void {
    this.mainMenu = document.createElement('div');
    this.mainMenu.id = 'main-menu';
    this.mainMenu.className = 'ui-screen hidden';
    this.mainMenu.innerHTML = `
      <div class="menu-content">
        <h1 class="game-title">GridPulse</h1>
        <div class="menu-buttons">
          <button id="btn-start" class="menu-button primary">Start Race</button>
          <button id="btn-settings" class="menu-button">Settings</button>
          <button id="btn-controls" class="menu-button">Controls</button>
        </div>
        <div class="menu-info">
          <p>Use Arrow Keys to steer, Q/E for air brakes</p>
          <p class="version">Modern TypeScript Edition</p>
        </div>
      </div>
    `;
    this.container.appendChild(this.mainMenu);

    // Add event listeners
    this.mainMenu.querySelector('#btn-start')?.addEventListener('click', () => {
      this.setState(UIState.PLAYING);
      if (this.onStartGame) this.onStartGame();
    });

    this.mainMenu.querySelector('#btn-settings')?.addEventListener('click', () => {
      this.setState(UIState.SETTINGS);
    });

    this.mainMenu.querySelector('#btn-controls')?.addEventListener('click', () => {
      this.showControls();
    });
  }

  /**
   * Create settings menu
   */
  private createSettingsMenu(): void {
    this.settingsMenu = document.createElement('div');
    this.settingsMenu.id = 'settings-menu';
    this.settingsMenu.className = 'ui-screen hidden';
    this.settingsMenu.innerHTML = `
      <div class="menu-content">
        <h2>Settings</h2>
        <div class="settings-group">
          <label>Quality</label>
          <select id="setting-quality">
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High</option>
            <option value="3">Ultra</option>
          </select>
        </div>
        <div class="settings-group">
          <label>Controls</label>
          <select id="setting-controls">
            <option value="0">Keyboard</option>
            <option value="1">Touch</option>
            <option value="3">Gamepad</option>
            <option value="4">Orientation</option>
          </select>
        </div>
        <div class="settings-group">
          <label>
            <input type="checkbox" id="setting-sound" checked> Sound Effects
          </label>
        </div>
        <div class="settings-group">
          <label>
            <input type="checkbox" id="setting-music" checked> Music
          </label>
        </div>
        <div class="menu-buttons">
          <button id="btn-settings-save" class="menu-button primary">Save</button>
          <button id="btn-settings-back" class="menu-button">Back</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.settingsMenu);

    // Set current values
    (this.settingsMenu.querySelector('#setting-quality') as HTMLSelectElement).value =
      this.settings.quality.toString();
    (this.settingsMenu.querySelector('#setting-controls') as HTMLSelectElement).value =
      this.settings.controlType.toString();
    (this.settingsMenu.querySelector('#setting-sound') as HTMLInputElement).checked =
      this.settings.soundEnabled;
    (this.settingsMenu.querySelector('#setting-music') as HTMLInputElement).checked =
      this.settings.musicEnabled;

    // Add event listeners
    this.settingsMenu.querySelector('#btn-settings-save')?.addEventListener('click', () => {
      this.saveSettings();
      this.setState(UIState.MAIN_MENU);
    });

    this.settingsMenu.querySelector('#btn-settings-back')?.addEventListener('click', () => {
      this.setState(UIState.MAIN_MENU);
    });
  }

  /**
   * Create pause menu
   */
  private createPauseMenu(): void {
    this.pauseMenu = document.createElement('div');
    this.pauseMenu.id = 'pause-menu';
    this.pauseMenu.className = 'ui-screen hidden';
    this.pauseMenu.innerHTML = `
      <div class="menu-content">
        <h2>Paused</h2>
        <div class="menu-buttons">
          <button id="btn-resume" class="menu-button primary">Resume</button>
          <button id="btn-restart" class="menu-button">Restart</button>
          <button id="btn-quit" class="menu-button">Main Menu</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.pauseMenu);

    // Add event listeners
    this.pauseMenu.querySelector('#btn-resume')?.addEventListener('click', () => {
      this.setState(UIState.PLAYING);
    });

    this.pauseMenu.querySelector('#btn-restart')?.addEventListener('click', () => {
      this.setState(UIState.PLAYING);
      if (this.onRestartGame) this.onRestartGame();
    });

    this.pauseMenu.querySelector('#btn-quit')?.addEventListener('click', () => {
      this.setState(UIState.MAIN_MENU);
    });
  }

  /**
   * Create results screen
   */
  private createResultsScreen(): void {
    this.resultsScreen = document.createElement('div');
    this.resultsScreen.id = 'results-screen';
    this.resultsScreen.className = 'ui-screen hidden';
    this.resultsScreen.innerHTML = `
      <div class="menu-content">
        <h2 id="results-title">Race Complete!</h2>
        <div class="results-stats">
          <div class="result-item">
            <span class="result-label">Time:</span>
            <span class="result-value" id="result-time">--</span>
          </div>
          <div class="result-item">
            <span class="result-label">Best Lap:</span>
            <span class="result-value" id="result-best-lap">--</span>
          </div>
          <div class="result-item">
            <span class="result-label">Position:</span>
            <span class="result-value" id="result-position">--</span>
          </div>
        </div>
        <div class="menu-buttons">
          <button id="btn-results-retry" class="menu-button primary">Retry</button>
          <button id="btn-results-menu" class="menu-button">Main Menu</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.resultsScreen);

    // Add event listeners
    this.resultsScreen.querySelector('#btn-results-retry')?.addEventListener('click', () => {
      this.setState(UIState.PLAYING);
      if (this.onRestartGame) this.onRestartGame();
    });

    this.resultsScreen.querySelector('#btn-results-menu')?.addEventListener('click', () => {
      this.setState(UIState.MAIN_MENU);
    });
  }

  /**
   * Set current UI state
   */
  setState(state: UIState): void {
    this.currentState = state;

    // Hide all screens
    this.loadingScreen?.classList.add('hidden');
    this.mainMenu?.classList.add('hidden');
    this.settingsMenu?.classList.add('hidden');
    this.pauseMenu?.classList.add('hidden');
    this.resultsScreen?.classList.add('hidden');

    // Show appropriate screen
    switch (state) {
      case UIState.LOADING:
        this.loadingScreen?.classList.remove('hidden');
        break;
      case UIState.MAIN_MENU:
        this.mainMenu?.classList.remove('hidden');
        break;
      case UIState.SETTINGS:
        this.settingsMenu?.classList.remove('hidden');
        break;
      case UIState.PAUSED:
        this.pauseMenu?.classList.remove('hidden');
        break;
      case UIState.RESULTS:
        this.resultsScreen?.classList.remove('hidden');
        break;
      case UIState.PLAYING:
        // All menus hidden
        break;
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(progress: number, text?: string): void {
    const progressBar = document.getElementById('loading-progress');
    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (text) {
      const loadingText = this.loadingScreen?.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = text;
      }
    }
  }

  /**
   * Show results
   */
  showResults(time: string, bestLap: string, position: number): void {
    const timeEl = document.getElementById('result-time');
    const lapEl = document.getElementById('result-best-lap');
    const posEl = document.getElementById('result-position');

    if (timeEl) timeEl.textContent = time;
    if (lapEl) lapEl.textContent = bestLap;
    if (posEl) posEl.textContent = position > 0 ? `#${position}` : 'N/A';

    this.setState(UIState.RESULTS);
  }

  /**
   * Show controls help
   */
  private showControls(): void {
    alert(
      'Controls:\n\n' +
        'Arrow Keys: Steer\n' +
        'Q/A: Left air brake\n' +
        'E/D: Right air brake\n' +
        'ESC: Pause\n\n' +
        'Mobile:\n' +
        'Left side: Virtual joystick\n' +
        'Right side: Accelerate'
    );
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    const qualityEl = this.settingsMenu?.querySelector('#setting-quality') as HTMLSelectElement;
    const controlsEl = this.settingsMenu?.querySelector('#setting-controls') as HTMLSelectElement;
    const soundEl = this.settingsMenu?.querySelector('#setting-sound') as HTMLInputElement;
    const musicEl = this.settingsMenu?.querySelector('#setting-music') as HTMLInputElement;

    this.settings = {
      quality: parseInt(qualityEl.value) as QualityLevel,
      controlType: parseInt(controlsEl.value) as ControlType,
      soundEnabled: soundEl.checked,
      musicEnabled: musicEl.checked,
    };

    localStorage.setItem('gridpulse_settings', JSON.stringify(this.settings));

    if (this.onSettingsChanged) {
      this.onSettingsChanged(this.settings);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const stored = localStorage.getItem('gridpulse_settings');
    if (stored) {
      try {
        this.settings = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): GameSettings {
    return { ...this.settings };
  }

  /**
   * Set callback for start game
   */
  onStart(callback: () => void): void {
    this.onStartGame = callback;
  }

  /**
   * Set callback for restart game
   */
  onRestart(callback: () => void): void {
    this.onRestartGame = callback;
  }

  /**
   * Set callback for settings changed
   */
  onSettingsChange(callback: (settings: GameSettings) => void): void {
    this.onSettingsChanged = callback;
  }

  /**
   * Get current state
   */
  getState(): UIState {
    return this.currentState;
  }
}
