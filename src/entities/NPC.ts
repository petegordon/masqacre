import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { NPCData, NPCState, RoomId, Position } from '../types';
import { NPC_SPEED, NPC_WANDER_SPEED } from '../config/GameConfig';

export class NPC {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public data: NPCData;
  public state: NPCState = 'idle';
  public currentRoom: RoomId;
  public isAlive = true;
  public suspicionLevel = 0;
  public alertIcon: Phaser.GameObjects.Graphics | null = null;

  private scene: GameScene;
  private textureKey: string;
  private wanderTarget: Position | null = null;
  private stateTimer = 0;
  private idleTime = 0;
  private maxIdleTime: number;
  private facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private targetIndicator: Phaser.GameObjects.Graphics | null = null;
  private isMarkedAsTarget = false;

  constructor(scene: GameScene, x: number, y: number, data: NPCData) {
    this.scene = scene;
    this.data = data;
    this.currentRoom = data.frequentedRoom;

    // Use the color-swapped texture based on mask color
    this.textureKey = `char_${data.mask}`;

    // Create sprite (32x32)
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey, 1);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(5);

    // Physics body for 32x32 sprite
    const bodySize = 24; // Slightly smaller than sprite for better collision
    this.sprite.body?.setSize(bodySize, bodySize);
    this.sprite.body?.setOffset(
      (32 - bodySize) / 2,
      (32 - bodySize) / 2
    );

    // Hide debug collision box
    if (this.sprite.body) {
      (this.sprite.body as Phaser.Physics.Arcade.Body).debugShowBody = false;
    }

    // Random idle time variation
    this.maxIdleTime = 2000 + Math.random() * 3000;

    // Start with idle animation
    this.sprite.play(`${this.textureKey}_idle_down`);

    // Create alert icon
    this.alertIcon = scene.add.graphics();
    this.alertIcon.setVisible(false);
    this.alertIcon.setDepth(20);

