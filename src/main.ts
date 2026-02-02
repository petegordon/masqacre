import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

// Initialize the game
const game = new Phaser.Game(GameConfig);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Handle orientation change (iOS needs this separately)
window.addEventListener('orientationchange', () => {
  // iOS needs a delay for the viewport to update after orientation change
  setTimeout(() => {
    game.scale.refresh();
  }, 100);

  // Additional delayed refresh for stubborn cases
  setTimeout(() => {
    game.scale.refresh();
  }, 300);
});

// Handle visibility change (when switching apps on mobile)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(() => {
      game.scale.refresh();
    }, 100);
  }
});

export default game;
