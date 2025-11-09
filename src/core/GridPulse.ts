/**
 * GridPulse - Main Game Engine
 * Modernized from bkcore.gridpulse.GridPulse
 *
 * This is the core orchestrator that:
 * - Initializes the renderer and render manager
 * - Loads and manages the track
 * - Creates and manages gameplay
 * - Handles HUD and UI
 * - Manages post-processing effects
 *
 * NOTE: This is a modernized stub. Many components are not yet migrated:
 * - Gameplay, ShipControls, CameraChase → Need migration
 * - HUD → Need migration
 * - Track system → Need migration
 * - Audio system → Need migration
 * - Shader effects → Need migration
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';
import { RenderManager } from '../rendering/RenderManager';
import { Loader, LoaderCallbacks } from '../rendering/Loader';
import type { GridPulseOptions, QualityLevel } from '../types';

/**
 * Main GridPulse game engine class
 */
export class GridPulse {
  // Configuration
  private document: Document;
  public active: boolean;
  public displayHUD: boolean;
  public width: number;
  public height: number;
  public difficulty: number;
  public player: string;
  public mode: string;
  public controlType: number;
  public quality: QualityLevel;
  public godmode: boolean;

  // Rendering
  public renderer!: THREE.WebGLRenderer;
  public manager!: RenderManager;
  public canvas!: HTMLCanvasElement;

  // Containers
  private containers: {
    main: HTMLElement;
    overlay: HTMLElement;
  };

  // Game components (stubs - to be filled in as modules are migrated)
  private track: any = null; // TODO: Type when Track module is migrated
  private gameplay: any = null; // TODO: Type when Gameplay module is migrated
  private hud: any = null; // TODO: Type when HUD module is migrated

  // Materials and extras
  private materials: Record<string, THREE.Material> = {};
  private components: Record<string, any> = {};
  private extras: {
    vignetteColor: THREE.Color;
    bloom: any;
    fxaa: any;
  };

  // Composers for post-processing
  private composers: {
    game: any; // TODO: Type as EffectComposer when available
  };

  // Gameover element
  private gameover: HTMLElement | null;

  constructor(options: GridPulseOptions) {
    this.document = options.document;
    this.active = true;
    this.displayHUD = options.hud;
    this.width = options.width;
    this.height = options.height;
    this.difficulty = options.difficulty;
    this.player = 'Anonym'; // Default player name
    this.mode = 'timeattack'; // Default mode
    this.controlType = options.controlType;
    this.quality = options.quality;
    this.godmode = options.godmode || false;

    // Adjust resolution for low quality
    if (this.quality === 0) {
      this.width /= 2;
      this.height /= 2;
    }

    // Setup containers
    this.containers = {
      main: options.container,
      overlay: options.overlay || options.container,
    };

    this.gameover = options.gameover || null;

    // Initialize extras
    this.extras = {
      vignetteColor: new THREE.Color(0x458ab1),
      bloom: null,
      fxaa: null,
    };

    // Initialize composers
    this.composers = {
      game: null,
    };

    // TODO: Load track based on options.track
    // this.track = tracks[options.track];

    console.log('GridPulse initialized with options:', {
      quality: this.quality,
      controlType: this.controlType,
      displayHUD: this.displayHUD,
      width: this.width,
      height: this.height,
    });

    // Initialize renderer
    this.initRenderer();

    // Setup keyboard listener for ESC key (reset)
    this.document.addEventListener('keydown', this.onKeyPress.bind(this), false);
  }

  /**
   * Keyboard event handler
   */
  private onKeyPress(event: KeyboardEvent): void {
    if (event.keyCode === 27) {
      // ESC key
      this.reset();
    }
  }

