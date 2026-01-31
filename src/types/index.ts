// Game Types

export type RoomId = 'ballroom' | 'garden' | 'library' | 'cellar';

export type NPCState = 'idle' | 'wandering' | 'socializing' | 'curious' | 'suspicious' | 'alarmed';

export type MaskType = 'red' | 'blue' | 'green' | 'gold' | 'silver' | 'purple' | 'black' | 'white';

export type PersonalityTrait = 'nervous' | 'confident' | 'secretive' | 'gossipy' | 'aloof' | 'friendly';

export interface Position {
  x: number;
  y: number;
}

export interface ClueType {
  category: 'mask' | 'location' | 'behavior';
  description: string;
  matchValue: string;
}

export interface NPCData {
  id: string;
  name: string;
  mask: MaskType;
  personality: PersonalityTrait;
  frequentedRoom: RoomId;
  secrets: string[];
  knownInfo: string[]; // Info this NPC knows about others
  isTarget?: boolean;
  hasRichDialogue?: boolean; // Only these NPCs have full dialogue options
}

export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  suspicionChange?: number;
  revealsClue?: ClueType;
  condition?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  autoAdvance?: string; // Next node ID for non-choice dialogue
}

export interface DialogueTree {
  npcId: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface GameState {
  currentRoom: RoomId;
  targetId: string | null;
  discoveredClues: ClueType[];
  suspicionLevel: number;
  timeRemaining: number;
  isGameOver: boolean;
  hasWon: boolean;
  hasIdentifiedTarget: boolean;
}

export interface DoorConfig {
  fromRoom: RoomId;
  toRoom: RoomId;
  fromPosition: Position;
  toPosition: Position; // Spawn position in target room
}

export interface RoomConfig {
  id: RoomId;
  displayName: string;
  tilemapKey: string;
  doors: DoorConfig[];
  npcSpawnPoints: Position[];
  clockPosition: Position;
}
