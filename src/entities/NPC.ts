import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { NPCData, NPCState, RoomId, Position } from '../types';
import { NPC_SPEED, NPC_WANDER_SPEED, TILE_SIZE } from '../config/GameConfig';

// Mask colors
const MASK_COLORS: Record<string, number> = {
  red: 0xff4444,
  blue: 0x4444ff,
  green: 0x44ff44,
  gold: 0xffd700,
  silver: 0xc0c0c0,
  purple: 0x8844ff,
  black: 0x333333,
  white: 0xeeeeee
};

export class NPC {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public data: NPCData;
  public state: NPCState = 'idle';
  public currentRoom: RoomId;
  public isAlive = true;
  public suspicionLevel = 0;
  public alertIcon: Phaser.GameObjects.Graphics | null = null;

  private scene: GameScene;
  private visual: Phaser.GameObjects.Graphics;
  private wanderTarget: Position | null = null;
  private stateTimer = 0;
  private idleTime = 0;
  private maxIdleTime: number;
  private maskColor: number;
  private targetIndicator: Phaser.GameObjects.Graphics | null = null;
  private isMarkedAsTarget = false;

  constructor(scene: GameScene, x: number, y: number, data: NPCData) {
    this.scene = scene;
    this.data = data;
    this.currentRoom = data.frequentedRoom;
    this.maskColor = MASK_COLORS[data.mask] || 0x888888;

    // Create a texture for this NPC if needed
    const textureKey = `npc_sprite_${data.mask}`;
    if (!scene.textures.exists(textureKey)) {
      const graphics = scene.add.graphics();
      graphics.fillStyle(0x808080);
      graphics.fillRect(4, 4, 24, 24);
      graphics.fillStyle(this.maskColor);
      graphics.fillRect(8, 8, 16, 8);
      graphics.generateTexture(textureKey, TILE_SIZE, TILE_SIZE);
      graphics.destroy();
    }

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(5);

    // Physics body
    this.sprite.body?.setSize(TILE_SIZE - 8, TILE_SIZE - 8);
    this.sprite.body?.setOffset(4, 4);

    // Random idle time variation
    this.maxIdleTime = 2000 + Math.random() * 3000;

    // Create visible graphics overlay
    this.visual = scene.add.graphics();
    this.updateVisual();

    // Create alert icon
    this.alertIcon = scene.add.graphics();
    this.alertIcon.setVisible(false);
    this.alertIcon.setDepth(20);

    // Mark if target (visible only after identification)
    if (data.isTarget && scene.gameState.hasIdentifiedTarget) {
      this.markAsTarget();
    }
  }

  private updateVisual(): void {
    this.visual.clear();
    this.visual.fillStyle(0x808080);
    this.visual.fillRect(this.sprite.x - 12, this.sprite.y - 12, 24, 24);
    this.visual.fillStyle(this.maskColor);
    this.visual.fillRect(this.sprite.x - 8, this.sprite.y - 12, 16, 8);
    this.visual.setDepth(5);
  }

  private updateAlertIcon(): void {
    if (!this.alertIcon) return;

    this.alertIcon.clear();
    this.alertIcon.setPosition(0, 0);

    if (this.state === 'curious') {
      this.alertIcon.fillStyle(0xffff00);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 24, 8);
      this.alertIcon.setVisible(true);
    } else if (this.state === 'suspicious') {
      this.alertIcon.fillStyle(0xffaa00);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 24, 8);
      this.alertIcon.setVisible(true);
    } else if (this.state === 'alarmed') {
      this.alertIcon.fillStyle(0xff0000);
      this.alertIcon.fillCircle(this.sprite.x, this.sprite.y - 24, 8);
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

    // Pulsing effect based on time
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 1;

    this.targetIndicator.clear();

    // Outer glow ring
    this.targetIndicator.lineStyle(4, 0xff0000, 0.6 * pulse);
    this.targetIndicator.strokeCircle(this.sprite.x, this.sprite.y, 22 * pulse);

    // Inner ring
    this.targetIndicator.lineStyle(2, 0xffff00, 0.8);
    this.targetIndicator.strokeCircle(this.sprite.x, this.sprite.y, 18);

    // Crosshair marks
    this.targetIndicator.lineStyle(2, 0xff0000, 0.9);
    const size = 8;
    // Top
    this.targetIndicator.lineBetween(this.sprite.x, this.sprite.y - 25, this.sprite.x, this.sprite.y - 25 - size);
    // Bottom
    this.targetIndicator.lineBetween(this.sprite.x, this.sprite.y + 25, this.sprite.x, this.sprite.y + 25 + size);
    // Left
    this.targetIndicator.lineBetween(this.sprite.x - 25, this.sprite.y, this.sprite.x - 25 - size, this.sprite.y);
    // Right
    this.targetIndicator.lineBetween(this.sprite.x + 25, this.sprite.y, this.sprite.x + 25 + size, this.sprite.y);
  }

  update(delta: number): void {
    if (!this.isAlive) return;

    this.updateVisual();
    this.updateAlertIcon();
    this.updateTargetIndicator();
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
    this.visual.setVisible(false);
    this.sprite.body?.enable && (this.sprite.body.enable = false);
    this.alertIcon?.setVisible(false);

    this.scene.addCorpse(this.sprite.x, this.sprite.y);
  }

  hide(): void {
    this.sprite.setVisible(false);
    this.visual.setVisible(false);
    this.sprite.body?.enable && (this.sprite.body.enable = false);
    this.alertIcon?.setVisible(false);
    this.targetIndicator?.setVisible(false);
  }

  show(): void {
    if (this.isAlive) {
      this.sprite.setVisible(true);
      this.visual.setVisible(true);
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

    if (body.velocity.x === 0 && body.velocity.y === 0) {
      return false;
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
