import { DialogueNode, DialogueChoice, NPCData, GameState, ClueType } from '../types';
import { NPC_DATA } from './NPCData';

interface DialogueTree {
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export function getDialogueForNPC(npc: NPCData, gameState: GameState): DialogueTree {
  // Base greeting based on personality
  const greetings: Record<string, string> = {
    nervous: '*fidgets* Oh! You startled me...',
    confident: 'Ah, another guest. What brings you to speak with me?',
    secretive: '*eyes you carefully* ...Yes?',
    gossipy: 'Oh my, have you heard the latest? There\'s so much to discuss!',
    aloof: '*barely acknowledges you* Hmm.',
    friendly: 'Hello there! Lovely party, isn\'t it? How may I help you?'
  };

  // Simple dialogue for NPCs without rich dialogue
  if (!npc.hasRichDialogue) {
    return getSimpleDialogue(npc);
  }

  // Create dynamic dialogue based on NPC knowledge
  const nodes: Record<string, DialogueNode> = {
    start: {
      id: 'start',
      speaker: npc.name,
      text: greetings[npc.personality],
      choices: generateMainChoices(npc, gameState)
    },
    ask_about_guests: {
      id: 'ask_about_guests',
      speaker: 'player',
      text: 'Have you noticed anything interesting about the other guests?',
      autoAdvance: 'guests_response'
    },
    guests_response: {
      id: 'guests_response',
      speaker: npc.name,
      text: npc.knownInfo[0] || 'I haven\'t been paying much attention, I\'m afraid.',
      choices: generateFollowUpChoices(npc, gameState, 'guests')
    },
    ask_about_masks: {
      id: 'ask_about_masks',
      speaker: 'player',
      text: 'I\'m trying to find someone specific. Any distinctive masks you\'ve noticed?',
      autoAdvance: 'masks_response'
    },
    masks_response: {
      id: 'masks_response',
      speaker: npc.name,
      text: getMaskInfo(npc, gameState),
      choices: generateFollowUpChoices(npc, gameState, 'masks')
    },
    ask_about_locations: {
      id: 'ask_about_locations',
      speaker: 'player',
      text: 'Where do people tend to gather at this party?',
      autoAdvance: 'locations_response'
    },
    locations_response: {
      id: 'locations_response',
      speaker: npc.name,
      text: getLocationInfo(npc),
      choices: generateFollowUpChoices(npc, gameState, 'locations')
    },
    ask_about_behavior: {
      id: 'ask_about_behavior',
      speaker: 'player',
      text: 'Anyone acting strangely tonight?',
      autoAdvance: 'behavior_response'
    },
    behavior_response: {
      id: 'behavior_response',
      speaker: npc.name,
      text: getBehaviorInfo(npc),
      choices: generateFollowUpChoices(npc, gameState, 'behavior')
    },
    threaten: {
      id: 'threaten',
      speaker: 'player',
      text: '*moves closer menacingly* I think you know more than you\'re telling me...',
      autoAdvance: 'threaten_response'
    },
    threaten_response: {
      id: 'threaten_response',
      speaker: npc.name,
      text: npc.personality === 'nervous'
        ? '*trembles* Please, I\'ll tell you what I know! ' + (npc.secrets[0] || 'I don\'t know anything else!')
        : 'Are you threatening me? At a party? How gauche. *backs away*',
      choices: [
        { text: 'Leave them be', nextNodeId: 'exit', suspicionChange: npc.personality === 'nervous' ? 5 : 15 }
      ]
    },
    compliment: {
      id: 'compliment',
      speaker: 'player',
      text: 'That\'s a lovely mask you\'re wearing. It suits you.',
      autoAdvance: 'compliment_response'
    },
    compliment_response: {
      id: 'compliment_response',
      speaker: npc.name,
      text: npc.personality === 'friendly' || npc.personality === 'gossipy'
        ? '*smiles* How kind! Speaking of masks, have you seen the others? So varied tonight!'
        : 'Thank you. Yours is... adequate.',
      choices: generateFollowUpChoices(npc, gameState, 'compliment')
    },
    farewell: {
      id: 'farewell',
      speaker: 'player',
      text: 'Thank you for your time. Enjoy the party.',
      autoAdvance: 'farewell_response'
    },
    farewell_response: {
      id: 'farewell_response',
      speaker: npc.name,
      text: getFarewellResponse(npc),
      choices: []
    }
  };

  return {
    startNodeId: 'start',
    nodes
  };
}

function generateMainChoices(npc: NPCData, _gameState: GameState): DialogueChoice[] {
  const choices: DialogueChoice[] = [
    {
      text: 'Ask about other guests',
      nextNodeId: 'ask_about_guests'
    },
    {
      text: 'Ask about masks',
      nextNodeId: 'ask_about_masks'
    },
    {
      text: 'Ask about where people gather',
      nextNodeId: 'ask_about_locations'
    },
    {
      text: 'Ask if anyone is acting strangely',
      nextNodeId: 'ask_about_behavior'
    }
  ];

  // Add personality-specific options
  if (npc.personality === 'nervous') {
    choices.push({
      text: 'Threaten them *risky*',
      nextNodeId: 'threaten',
      suspicionChange: 10
    });
  }

  if (npc.personality === 'friendly' || npc.personality === 'gossipy') {
    choices.unshift({
      text: 'Compliment their mask',
      nextNodeId: 'compliment'
    });
  }

  // Limit topic choices to 4, then always add Leave option
  const topicChoices = choices.slice(0, 4);
  topicChoices.push({
    text: 'Leave',
    nextNodeId: 'exit'
  });

  return topicChoices;
}

function generateFollowUpChoices(npc: NPCData, gameState: GameState, topic: string): DialogueChoice[] {
  const choices: DialogueChoice[] = [];

  // Add clue-revealing choice based on topic
  const clue = getClueForTopic(npc, topic, gameState);
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

function getMaskInfo(npc: NPCData, _gameState: GameState): string {
  const info = npc.knownInfo.find(i => i.toLowerCase().includes('mask'));

  if (info) {
    return info;
  }

  // Generic responses by personality
  const responses: Record<string, string> = {
    nervous: 'I try not to stare at people... but yes, many colorful masks tonight.',
    confident: 'The masks are quite varied. Gold, silver, red, blue... all manner of colors.',
    secretive: 'I pay attention to faces, not masks.',
    gossipy: 'Oh yes! There\'s gold, purple, red... the purple one is particularly mysterious!',
    aloof: 'I haven\'t been looking at masks.',
    friendly: 'So many beautiful masks! The red ones stand out, and the gold is quite striking.'
  };

  return responses[npc.personality];
}

function getLocationInfo(npc: NPCData): string {
  const roomDescriptions: Record<string, string> = {
    ballroom: 'The ballroom is the heart of the party, of course. Most guests mingle there.',
    garden: 'The garden is peaceful. Some prefer the quiet... or the privacy.',
    library: 'The library attracts the intellectual types. Or those seeking solitude.',
    cellar: 'The cellar? Strange place for guests, but some venture there for the wine...'
  };

  // Mix in what this NPC knows
  const info = npc.knownInfo.find(i =>
    i.toLowerCase().includes('garden') ||
    i.toLowerCase().includes('library') ||
    i.toLowerCase().includes('cellar') ||
    i.toLowerCase().includes('ballroom')
  );

  if (info) {
    return `${roomDescriptions[npc.frequentedRoom]} ${info}`;
  }

  return roomDescriptions[npc.frequentedRoom];
}

function getBehaviorInfo(npc: NPCData): string {
  const info = npc.knownInfo.find(i =>
    i.toLowerCase().includes('nervous') ||
    i.toLowerCase().includes('confident') ||
    i.toLowerCase().includes('secretive') ||
    i.toLowerCase().includes('friendly') ||
    i.toLowerCase().includes('aloof') ||
    i.toLowerCase().includes('acting')
  );

  if (info) {
    return info;
  }

  const responses: Record<string, string> = {
    nervous: 'Everyone seems... suspicious to me. But that\'s probably just me.',
    confident: 'A few guests seem on edge. Nervous types stick out.',
    secretive: 'I observe, but I don\'t share observations freely.',
    gossipy: 'Oh my, yes! Some seem nervous, others too confident for their own good!',
    aloof: 'People act as they always do. Nothing special.',
    friendly: 'Most are enjoying themselves! A few seem nervous though.'
  };

  return responses[npc.personality];
}

function getFarewellResponse(npc: NPCData): string {
  const responses: Record<string, string> = {
    nervous: '*relief visible* Yes, you too... *looks around anxiously*',
    confident: 'Indeed. May fortune favor you this evening.',
    secretive: '...Be careful.',
    gossipy: 'Do come back if you hear anything juicy!',
    aloof: '*nods slightly*',
    friendly: 'Of course! Don\'t be a stranger!'
  };

  return responses[npc.personality];
}

function getClueForTopic(_npc: NPCData, topic: string, gameState: GameState): ClueType | undefined {
  // Find the actual target
  const target = NPC_DATA.find(n => n.id === gameState.targetId);
  if (!target) return undefined;

  // Each topic reveals a clue about the ACTUAL target
  if (topic === 'masks') {
    const maskDescriptions: Record<string, string> = {
      red: 'a crimson mask, like blood',
      blue: 'a sapphire mask, deep as the sea',
      green: 'an emerald mask, like the forest',
      gold: 'a golden mask, gleaming bright',
      silver: 'a silver mask, like moonlight',
      purple: 'a purple mask, dark and regal',
      black: 'a black mask, shrouded in shadow',
      white: 'a white mask, pale as bone'
    };
    return {
      category: 'mask',
      description: `The one you seek wears ${maskDescriptions[target.mask]}`,
      matchValue: target.mask
    };
  }

  if (topic === 'locations') {
    const locationDescriptions: Record<string, string> = {
      ballroom: 'the ballroom, among the dancers',
      garden: 'the garden, among the hedges',
      library: 'the library, among the books',
      cellar: 'the cellar, in the shadows'
    };
    return {
      category: 'location',
      description: `Your target frequents ${locationDescriptions[target.frequentedRoom]}`,
      matchValue: target.frequentedRoom
    };
  }

  if (topic === 'behavior') {
    const behaviorDescriptions: Record<string, string> = {
      nervous: 'nervous and easily startled',
      confident: 'confident and self-assured',
      secretive: 'secretive and guarded',
      gossipy: 'talkative and gossipy',
      aloof: 'aloof and distant',
      friendly: 'friendly and approachable'
    };
    return {
      category: 'behavior',
      description: `The one you hunt is ${behaviorDescriptions[target.personality]}`,
      matchValue: target.personality
    };
  }

  return undefined;
}

function getSimpleDialogue(npc: NPCData): DialogueTree {
  // Simple responses based on personality - these NPCs don't have much to say
  const simpleResponses: Record<string, string> = {
    nervous: '*looks around anxiously* I... I\'d rather not talk right now. Please excuse me.',
    confident: 'I have nothing to discuss with strangers. Good evening.',
    secretive: '*turns away slightly* I prefer to keep to myself.',
    gossipy: 'Oh, I\'m just enjoying the atmosphere! Nothing interesting to share, I\'m afraid.',
    aloof: '*sighs* I\'m not in the mood for conversation.',
    friendly: 'Lovely party! But I really must be going. Enjoy your evening!'
  };

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
