import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

interface GameOverData {
  won: boolean;
  reason: string;
  timeRemaining: number;
}

export class GameOverScene extends Phaser.Scene {
  private resultData!: GameOverData;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.resultData = data;
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor(0x0a0a0a);

    // Result header
    const headerText = this.resultData.won ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const headerColor = this.resultData.won ? '#ffd700' : '#8b0000';

    const header = this.add.text(GAME_WIDTH / 2, 120, headerText, {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: headerColor,
      stroke: '#000000',
      strokeThickness: 4
    });
    header.setOrigin(0.5);

    // Reason
    const reason = this.add.text(GAME_WIDTH / 2, 200, this.resultData.reason, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    });
    reason.setOrigin(0.5);

    // Stats
    if (this.resultData.won) {
      const timeBonus = Math.floor(this.resultData.timeRemaining * 10);
      const stats = this.add.text(GAME_WIDTH / 2, 280, [
        `Time Remaining: ${Math.floor(this.resultData.timeRemaining)}s`,
        `Score: ${timeBonus}`
      ], {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
        align: 'center',
        lineSpacing: 8
      });
      stats.setOrigin(0.5);
    }

    // Buttons
    const restartButton = this.add.text(GAME_WIDTH / 2, 400, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff'
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });

    restartButton.on('pointerover', () => {
      restartButton.setColor('#ffd700');
      restartButton.setScale(1.1);
    });
    restartButton.on('pointerout', () => {
      restartButton.setColor('#ffffff');
      restartButton.setScale(1);
    });
    restartButton.on('pointerdown', () => this.restartGame());

    const menuButton = this.add.text(GAME_WIDTH / 2, 460, '[ MAIN MENU ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#888888'
    });
    menuButton.setOrigin(0.5);
    menuButton.setInteractive({ useHandCursor: true });

    menuButton.on('pointerover', () => {
      menuButton.setColor('#ffffff');
    });
    menuButton.on('pointerout', () => {
      menuButton.setColor('#888888');
    });
    menuButton.on('pointerdown', () => this.goToMenu());

    // Credits (ordered by last name)
    const credits = this.add.text(GAME_WIDTH / 2, 540, [
      'Credits',
      'Kylie Egger  •  CJ Gonzales  •  Pete Gordon  •  Chris Smith'
    ], {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#555555',
      align: 'center',
      lineSpacing: 4
    });
    credits.setOrigin(0.5);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-SPACE', () => this.restartGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.restartGame());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());

    // Decorative elements
    this.createDecorations();

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  private createDecorations(): void {
    // Animated mask that rises
    if (!this.resultData.won) {
      // Falling masks for failure
      for (let i = 0; i < 5; i++) {
        const mask = this.add.graphics();
        mask.fillStyle(0x8b0000, 0.5);
        mask.fillEllipse(0, 0, 40, 25);
        mask.x = 100 + i * 150;
        mask.y = -50;

        this.tweens.add({
          targets: mask,
          y: GAME_HEIGHT + 50,
          rotation: Math.PI * 2,
          duration: 3000 + Math.random() * 2000,
          delay: i * 500,
          repeat: -1,
          ease: 'Linear'
        });
      }
    } else {
      // Rising confetti for victory
      for (let i = 0; i < 20; i++) {
        const colors = [0xffd700, 0xff4444, 0x44ff44, 0x4444ff];
        const confetti = this.add.graphics();
        confetti.fillStyle(colors[i % colors.length], 0.8);
        confetti.fillRect(-3, -3, 6, 6);
        confetti.x = Math.random() * GAME_WIDTH;
        confetti.y = GAME_HEIGHT + 20;

        this.tweens.add({
          targets: confetti,
          y: -20,
          x: confetti.x + (Math.random() - 0.5) * 100,
          rotation: Math.PI * 4,
          alpha: 0,
          duration: 2000 + Math.random() * 1000,
          delay: Math.random() * 2000,
          repeat: -1,
          ease: 'Linear'
        });
      }
    }
  }

  private restartGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene');
    });
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }

  shutdown(): void {
    // Clean up keyboard listeners
    this.input.keyboard?.off('keydown-SPACE');
    this.input.keyboard?.off('keydown-ENTER');
    this.input.keyboard?.off('keydown-ESC');

    // Stop all tweens
    this.tweens.killAll();
  }
}
