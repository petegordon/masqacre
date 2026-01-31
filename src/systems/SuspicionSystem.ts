import { GameScene } from '../scenes/GameScene';
import { SUSPICION_MAX, SUSPICION_THRESHOLD_ALARMED } from '../config/GameConfig';

export class SuspicionSystem {
  private scene: GameScene;
  private decayRate = 0.5; // Suspicion decay per second when not doing anything suspicious

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(delta: number): void {
    // Natural decay when not in danger
    if (this.scene.gameState.suspicionLevel > 0) {
      const alarmedNPCs = this.scene.npcs.filter(
        npc => npc.state === 'alarmed' && npc.currentRoom === this.scene.gameState.currentRoom
      );

      // Only decay if no one is actively alarmed
      if (alarmedNPCs.length === 0) {
        this.scene.gameState.suspicionLevel -= (this.decayRate * delta) / 1000;
        this.scene.gameState.suspicionLevel = Math.max(0, this.scene.gameState.suspicionLevel);
      }
    }

    // Check for game over condition
    if (this.scene.gameState.suspicionLevel >= SUSPICION_MAX) {
      this.onMaxSuspicion();
    }
  }

  addSuspicion(amount: number): void {
    this.scene.gameState.suspicionLevel = Math.min(
      SUSPICION_MAX,
      this.scene.gameState.suspicionLevel + amount
    );

    // Visual feedback for sudden increases
    if (amount >= 10) {
      this.scene.cameras.main.flash(100, 255, 0, 0, false);
    }
  }

  removeSuspicion(amount: number): void {
    this.scene.gameState.suspicionLevel = Math.max(
      0,
      this.scene.gameState.suspicionLevel - amount
    );
  }

  private onMaxSuspicion(): void {
    // Guards close in
    this.scene.gameOver(false, 'You were caught! The guards have apprehended you.');
  }

  getSuspicionLevel(): number {
    return this.scene.gameState.suspicionLevel;
  }

  getSuspicionPercentage(): number {
    return (this.scene.gameState.suspicionLevel / SUSPICION_MAX) * 100;
  }

  isHighAlert(): boolean {
    return this.scene.gameState.suspicionLevel >= SUSPICION_THRESHOLD_ALARMED;
  }
}
