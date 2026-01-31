import { GameScene } from '../scenes/GameScene';
import { NPC } from '../entities/NPC';

export class AISystem {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(delta: number): void {
    // Update all NPCs in current room
    this.scene.npcs.forEach(npc => {
      if (npc.currentRoom === this.scene.gameState.currentRoom && npc.isAlive) {
        npc.update(delta);
        this.checkPlayerDetection(npc);
      }
    });

    // Check for corpse discovery
    this.checkCorpseDiscovery();
  }

  private checkPlayerDetection(npc: NPC): void {
    if (!npc.canSeePlayer()) return;

    const player = this.scene.player;

    // Check for suspicious behavior
    let suspicionGain = 0;

    // Running in sight
    if (player.isMoving() && !player.isSneaking) {
      suspicionGain += 0.05;
    }

    // Being too close
    const distance = Phaser.Math.Distance.Between(
      npc.sprite.x, npc.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (distance < 50) {
      suspicionGain += 0.02;
    }

    // Apply suspicion to NPC
    if (suspicionGain > 0) {
      npc.suspicionLevel += suspicionGain;

      // State transitions based on suspicion
      if (npc.suspicionLevel > 75 && npc.state !== 'alarmed') {
        npc.becomeAlarmed();
        this.scene.suspicionSystem.addSuspicion(20);
      } else if (npc.suspicionLevel > 50 && npc.state !== 'suspicious' && npc.state !== 'alarmed') {
        npc.becomeSuspicious();
        this.scene.suspicionSystem.addSuspicion(10);
      } else if (npc.suspicionLevel > 25 && npc.state !== 'curious' && npc.state !== 'suspicious' && npc.state !== 'alarmed') {
        npc.becomeCurious();
        this.scene.suspicionSystem.addSuspicion(5);
      }
    }

    // Decay suspicion over time if player is not visible
    if (!npc.canSeePlayer() && npc.suspicionLevel > 0) {
      npc.suspicionLevel = Math.max(0, npc.suspicionLevel - 0.01);
    }
  }

  private checkCorpseDiscovery(): void {
    if (this.scene.corpses.length === 0) return;

    this.scene.npcs.forEach(npc => {
      if (npc.currentRoom !== this.scene.gameState.currentRoom || !npc.isAlive) return;

      this.scene.corpses.forEach(corpse => {
        const distance = Phaser.Math.Distance.Between(
          npc.sprite.x, npc.sprite.y,
          corpse.x, corpse.y
        );

        // NPC discovered a corpse
        if (distance < 100) {
          this.onCorpseDiscovered(npc);
        }
      });
    });
  }

  private onCorpseDiscovered(discoverer: NPC): void {
    // Mass alert
    console.log(`${discoverer.data.name} discovered a body!`);

    // Alert all NPCs in the room
    this.scene.npcs.forEach(npc => {
      if (npc.currentRoom === this.scene.gameState.currentRoom && npc.isAlive) {
        npc.becomeAlarmed();
      }
    });

    // Major suspicion increase
    this.scene.suspicionSystem.addSuspicion(50);

    // Visual feedback
    this.scene.cameras.main.shake(200, 0.01);
  }

  // Called when player makes noise
  onNoiseGenerated(x: number, y: number, radius: number): void {
    this.scene.npcs.forEach(npc => {
      if (npc.currentRoom !== this.scene.gameState.currentRoom || !npc.isAlive) return;

      const distance = Phaser.Math.Distance.Between(
        npc.sprite.x, npc.sprite.y,
        x, y
      );

      if (distance < radius) {
        if (npc.state === 'idle' || npc.state === 'wandering' || npc.state === 'socializing') {
          npc.becomeCurious();
        }
      }
    });
  }
}
