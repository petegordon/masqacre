import Phaser from 'phaser';
import { TILE_SIZE } from '../config/GameConfig';

// Color definitions for mask palette swapping
// These are the target colors for each mask type
const MASK_PALETTE: Record<string, { h: number; s: number }> = {
  blue: { h: 220, s: 0.8 },    // Original - keep as reference
  red: { h: 0, s: 0.85 },
  green: { h: 120, s: 0.7 },
  gold: { h: 45, s: 0.9 },
  silver: { h: 0, s: 0.05 },   // Desaturated
  purple: { h: 280, s: 0.75 },
  black: { h: 0, s: 0.1 },     // Very dark, low saturation
  white: { h: 0, s: 0.05 }     // Very light, low saturation
};

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

    // Load the character spritesheet (3 cols x 4 rows, 32x32 frames)
    this.load.spritesheet('character_base', 'assets/sprites/masked_char_phaser_3x4_32.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Load furniture sprites
    this.load.image('furniture_bookcase', 'assets/sprites/furniture_bookcase.png');
    this.load.image('furniture_chair_forward', 'assets/sprites/furniture_chair_forward.png');
    this.load.image('furniture_chair_right', 'assets/sprites/furniture_chair_right.png');

    // Load character portraits for dialogue
    this.load.image('portrait_lord_vermillion', 'assets/characters/red_lord_vermillion.png');
    this.load.image('portrait_duchess_fontaine', 'assets/characters/white_duchess_fontaine.png');
    this.load.image('portrait_miss_evergreen', 'assets/characters/green_miss_evergreen.png');
    this.load.image('portrait_viscount_azure', 'assets/characters/blue_viscount_azure.png');
    this.load.image('portrait_wine_merchant', 'assets/characters/yellow_wine_merchant.png');
  }

  create(): void {
    // Generate color-swapped character spritesheets
    this.createCharacterVariants();

    // Generate other textures
    this.createOtherTextures();

    // Create animations
    this.createAnimations();

    // Transition to menu
    this.scene.start('MenuScene');
  }

  private createCharacterVariants(): void {
    const baseTexture = this.textures.get('character_base');
    const baseImage = baseTexture.getSourceImage() as HTMLImageElement;

    // Frame dimensions for 3x4 grid of 32x32 sprites
    const frameWidth = 32;
    const frameHeight = 32;
    const cols = 3;
    const rows = 4;

    // Create each color variant
    Object.entries(MASK_PALETTE).forEach(([colorName, targetColor]) => {
      // Create a NEW canvas for each variant
      const canvas = document.createElement('canvas');
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(baseImage, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a < 10) continue;

        // Convert to HSL
        const hsl = this.rgbToHsl(r, g, b);

        // Check if this is a blue pixel (hue roughly 180-260)
        if (hsl.h >= 180 && hsl.h <= 260 && hsl.s > 0.2) {
          // Remap to target color
          const newHsl = {
            h: targetColor.h,
            s: Math.min(1, hsl.s * (targetColor.s / 0.8)),
            l: hsl.l
          };

          // Special handling for black and white
          if (colorName === 'black') {
            newHsl.l = Math.max(0.1, hsl.l * 0.5);
            newHsl.s = 0.1;
          } else if (colorName === 'white') {
            newHsl.l = Math.min(0.95, hsl.l * 1.3 + 0.2);
            newHsl.s = 0.08;
          } else if (colorName === 'silver') {
            newHsl.s = 0.1;
            newHsl.l = Math.min(0.85, hsl.l * 1.1);
          }

          // Convert back to RGB
          const rgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
          data[i] = rgb.r;
          data[i + 1] = rgb.g;
          data[i + 2] = rgb.b;
        }
      }

      // Put modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Create texture from canvas
      const textureKey = `char_${colorName}`;
      if (this.textures.exists(textureKey)) {
        this.textures.remove(textureKey);
      }

      // Add canvas as texture, then add spritesheet frames
      const canvasTexture = this.textures.addCanvas(textureKey, canvas);
      if (canvasTexture) {
        const texture = this.textures.get(textureKey);
        // Add 32x32 frames in a 3x4 grid
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const frameIndex = row * cols + col;
            texture.add(
              frameIndex,
              0,
              col * frameWidth,
              row * frameHeight,
              frameWidth,
              frameHeight
            );
          }
        }
      }
    });

    // Create player variant (teal color)
    const playerCanvas = document.createElement('canvas');
    playerCanvas.width = baseImage.width;
    playerCanvas.height = baseImage.height;
    const playerCtx = playerCanvas.getContext('2d')!;
    playerCtx.drawImage(baseImage, 0, 0);
    const playerImageData = playerCtx.getImageData(0, 0, playerCanvas.width, playerCanvas.height);
    const playerData = playerImageData.data;

    for (let i = 0; i < playerData.length; i += 4) {
      const r = playerData[i];
      const g = playerData[i + 1];
      const b = playerData[i + 2];
      const a = playerData[i + 3];

      if (a < 10) continue;

      const hsl = this.rgbToHsl(r, g, b);

      // Player uses a teal/cyan color
      if (hsl.h >= 180 && hsl.h <= 260 && hsl.s > 0.2) {
        const newHsl = {
          h: 185,
          s: hsl.s * 0.9,
          l: hsl.l
        };
        const rgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        playerData[i] = rgb.r;
        playerData[i + 1] = rgb.g;
        playerData[i + 2] = rgb.b;
      }
    }

    playerCtx.putImageData(playerImageData, 0, 0);

    if (this.textures.exists('char_player')) {
      this.textures.remove('char_player');
    }

    const playerTexture = this.textures.addCanvas('char_player', playerCanvas);
    if (playerTexture) {
      const texture = this.textures.get('char_player');
      // Add 32x32 frames in a 3x4 grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const frameIndex = row * cols + col;
          texture.add(
            frameIndex,
            0,
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight
          );
        }
      }
    }
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  private createAnimations(): void {
    // Animation frame layout (from new sprite sheet):
    // Row 0 (frames 0-2): Down/Front (facing viewer)
    // Row 1 (frames 3-5): Left (walking left)
    // Row 2 (frames 6-8): Right (walking right)
    // Row 3 (frames 9-11): Up/Back (facing away)

    const colors = ['blue', 'red', 'green', 'gold', 'silver', 'purple', 'black', 'white', 'player'];

    colors.forEach(color => {
      const key = color === 'player' ? 'char_player' : `char_${color}`;

      // Walk down (row 0, frames 0-2)
      this.anims.create({
        key: `${key}_walk_down`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
      });

      // Walk right (row 1, frames 3-5)
      this.anims.create({
        key: `${key}_walk_right`,
        frames: this.anims.generateFrameNumbers(key, { start: 3, end: 5 }),
        frameRate: 8,
        repeat: -1
      });

      // Walk left (row 2, frames 6-8)
      this.anims.create({
        key: `${key}_walk_left`,
        frames: this.anims.generateFrameNumbers(key, { start: 6, end: 8 }),
        frameRate: 8,
        repeat: -1
      });

      // Walk up (row 3, frames 9-11)
      this.anims.create({
        key: `${key}_walk_up`,
        frames: this.anims.generateFrameNumbers(key, { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1
      });

      // Idle frames (middle frame of each direction)
      this.anims.create({
        key: `${key}_idle_down`,
        frames: [{ key: key, frame: 1 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${key}_idle_right`,
        frames: [{ key: key, frame: 4 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${key}_idle_left`,
        frames: [{ key: key, frame: 7 }],
        frameRate: 1
      });

      this.anims.create({
        key: `${key}_idle_up`,
        frames: [{ key: key, frame: 10 }],
        frameRate: 1
      });
    });
  }

  private createOtherTextures(): void {
    const graphics = this.add.graphics();

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

    // Corpse
    graphics.clear();
    graphics.fillStyle(0x555555);
    graphics.fillRect(2, 10, 28, 14);
    graphics.fillStyle(0x8b0000);
    graphics.fillCircle(8, 16, 4);
    graphics.generateTexture('corpse', TILE_SIZE, TILE_SIZE);

    graphics.destroy();
  }
}
