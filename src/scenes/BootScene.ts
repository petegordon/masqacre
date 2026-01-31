import Phaser from 'phaser';
import { TILE_SIZE } from '../config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
  }

  create(): void {
    // Generate all textures in create() where the scene is fully ready
    this.createAllTextures();

    // Transition to menu
    this.scene.start('MenuScene');
  }

  private createAllTextures(): void {
    const graphics = this.add.graphics();

    // Player sprite (32x32 blue-ish character)
    graphics.clear();
    graphics.fillStyle(0x4a6fa5);
    graphics.fillRect(4, 4, 24, 24);
    graphics.fillStyle(0x2d4a6f);
    graphics.fillRect(8, 8, 16, 8);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);

    // NPC sprites with different mask colors
    const maskColors: Record<string, number> = {
      red: 0xff4444,
      blue: 0x4444ff,
      green: 0x44ff44,
      gold: 0xffd700,
      silver: 0xc0c0c0,
      purple: 0x8844ff,
      black: 0x333333,
      white: 0xeeeeee
    };

    Object.entries(maskColors).forEach(([name, color]) => {
      graphics.clear();
      graphics.fillStyle(0x808080);
      graphics.fillRect(4, 4, 24, 24);
      graphics.fillStyle(color);
      graphics.fillRect(8, 8, 16, 8);
      graphics.generateTexture(`npc_${name}`, TILE_SIZE, TILE_SIZE);
    });

    // Guard sprite
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(4, 4, 24, 24);
    graphics.fillStyle(0x000000);
    graphics.fillRect(8, 8, 16, 8);
    graphics.generateTexture('guard', TILE_SIZE, TILE_SIZE);

    // Floor tile (generic)
    graphics.clear();
    graphics.fillStyle(0x3d3d3d);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(1, 0x4a4a4a);
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('floor', TILE_SIZE, TILE_SIZE);

    // Ballroom floor (elegant wooden)
    graphics.clear();
    graphics.fillStyle(0x8b5a2b);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(1, 0x6b4423);
    graphics.lineBetween(0, TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2);
    graphics.generateTexture('floor_ballroom', TILE_SIZE, TILE_SIZE);

    // Garden floor (grass)
    graphics.clear();
    graphics.fillStyle(0x355e3b);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x3d6b44);
    graphics.fillRect(4, 4, 8, 8);
    graphics.fillRect(20, 20, 8, 8);
    graphics.generateTexture('floor_garden', TILE_SIZE, TILE_SIZE);

    // Library floor (carpet)
    graphics.clear();
    graphics.fillStyle(0x722f37);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(1, 0x5a252c);
    graphics.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    graphics.generateTexture('floor_library', TILE_SIZE, TILE_SIZE);

    // Cellar floor (stone)
    graphics.clear();
    graphics.fillStyle(0x4a4a4a);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x3a3a3a);
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('floor_cellar', TILE_SIZE, TILE_SIZE);

    // Wall tile
    graphics.clear();
    graphics.fillStyle(0x5c4033);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x3d2817);
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);

    // Door tile
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(4, 0, 24, TILE_SIZE);
    graphics.fillStyle(0xffd700);
    graphics.fillCircle(22, 16, 3);
    graphics.generateTexture('door', TILE_SIZE, TILE_SIZE);

    // Grandfather clock
    graphics.clear();
    graphics.fillStyle(0x5c3317);
    graphics.fillRect(8, 0, 16, TILE_SIZE * 2);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(16, 12, 8);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(16, 12, 1);
    graphics.lineStyle(2, 0x000000);
    graphics.lineBetween(16, 12, 16, 6);
    graphics.lineBetween(16, 12, 20, 12);
    graphics.generateTexture('clock', TILE_SIZE, TILE_SIZE * 2);

    // Corpse
    graphics.clear();
    graphics.fillStyle(0x555555);
    graphics.fillRect(2, 10, 28, 14);
    graphics.fillStyle(0x8b0000);
    graphics.fillCircle(8, 16, 4);
    graphics.generateTexture('corpse', TILE_SIZE, TILE_SIZE);

    // Alert icon - curious (yellow)
    graphics.clear();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('alert_curious', 16, 16);

    // Alert icon - alarmed (red)
    graphics.clear();
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('alert_alarmed', 16, 16);

    graphics.destroy();
  }
}
