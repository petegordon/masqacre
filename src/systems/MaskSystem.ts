import { GameScene } from '../scenes/GameScene';
import { NPCData, MaskType } from '../types';
import { NPC_DATA } from '../data/NPCData';

export class MaskSystem {
  private scene: GameScene;
  private targetNPC: NPCData | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  selectRandomTarget(): void {
    // Select random NPC as target
    const eligibleNPCs = NPC_DATA.filter(npc => !npc.id.startsWith('guard'));
    const targetIndex = Math.floor(Math.random() * eligibleNPCs.length);
    this.targetNPC = { ...eligibleNPCs[targetIndex], isTarget: true };

    // Store target ID
    this.scene.gameState.targetId = this.targetNPC.id;

    // Update NPC data to mark target
    NPC_DATA.forEach((npc, index) => {
      if (npc.id === this.targetNPC!.id) {
        NPC_DATA[index] = { ...npc, isTarget: true };
      } else {
        NPC_DATA[index] = { ...npc, isTarget: false };
      }
    });

    console.log(`Target selected: ${this.targetNPC.name} (${this.targetNPC.mask} mask)`);
  }

  getTarget(): NPCData | null {
    return this.targetNPC;
  }

  getTargetClues(): { mask: string; location: string; behavior: string } {
    if (!this.targetNPC) {
      return { mask: 'Unknown', location: 'Unknown', behavior: 'Unknown' };
    }

    const maskDescriptions: Record<MaskType, string> = {
      red: 'a crimson mask, like blood',
      blue: 'a sapphire mask, like the sea',
      green: 'an emerald mask, like the forest',
      gold: 'a golden mask, gleaming bright',
      silver: 'a silver mask, like moonlight',
      purple: 'a purple mask, regal and dark',
      black: 'a black mask, hiding in shadow',
      white: 'a white mask, pure and pale'
    };

    const locationDescriptions: Record<string, string> = {
      ballroom: 'often seen dancing in the ballroom',
      garden: 'frequently found in the garden',
      library: 'tends to lurk in the library',
      cellar: 'sometimes disappears to the cellar'
    };

    const personalityDescriptions: Record<string, string> = {
      nervous: 'seems nervous and on edge',
      confident: 'carries themselves with confidence',
      secretive: 'appears secretive and guarded',
      gossipy: 'talks to everyone they meet',
      aloof: 'keeps to themselves, aloof',
      friendly: 'is friendly to all guests'
    };

    return {
      mask: maskDescriptions[this.targetNPC.mask],
      location: locationDescriptions[this.targetNPC.frequentedRoom],
      behavior: personalityDescriptions[this.targetNPC.personality]
    };
  }

  checkTargetIdentified(): boolean {
    const clues = this.scene.gameState.discoveredClues;

    // Need at least one clue from each category
    const hasMaskClue = clues.some(c => c.category === 'mask');
    const hasLocationClue = clues.some(c => c.category === 'location');
    const hasBehaviorClue = clues.some(c => c.category === 'behavior');

    if (hasMaskClue && hasLocationClue && hasBehaviorClue) {
      // Check if clues match target
      const maskMatch = clues.some(c =>
        c.category === 'mask' && c.matchValue === this.targetNPC?.mask
      );
      const locationMatch = clues.some(c =>
        c.category === 'location' && c.matchValue === this.targetNPC?.frequentedRoom
      );
      const behaviorMatch = clues.some(c =>
        c.category === 'behavior' && c.matchValue === this.targetNPC?.personality
      );

      return maskMatch && locationMatch && behaviorMatch;
    }

    return false;
  }

  identifyTarget(): void {
    this.scene.gameState.hasIdentifiedTarget = true;

    // Add visual indicator to target NPC
    const targetNPC = this.scene.npcs.find(npc => npc.data.id === this.targetNPC?.id);
    if (targetNPC) {
      targetNPC.markAsTarget();
    }

    this.scene.events.emit('targetIdentified');
  }
}
