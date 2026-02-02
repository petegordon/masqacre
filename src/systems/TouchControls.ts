import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export interface TouchInputState {
  velocityX: number;
  velocityY: number;
  isSneaking: boolean;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private joystickBase!: Phaser.GameObjects.Graphics;
  private joystickThumb!: Phaser.GameObjects.Graphics;
  private joystickPointer: Phaser.Input.Pointer | null = null;

  private baseX = 0;
  private baseY = 0;
  private thumbX = 0;
  private thumbY = 0;
  private joystickRadius = 50;
  private thumbRadius = 25;

  public velocityX = 0;
  public velocityY = 0;
  public isActive = false;

  // Action buttons
  private interactButton!: Phaser.GameObjects.Container;
  private attackButton!: Phaser.GameObjects.Container;
  private inventoryButton!: Phaser.GameObjects.Container;
  private sneakButton!: Phaser.GameObjects.Container;
  private fullscreenButton!: Phaser.GameObjects.Container;

  public onInteract: (() => void) | null = null;
  public onAttack: (() => void) | null = null;
  public onInventory: (() => void) | null = null;
  public isSneaking = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Only create touch controls on touch-capable devices
    if (this.isTouchDevice()) {
      this.createJoystick();
      this.createActionButtons();
      this.setupTouchListeners();
      this.isActive = true;
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           window.matchMedia('(pointer: coarse)').matches;
  }

  private createJoystick(): void {
    // Use game dimensions (UIScene uses the same coordinate system)
    const gameHeight = GAME_HEIGHT;

    // Position joystick in bottom-left corner with padding
    this.baseX = 90;
    this.baseY = gameHeight - 90;
    this.thumbX = this.baseX;
    this.thumbY = this.baseY;

    // Create joystick base
    this.joystickBase = this.scene.add.graphics();
    this.joystickBase.fillStyle(0x000000, 0.4);
    this.joystickBase.fillCircle(this.baseX, this.baseY, this.joystickRadius);
    this.joystickBase.lineStyle(3, 0xffffff, 0.5);
    this.joystickBase.strokeCircle(this.baseX, this.baseY, this.joystickRadius);
    this.joystickBase.setDepth(1000);

    // Create joystick thumb
    this.joystickThumb = this.scene.add.graphics();
    this.drawThumb();
    this.joystickThumb.setDepth(1001);
  }

  private drawThumb(): void {
    this.joystickThumb.clear();
    this.joystickThumb.fillStyle(0xffffff, 0.7);
    this.joystickThumb.fillCircle(this.thumbX, this.thumbY, this.thumbRadius);
    this.joystickThumb.lineStyle(2, 0xffd700, 0.8);
    this.joystickThumb.strokeCircle(this.thumbX, this.thumbY, this.thumbRadius);
  }

  private createActionButtons(): void {
    const gameWidth = GAME_WIDTH;
    const gameHeight = GAME_HEIGHT;

    const buttonSize = 50;
    const buttonPadding = 10;
    const rightMargin = 20;
    const bottomMargin = 70;

    // Position buttons in bottom-right corner
    const buttonBaseX = gameWidth - rightMargin - buttonSize;
    const buttonBaseY = gameHeight - bottomMargin;

    // Interact button (E) - primary action
    this.interactButton = this.createButton(
      buttonBaseX - buttonSize - buttonPadding,
      buttonBaseY - buttonSize - buttonPadding,
      buttonSize,
      'E',
      0x44aa44,
      () => this.onInteract?.()
    );

    // Attack button (Q) - secondary action
    this.attackButton = this.createButton(
      buttonBaseX,
      buttonBaseY - buttonSize - buttonPadding,
      buttonSize,
      'Q',
      0xaa4444,
      () => this.onAttack?.()
    );

    // Inventory button (Tab) - smaller
    this.inventoryButton = this.createButton(
      buttonBaseX,
      buttonBaseY - (buttonSize + buttonPadding) * 2,
      buttonSize * 0.8,
      'INV',
      0x4444aa,
      () => this.onInventory?.()
    );

    // Sneak button (Shift) - toggle
    this.sneakButton = this.createButton(
      buttonBaseX - buttonSize - buttonPadding,
      buttonBaseY,
      buttonSize * 0.85,
      'SNK',
      0x666666,
      () => this.toggleSneak(),
      true // is toggle
    );

    // Fullscreen button - top right corner
    this.fullscreenButton = this.createButton(
      gameWidth - 50,
      10,
      40,
      '⛶',
      0x888888,
      () => this.toggleFullscreen()
    );
  }

  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    color: number,
    callback: () => void,
    isToggle = false
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(1000);

    // Button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(0, 0, size, size, 8);
    bg.lineStyle(2, color, 0.9);
    bg.strokeRoundedRect(0, 0, size, size, 8);
    container.add(bg);

    // Button label
    const fontSize = label.length > 2 ? '11px' : '16px';
    const text = this.scene.add.text(size / 2, size / 2, label, {
      fontFamily: 'monospace',
      fontSize: fontSize,
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    container.add(text);

    // Make button interactive
    const hitArea = this.scene.add.rectangle(size / 2, size / 2, size, size);
    hitArea.setInteractive();
    container.add(hitArea);
    hitArea.setAlpha(0.001);

    // Store reference for toggle buttons
    container.setData('bg', bg);
    container.setData('color', color);
    container.setData('size', size);
    container.setData('isToggle', isToggle);
    container.setData('isActive', false);

    // Touch events
    hitArea.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(color, 0.8);
      bg.fillRoundedRect(0, 0, size, size, 8);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(0, 0, size, size, 8);

      callback();
    });

    hitArea.on('pointerup', () => {
      if (!isToggle || !container.getData('isActive')) {
        bg.clear();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRoundedRect(0, 0, size, size, 8);
        bg.lineStyle(2, color, 0.9);
        bg.strokeRoundedRect(0, 0, size, size, 8);
      }
    });

    hitArea.on('pointerout', () => {
      if (!isToggle || !container.getData('isActive')) {
        bg.clear();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRoundedRect(0, 0, size, size, 8);
        bg.lineStyle(2, color, 0.9);
        bg.strokeRoundedRect(0, 0, size, size, 8);
      }
    });

    return container;
  }

  private toggleSneak(): void {
    this.isSneaking = !this.isSneaking;

    const bg = this.sneakButton.getData('bg') as Phaser.GameObjects.Graphics;
    const color = this.sneakButton.getData('color') as number;
    const size = this.sneakButton.getData('size') as number;

    this.sneakButton.setData('isActive', this.isSneaking);

    bg.clear();
    if (this.isSneaking) {
      bg.fillStyle(color, 0.9);
      bg.fillRoundedRect(0, 0, size, size, 8);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(0, 0, size, size, 8);
    } else {
      bg.fillStyle(0x000000, 0.6);
      bg.fillRoundedRect(0, 0, size, size, 8);
      bg.lineStyle(2, color, 0.9);
      bg.strokeRoundedRect(0, 0, size, size, 8);
    }
  }

  private toggleFullscreen(): void {
    if (this.scene.scale.isFullscreen) {
      this.scene.scale.stopFullscreen();
    } else {
      this.scene.scale.startFullscreen();
    }
  }

  private setupTouchListeners(): void {
    // Handle joystick touch - use worldX/worldY for proper coordinates
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if touch is in the left third of the screen (joystick area)
      if (pointer.x < GAME_WIDTH / 3) {
        this.joystickPointer = pointer;
        this.updateJoystickPosition(pointer);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.updateJoystickPosition(pointer);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.resetJoystick();
      }
    });
  }

  private updateJoystickPosition(pointer: Phaser.Input.Pointer): void {
    // Calculate distance from joystick base
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit thumb to joystick radius
    if (distance <= this.joystickRadius) {
      this.thumbX = pointer.x;
      this.thumbY = pointer.y;
    } else {
      const angle = Math.atan2(dy, dx);
      this.thumbX = this.baseX + Math.cos(angle) * this.joystickRadius;
      this.thumbY = this.baseY + Math.sin(angle) * this.joystickRadius;
    }

    // Calculate normalized velocity (-1 to 1)
    this.velocityX = (this.thumbX - this.baseX) / this.joystickRadius;
    this.velocityY = (this.thumbY - this.baseY) / this.joystickRadius;

    // Apply dead zone
    const deadZone = 0.15;
    if (Math.abs(this.velocityX) < deadZone) this.velocityX = 0;
    if (Math.abs(this.velocityY) < deadZone) this.velocityY = 0;

    this.drawThumb();
  }

  private resetJoystick(): void {
    this.joystickPointer = null;
    this.thumbX = this.baseX;
    this.thumbY = this.baseY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.drawThumb();
  }

  getInputState(): TouchInputState {
    return {
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isSneaking: this.isSneaking
    };
  }

  show(): void {
    if (!this.isActive) return;

    this.joystickBase?.setVisible(true);
    this.joystickThumb?.setVisible(true);
    this.interactButton?.setVisible(true);
    this.attackButton?.setVisible(true);
    this.inventoryButton?.setVisible(true);
    this.sneakButton?.setVisible(true);
    this.fullscreenButton?.setVisible(true);
  }

  hide(): void {
    if (!this.isActive) return;

    this.joystickBase?.setVisible(false);
    this.joystickThumb?.setVisible(false);
    this.interactButton?.setVisible(false);
    this.attackButton?.setVisible(false);
    this.inventoryButton?.setVisible(false);
    this.sneakButton?.setVisible(false);
    // Keep fullscreen button visible
  }

  destroy(): void {
    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.interactButton?.destroy();
    this.attackButton?.destroy();
    this.inventoryButton?.destroy();
    this.sneakButton?.destroy();
    this.fullscreenButton?.destroy();
  }
}