  /**
   * Initialize the WebGL renderer
   */
  private initRenderer(): void {
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
    });

    // High quality settings (desktop + quality mid or high)
    if (this.quality > 2) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    }

    renderer.autoClear = false;
    renderer.setSize(this.width, this.height);
    renderer.domElement.style.position = 'relative';

    this.containers.main.appendChild(renderer.domElement);
    this.canvas = renderer.domElement;
    this.renderer = renderer;
    this.manager = new RenderManager(renderer);

    console.log('Renderer initialized:', {
      width: this.width,
      height: this.height,
      quality: this.quality,
      shadowMap: renderer.shadowMap.enabled,
    });
  }

  /**
   * Load game assets
   */
  async load(callbacks: LoaderCallbacks): Promise<void> {
    console.log('TODO: Load assets');
    console.log('This requires:');
    console.log('- Track module migration');
    console.log('- Asset manifest definition');
    console.log('- Geometry and texture paths');

    // Simulate loading for now
    if (callbacks.onLoad) {
      setTimeout(() => {
        callbacks.onLoad!();
      }, 1000);
    }

    // TODO: Implement actual asset loading
    // const loader = new Loader(callbacks);
    // await this.track.load(loader, this.quality);
  }

  /**
   * Initialize the game after assets are loaded
   */
  init(): void {
    console.log('Initializing game components...');

    this.initHUD();

    // TODO: Initialize track
    // this.track.buildMaterials(this.quality);
    // this.track.buildScenes(this, this.quality);

    this.initGameComposer();

    console.log('Game components initialized');
  }

  /**
   * Initialize the HUD (Heads-Up Display)
   */
  private initHUD(): void {
    if (!this.displayHUD) {
      console.log('HUD disabled');
      return;
    }

    console.log('TODO: Initialize HUD');
    console.log('Requires HUD module migration');

    // TODO: Implement HUD initialization
    // this.hud = new HUD({
    //   width: this.width,
    //   height: this.height,
    //   font: 'BebasNeueRegular',
    //   bg: this.track.lib.get('images', 'hud.bg'),
    //   speed: this.track.lib.get('images', 'hud.speed'),
    //   shield: this.track.lib.get('images', 'hud.shield'),
    // });
    // this.containers.overlay.appendChild(this.hud.canvas);
  }

  /**
   * Initialize post-processing composer
   */
  private initGameComposer(): void {
    console.log('TODO: Initialize post-processing');
    console.log('Requires:');
    console.log('- Three.js EffectComposer setup');
    console.log('- Shader migration');
    console.log('- Render passes configuration');

    // TODO: Implement post-processing
    // This requires migrating the shader system and setting up EffectComposer
  }

  /**
   * Initialize gameplay logic
   */
  private initGameplay(): void {
    console.log('TODO: Initialize gameplay');
    console.log('Requires Gameplay module migration');

    // TODO: Implement gameplay initialization
    // this.gameplay = new Gameplay({
    //   mode: this.mode,
    //   hud: this.hud,
    //   shipControls: this.components.shipControls,
    //   cameraControls: this.components.cameraChase,
    //   analyser: this.track.analyser,
    //   pixelRatio: this.track.pixelRatio,
    //   track: this.track,
    //   onFinish: (finishTime, lapTimes) => {
    //     this.displayScore(finishTime, lapTimes);
    //   },
    // });
  }

  /**
   * Start the game
   */
  start(): void {
    console.log('Starting game...');

    // Set current render setup to game
    // this.manager.setCurrent('game');

    // Start game loop
    const gameLoop = () => {
      if (this.active) {
        requestAnimationFrame(gameLoop);
      }
      this.update();
    };

    gameLoop();

    this.initGameplay();

    console.log('Game started');
  }

  /**
   * Main update loop
   */
  update(): void {
    if (!this.active) return;

    // Update gameplay if initialized
    if (this.gameplay) {
      this.gameplay.update();
    }

    // Render current scene
    this.manager.renderCurrent();
  }

  /**
   * Reset the game
   */
  reset(): void {
    console.log('Resetting game...');

    // TODO: Reset gameplay
    // if (this.gameplay) {
    //   this.gameplay.start();
    // }

    // TODO: Reset audio
    // Audio.stop('bg');
    // Audio.stop('wind');
    // Audio.play('bg');
    // Audio.play('wind');
  }

  /**
   * Restart the game
   */
  restart(): void {
    // Hide finish screen if it exists
    try {
      const finishElement = this.document.getElementById('finish');
      if (finishElement) {
        finishElement.style.display = 'none';
      }
    } catch (e) {
      // Ignore
    }

    this.reset();
  }

  /**
   * Display final score
   */
  private displayScore(finishTime: number, lapTimes: number[]): void {
    console.log('Game finished!');
    console.log('Finish time:', finishTime);
    console.log('Lap times:', lapTimes);

    this.active = false;

    // TODO: Implement score display
    // This requires:
    // - Timer formatting utility
    // - Ladder/leaderboard system
    // - Local storage integration
    // - UI elements setup

    if (this.gameover) {
      this.gameover.style.display = 'block';
      // TODO: Populate score data
    }
  }

  /**
   * Create a mesh with appropriate quality settings
   */
  createMesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    material: THREE.Material
  ): THREE.Mesh {
    // Note: computeTangents is deprecated in modern Three.js
    // Tangents should be pre-computed or use computeTangent() on geometry

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);

    // Enable shadows for high quality
    if (this.quality > 2) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    return mesh;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.active = false;

    // TODO: Cleanup
    // - Dispose geometries
    // - Dispose materials
    // - Dispose textures
    // - Remove event listeners
    // - Stop audio

    console.log('GridPulse destroyed');
  }
}
