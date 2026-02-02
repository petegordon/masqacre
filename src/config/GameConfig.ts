import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { DialogueScene } from '../scenes/DialogueScene';
import { GameOverScene } from '../scenes/GameOverScene';

export const TILE_SIZE = 32;
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const ROOM_WIDTH = 25; // tiles
export const ROOM_HEIGHT = 19; // tiles

export const GAME_TIME_SECONDS = 300; // 5 minutes
export const CLOCK_CHIME_INTERVAL = 60; // Chime every 60 seconds

export const PLAYER_SPEED = 160;
export const PLAYER_SNEAK_SPEED = 80;
export const NPC_SPEED = 100;
export const NPC_WANDER_SPEED = 60;

export const SUSPICION_THRESHOLD_CURIOUS = 25;
export const SUSPICION_THRESHOLD_SUSPICIOUS = 50;
export const SUSPICION_THRESHOLD_ALARMED = 75;
export const SUSPICION_MAX = 100;

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, DialogueScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Expand to fill available space while maintaining aspect ratio
    expandParent: true,
    // Fullscreen settings for mobile
    fullscreenTarget: 'game-container'
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  input: {
    // Enable touch input
    touch: true,
    // Prevent right-click context menu
    mouse: {
      preventDefaultDown: true,
      preventDefaultUp: true,
      preventDefaultMove: true
    }
  }
};
