import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { NPC } from '../entities/NPC';
import { DialogueNode, DialogueChoice } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getDialogueForNPC } from '../data/DialogueData';

// Helper to detect mobile for larger fonts
const isMobile = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export class DialogueScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private npc!: NPC;
  private dialogueBox!: Phaser.GameObjects.Container;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private currentNodeId!: string;
  private dialogueTree!: ReturnType<typeof getDialogueForNPC>;
  private selectedChoice = 0;
  private portrait: Phaser.GameObjects.Image | null = null;
  private textStartX = -290; // X position for text elements

  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: { gameScene: GameScene; npc: NPC }): void {
    this.gameScene = data.gameScene;
    this.npc = data.npc;
  }

  create(): void {
    // Semi-transparent background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Display character portrait if available
    this.createPortrait();

    // Create dialogue box
    this.createDialogueBox();

    // Load dialogue for this NPC
    this.dialogueTree = getDialogueForNPC(this.npc.data, this.gameScene.gameState);
    this.currentNodeId = this.dialogueTree.startNodeId;

    // Display first node
    this.displayNode(this.dialogueTree.nodes[this.currentNodeId]);

    // Set up input
    this.setupInput();
  }

  private createPortrait(): void {
    // Only show portrait for NPCs that have one
    if (!this.npc.data.portrait) return;

    // Portrait should be ~97.5% of screen height (75% * 1.3 = 30% bigger)
    const targetHeight = GAME_HEIGHT * 0.975;

    // Create portrait image on the right side, overlaying the dialogue box
    this.portrait = this.add.image(GAME_WIDTH - 10, GAME_HEIGHT, this.npc.data.portrait);
    this.portrait.setOrigin(1, 1); // Anchor to bottom-right

    // Scale to target height while maintaining aspect ratio
    const scale = targetHeight / this.portrait.height;
    this.portrait.setScale(scale);

    // Set depth to appear above the dialogue box
    this.portrait.setDepth(10);
  }

  private createDialogueBox(): void {
    this.dialogueBox = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 120);

    // Mobile-friendly font sizes
    const mobile = isMobile();
    const speakerFontSize = mobile ? '20px' : '16px';
    const dialogueFontSize = mobile ? '16px' : '13px';

    // Box background - taller to fit all content
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRect(-380, -110, 760, 220);
    bg.lineStyle(3, 0x8b0000);
    bg.strokeRect(-380, -110, 760, 220);
    this.dialogueBox.add(bg);

    // NPC portrait area (mask display) - only show if no large portrait
    if (!this.npc.data.portrait) {
      const portraitBox = this.add.graphics();
      portraitBox.fillStyle(0x333333, 1);
      portraitBox.fillRect(-375, -105, 70, 70);
      portraitBox.lineStyle(2, 0x666666);
      portraitBox.strokeRect(-375, -105, 70, 70);
      this.dialogueBox.add(portraitBox);

      // Mask icon inside portrait
      const maskColors: Record<string, number> = {
        red: 0xff4444, blue: 0x4444ff, green: 0x44ff44,
        gold: 0xffd700, silver: 0xc0c0c0, purple: 0x8844ff,
        black: 0x444444, white: 0xeeeeee
      };
      const mask = this.add.graphics();
      mask.fillStyle(maskColors[this.npc.data.mask] || 0x888888);
      mask.fillEllipse(-340, -70, 40, 25);
      this.dialogueBox.add(mask);
    }

    // Speaker name position - store for use in displayChoices
    this.textStartX = this.npc.data.portrait ? -375 : -290;

    // Speaker name
    this.speakerText = this.add.text(this.textStartX, -100, '', {
      fontFamily: 'Georgia, serif',
      fontSize: speakerFontSize,
      color: '#ffd700'
    });
    this.dialogueBox.add(this.speakerText);

    // Dialogue text
    this.dialogueText = this.add.text(this.textStartX, -70, '', {
      fontFamily: 'monospace',
      fontSize: dialogueFontSize,
      color: '#ffffff',
      wordWrap: { width: 620 },
      lineSpacing: mobile ? 6 : 2
    });
    this.dialogueBox.add(this.dialogueText);
  }

  private displayNode(node: DialogueNode): void {
    // Update speaker name
    const speakerName = node.speaker === 'player' ? 'You' : this.npc.data.name;
    this.speakerText.setText(speakerName);

    // Update dialogue text
    this.dialogueText.setText(node.text);

    // Clear old choices
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.selectedChoice = 0;

    // Display choices or continue prompt
    if (node.choices && node.choices.length > 0) {
      this.displayChoices(node.choices);
    } else if (node.autoAdvance) {
      this.displayContinuePrompt(node.autoAdvance);
    } else {
      this.displayExitPrompt();
    }
  }

  private displayChoices(choices: DialogueChoice[]): void {
    const mobile = isMobile();
    const fontSize = mobile ? '16px' : '12px';
    const lineHeight = mobile ? 32 : 22;
    const startY = mobile ? 5 : -5;

    choices.forEach((choice, index) => {
      // Create a background for better tap target on mobile
      if (mobile) {
        const bg = this.add.graphics();
        bg.fillStyle(0x333344, 0.5);
        bg.fillRoundedRect(this.textStartX - 5, startY + index * lineHeight - 4, 640, lineHeight - 4, 4);
        this.dialogueBox.add(bg);
        this.choiceTexts.push(bg as unknown as Phaser.GameObjects.Text);
      }

      const text = this.add.text(this.textStartX, startY + index * lineHeight, `${index + 1}. ${choice.text}`, {
        fontFamily: 'monospace',
        fontSize: fontSize,
        color: index === this.selectedChoice ? '#ffd700' : '#aaaaaa',
        padding: mobile ? { x: 5, y: 5 } : undefined
      });
      text.setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        this.selectedChoice = index;
        this.updateChoiceHighlight();
      });

      text.on('pointerdown', () => {
        this.selectChoice(index);
      });

      this.dialogueBox.add(text);
      this.choiceTexts.push(text);
    });
  }

  private displayContinuePrompt(nextNodeId: string): void {
    const mobile = isMobile();
    const promptText = mobile ? '[ TAP TO CONTINUE ]' : '[SPACE or ENTER to continue]';
    const fontSize = mobile ? '18px' : '12px';

    // Add a visible button background on mobile
    if (mobile) {
      const bg = this.add.graphics();
      bg.fillStyle(0x8b0000, 0.8);
      bg.fillRoundedRect(-120, 55, 240, 40, 8);
      bg.lineStyle(2, 0xffd700);
      bg.strokeRoundedRect(-120, 55, 240, 40, 8);
      this.dialogueBox.add(bg);
      this.choiceTexts.push(bg as unknown as Phaser.GameObjects.Text);
    }

    const text = this.add.text(0, mobile ? 75 : 70, promptText, {
      fontFamily: 'monospace',
      fontSize: fontSize,
      color: mobile ? '#ffd700' : '#888888',
      fontStyle: mobile ? 'bold' : 'normal'
    });
    text.setOrigin(0.5);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.confirmSelection());
    this.dialogueBox.add(text);
    this.choiceTexts.push(text);

    // Store for auto-advance
    (this as unknown as { pendingAdvance: string }).pendingAdvance = nextNodeId;
  }

  private displayExitPrompt(): void {
    const mobile = isMobile();
    const promptText = mobile ? '[ TAP TO LEAVE ]' : '[SPACE or ENTER to leave]';
    const fontSize = mobile ? '18px' : '12px';

    // Add a visible button background on mobile
    if (mobile) {
      const bg = this.add.graphics();
      bg.fillStyle(0x8b0000, 0.8);
      bg.fillRoundedRect(-100, 55, 200, 40, 8);
      bg.lineStyle(2, 0xffd700);
      bg.strokeRoundedRect(-100, 55, 200, 40, 8);
      this.dialogueBox.add(bg);
      this.choiceTexts.push(bg as unknown as Phaser.GameObjects.Text);
    }

    const text = this.add.text(0, mobile ? 75 : 70, promptText, {
      fontFamily: 'monospace',
      fontSize: fontSize,
      color: mobile ? '#ffd700' : '#888888',
      fontStyle: mobile ? 'bold' : 'normal'
    });
    text.setOrigin(0.5);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.confirmSelection());
    this.dialogueBox.add(text);
    this.choiceTexts.push(text);

    (this as unknown as { pendingAdvance: string | null }).pendingAdvance = null;
  }

  private setupInput(): void {
    // Arrow keys for choice selection
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.choiceTexts.length > 0 && this.getCurrentNode()?.choices) {
        this.selectedChoice = Math.max(0, this.selectedChoice - 1);
        this.updateChoiceHighlight();
      }
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      const node = this.getCurrentNode();
      if (node?.choices) {
        this.selectedChoice = Math.min(node.choices.length - 1, this.selectedChoice + 1);
        this.updateChoiceHighlight();
      }
    });

    // Confirm selection
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-E', () => this.confirmSelection());

    // Number keys for quick selection
    for (let i = 1; i <= 4; i++) {
      this.input.keyboard?.on(`keydown-${i}`, () => {
        const node = this.getCurrentNode();
        if (node?.choices && i <= node.choices.length) {
          this.selectChoice(i - 1);
        }
      });
    }

    // Escape to exit
    this.input.keyboard?.on('keydown-ESC', () => this.endDialogue());
  }

  private getCurrentNode(): DialogueNode | null {
    return this.dialogueTree.nodes[this.currentNodeId] || null;
  }

  private updateChoiceHighlight(): void {
    this.choiceTexts.forEach((text, index) => {
      text.setColor(index === this.selectedChoice ? '#ffd700' : '#aaaaaa');
    });
  }

  private confirmSelection(): void {
    const node = this.getCurrentNode();

    if (node?.choices && node.choices.length > 0) {
      this.selectChoice(this.selectedChoice);
    } else {
      const pendingAdvance = (this as unknown as { pendingAdvance: string | null }).pendingAdvance;
      if (pendingAdvance) {
        this.currentNodeId = pendingAdvance;
        this.displayNode(this.dialogueTree.nodes[this.currentNodeId]);
      } else {
        this.endDialogue();
      }
    }
  }

  private selectChoice(index: number): void {
    const node = this.getCurrentNode();
    if (!node?.choices || !node.choices[index]) return;

    const choice = node.choices[index];

    // Apply suspicion change
    if (choice.suspicionChange) {
      this.gameScene.suspicionSystem.addSuspicion(choice.suspicionChange);
    }

    // Reveal clue if any
    if (choice.revealsClue) {
      this.gameScene.clueSystem.discoverClue(choice.revealsClue);
    }

    // Advance to next node
    if (choice.nextNodeId === 'exit') {
      this.endDialogue();
    } else {
      this.currentNodeId = choice.nextNodeId;
      this.displayNode(this.dialogueTree.nodes[this.currentNodeId]);
    }
  }

  private endDialogue(): void {
    this.scene.stop();
    this.gameScene.endDialogue();
  }
}
