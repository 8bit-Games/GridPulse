/**
 * GridPulse - Main Entry Point
 *
 * Integrates all modernized systems into a complete racing game.
 * Based on the original HexGL by Thibaut 'BKcore' Despoulain.
 */

import * as THREE from 'three';
import { RenderManager } from './rendering/RenderManager';
import { Loader } from './utils/Loader';
import { AudioManager } from './audio/AudioManager';
import { Ladder } from './core/Ladder';
import { Gameplay } from './core/Gameplay';
import { ShipControls } from './physics/ShipControls';
import { HUD } from './rendering/HUD';
import { CameraChase, CameraMode } from './rendering/CameraChase';
import { Cityscape } from './tracks/Cityscape';
import { ShipEffects } from './rendering/ShipEffects';
import { Particles } from './rendering/Particles';
import { UIManager, UIState } from './ui/UIManager';
import { TouchController } from './input/TouchController';
import { GamepadController } from './input/GamepadController';
import { OrientationController } from './input/OrientationController';
import { Timer } from './utils/Timer';
import { isTouchDevice, URLParameters } from './utils/Utils';
import type { ControlType, QualityLevel } from './types';

// Console welcome message
console.log('%cGridPulse', 'font-size: 24px; font-weight: bold; color: #00D4FF;');
console.log('Modern TypeScript build. Based on HexGL by Thibaut Despoulain.');
console.log('Three.js version:', THREE.REVISION);

/**
 * Game configuration
 */
interface GameConfig {
  controlType: ControlType;
  quality: QualityLevel;
  hud: boolean;
  godmode: boolean;
  track: string;
  mode: string;
}

/**
 * Game context holding all active game systems
 */
interface GameContext {
  manager: RenderManager;
  gameplay: Gameplay;
  controls: ShipControls;
  hud: HUD;
  camera: CameraChase;
  effects: ShipEffects;
  particles: Particles;
  track: Cityscape;
  // Controller instances
  touchController?: TouchController;
  gamepadController?: GamepadController;
  orientationController?: OrientationController;
}

/**
 * Main application class
 */
class GridPulseApp {
  private config: GameConfig;
  private ui: UIManager;
  private context?: GameContext;
  private loader: Loader;
  private isPaused: boolean = false;
  private isRaceStarted: boolean = false;

  constructor() {
    // Parse URL parameters or use defaults
    const defaultControls: ControlType = isTouchDevice() ? 1 : 0;

    this.config = {
      controlType: Number(URLParameters.get('controlType') ?? defaultControls) as ControlType,
      quality: Number(URLParameters.get('quality') ?? 3) as QualityLevel,
      hud: Number(URLParameters.get('hud') ?? 1) === 1,
      godmode: Number(URLParameters.get('godmode') ?? 0) === 1,
      track: URLParameters.get('track') ?? 'cityscape',
      mode: URLParameters.get('mode') ?? 'timeattack',
    };

    console.log('Configuration:', this.config);

    // Initialize systems
    this.loader = new Loader();
    this.ui = new UIManager();

    // Check WebGL support
    if (!this.checkWebGLSupport()) {
      alert('WebGL is not supported in your browser. Please upgrade or use a different browser.');
      return;
    }

    // Setup UI callbacks
    this.setupUICallbacks();

    // Start at main menu
    this.ui.setState(UIState.MAIN_MENU);
  }

  /**
   * Check WebGL support
   */
  private checkWebGLSupport(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  }

  /**
   * Setup UI callback handlers
   */
  private setupUICallbacks(): void {
    // Start game
    this.ui.onStart = () => {
      this.startGame();
    };

    // Settings changes
    this.ui.onQualityChange = (quality) => {
      this.config.quality = quality;
      console.log('Quality changed to:', quality);
      // If in game, would need to rebuild scenes
    };

    this.ui.onControlsChange = (controlType) => {
      this.config.controlType = controlType;
      console.log('Controls changed to:', controlType);
      if (this.context) {
        this.setupControllers(this.context);
      }
    };

    this.ui.onAudioChange = (enabled) => {
      console.log('Audio changed to:', enabled);
      if (enabled) {
        AudioManager.resume();
      } else {
        AudioManager.pauseAll();
      }
    };

    // Pause menu
    this.ui.onResume = () => {
      this.resumeGame();
    };

    this.ui.onRestart = () => {
      this.restartGame();
    };

    this.ui.onQuit = () => {
      this.quitToMenu();
    };

    // Results screen
    this.ui.onPlayAgain = () => {
      this.restartGame();
    };

    this.ui.onMainMenu = () => {
      this.quitToMenu();
    };
  }

