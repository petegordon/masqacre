import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 120, 'MASQACRE', {
      fontFamily: 'Georgia, serif',
      fontSize: '64px',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 180, 'A Masquerade Mystery', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#c0c0c0'
    });
    subtitle.setOrigin(0.5);

    // Instructions
    const instructions = [
      'Find and eliminate your target among the masked guests.',
      '',
      'Controls:',
      'WASD / Arrows - Move',
      'Shift (hold) - Sneak',
      'E - Interact / Talk',
      'Q - Quick kill (from behind)',
      'Tab - Inventory / Clues'
    ];

    const instructionText = this.add.text(GAME_WIDTH / 2, 320, instructions, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 8
    });
    instructionText.setOrigin(0.5);

    // Start button
    const startButton = this.add.text(GAME_WIDTH / 2, 500, '[ START GAME ]', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#8b0000',
      strokeThickness: 2
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    // Button hover effects
    startButton.on('pointerover', () => {
      startButton.setColor('#ffd700');
      startButton.setScale(1.1);
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#ffffff');
      startButton.setScale(1);
    });

    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Keyboard start
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });

    // Animated mask decorations
    this.createMaskDecorations();
  }

  private createMaskDecorations(): void {
    const maskColors = [0xff4444, 0x4444ff, 0xffd700, 0x44ff44, 0x8844ff];

    for (let i = 0; i < 8; i++) {
      const x = 50 + (i % 4) * 200 + (Math.random() * 100 - 50);
      const y = i < 4 ? 50 : GAME_HEIGHT - 50;
      const color = maskColors[Math.floor(Math.random() * maskColors.length)];

      const mask = this.add.graphics();
      mask.fillStyle(color, 0.3);
      mask.fillEllipse(0, 0, 40, 25);
      mask.x = x;
      mask.y = y;
      mask.setAlpha(0.5);

      this.tweens.add({
        targets: mask,
        y: mask.y + 10,
        alpha: 0.3,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }
}
