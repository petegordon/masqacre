import { GameScene } from '../scenes/GameScene';
import { GAME_TIME_SECONDS } from '../config/GameConfig';

export class TimerSystem {
  private scene: GameScene;
  private isRunning = false;
  private lastChimeTime = 0;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  start(): void {
    this.isRunning = true;
    this.scene.gameState.timeRemaining = GAME_TIME_SECONDS;
    this.lastChimeTime = GAME_TIME_SECONDS;
  }

  stop(): void {
    this.isRunning = false;
  }

  update(delta: number): void {
    if (!this.isRunning) return;

    this.scene.gameState.timeRemaining -= delta / 1000;

    // Check for chime
    const currentSeconds = Math.floor(this.scene.gameState.timeRemaining);
    const lastChimeSeconds = Math.floor(this.lastChimeTime);

    if (Math.floor(lastChimeSeconds / 60) > Math.floor(currentSeconds / 60)) {
      this.playChime();
      this.lastChimeTime = this.scene.gameState.timeRemaining;
    }

    // Check for time up
    if (this.scene.gameState.timeRemaining <= 0) {
      this.scene.gameState.timeRemaining = 0;
      this.isRunning = false;
      this.scene.gameOver(false, 'Time ran out! The party has ended.');
    }
  }

  private playChime(): void {
    // Visual feedback - flash screen slightly
    this.scene.cameras.main.flash(200, 255, 215, 0, false);

    // Could play audio here when audio system is implemented
    console.log('DONG! Clock chimes...');
  }

  getFormattedTime(): string {
    const seconds = Math.max(0, Math.floor(this.scene.gameState.timeRemaining));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    return this.scene.gameState.timeRemaining / GAME_TIME_SECONDS;
  }
}
