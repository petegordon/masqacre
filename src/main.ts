import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

// Initialize the game
const game = new Phaser.Game(GameConfig);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export default game;
