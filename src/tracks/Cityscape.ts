/**
 * Cityscape Track - The main racing track
 * Modernized from bkcore.gridpulse.tracks.Cityscape
 *
 * Defines:
 * - Track configuration (spawn, checkpoints)
 * - Asset loading manifest (quality-based)
 * - Material creation
 * - Scene building
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import * as THREE from 'three';
import type { Loader, AssetData } from '../rendering/Loader';
import type { ImageData } from '../utils/ImageData';
import type { QualityLevel } from '../types';

/**
 * Track checkpoint configuration
 */
export interface TrackCheckpoints {
  list: number[];
  start: number;
  last: number;
}

/**
 * Track spawn position
 */
export interface TrackSpawn {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
}

/**
 * Cityscape track definition
 */
export class CityscapeTrack {
  // Track metadata
  public readonly name: string = 'Cityscape';

  // Asset loader
  private loader: Loader | null = null;

  // Materials
  public materials: Record<string, THREE.Material> = {};

  // Track configuration
  public readonly checkpoints: TrackCheckpoints = {
    list: [0, 1, 2],
    start: 0,
    last: 2,
  };

  public readonly spawn: TrackSpawn = {
    position: new THREE.Vector3(-1134 * 2, 387, -443 * 2),
    rotation: new THREE.Vector3(0, 0, 0),
  };

  // Collision/height map
  public analyser: ImageData | null = null;
  public readonly pixelRatio: number = 2048.0 / 6000.0;

  /**
   * Load track assets based on quality level
   */
  async load(loader: Loader, quality: QualityLevel): Promise<void> {
    this.loader = loader;

    const assets: AssetData = quality < 2 ? this.getLowQualityAssets() : this.getHighQualityAssets();

    await loader.load(assets);
  }

  /**
   * Get low quality asset manifest
   */
  private getLowQualityAssets(): AssetData {
    return {
      textures: {
        hex: 'textures/hud/hex.jpg',
        spark: 'textures/particles/spark.png',
        cloud: 'textures/particles/cloud.png',
        'ship.feisar.diffuse': 'textures/ships/feisar/diffuse.jpg',
        'booster.diffuse': 'textures/ships/feisar/booster/booster.png',
        'booster.sprite': 'textures/ships/feisar/booster/boostersprite.jpg',
        'track.cityscape.diffuse': 'textures/tracks/cityscape/diffuse.jpg',
        'track.cityscape.scrapers1.diffuse': 'textures/tracks/cityscape/scrapers1/diffuse.jpg',
        'track.cityscape.scrapers2.diffuse': 'textures/tracks/cityscape/scrapers2/diffuse.jpg',
        'track.cityscape.start.diffuse': 'textures/tracks/cityscape/start/diffuse.jpg',
        'track.cityscape.start.banner': 'textures/tracks/cityscape/start/start.jpg',
        'bonus.base.diffuse': 'textures/bonus/base/diffuse.jpg',
      },
      texturesCube: {
        'skybox.dawnclouds': 'textures/skybox/dawnclouds/%1.jpg',
      },
      geometries: {
        'bonus.base': 'geometries/bonus/base/base.js',
        booster: 'geometries/booster/booster.js',
        'ship.feisar': 'geometries/ships/feisar/feisar.js',
        'track.cityscape': 'geometries/tracks/cityscape/track.js',
        'track.cityscape.scrapers1': 'geometries/tracks/cityscape/scrapers1.js',
        'track.cityscape.scrapers2': 'geometries/tracks/cityscape/scrapers2.js',
        'track.cityscape.start': 'geometries/tracks/cityscape/start.js',
        'track.cityscape.start.banner': 'geometries/tracks/cityscape/startbanner.js',
        'track.cityscape.bonus.speed': 'geometries/tracks/cityscape/bonus/speed.js',
      },
      analysers: {
        'track.cityscape.collision': 'textures/tracks/cityscape/collision.png',
        'track.cityscape.height': 'textures/tracks/cityscape/height.png',
      },
      images: {
        'hud.bg': 'textures/hud/hud-bg.png',
        'hud.speed': 'textures/hud/hud-fg-speed.png',
        'hud.shield': 'textures/hud/hud-fg-shield.png',
      },
      sounds: {
        bg: {
          src: 'audio/bg.ogg',
          loop: true,
          usePanner: false,
        },
        crash: {
          src: 'audio/crash.ogg',
          loop: false,
          usePanner: true,
        },
        destroyed: {
          src: 'audio/destroyed.ogg',
          loop: false,
          usePanner: false,
        },
        boost: {
          src: 'audio/boost.ogg',
          loop: false,
          usePanner: true,
        },
        wind: {
          src: 'audio/wind.ogg',
          loop: true,
          usePanner: true,
        },
      },
    };
  }

