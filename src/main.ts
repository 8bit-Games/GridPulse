/**
 * GridPulse - Modern Entry Point
 *
 * This is the main entry point for the modernized GridPulse application.
 * It demonstrates the pattern for the new ES6 module-based architecture.
 *
 * NOTE: This is a foundation/template. The complete migration from the legacy
 * bkcore/gridpulse/ files is still in progress. See MIGRATION_GUIDE.md for details.
 */

import * as THREE from 'three';
import { Timer } from './utils/Timer';
import { isTouchDevice, URLParameters } from './utils/Utils';
import type { ControlType, QualityLevel } from './types';

// Console welcome message
console.log('%cGridPulse', 'font-size: 24px; font-weight: bold; color: #00D4FF;');
console.log('Modern build initialized. Based on HexGL by Thibaut Despoulain.');
console.log('Three.js version:', THREE.REVISION);

/**
 * Game initialization configuration
 */
interface GameConfig {
  controlType: ControlType;
  quality: QualityLevel;
  hud: boolean;
  godmode: boolean;
}

/**
 * Parse configuration from URL parameters or use defaults
 */
function getGameConfig(): GameConfig {
  const defaultControls: ControlType = isTouchDevice() ? 1 : 0; // Touch or Keyboard

  return {
    controlType: Number(URLParameters.get('controlType') ?? defaultControls) as ControlType,
    quality: Number(URLParameters.get('quality') ?? 3) as QualityLevel, // Default: VERY HIGH
    hud: Number(URLParameters.get('hud') ?? 1) === 1,
    godmode: Number(URLParameters.get('godmode') ?? 0) === 1,
  };
}

/**
 * Main application class
 */
class GridPulseApp {
  private config: GameConfig;
  private timer: Timer;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private animationId?: number;

  constructor() {
    this.config = getGameConfig();
    this.timer = new Timer();

    console.log('Configuration:', this.config);

    this.init();
  }

  /**
   * Initialize the application
   */
  private init(): void {
    // Check WebGL support
    if (!this.checkWebGLSupport()) {
      this.showWebGLError();
      return;
    }

    // Setup UI event listeners
    this.setupUI();

    console.log('GridPulse initialized. Click START to begin.');
  }

  /**
   * Check if WebGL is supported
   */
  private checkWebGLSupport(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  }

  /**
   * Show WebGL error message
   */
  private showWebGLError(): void {
    const startButton = document.getElementById('start');
    if (startButton) {
      startButton.innerHTML = 'WebGL is not supported!';
      startButton.onclick = () => {
        window.location.href = 'http://get.webgl.org/';
      };
    }
  }

  /**
   * Setup UI event listeners
   */
  private setupUI(): void {
    // Start button
    const startButton = document.getElementById('start');
    if (startButton) {
      startButton.onclick = () => this.onStartClicked();
    }

    // Credits toggle
    const creditsButton = document.getElementById('s-credits');
    const creditsDiv = document.getElementById('credits');
    const step1 = document.getElementById('step-1');

    if (creditsButton && creditsDiv && step1) {
      creditsButton.onclick = () => {
        step1.style.display = 'none';
        creditsDiv.style.display = 'block';
      };

      creditsDiv.onclick = () => {
        step1.style.display = 'block';
        creditsDiv.style.display = 'none';
      };
    }

    // Settings cycling (control type, quality, HUD, godmode)
    this.setupSettingsUI();
  }

  /**
   * Setup settings UI (quality, controls, etc.)
   */
  private setupSettingsUI(): void {
    const settings = [
      {
        key: 'controlType',
        element: 's-controlType',
        options: ['KEYBOARD', 'TOUCH', 'LEAP MOTION CONTROLLER', 'GAMEPAD'],
        prefix: 'Controls: ',
      },
      {
        key: 'quality',
        element: 's-quality',
        options: ['LOW', 'MID', 'HIGH', 'VERY HIGH'],
        prefix: 'Quality: ',
      },
      {
        key: 'hud',
        element: 's-hud',
        options: ['OFF', 'ON'],
        prefix: 'HUD: ',
      },
      {
        key: 'godmode',
        element: 's-godmode',
        options: ['OFF', 'ON'],
        prefix: 'Godmode: ',
      },
    ];

    settings.forEach((setting) => {
      const element = document.getElementById(setting.element);
      if (!element) return;

      const currentValue = this.config[setting.key as keyof GameConfig] as number;
      element.innerHTML = setting.prefix + setting.options[currentValue];

      element.onclick = () => {
        const newValue = (currentValue + 1) % setting.options.length;
        (this.config[setting.key as keyof GameConfig] as any) = newValue;
        element.innerHTML = setting.prefix + setting.options[newValue];
      };
    });
  }

  /**
   * Handle start button click
   */
  private onStartClicked(): void {
    console.log('Starting game with config:', this.config);

    // Hide step 1, show step 2
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    if (step1 && step2) {
      step1.style.display = 'none';
      step2.style.display = 'block';

      // Set control help image
      step2.style.backgroundImage = `url(css/help-${this.config.controlType}.png)`;

      // Click to continue to loading screen
      step2.onclick = () => this.startLoading();
    }
  }

  /**
   * Start loading game assets
   */
  private async startLoading(): Promise<void> {
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    if (step2 && step3) {
      step2.style.display = 'none';
      step3.style.display = 'block';
    }

    // TODO: Implement actual asset loading
    // For now, just show a placeholder message
    console.log('Asset loading not yet implemented in modern build.');
    console.log('This requires migration of:');
    console.log('- bkcore/threejs/Loader.ts');
    console.log('- bkcore/gridpulse/GridPulse.ts');
    console.log('- All geometry and texture assets');

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.startGame();
  }

  /**
   * Start the game
   */
  private startGame(): void {
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');

    if (step3 && step4) {
      step3.style.display = 'none';
      step4.style.display = 'block';
    }

    // Initialize Three.js scene
    this.initThreeJS();

    // Start game loop
    this.timer.start();
    this.gameLoop();
  }

  /**
   * Initialize Three.js renderer and scene
   */
  private initThreeJS(): void {
    const container = document.getElementById('main');
    if (!container) {
      console.error('Main container not found');
      return;
    }

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: this.config.quality >= 2 });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 3000);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.camera.position.set(0, 10, 20);

    // Add a simple cube for demonstration
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    console.log('Three.js scene initialized');
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    this.animationId = requestAnimationFrame(this.gameLoop);

    this.timer.update();
    this.update(this.timer.time.delta);
    this.render();
  };

  /**
   * Update game state
   */
  private update(delta: number): void {
    // TODO: Update game logic
    // This will be implemented when core game files are migrated
  }

  /**
   * Render the scene
   */
  private render(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Cleanup and stop the game
   */
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new GridPulseApp());
} else {
  new GridPulseApp();
}

// Export for debugging
if (import.meta.env.DEV) {
  (window as any).GridPulseApp = GridPulseApp;
}
