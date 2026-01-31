import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { PLAYER_SPEED, PLAYER_SNEAK_SPEED } from '../config/GameConfig';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isSneaking = false;
  public facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private frozen = false;
  private textureKey = 'char_player';

  constructor(scene: GameScene, x: number, y: number) {
    // Create sprite using the animated character spritesheet (32x32)
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey, 1);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    // Set up physics body for 32x32 sprite
    const bodySize = 24; // Slightly smaller than sprite for better collision
    this.sprite.body?.setSize(bodySize, bodySize);
    this.sprite.body?.setOffset(
      (32 - bodySize) / 2,
      (32 - bodySize) / 2
    );

    // Start with idle animation
    this.sprite.play(`${this.textureKey}_idle_down`);
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key },
    sneakKey: Phaser.Input.Keyboard.Key
  ): void {
    if (this.frozen) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Check sneak
    this.isSneaking = sneakKey.isDown;
    const speed = this.isSneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;

    // Calculate velocity
    let velocityX = 0;
    let velocityY = 0;
    let newDirection = this.facingDirection;

    if (cursors.left.isDown || wasd.A.isDown) {
      velocityX = -speed;
      newDirection = 'left';
    } else if (cursors.right.isDown || wasd.D.isDown) {
      velocityX = speed;
      newDirection = 'right';
    }

    if (cursors.up.isDown || wasd.W.isDown) {
      velocityY = -speed;
      newDirection = 'up';
    } else if (cursors.down.isDown || wasd.S.isDown) {
      velocityY = speed;
      newDirection = 'down';
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.sprite.setVelocity(velocityX, velocityY);

    // Update animation based on movement
    const isMoving = velocityX !== 0 || velocityY !== 0;

    if (isMoving) {
      this.facingDirection = newDirection;
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

    // Adjust alpha when sneaking
    this.sprite.setAlpha(this.isSneaking ? 0.7 : 1);
  }

  freeze(): void {
    this.frozen = true;
    this.sprite.setVelocity(0, 0);
    // Play idle animation when frozen
    const idleAnim = `${this.textureKey}_idle_${this.facingDirection}`;
    this.sprite.play(idleAnim);
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
