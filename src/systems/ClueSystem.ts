import { GameScene } from '../scenes/GameScene';
import { ClueType } from '../types';

export class ClueSystem {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  discoverClue(clue: ClueType): void {
    // Check if we already have a clue in this category (max 1 per category, 3 total)
    const alreadyHaveCategory = this.scene.gameState.discoveredClues.some(
      c => c.category === clue.category
    );

    if (alreadyHaveCategory) {
      console.log(`Already have a ${clue.category} clue`);
      return;
    }

    // Add clue
    this.scene.gameState.discoveredClues.push(clue);
    console.log(`New clue discovered: ${clue.description}`);

    // Emit event for UI
    this.scene.events.emit('clueDiscovered', clue);

    // Check if target can be identified
    this.checkIdentification();
  }

  private checkIdentification(): void {
    if (this.scene.gameState.hasIdentifiedTarget) return;

    if (this.scene.maskSystem.checkTargetIdentified()) {
      this.scene.maskSystem.identifyTarget();
    }
  }

  getCluesByCategory(category: 'mask' | 'location' | 'behavior'): ClueType[] {
    return this.scene.gameState.discoveredClues.filter(c => c.category === category);
  }

  hasAllClues(): boolean {
    const categories = ['mask', 'location', 'behavior'];
    return categories.every(cat =>
      this.scene.gameState.discoveredClues.some(c => c.category === cat)
    );
  }

  getClueCount(): number {
    return this.scene.gameState.discoveredClues.length;
  }
}
