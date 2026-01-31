import { DialogueNode, DialogueChoice, NPCData, GameState, ClueType } from '../types';
import { NPC_DATA } from './NPCData';
import dialogueData from './dialogues.json';

interface DialogueTree {
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

interface PlaceholderContext {
  npc: NPCData;
  gameState: GameState;
}

// Process placeholders in text strings
function processPlaceholder(text: string, context: PlaceholderContext): string {
  const { npc } = context;

  // Handle {{npc.name}}
  text = text.replace(/\{\{npc\.name\}\}/g, npc.name);

  // Handle {{npc.secret}}
  text = text.replace(/\{\{npc\.secret\}\}/g, npc.secrets[0] || "I don't know anything else!");

  // Handle {{personality:key}} - look up from templates
  text = text.replace(/\{\{personality:(\w+)\}\}/g, (_match, key) => {
    const templates = dialogueData.templates as Record<string, Record<string, string>>;
    if (templates[key] && templates[key][npc.personality]) {
      return templates[key][npc.personality];
    }
    return text;
  });

  return text;
}

// Get mask info based on NPC's knowledge or personality default
function getMaskInfo(npc: NPCData): string {
  const info = npc.knownInfo.find(i => i.toLowerCase().includes('mask'));
  if (info) return info;

  const templates = dialogueData.templates as Record<string, Record<string, string>>;
  return templates.maskResponses[npc.personality];
}

// Get location info based on NPC's knowledge
function getLocationInfo(npc: NPCData): string {
  const locationDescriptions = dialogueData.locationDescriptions as Record<string, string>;

  const info = npc.knownInfo.find(i =>
    i.toLowerCase().includes('garden') ||
    i.toLowerCase().includes('library') ||
    i.toLowerCase().includes('cellar') ||
    i.toLowerCase().includes('ballroom')
  );

  if (info) {
    return `${locationDescriptions[npc.frequentedRoom]} ${info}`;
  }

  return locationDescriptions[npc.frequentedRoom];
}

// Get behavior info based on NPC's knowledge or personality default
function getBehaviorInfo(npc: NPCData): string {
  const info = npc.knownInfo.find(i =>
    i.toLowerCase().includes('nervous') ||
    i.toLowerCase().includes('confident') ||
    i.toLowerCase().includes('secretive') ||
    i.toLowerCase().includes('friendly') ||
    i.toLowerCase().includes('aloof') ||
    i.toLowerCase().includes('acting')
  );

  if (info) return info;

  const templates = dialogueData.templates as Record<string, Record<string, string>>;
  return templates.behaviorResponses[npc.personality];
}

// Get threat response based on personality
function getThreatResponse(npc: NPCData): string {
  const templates = dialogueData.templates as Record<string, Record<string, string>>;

  if (npc.personality === 'nervous') {
    let response = templates.threatResponses.nervous;
    response = response.replace('{{npc.secret}}', npc.secrets[0] || "I don't know anything else!");
    return response;
  }

  return templates.threatResponses.default;
}

// Get compliment response based on personality
function getComplimentResponse(npc: NPCData): string {
  const templates = dialogueData.templates as Record<string, Record<string, string>>;

  if (npc.personality === 'friendly' || npc.personality === 'gossipy') {
    return templates.complimentResponses.friendly;
  }

  return templates.complimentResponses.default;
}

// Process dynamic text placeholders for special response types
function processDynamicText(_nodeId: string, text: string, npc: NPCData): string {
  switch (text) {
    case '{{maskInfo}}':
      return getMaskInfo(npc);
    case '{{locationInfo}}':
      return getLocationInfo(npc);
    case '{{behaviorInfo}}':
      return getBehaviorInfo(npc);
    case '{{threatResponse}}':
      return getThreatResponse(npc);
    case '{{complimentResponse}}':
      return getComplimentResponse(npc);
    case '{{npc.knownInfo}}':
      return npc.knownInfo[0] || "I haven't been paying much attention, I'm afraid.";
    default:
      return text;
  }
}

// Generate clue for a topic based on actual target
function getClueForTopic(topic: string, gameState: GameState): ClueType | undefined {
  const target = NPC_DATA.find(n => n.id === gameState.targetId);
  if (!target) return undefined;

  const clueDescriptions = dialogueData.clueDescriptions as Record<string, Record<string, string>>;
  const clueTemplates = dialogueData.clueTemplates as Record<string, string>;

  if (topic === 'masks') {
    const description = clueDescriptions.mask[target.mask];
    return {
      category: 'mask',
      description: clueTemplates.mask.replace('{{description}}', description),
      matchValue: target.mask
    };
  }

  if (topic === 'locations') {
    const description = clueDescriptions.location[target.frequentedRoom];
    return {
      category: 'location',
      description: clueTemplates.location.replace('{{description}}', description),
      matchValue: target.frequentedRoom
    };
  }

  if (topic === 'behavior') {
    const description = clueDescriptions.behavior[target.personality];
    return {
      category: 'behavior',
      description: clueTemplates.behavior.replace('{{description}}', description),
      matchValue: target.personality
    };
  }

  return undefined;
}

// Generate main dialogue choices based on NPC personality
function generateMainChoices(npc: NPCData): DialogueChoice[] {
  const choices: DialogueChoice[] = [...dialogueData.mainChoices];
  const specialChoices = dialogueData.specialChoices as Record<string, {
    text: string;
    nextNodeId: string;
    suspicionChange?: number;
    position?: string;
    forPersonalities: string[];
  }>;

  // Add personality-specific options
  if (specialChoices.threaten.forPersonalities.includes(npc.personality)) {
    choices.push({
      text: specialChoices.threaten.text,
      nextNodeId: specialChoices.threaten.nextNodeId,
      suspicionChange: specialChoices.threaten.suspicionChange
    });
  }

  if (specialChoices.compliment.forPersonalities.includes(npc.personality)) {
    choices.unshift({
      text: specialChoices.compliment.text,
      nextNodeId: specialChoices.compliment.nextNodeId
    });
  }

  // Limit topic choices to 4, then add Leave option
  const topicChoices = choices.slice(0, 4);
  topicChoices.push({
    text: 'Leave',
    nextNodeId: 'exit'
  });

  return topicChoices;
}

// Generate follow-up choices with clue revelation
function generateFollowUpChoices(_npc: NPCData, gameState: GameState, topic: string): DialogueChoice[] {
  const choices: DialogueChoice[] = [];

  // Add clue-revealing choice based on topic
  const clue = getClueForTopic(topic, gameState);
  if (clue) {
    choices.push({
      text: 'Tell me more about that...',
      nextNodeId: 'start',
      revealsClue: clue
    });
  }

  choices.push({
    text: 'Ask something else',
    nextNodeId: 'start'
  });

  choices.push({
    text: 'Leave',
    nextNodeId: 'exit'
  });

  return choices;
}

// Build dialogue node from JSON template
function buildNode(
  nodeId: string,
  npc: NPCData,
  gameState: GameState
): DialogueNode {
  const jsonNodes = dialogueData.nodes as Record<string, {
    id: string;
    speaker: string;
    text: string;
    fallbackText?: string;
    autoAdvance?: string;
    choicesType?: string;
    topic?: string;
  }>;

  const nodeTemplate = jsonNodes[nodeId];
  const context: PlaceholderContext = { npc, gameState };

  // Process speaker placeholder
  const speaker = nodeTemplate.speaker === 'player'
    ? 'player'
    : processPlaceholder(nodeTemplate.speaker, context);

  // Process text placeholder
  let text = processPlaceholder(nodeTemplate.text, context);
  text = processDynamicText(nodeId, text, npc);

  // Build base node
  const node: DialogueNode = {
    id: nodeTemplate.id,
    speaker,
    text
  };

  // Add auto-advance if present
  if (nodeTemplate.autoAdvance) {
    node.autoAdvance = nodeTemplate.autoAdvance;
  }

  // Generate choices based on choicesType
  if (nodeTemplate.choicesType) {
    switch (nodeTemplate.choicesType) {
      case 'main':
        node.choices = generateMainChoices(npc);
        break;
      case 'followUp':
        node.choices = generateFollowUpChoices(npc, gameState, nodeTemplate.topic || '');
        break;
      case 'threatExit':
        node.choices = [{
          text: 'Leave them be',
          nextNodeId: 'exit',
          suspicionChange: npc.personality === 'nervous' ? 5 : 15
        }];
        break;
      case 'none':
        node.choices = [];
        break;
    }
  }

  return node;
}

export function getDialogueForNPC(npc: NPCData, gameState: GameState): DialogueTree {
  // Simple dialogue for NPCs without rich dialogue
  if (!npc.hasRichDialogue) {
    return getSimpleDialogue(npc);
  }

  // Build all nodes from JSON templates
  const nodeIds = Object.keys(dialogueData.nodes);
  const nodes: Record<string, DialogueNode> = {};

  for (const nodeId of nodeIds) {
    nodes[nodeId] = buildNode(nodeId, npc, gameState);
  }

  return {
    startNodeId: 'start',
    nodes
  };
}

function getSimpleDialogue(npc: NPCData): DialogueTree {
  const simpleResponses = dialogueData.simpleDialogue as Record<string, string>;

  return {
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: npc.name,
        text: simpleResponses[npc.personality],
        choices: [
          { text: 'Leave', nextNodeId: 'exit' }
        ]
      }
    }
  };
}
