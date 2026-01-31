import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { PLAYER_SPEED, PLAYER_SNEAK_SPEED, TILE_SIZE } from '../config/GameConfig';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isSneaking = false;
  public facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private frozen = false;
  private visual: Phaser.GameObjects.Graphics;

  constructor(scene: GameScene, x: number, y: number) {
    // Create a simple graphics texture for the player if it doesn't exist
    if (!scene.textures.exists('player_sprite')) {
      const graphics = scene.add.graphics();
      graphics.fillStyle(0x4a6fa5);
      graphics.fillRect(4, 4, 24, 24);
      graphics.fillStyle(0x2d4a6f);
      graphics.fillRect(8, 8, 16, 8);
      graphics.generateTexture('player_sprite', TILE_SIZE, TILE_SIZE);
      graphics.destroy();
    }

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player_sprite');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    // Set up physics body
    this.sprite.body?.setSize(TILE_SIZE - 8, TILE_SIZE - 8);
    this.sprite.body?.setOffset(4, 4);

    // Create a visible graphics overlay for the player
    this.visual = scene.add.graphics();
    this.updateVisual();
  }

  private updateVisual(): void {
    this.visual.clear();
    this.visual.fillStyle(0x4a6fa5);
    this.visual.fillRect(this.sprite.x - 12, this.sprite.y - 12, 24, 24);
    this.visual.fillStyle(0x2d4a6f);
    this.visual.fillRect(this.sprite.x - 8, this.sprite.y - 12, 16, 8);
    this.visual.setDepth(10);
    this.visual.setAlpha(this.isSneaking ? 0.7 : 1);
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key },
    sneakKey: Phaser.Input.Keyboard.Key
  ): void {
    if (this.frozen) {
      this.sprite.setVelocity(0, 0);
      this.updateVisual();
      return;
    }

    // Check sneak
    this.isSneaking = sneakKey.isDown;
    const speed = this.isSneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;

    // Calculate velocity
    let velocityX = 0;
    let velocityY = 0;

    if (cursors.left.isDown || wasd.A.isDown) {
      velocityX = -speed;
      this.facingDirection = 'left';
    } else if (cursors.right.isDown || wasd.D.isDown) {
      velocityX = speed;
      this.facingDirection = 'right';
    }

    if (cursors.up.isDown || wasd.W.isDown) {
      velocityY = -speed;
      this.facingDirection = 'up';
    } else if (cursors.down.isDown || wasd.S.isDown) {
      velocityY = speed;
      this.facingDirection = 'down';
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.sprite.setVelocity(velocityX, velocityY);

    // Update visual representation
    this.updateVisual();
  }

  freeze(): void {
    this.frozen = true;
    this.sprite.setVelocity(0, 0);
  }

  unfreeze(): void {
    this.frozen = false;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  isMoving(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return body.velocity.x !== 0 || body.velocity.y !== 0;
  }

  getNoiseLevel(): number {
    if (!this.isMoving()) return 0;
    return this.isSneaking ? 0.2 : 1.0;
  }
}