  /**
   * Start game initialization and loading
   */
  private async startGame(): Promise<void> {
    try {
      this.ui.setState(UIState.LOADING);
      this.ui.updateLoadingProgress(0, 'Initializing...');

      // Initialize RenderManager
      const container = document.getElementById('main');
      if (!container) {
        throw new Error('Main container not found');
      }

      const manager = new RenderManager(container, this.config.quality);
      this.ui.updateLoadingProgress(0.1, 'Render manager initialized');

      // Load audio files
      this.ui.updateLoadingProgress(0.2, 'Loading audio...');
      await this.loadAudio();

      // Load track assets
      this.ui.updateLoadingProgress(0.4, 'Loading track assets...');
      const track = new Cityscape();
      await this.loadTrackAssets(track);

      // Build scenes
      this.ui.updateLoadingProgress(0.7, 'Building scene...');
      const gameContext = await this.buildGameScene(manager, track);

      // Setup input controllers
      this.ui.updateLoadingProgress(0.9, 'Setting up controls...');
      this.setupControllers(gameContext);

      // Store context
      this.context = gameContext;

      // Loading complete
      this.ui.updateLoadingProgress(1.0, 'Ready!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start race countdown
      this.startRaceCountdown();

    } catch (error) {
      console.error('Failed to load game:', error);
      alert('Failed to load game. Check console for details.');
      this.ui.setState(UIState.MAIN_MENU);
    }
  }

  /**
   * Load audio assets
   */
  private async loadAudio(): Promise<void> {
    await AudioManager.addSound('bg', 'audio/bg.ogg', true, false);
    await AudioManager.addSound('boost', 'audio/boost.ogg', false, true);
    await AudioManager.addSound('crash', 'audio/crash.ogg', false, false);
    await AudioManager.addSound('wind', 'audio/wind.ogg', true, true);

    AudioManager.volume('bg', 0.3);
    AudioManager.volume('wind', 0.4);
  }

  /**
   * Load track assets using Loader
   */
  private async loadTrackAssets(track: Cityscape): Promise<void> {
    const manifest = track.getManifest(this.config.quality);

    return new Promise((resolve, reject) => {
      let loaded = 0;
      const total = manifest.textures.length + manifest.analysers.length + manifest.groups.length;

      const onProgress = () => {
        loaded++;
        const progress = 0.4 + (loaded / total) * 0.3; // 40% to 70%
        this.ui.updateLoadingProgress(progress, `Loading assets... ${loaded}/${total}`);

        if (loaded >= total) {
          resolve();
        }
      };

      // Load textures
      manifest.textures.forEach(tex => {
        this.loader.loadTexture(tex.id, tex.url, tex.type, onProgress);
      });

      // Load analysers (heightmaps, collision maps)
      manifest.analysers.forEach(analyser => {
        this.loader.loadImageData(analyser.id, analyser.url, onProgress);
      });

      // Load geometries
      manifest.groups.forEach(group => {
        this.loader.addGeometryFromOBJ(group.id, group.geometries, onProgress);
      });
    });
  }

  /**
   * Build the complete game scene
   */
  private async buildGameScene(manager: RenderManager, track: Cityscape): Promise<GameContext> {
    // Build track scenes (skybox + main scene)
    track.buildScenes(
      {
        manager,
        loader: this.loader,
        quality: this.config.quality,
      },
      this.config.quality
    );

    // Get the main scene that was registered
    const sceneData = manager.get('game');
    if (!sceneData) {
      throw new Error('Game scene not found after track build');
    }

    const { scene, camera } = sceneData;

    // Find ship in scene (added by track builder)
    const shipMesh = scene.getObjectByName('ship') as THREE.Mesh;
    if (!shipMesh) {
      throw new Error('Ship mesh not found in scene');
    }

    // Create gameplay manager
    const gameplay = new Gameplay();

    // Create ship controls
    const controls = new ShipControls(
      shipMesh,
      this.loader.get('track.collision.top') as THREE.Texture,
      this.loader.get('track.collision.bottom') as THREE.Texture,
      this.loader.get('track.height') as THREE.Texture,
      gameplay
    );

    if (this.config.godmode) {
      controls.enableGodmode();
    }

    // Create HUD
    const hud = new HUD({
      width: 300,
      height: 150,
      shield: true,
    });

    if (this.config.hud) {
      hud.display();
    }

    // Create camera
    const cameraChase = new CameraChase(camera as THREE.PerspectiveCamera, shipMesh, {
      dampingFactor: 0.8,
      cameraHeight: 260,
      cameraDistance: 1000,
      heightOffset: 200,
      speedOffsetMultiplier: 0.05,
    });

    // Create particles
    const particles = new Particles(1000, scene);

    // Create ship effects
    const effects = new ShipEffects(scene, shipMesh);

    // Update render loop to include all systems
    manager.add('game', scene, camera as THREE.PerspectiveCamera, (delta, renderer) => {
      if (this.isPaused || !this.isRaceStarted) return;

      const dt = delta / 16.6; // Normalize to 60fps baseline

      // Update game logic
      gameplay.update(dt);
      controls.update(dt);

      // Update visual systems
      effects.update(dt);
      particles.update(dt);
      cameraChase.update(dt, controls.getSpeedRatio());

      // Update HUD
      if (this.config.hud) {
        hud.updateShield(controls.getShield());
        hud.updateSpeed(controls.getSpeedRatio());
      }

      // Update audio listener position
      AudioManager.setListenerPos(shipMesh.position);

      // Render scene
      renderer.render(scene, camera);
    });

    return {
      manager,
      gameplay,
      controls,
      hud,
      camera: cameraChase,
      effects,
      particles,
      track,
    };
  }

  /**
   * Setup input controllers based on control type
   */
  private setupControllers(context: GameContext): void {
    const { controls } = context;

    // Clear existing controllers
    if (context.touchController) {
      context.touchController.destroy();
      context.touchController = undefined;
    }
    if (context.gamepadController) {
      context.gamepadController.destroy();
      context.gamepadController = undefined;
    }
    if (context.orientationController) {
      context.orientationController.destroy();
      context.orientationController = undefined;
    }

    switch (this.config.controlType) {
      case 0: // Keyboard
        // Keyboard is built into ShipControls
        console.log('Using keyboard controls');
        break;

      case 1: // Touch
        context.touchController = new TouchController();
        context.touchController.onMove = (vector) => {
          controls.key.left = vector.x < -0.3;
          controls.key.right = vector.x > 0.3;
          controls.key.forward = vector.y < -0.3;
        };
        console.log('Using touch controls');
        break;

      case 2: // Gamepad
        context.gamepadController = new GamepadController();
        context.gamepadController.onUpdate = (state) => {
          controls.key.left = state.lstickx < -0.3;
          controls.key.right = state.lstickx > 0.3;
          controls.key.forward = state.acceleration > 0.5 || state.rtrigger > 0.5;
        };
        console.log('Using gamepad controls');
        break;

      case 3: // Orientation (gyroscope)
        OrientationController.requestPermission().then(granted => {
          if (granted) {
            context.orientationController = new OrientationController();
            context.orientationController.onMove = (beta, gamma) => {
              controls.key.left = beta < -10;
              controls.key.right = beta > 10;
              controls.key.forward = gamma < -20;
            };
            console.log('Using orientation controls');
          } else {
            console.warn('Orientation permission denied, falling back to keyboard');
            this.config.controlType = 0;
          }
        });
        break;
    }
  }

  /**
   * Start race countdown
   */
  private startRaceCountdown(): void {
    if (!this.context) return;

    this.ui.setState(UIState.PLAYING);

    const { gameplay, hud } = this.context;

    // Show countdown messages
    hud.display();
    hud.showMessage('3');
    setTimeout(() => hud.showMessage('2'), 1000);
    setTimeout(() => hud.showMessage('1'), 2000);
    setTimeout(() => {
      hud.showMessage('GO!');

      // Start race
      this.isRaceStarted = true;
      gameplay.start();

      // Start audio
      AudioManager.resume();
      AudioManager.play('bg');
      AudioManager.play('wind');

      // Start render loop
      this.context?.manager.start();

      // Setup pause key (ESC)
      this.setupPauseKey();

      // Setup race end detection
      this.setupRaceEndDetection();

    }, 3000);
  }

  /**
   * Setup pause key listener
   */
  private setupPauseKey(): void {
    const pauseHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isRaceStarted && !this.isPaused) {
        this.pauseGame();
      }
    };