    // Mark if target (visible only after identification)
    if (data.isTarget && scene.gameState.hasIdentifiedTarget) {
      this.markAsTarget();
    }
  }

  private updateAlertIcon(): void {
    if (!this.alertIcon) return;

    this.alertIcon.clear();
    this.alertIcon.setPosition(0, 0);

    if (this.state === 'curious') {
      this.alertIcon.fillStyle(0xffff00);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 30, 8);
      this.alertIcon.setVisible(true);
    } else if (this.state === 'suspicious') {
      this.alertIcon.fillStyle(0xffaa00);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 30, 8);
      this.alertIcon.setVisible(true);
    } else if (this.state === 'alarmed') {
      this.alertIcon.fillStyle(0xff0000);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 30, 8);
      this.alertIcon.setVisible(true);
    } else {
      this.alertIcon.setVisible(false);
    }
  }

  markAsTarget(): void {
    this.isMarkedAsTarget = true;

    // Create a visible red indicator ring around the target
    this.targetIndicator = this.scene.add.graphics();
    this.targetIndicator.setDepth(4); // Just below NPC
  }

  private updateTargetIndicator(): void {
    if (!this.targetIndicator || !this.isMarkedAsTarget) return;

    // Don't draw if not visible (in different room)
    if (!this.sprite.visible) {
      this.targetIndicator.clear();
      return;
    }

    // Pulsing effect based on time
    const pulse = Math.sin(Date.now() / 400) * 0.15 + 1;
    const alpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;

    this.targetIndicator.clear();

    // Simple red targeting reticle
    this.targetIndicator.lineStyle(3, 0xff0000, alpha);
    this.targetIndicator.strokeCircle(this.sprite.x, this.sprite.y, 20 * pulse);

    // Corner brackets instead of full crosshairs
    const r = 24 * pulse;
    const len = 6;

    // Top-left corner
    this.targetIndicator.lineBetween(this.sprite.x - r, this.sprite.y - r + len, this.sprite.x - r, this.sprite.y - r);
    this.targetIndicator.lineBetween(this.sprite.x - r, this.sprite.y - r, this.sprite.x - r + len, this.sprite.y - r);

    // Top-right corner
    this.targetIndicator.lineBetween(this.sprite.x + r - len, this.sprite.y - r, this.sprite.x + r, this.sprite.y - r);
    this.targetIndicator.lineBetween(this.sprite.x + r, this.sprite.y - r, this.sprite.x + r, this.sprite.y - r + len);

    // Bottom-left corner
    this.targetIndicator.lineBetween(this.sprite.x - r, this.sprite.y + r - len, this.sprite.x - r, this.sprite.y + r);
    this.targetIndicator.lineBetween(this.sprite.x - r, this.sprite.y + r, this.sprite.x - r + len, this.sprite.y + r);

    // Bottom-right corner
    this.targetIndicator.lineBetween(this.sprite.x + r - len, this.sprite.y + r, this.sprite.x + r, this.sprite.y + r);
    this.targetIndicator.lineBetween(this.sprite.x + r, this.sprite.y + r - len, this.sprite.x + r, this.sprite.y + r);
  }

  update(delta: number): void {
    if (!this.isAlive) return;

    this.updateAlertIcon();
    this.updateTargetIndicator();
    this.updateAnimation();
    this.stateTimer += delta;

    switch (this.state) {
      case 'idle':
        this.updateIdle(delta);
        break;
      case 'wandering':
        this.updateWandering(delta);
        break;
      case 'socializing':
        this.updateSocializing(delta);
        break;
      case 'curious':
        this.updateCurious(delta);
        break;
      case 'suspicious':
        this.updateSuspicious(delta);
        break;
      case 'alarmed':
        this.updateAlarmed(delta);
        break;
    }
  }

  private updateAnimation(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const isMoving = body.velocity.x !== 0 || body.velocity.y !== 0;

    // Determine facing direction from velocity
    if (isMoving) {
      if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) {
        this.facingDirection = body.velocity.x > 0 ? 'right' : 'left';
      } else {
        this.facingDirection = body.velocity.y > 0 ? 'down' : 'up';
      }

      const walkAnim = `${this.textureKey}_walk_${this.facingDirection}`;
      if (this.sprite.anims.currentAnim?.key !== walkAnim) {
        this.sprite.play(walkAnim);
      }
    } else {
      const idleAnim = `${this.textureKey}_idle_${this.facingDirection}`;
      if (this.sprite.anims.currentAnim?.key !== idleAnim) {
        this.sprite.play(idleAnim);
      }
    }
  }

  private updateIdle(delta: number): void {
    this.sprite.setVelocity(0, 0);
    this.idleTime += delta;

    if (this.idleTime > this.maxIdleTime) {
      this.idleTime = 0;
      this.maxIdleTime = 2000 + Math.random() * 3000;

      const roll = Math.random();
      if (roll < 0.6) {
        this.startWandering();
      } else {
        this.startSocializing();
      }
    }
  }

  private updateWandering(_delta: number): void {
    if (!this.wanderTarget) {
      this.state = 'idle';
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.wanderTarget.x, this.wanderTarget.y
    );

    if (distance < 10) {
      this.sprite.setVelocity(0, 0);
      this.wanderTarget = null;
      this.state = 'idle';
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.wanderTarget.x, this.wanderTarget.y
    );

    this.sprite.setVelocity(
      Math.cos(angle) * NPC_WANDER_SPEED,
      Math.sin(angle) * NPC_WANDER_SPEED
    );
  }

  private updateSocializing(_delta: number): void {
    this.sprite.setVelocity(0, 0);

    if (this.stateTimer > 5000) {
      this.state = 'idle';
      this.stateTimer = 0;
    }
  }

  private updateCurious(_delta: number): void {
    if (this.stateTimer > 3000) {
      this.state = 'idle';
      this.stateTimer = 0;
    }
  }

  private updateSuspicious(_delta: number): void {
    if (this.stateTimer > 5000) {
      if (this.suspicionLevel < 50) {
        this.state = 'idle';
      }
      this.stateTimer = 0;
    }
  }

  private updateAlarmed(_delta: number): void {
    const playerPos = this.scene.player.getPosition();
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );

    this.sprite.setVelocity(
      Math.cos(angle) * NPC_SPEED,
      Math.sin(angle) * NPC_SPEED
    );
  }

  startWandering(): void {
    this.state = 'wandering';
    this.stateTimer = 0;

    const room = this.scene.rooms.get(this.currentRoom);
    if (room) {
      const bounds = room.getWalkableBounds();
      this.wanderTarget = {
        x: bounds.x + Math.random() * bounds.width,
        y: bounds.y + Math.random() * bounds.height
      };
    }
  }

  startSocializing(): void {
    this.state = 'socializing';
    this.stateTimer = 0;
  }

  becomeCurious(): void {
    if (this.state !== 'alarmed') {
      this.state = 'curious';
      this.stateTimer = 0;
    }
  }

  becomeSuspicious(): void {
    if (this.state !== 'alarmed') {
      this.state = 'suspicious';
      this.stateTimer = 0;
    }
  }

  becomeAlarmed(): void {
    this.state = 'alarmed';
    this.stateTimer = 0;
  }

  die(): void {
    this.isAlive = false;
    this.sprite.setVisible(false);
    this.sprite.body?.enable && (this.sprite.body.enable = false);
    this.alertIcon?.setVisible(false);
    this.targetIndicator?.setVisible(false);

    this.scene.addCorpse(this.sprite.x, this.sprite.y);
  }

  hide(): void {
    this.sprite.setVisible(false);
    this.sprite.body?.enable && (this.sprite.body.enable = false);
    this.alertIcon?.setVisible(false);
    this.targetIndicator?.setVisible(false);
  }

  show(): void {
    if (this.isAlive) {
      this.sprite.setVisible(true);
      this.sprite.body?.enable !== undefined && (this.sprite.body.enable = true);
      if (this.isMarkedAsTarget) {
        this.targetIndicator?.setVisible(true);
      }
    }
  }

  canSeePlayer(): boolean {
    if (!this.isAlive) return false;

    const playerPos = this.scene.player.getPosition();
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );

    const visionRange = 150;
    if (distance > visionRange) return false;

    return true;
  }

  isBehindPlayer(): boolean {
    const playerPos = this.scene.player.getPosition();
    const playerFacing = this.scene.player.facingDirection;

    const dx = this.sprite.x - playerPos.x;
    const dy = this.sprite.y - playerPos.y;

    switch (playerFacing) {
      case 'up': return dy > 0;
      case 'down': return dy < 0;
      case 'left': return dx > 0;
      case 'right': return dx < 0;
    }
  }

  isPlayerBehind(): boolean {
    const playerPos = this.scene.player.getPosition();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // If NPC is standing still, check based on their facing direction
    if (body.velocity.x === 0 && body.velocity.y === 0) {
      const dx = playerPos.x - this.sprite.x;
      const dy = playerPos.y - this.sprite.y;

      switch (this.facingDirection) {
        case 'up': return dy > 0;
        case 'down': return dy < 0;
        case 'left': return dx > 0;
        case 'right': return dx < 0;
      }
    }

    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;

    if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) {
      if (body.velocity.x > 0) return dx < 0;
      return dx > 0;
    } else {
      if (body.velocity.y > 0) return dy < 0;
      return dy > 0;
    }
  }
}
