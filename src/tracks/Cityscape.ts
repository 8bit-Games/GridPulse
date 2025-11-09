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
   * TODO: This requires ShipEffects, Shaders, and other dependencies to be fully migrated
   */
  buildScenes(context: any, quality: QualityLevel): void {
    if (!this.loader) {
      throw new Error('Loader not initialized. Call load() first.');
    }

    // Set collision analyser
    this.analyser = this.loader.get('analysers', 'track.cityscape.collision');

    console.log('TODO: Complete scene building');
    console.log('Requires:');
    console.log('- Skybox shader migration');
    console.log('- ShipEffects migration');
    console.log('- Particles system migration');
    console.log('- Post-processing composer setup');

    // Basic scene setup would go here
    // For now, this is stubbed out until dependencies are migrated
  }
}

/**
 * Export singleton track instance
 */
export const cityscape = new CityscapeTrack();