    document.addEventListener('keydown', pauseHandler);
  }

  /**
   * Setup race end detection
   */
  private setupRaceEndDetection(): void {
    if (!this.context) return;

    const { gameplay, controls } = this.context;

    const checkRaceEnd = () => {
      if (gameplay.getCurrentLap() > 3) {
        // Race finished
        this.endRace();
      } else if (controls.getShield() <= 0 && !this.config.godmode) {
        // Ship destroyed
        this.endRace(true);
      } else if (this.isRaceStarted && !this.isPaused) {
        requestAnimationFrame(checkRaceEnd);
      }
    };

    requestAnimationFrame(checkRaceEnd);
  }

  /**
   * Pause the game
   */
  private pauseGame(): void {
    if (!this.context) return;

    this.isPaused = true;
    this.context.manager.stop();
    AudioManager.pauseAll();

    this.ui.setState(UIState.PAUSED);
  }

  /**
   * Resume the game
   */
  private resumeGame(): void {
    if (!this.context) return;

    this.isPaused = false;
    this.context.manager.start();
    AudioManager.resume();
    AudioManager.play('bg');
    AudioManager.play('wind');

    this.ui.setState(UIState.PLAYING);
  }

  /**
   * Restart the race
   */
  private restartGame(): void {
    if (!this.context) return;

    // Reset gameplay
    this.context.gameplay.reset();
    this.context.controls.reset();

    // Reset state
    this.isPaused = false;
    this.isRaceStarted = false;

    // Restart countdown
    this.startRaceCountdown();
  }

  /**
   * End the race and show results
   */
  private endRace(crashed: boolean = false): void {
    if (!this.context) return;

    this.isRaceStarted = false;
    this.context.manager.stop();
    AudioManager.pauseAll();

    const { gameplay } = this.context;

    if (crashed) {
      this.ui.showResults('DNF', 'DNF', 0);
    } else {
      const raceTime = gameplay.getTimer().getElapsedTime();
      const bestLap = gameplay.getBestLap();

      const raceTimeStr = Timer.formatTime(raceTime);
      const bestLapStr = Timer.formatTime(bestLap || 0);

      // Add to leaderboard
      const position = Ladder.addScore(
        this.config.track,
        this.config.mode,
        'Player',
        raceTime
      );

      this.ui.showResults(raceTimeStr, bestLapStr, position);
    }
  }

  /**
   * Quit to main menu
   */
  private quitToMenu(): void {
    // Cleanup game context
    if (this.context) {
      this.context.manager.stop();
      this.context.manager.clear();

      if (this.context.touchController) {
        this.context.touchController.destroy();
      }
      if (this.context.gamepadController) {
        this.context.gamepadController.destroy();
      }
      if (this.context.orientationController) {
        this.context.orientationController.destroy();
      }

      this.context = undefined;
    }

    AudioManager.pauseAll();

    this.isPaused = false;
    this.isRaceStarted = false;

    this.ui.setState(UIState.MAIN_MENU);
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
  (window as any).AudioManager = AudioManager;
  (window as any).Ladder = Ladder;
}
