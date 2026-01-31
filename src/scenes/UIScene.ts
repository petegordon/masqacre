import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { GAME_WIDTH, GAME_HEIGHT, SUSPICION_MAX } from '../config/GameConfig';
import { ClueType } from '../types';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private suspicionBar!: Phaser.GameObjects.Graphics;
  private suspicionText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private clueCountText!: Phaser.GameObjects.Text;
  private interactPrompt!: Phaser.GameObjects.Text;

  private inventoryPanel!: Phaser.GameObjects.Container;
  private isInventoryOpen = false;

  // Grandfather clock elements
  private clockContainer!: Phaser.GameObjects.Container;
  private clockMinuteHand!: Phaser.GameObjects.Graphics;
  private clockHourHand!: Phaser.GameObjects.Graphics;
  private clockPendulum!: Phaser.GameObjects.Graphics;
  private clockTimeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    // Suspicion meter
    this.createSuspicionMeter();

    // Grandfather clock (replaces simple timer)
    this.createGrandfatherClock();

    // Room indicator
    this.createRoomIndicator();

    // Clue counter
    this.createClueCounter();

    // Interact prompt
    this.createInteractPrompt();

    // Inventory panel (hidden by default)
    this.createInventoryPanel();

    // Listen for events
    this.setupEventListeners();
  }

  update(_time: number, _delta: number): void {
    this.updateSuspicionMeter();
    this.updateGrandfatherClock();
    this.updateRoomIndicator();
    this.updateClueCounter();
    this.updateInteractPrompt();
  }

  private createSuspicionMeter(): void {
    const x = 20;
    const y = 20;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.8);
    bg.fillRect(x, y, 150, 25);

    // Label
    this.add.text(x + 5, y + 4, 'SUSPICION', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff'
    });

    // Bar
    this.suspicionBar = this.add.graphics();

    // Value text
    this.suspicionText = this.add.text(x + 140, y + 4, '0%', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    this.suspicionText.setOrigin(1, 0);
  }

  private createGrandfatherClock(): void {
    const clockX = GAME_WIDTH - 70;
    const clockY = GAME_HEIGHT - 140;

    this.clockContainer = this.add.container(clockX, clockY);
    this.clockContainer.setDepth(50);

    const clock = this.add.graphics();

    // === CLOCK CASE (Ornate Mahogany) ===

    // Main body shadow
    clock.fillStyle(0x1a0a05);
    clock.fillRect(-32, -95, 64, 195);

    // Main body - rich mahogany
    clock.fillStyle(0x4a1c10);
    clock.fillRect(-30, -93, 60, 190);

    // Wood grain highlights
    clock.fillStyle(0x5c2415);
    clock.fillRect(-25, -90, 50, 185);

    // Inner panel recess
    clock.fillStyle(0x3d1810);
    clock.fillRect(-22, -85, 44, 175);

    // === ORNATE CROWN/TOP ===

    // Crown base
    clock.fillStyle(0x5c2415);
    clock.fillRect(-35, -110, 70, 20);

    // Crown decorative top piece
    clock.fillStyle(0x6b2d18);
    clock.beginPath();
    clock.moveTo(-30, -110);
    clock.lineTo(-20, -125);
    clock.lineTo(0, -130);
    clock.lineTo(20, -125);
    clock.lineTo(30, -110);
    clock.closePath();
    clock.fillPath();

    // Crown finial (decorative ball on top)
    clock.fillStyle(0xdaa520);
    clock.fillCircle(0, -133, 6);
    clock.fillStyle(0xffd700);
    clock.fillCircle(0, -134, 4);

    // Crown gold trim
    clock.lineStyle(2, 0xdaa520);
    clock.strokeRect(-35, -110, 70, 5);

    // === CLOCK FACE AREA ===

    // Face surround (gold frame)
    clock.fillStyle(0xdaa520);
    clock.fillCircle(0, -45, 38);

    // Face outer ring
    clock.fillStyle(0x8b7355);
    clock.fillCircle(0, -45, 35);

    // Clock face - ivory
    clock.fillStyle(0xfff8dc);
    clock.fillCircle(0, -45, 32);

    // Face inner decoration ring
    clock.lineStyle(1, 0xdaa520);
    clock.strokeCircle(0, -45, 28);
    clock.strokeCircle(0, -45, 25);

    // Hour markers (Roman numeral positions)
    clock.fillStyle(0x2c1810);
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const markerX = Math.cos(angle) * 22;
      const markerY = -45 + Math.sin(angle) * 22;

      if (i % 3 === 0) {
        // Major hour markers (12, 3, 6, 9)
        clock.fillRect(markerX - 2, markerY - 4, 4, 8);
      } else {
        // Minor hour markers
        clock.fillCircle(markerX, markerY, 2);
      }
    }

    // Center decoration
    clock.fillStyle(0xdaa520);
    clock.fillCircle(0, -45, 4);
    clock.fillStyle(0x2c1810);
    clock.fillCircle(0, -45, 2);

    this.clockContainer.add(clock);

    // === CLOCK HANDS (separate graphics for rotation) ===

    // Hour hand
    this.clockHourHand = this.add.graphics();
    this.clockHourHand.fillStyle(0x1a0a05);
    this.clockHourHand.fillRect(-2, -15, 4, 18);
    this.clockHourHand.fillTriangle(-3, -15, 3, -15, 0, -20);
    this.clockContainer.add(this.clockHourHand);

    // Minute hand
    this.clockMinuteHand = this.add.graphics();
    this.clockMinuteHand.fillStyle(0x2c1810);
    this.clockMinuteHand.fillRect(-1.5, -22, 3, 25);
    this.clockMinuteHand.fillTriangle(-2, -22, 2, -22, 0, -26);
    this.clockContainer.add(this.clockMinuteHand);

    // === PENDULUM WINDOW ===

    const pendulumWindow = this.add.graphics();

    // Glass panel frame
    pendulumWindow.fillStyle(0xdaa520);
    pendulumWindow.fillRect(-18, 5, 36, 70);

    // Glass (dark interior)
    pendulumWindow.fillStyle(0x0a0505);
    pendulumWindow.fillRect(-15, 8, 30, 64);

    // Glass reflection
    pendulumWindow.fillStyle(0x1a1510, 0.3);
    pendulumWindow.fillRect(-14, 9, 8, 60);

    this.clockContainer.add(pendulumWindow);

    // === PENDULUM ===

    this.clockPendulum = this.add.graphics();

    // Pendulum rod
    this.clockPendulum.lineStyle(2, 0xdaa520);
    this.clockPendulum.lineBetween(0, 15, 0, 55);

    // Pendulum bob (ornate disc)
    this.clockPendulum.fillStyle(0xdaa520);
    this.clockPendulum.fillCircle(0, 58, 12);
    this.clockPendulum.fillStyle(0xffd700);
    this.clockPendulum.fillCircle(0, 58, 9);
    this.clockPendulum.fillStyle(0xdaa520);
    this.clockPendulum.fillCircle(0, 58, 5);

    this.clockContainer.add(this.clockPendulum);

    // Start pendulum swing animation
    this.tweens.add({
      targets: this.clockPendulum,
      angle: { from: -8, to: 8 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // === BASE/FEET ===

    const base = this.add.graphics();

    // Base platform
    base.fillStyle(0x4a1c10);
    base.fillRect(-35, 90, 70, 15);

    // Decorative feet
    base.fillStyle(0x5c2415);
    base.fillRect(-32, 100, 15, 8);
    base.fillRect(17, 100, 15, 8);

    // Gold trim on base
    base.lineStyle(2, 0xdaa520);
    base.lineBetween(-35, 90, 35, 90);

    this.clockContainer.add(base);

    // === SIDE COLUMNS ===

    const columns = this.add.graphics();

    // Left column
    columns.fillStyle(0x5c2415);
    columns.fillRect(-28, -5, 6, 95);
    columns.fillStyle(0xdaa520);
    columns.fillRect(-28, -5, 6, 3);
    columns.fillRect(-28, 87, 6, 3);

    // Right column
    columns.fillStyle(0x5c2415);
    columns.fillRect(22, -5, 6, 95);
    columns.fillStyle(0xdaa520);
    columns.fillRect(22, -5, 6, 3);
    columns.fillRect(22, 87, 6, 3);

    this.clockContainer.add(columns);

    // === TIME DISPLAY TEXT ===

    this.clockTimeText = this.add.text(0, 108, '5:00', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.clockTimeText.setOrigin(0.5);
    this.clockContainer.add(this.clockTimeText);

    // Position hands at clock face center
    this.clockHourHand.setPosition(0, -45);
    this.clockMinuteHand.setPosition(0, -45);
    this.clockPendulum.setPosition(0, 0);
  }

  private createRoomIndicator(): void {
    const x = GAME_WIDTH / 2;
    const y = 15;

    this.roomText = this.add.text(x, y, 'BALLROOM', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.roomText.setOrigin(0.5, 0);
  }

  private createClueCounter(): void {
    const x = 20;
    const y = 55;

    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.8);
    bg.fillRect(x, y, 100, 20);

    this.clueCountText = this.add.text(x + 5, y + 3, 'CLUES: 0/3', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd700'
    });
  }

  private createInteractPrompt(): void {
    this.interactPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.interactPrompt.setOrigin(0.5);
    this.interactPrompt.setAlpha(0);
  }

  private createInventoryPanel(): void {
    this.inventoryPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRect(-200, -150, 400, 300);
    bg.lineStyle(2, 0xffd700);
    bg.strokeRect(-200, -150, 400, 300);
    this.inventoryPanel.add(bg);

    // Title
    const title = this.add.text(0, -130, 'CLUE JOURNAL', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffd700'
    });
    title.setOrigin(0.5);
    this.inventoryPanel.add(title);

    // Close hint
    const closeHint = this.add.text(0, 130, 'Press TAB to close', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    });
    closeHint.setOrigin(0.5);
    this.inventoryPanel.add(closeHint);

    this.inventoryPanel.setVisible(false);
    this.inventoryPanel.setDepth(100);
  }

  private setupEventListeners(): void {
    this.gameScene.events.on('toggleInventory', this.toggleInventory, this);
    this.gameScene.events.on('clueDiscovered', this.onClueDiscovered, this);
    this.gameScene.events.on('targetIdentified', this.onTargetIdentified, this);
  }

  private updateSuspicionMeter(): void {
    const level = this.gameScene.gameState.suspicionLevel;
    const width = (level / SUSPICION_MAX) * 90;

    this.suspicionBar.clear();

    // Color based on level
    let color = 0x44ff44; // Green
    if (level > 25) color = 0xffff44; // Yellow
    if (level > 50) color = 0xff8844; // Orange
    if (level > 75) color = 0xff4444; // Red

    this.suspicionBar.fillStyle(color);
    this.suspicionBar.fillRect(45, 27, width, 12);

    this.suspicionText.setText(`${Math.floor(level)}%`);
  }

  private updateGrandfatherClock(): void {
    const totalSeconds = 300; // 5 minutes total
    const seconds = Math.max(0, Math.floor(this.gameScene.gameState.timeRemaining));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // Update time text
    this.clockTimeText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    // Flash text red when low on time
    if (seconds < 60) {
      this.clockTimeText.setColor(seconds % 2 === 0 ? '#ff4444' : '#ffd700');
    }

    // Calculate hand angles based on time remaining
    // Minute hand: full rotation over total game time
    const timeElapsed = totalSeconds - seconds;
    const minuteProgress = timeElapsed / totalSeconds;
    const minuteAngle = minuteProgress * 360;

    // Hour hand: moves slower (1/12 of minute hand speed)
    const hourAngle = minuteProgress * 360 / 12;

    // Apply rotations to hands
    this.clockMinuteHand.setAngle(minuteAngle);
    this.clockHourHand.setAngle(hourAngle);

    // Make clock glow/pulse when time is critical
    if (seconds < 60 && seconds > 0) {
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      this.clockContainer.setAlpha(pulse);
    } else {
      this.clockContainer.setAlpha(1);
    }
  }

  private updateRoomIndicator(): void {
    const roomNames: Record<string, string> = {
      ballroom: 'BALLROOM',
      garden: 'GARDEN',
      library: 'LIBRARY',
      cellar: 'CELLAR'
    };
    this.roomText.setText(roomNames[this.gameScene.gameState.currentRoom]);
  }

  private updateClueCounter(): void {
    const count = this.gameScene.gameState.discoveredClues.length;
    this.clueCountText.setText(`CLUES: ${count}/3`);

    if (count >= 3 && !this.gameScene.gameState.hasIdentifiedTarget) {
      this.clueCountText.setColor('#44ff44');
    }
  }

  private updateInteractPrompt(): void {
    // Check for nearby interactive objects
    const nearbyNPC = this.gameScene['getNearbyNPC']?.();

    if (nearbyNPC && nearbyNPC.isAlive) {
      this.interactPrompt.setText('[E] Talk  [Q] Attack');
      this.interactPrompt.setAlpha(1);
    } else {
      // Check for doors
      const doors = this.gameScene.currentRoom?.getDoors() || [];
      let nearDoor = false;

      for (const door of doors) {
        const dist = Phaser.Math.Distance.Between(
          this.gameScene.player.sprite.x,
          this.gameScene.player.sprite.y,
          door.x, door.y
        );
        if (dist < 48) {
          nearDoor = true;
          break;
        }
      }

      if (nearDoor) {
        this.interactPrompt.setText('[E] Enter');
        this.interactPrompt.setAlpha(1);
      } else {
        this.interactPrompt.setAlpha(0);
      }
    }
  }

  private toggleInventory(): void {
    this.isInventoryOpen = !this.isInventoryOpen;

    if (this.isInventoryOpen) {
      this.updateInventoryContent();
      this.inventoryPanel.setVisible(true);
    } else {
      this.inventoryPanel.setVisible(false);
    }
  }

  private updateInventoryContent(): void {
    // Remove old clue texts
    this.inventoryPanel.list.forEach((child, index) => {
      if (index > 2) { // Keep bg, title, and close hint
        child.destroy();
      }
    });

    const clues = this.gameScene.gameState.discoveredClues;

    if (clues.length === 0) {
      const noClues = this.add.text(0, 0, 'No clues discovered yet.\nTalk to guests to gather information.', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
        align: 'center'
      });
      noClues.setOrigin(0.5);
      this.inventoryPanel.add(noClues);
    } else {
      const categories = ['mask', 'location', 'behavior'];
      const categoryNames = { mask: 'MASK', location: 'LOCATION', behavior: 'BEHAVIOR' };

      let yOffset = -80;

      categories.forEach(cat => {
        const catClues = clues.filter(c => c.category === cat);
        if (catClues.length > 0) {
          const header = this.add.text(-180, yOffset, categoryNames[cat as keyof typeof categoryNames], {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffd700'
          });
          this.inventoryPanel.add(header);
          yOffset += 20;

          catClues.forEach(clue => {
            const clueText = this.add.text(-170, yOffset, `• ${clue.description}`, {
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#ffffff'
            });
            this.inventoryPanel.add(clueText);
            yOffset += 18;
          });
          yOffset += 10;
        }
      });

      // Target identified message
      if (this.gameScene.gameState.hasIdentifiedTarget) {
        const identified = this.add.text(0, 80, 'TARGET IDENTIFIED!', {
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#ff4444'
        });
        identified.setOrigin(0.5);
        this.inventoryPanel.add(identified);
      }
    }
  }

  private onClueDiscovered(clue: ClueType): void {
    // Create modal overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(200);

    // Modal container
    const modal = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    modal.setDepth(201);

    // Modal background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.98);
    bg.fillRect(-180, -80, 360, 160);
    bg.lineStyle(3, 0xffd700);
    bg.strokeRect(-180, -80, 360, 160);
    modal.add(bg);

    // Header
    const header = this.add.text(0, -55, 'CLUE DISCOVERED', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ffd700'
    });
    header.setOrigin(0.5);
    modal.add(header);

    // Category label
    const categoryNames = { mask: 'MASK CLUE', location: 'LOCATION CLUE', behavior: 'BEHAVIOR CLUE' };
    const category = this.add.text(0, -25, categoryNames[clue.category as keyof typeof categoryNames], {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    });
    category.setOrigin(0.5);
    modal.add(category);

    // Clue description
    const description = this.add.text(0, 10, clue.description, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 320 }
    });
    description.setOrigin(0.5);
    modal.add(description);

    // Continue prompt
    const prompt = this.add.text(0, 55, '[Press SPACE to continue]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888'
    });
    prompt.setOrigin(0.5);
    modal.add(prompt);

    // Pulse the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Wait for key press to dismiss
    const dismissModal = () => {
      overlay.destroy();
      modal.destroy();
      this.input.keyboard?.off('keydown-SPACE', dismissModal);
      this.input.keyboard?.off('keydown-ENTER', dismissModal);
      this.input.keyboard?.off('keydown-E', dismissModal);
    };

    this.input.keyboard?.once('keydown-SPACE', dismissModal);
    this.input.keyboard?.once('keydown-ENTER', dismissModal);
    this.input.keyboard?.once('keydown-E', dismissModal);
  }

  private onTargetIdentified(): void {
    const notification = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50,
      'TARGET IDENTIFIED!\nYou now know who to eliminate.', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ff4444',
      backgroundColor: '#000000',
      padding: { x: 20, y: 15 },
      align: 'center',
      stroke: '#ffffff',
      strokeThickness: 1
    });
    notification.setOrigin(0.5);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => notification.destroy()
    });
  }
}
