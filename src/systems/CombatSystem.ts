import { GameScene } from '../scenes/GameScene';
import { NPC } from '../entities/NPC';
import { TILE_SIZE } from '../config/GameConfig';

export class CombatSystem {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  attemptKill(target: NPC): void {
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.sprite.x, player.sprite.y,
      target.sprite.x, target.sprite.y
    );

    // Must be close enough
    if (distance > TILE_SIZE * 1.5) {
      console.log('Too far away to attack');
      return;
    }

    // Check if backstab (player behind NPC)
    const isBackstab = target.isPlayerBehind();

    // Check for witnesses
    const witnesses = this.getWitnesses(target);

    if (isBackstab && witnesses.length === 0) {
      // Silent kill
      this.executeKill(target, true);
    } else {
      // Loud kill
      this.executeKill(target, false);

      // Alert witnesses
      if (witnesses.length > 0) {
        this.alertWitnesses(witnesses);
      }
    }
  }

  private executeKill(target: NPC, silent: boolean): void {
    // Kill the NPC
    target.die();

    // Check if correct target
    if (target.data.isTarget) {
      // Win condition - must escape
      this.scene.time.delayedCall(1000, () => {
        if (!this.scene.gameState.isGameOver) {
          this.scene.gameOver(true, 'Target eliminated! You have completed your mission.');
        }
      });
    } else {
      // Wrong target - lose
      this.scene.gameOver(false, 'You killed an innocent guest! Mission failed.');
    }

    // Effects
    if (!silent) {
      // Generate noise
      this.scene.aiSystem.onNoiseGenerated(target.sprite.x, target.sprite.y, 200);

      // Suspicion increase
      this.scene.suspicionSystem.addSuspicion(30);

      // Camera shake
      this.scene.cameras.main.shake(100, 0.01);
    }

    // Flash
    this.scene.cameras.main.flash(100, 139, 0, 0, false);
  }

  private getWitnesses(target: NPC): NPC[] {
    const witnesses: NPC[] = [];
    const killPosition = { x: target.sprite.x, y: target.sprite.y };

    this.scene.npcs.forEach(npc => {
      if (npc === target) return;
      if (npc.currentRoom !== this.scene.gameState.currentRoom) return;
      if (!npc.isAlive) return;

      // Check if NPC can see the kill location
      const distance = Phaser.Math.Distance.Between(
        npc.sprite.x, npc.sprite.y,
        killPosition.x, killPosition.y
      );

      // Vision range for witnessing
      if (distance < 150) {
        // Simple line of sight check
        witnesses.push(npc);
      }
    });

    return witnesses;
  }

  private alertWitnesses(witnesses: NPC[]): void {
    witnesses.forEach(witness => {
      witness.becomeAlarmed();
    });

    // Major suspicion increase for witnessed kill
    this.scene.suspicionSystem.addSuspicion(50);

    console.log(`Kill witnessed by ${witnesses.length} guest(s)!`);
  }

  canBackstab(target: NPC): boolean {
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.sprite.x, player.sprite.y,
      target.sprite.x, target.sprite.y
    );

    if (distance > TILE_SIZE * 1.5) return false;

    return target.isPlayerBehind();
  }

  getWitnessCount(target: NPC): number {
    return this.getWitnesses(target).length;
  }
}