  /**
   * Get high quality asset manifest (with normal/specular maps)
   */
  private getHighQualityAssets(): AssetData {
    return {
      textures: {
        hex: 'textures.full/hud/hex.jpg',
        spark: 'textures.full/particles/spark.png',
        cloud: 'textures.full/particles/cloud.png',
        'ship.feisar.diffuse': 'textures.full/ships/feisar/diffuse.jpg',
        'ship.feisar.specular': 'textures.full/ships/feisar/specular.jpg',
        'ship.feisar.normal': 'textures.full/ships/feisar/normal.jpg',
        'booster.diffuse': 'textures.full/ships/feisar/booster/booster.png',
        'booster.sprite': 'textures.full/ships/feisar/booster/boostersprite.jpg',
        'track.cityscape.diffuse': 'textures.full/tracks/cityscape/diffuse.jpg',
        'track.cityscape.specular': 'textures.full/tracks/cityscape/specular.jpg',
        'track.cityscape.normal': 'textures.full/tracks/cityscape/normal.jpg',
        'track.cityscape.scrapers1.diffuse': 'textures.full/tracks/cityscape/scrapers1/diffuse.jpg',
        'track.cityscape.scrapers1.specular': 'textures.full/tracks/cityscape/scrapers1/specular.jpg',
        'track.cityscape.scrapers1.normal': 'textures.full/tracks/cityscape/scrapers1/normal.jpg',
        'track.cityscape.scrapers2.diffuse': 'textures.full/tracks/cityscape/scrapers2/diffuse.jpg',
        'track.cityscape.scrapers2.specular': 'textures.full/tracks/cityscape/scrapers2/specular.jpg',
        'track.cityscape.scrapers2.normal': 'textures.full/tracks/cityscape/scrapers2/normal.jpg',
        'track.cityscape.start.diffuse': 'textures.full/tracks/cityscape/start/diffuse.jpg',
        'track.cityscape.start.specular': 'textures.full/tracks/cityscape/start/specular.jpg',
        'track.cityscape.start.normal': 'textures.full/tracks/cityscape/start/normal.jpg',
        'track.cityscape.start.banner': 'textures.full/tracks/cityscape/start/start.jpg',
        'bonus.base.diffuse': 'textures.full/bonus/base/diffuse.jpg',
        'bonus.base.normal': 'textures.full/bonus/base/normal.jpg',
        'bonus.base.specular': 'textures.full/bonus/base/specular.jpg',
      },
      texturesCube: {
        'skybox.dawnclouds': 'textures.full/skybox/dawnclouds/%1.jpg',
      },
      geometries: {
        'bonus.base': 'geometries/bonus/base/base.js',
        booster: 'geometries/booster/booster.js',
        'ship.feisar': 'geometries/ships/feisar/feisar.js',
        'track.cityscape': 'geometries/tracks/cityscape/track.js',
        'track.cityscape.scrapers1': 'geometries/tracks/cityscape/scrapers1.js',
        'track.cityscape.scrapers2': 'geometries/tracks/cityscape/scrapers2.js',
        'track.cityscape.start': 'geometries/tracks/cityscape/start.js',
        'track.cityscape.start.banner': 'geometries/tracks/cityscape/startbanner.js',
        'track.cityscape.bonus.speed': 'geometries/tracks/cityscape/bonus/speed.js',
      },
      analysers: {
        'track.cityscape.collision': 'textures.full/tracks/cityscape/collision.png',
        'track.cityscape.height': 'textures.full/tracks/cityscape/height.png',
      },
      images: {
        'hud.bg': 'textures.full/hud/hud-bg.png',
        'hud.speed': 'textures.full/hud/hud-fg-speed.png',
        'hud.shield': 'textures.full/hud/hud-fg-shield.png',
      },
      sounds: {
        bg: {
          src: 'audio/bg.ogg',
          loop: true,
        },
        crash: {
          src: 'audio/crash.ogg',
          loop: false,
        },
        destroyed: {
          src: 'audio/destroyed.ogg',
          loop: false,
        },
        boost: {
          src: 'audio/boost.ogg',
          loop: false,
        },
        wind: {
          src: 'audio/wind.ogg',
          loop: true,
        },
      },
    };
  }

  /**
   * Build materials based on quality level
   */
  buildMaterials(quality: QualityLevel): void {
    if (!this.loader) {
      throw new Error('Loader not initialized. Call load() first.');
    }

    if (quality < 2) {
      // Low quality - basic materials
      this.materials.track = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'track.cityscape.diffuse'),
        // Note: 'ambient' property removed in modern Three.js, use scene ambient light instead
      });

      this.materials.bonusBase = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'bonus.base.diffuse'),
      });

      this.materials.bonusSpeed = new THREE.MeshBasicMaterial({
        color: 0x0096ff,
      });

      this.materials.ship = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'ship.feisar.diffuse'),
      });

      this.materials.booster = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'booster.diffuse'),
        transparent: true,
      });

      this.materials.scrapers1 = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'track.cityscape.scrapers1.diffuse'),
      });

      this.materials.scrapers2 = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'track.cityscape.scrapers2.diffuse'),
      });

      this.materials.start = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'track.cityscape.start.diffuse'),
      });

      this.materials.startBanner = new THREE.MeshBasicMaterial({
        map: this.loader.get('textures', 'track.cityscape.start.banner'),
        transparent: false,
      });
    } else {
      // High quality - use standard materials with normal/specular maps
      // TODO: createNormalMaterial utility needs to be migrated
      // For now, use MeshStandardMaterial as a modern equivalent

      this.materials.track = new THREE.MeshStandardMaterial({
        map: this.loader.get('textures', 'track.cityscape.diffuse'),
        normalMap: this.loader.get('textures', 'track.cityscape.normal'),
        roughnessMap: this.loader.get('textures', 'track.cityscape.specular'),
        metalness: 0.5,
      });

      this.materials.ship = new THREE.MeshStandardMaterial({
        map: this.loader.get('textures', 'ship.feisar.diffuse'),
        normalMap: this.loader.get('textures', 'ship.feisar.normal'),
        roughnessMap: this.loader.get('textures', 'ship.feisar.specular'),
        metalness: 0.7,
      });

      // Continue with other high-quality materials...
      // (Simplified for now - full implementation requires more work on materials)

      console.warn('High quality materials partially implemented - needs shader migration');
    }
  }

  /**
   * Build the track scenes
   * Creates skybox, main scene, ship, track meshes, and render loop
   */
  buildScenes(context: any, quality: QualityLevel): void {
    if (!this.loader) {
      throw new Error('Loader not initialized. Call load() first.');
    }

    // Set collision analyser
    this.analyser = this.loader.get('analysers', 'track.cityscape.collision');

    // Build skybox scene
    this.buildSkybox(context, quality);

    // Build main game scene
    this.buildMainScene(context, quality);
  }

  /**
   * Build skybox scene
   */
  private buildSkybox(context: any, quality: QualityLevel): void {
    const sceneCube = new THREE.Scene();
    const cameraCube = new THREE.PerspectiveCamera(
      70,
      context.width / context.height,
      1,
      6000
    );
    sceneCube.add(cameraCube);

    // Create skybox using modern approach
    const cubeTexture = this.loader!.get('texturesCube', 'skybox.dawnclouds');
    if (cubeTexture) {
      const skyboxGeometry = new THREE.BoxGeometry(100, 100, 100);
      const skyboxMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tCube: { value: cubeTexture },
          tFlip: { value: -1 },
        },
        vertexShader: `
          varying vec3 vViewPosition;
          void main() {
            vec4 mPosition = modelMatrix * vec4(position, 1.0);
            vViewPosition = cameraPosition - mPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform samplerCube tCube;
          uniform float tFlip;
          varying vec3 vViewPosition;
          void main() {
            vec3 wPos = cameraPosition - vViewPosition;
            gl_FragColor = textureCube(tCube, vec3(tFlip * wPos.x, wPos.yz));
          }
        `,
        depthWrite: false,
        side: THREE.BackSide,
      });

      const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
      sceneCube.add(skybox);
    }

    context.manager.add('sky', sceneCube, cameraCube);
  }

  /**
   * Build main game scene with ship, track, and lighting
   */
  private buildMainScene(context: any, quality: QualityLevel): void {
    const camera = new THREE.PerspectiveCamera(
      70,
      context.width / context.height,
      1,
      60000
    );

    const scene = new THREE.Scene();
    scene.add(camera);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xbbbbbb);
    scene.add(ambientLight);

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-4000, 1200, 1800);

    // Shadows for high quality
    if (quality > 2) {
      sun.castShadow = true;
      sun.shadow.camera.near = 50;
      sun.shadow.camera.far = 60000 * 2;
      sun.shadow.camera.left = -3000;
      sun.shadow.camera.right = 3000;
      sun.shadow.camera.top = 3000;
      sun.shadow.camera.bottom = -3000;
      sun.shadow.bias = 0.0001;
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
    }
    scene.add(sun);

    // Create ship mesh
    const shipGeometry = this.loader!.get('geometries', 'ship.feisar');
    const ship = this.createMesh(
      scene,
      shipGeometry,
      this.spawn.position.x,
      this.spawn.position.y,
      this.spawn.position.z,
      this.materials.ship
    );

    // Create booster
    const boosterGeometry = this.loader!.get('geometries', 'booster');
    const booster = this.createMesh(
      ship,
      boosterGeometry,
      0,
      0.665,
      -3.8,
      this.materials.booster
    );

    // Booster light
    let boosterLight: THREE.PointLight | undefined;
    if (quality > 0) {
      boosterLight = new THREE.PointLight(0x00a2ff, 4.0, 60);
      boosterLight.position.set(0, 0.665, -4);
      ship.add(boosterLight);
    }

    // Initialize ship controls
    const shipControls = context.components.shipControls;
    shipControls.collisionMap = this.loader!.get('analysers', 'track.cityscape.collision');
    shipControls.collisionPixelRatio = this.pixelRatio;
    shipControls.collisionDetection = true;
    shipControls.heightMap = this.loader!.get('analysers', 'track.cityscape.height');
    shipControls.heightPixelRatio = this.pixelRatio;
    shipControls.heightBias = 4.0;
    shipControls.heightScale = 10.0;
    shipControls.control(ship);

    // Initialize ship effects
    const shipEffects = context.components.shipEffects;
    if (shipEffects && quality > 2) {
      // High quality: enable particles
      // Note: This would need texture parameters passed in
    }

    // Create track meshes
    this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape'),
      0,
      -5,
      0,
      this.materials.track
    );

    this.createMesh(
      scene,
      this.loader!.get('geometries', 'bonus.base'),
      0,
      -5,
      0,
      this.materials.bonusBase
    );

    const bonusSpeed = this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape.bonus.speed'),
      0,
      -5,
      0,
      this.materials.bonusSpeed
    );
    bonusSpeed.receiveShadow = false;

    this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape.scrapers1'),
      0,
      0,
      0,
      this.materials.scrapers1
    );

    this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape.scrapers2'),
      0,
      0,
      0,
      this.materials.scrapers2
    );

    this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape.start'),
      0,
      -5,
      0,
      this.materials.start
    );

    const startBanner = this.createMesh(
      scene,
      this.loader!.get('geometries', 'track.cityscape.start.banner'),
      0,
      -5,
      0,
      this.materials.startBanner
    );
    if (startBanner.material) {
      (startBanner.material as THREE.Material).side = THREE.DoubleSide;
    }

    // Setup camera chase
    const cameraChase = context.components.cameraChase;
    if (cameraChase) {
      cameraChase.camera = camera;
      cameraChase.targetObject = ship;
    }

    // Register game render loop
    context.manager.add(
      'game',
      scene,
      camera,
      (delta: number, renderer: THREE.WebGLRenderer) => {
        const dt = delta / 16.6; // Normalize to 60fps

        // Update ship physics
        shipControls.update(dt);

        // Update ship effects
        if (shipEffects) {
          shipEffects.update(dt);
        }

        // Update camera
        if (cameraChase) {
          cameraChase.update(dt, shipControls.getSpeedRatio());
        }

        // Update HUD
        if (context.hud) {
          context.hud.update(
            shipControls.getRealSpeed(100),
            shipControls.getRealSpeedRatio(),
            shipControls.getShield(100),
            shipControls.getShieldRatio()
          );
        }

        // Render scenes
        renderer.render(scene, camera);

        // Render skybox
        const skySetup = context.manager.get('sky');
        if (skySetup) {
          renderer.render(skySetup.scene, skySetup.camera);
        }
      },
      {
        shipControls,
        shipEffects,
        cameraChase,
        hud: context.hud,
      }
    );
  }

  /**
   * Helper to create a mesh at a position
   */
  private createMesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry | null,
    x: number,
    y: number,
    z: number,
    material: THREE.Material
  ): THREE.Mesh {
    if (!geometry) {
      throw new Error('Geometry is null');
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
}

/**
 * Export singleton track instance
 */
export const cityscape = new CityscapeTrack();
