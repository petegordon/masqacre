import { NPCData, MaskType, RoomId } from '../types';

export const NPC_DATA: NPCData[] = [
  // Ballroom NPCs (6)
  {
    id: 'lord_ashford',
    name: 'Lord Ashford',
    mask: 'gold',
    personality: 'confident',
    frequentedRoom: 'ballroom',
    secrets: ['Had an affair with the Countess', 'Owes gambling debts'],
    knownInfo: ['Lord Vermillion seems nervous tonight', 'The one in green frequents the library']
  },
  {
    id: 'lord_vermillion',
    name: 'Lord Vermillion',
    mask: 'red',
    personality: 'nervous',
    frequentedRoom: 'ballroom',
    secrets: ['Knows about the host\'s blackmail scheme', 'Witnessed a crime'],
    knownInfo: ['Someone in a purple mask has been acting secretive', 'The gold-masked lord is not to be trusted'],
    hasRichDialogue: true,
    portrait: 'portrait_lord_vermillion'
  },
  {
    id: 'count_moravec',
    name: 'Count Moravec',
    mask: 'purple',
    personality: 'secretive',
    frequentedRoom: 'ballroom',
    secrets: ['Is actually a foreign spy', 'Carries a hidden weapon'],
    knownInfo: ['The one in silver keeps to the garden', 'A blue-masked guest seems very friendly']
  },
  {
    id: 'duchess_fontaine',
    name: 'Duchess Fontaine',
    mask: 'white',
    personality: 'gossipy',
    frequentedRoom: 'ballroom',
    secrets: ['Spreads rumors for political gain'],
    knownInfo: ['Everyone! The black mask stays in the cellar', 'The green one is very aloof'],
    hasRichDialogue: true,
    portrait: 'portrait_duchess_fontaine'
  },
  {
    id: 'sir_blackwood',
    name: 'Sir Blackwood',
    mask: 'black',
    personality: 'aloof',
    frequentedRoom: 'ballroom',
    secrets: ['Planning to rob the vault tonight'],
    knownInfo: ['I prefer not to gossip']
  },
  {
    id: 'madame_azure',
    name: 'Madame Azure',
    mask: 'blue',
    personality: 'friendly',
    frequentedRoom: 'ballroom',
    secrets: ['Is gathering information for a rival family'],
    knownInfo: ['The red mask appears quite nervous', 'Gold and purple masks are often together']
  },

  // Garden NPCs (4)
  {
    id: 'baron_sterling',
    name: 'Baron Sterling',
    mask: 'silver',
    personality: 'aloof',
    frequentedRoom: 'garden',
    secrets: ['Meeting someone in secret', 'Has enemies at the party'],
    knownInfo: ['The fresh air suits me. Some guests seem... on edge tonight']
  },
  {
    id: 'miss_evergreen',
    name: 'Miss Evergreen',
    mask: 'green',
    personality: 'nervous',
    frequentedRoom: 'garden',
    secrets: ['Hiding from someone at the party'],
    knownInfo: ['I saw the purple mask sneaking about', 'The library is quiet, but someone lurks there'],
    hasRichDialogue: true,
    portrait: 'portrait_miss_evergreen'
  },
  {
    id: 'professor_crane',
    name: 'Professor Crane',
    mask: 'white',
    personality: 'friendly',
    frequentedRoom: 'garden',
    secrets: ['Working on a dangerous experiment'],
    knownInfo: ['A gold-masked gentleman has a confident stride', 'The cellar is off-limits, they say']
  },
  {
    id: 'lady_rose',
    name: 'Lady Rose',
    mask: 'red',
    personality: 'gossipy',
    frequentedRoom: 'garden',
    secrets: ['Spreading misinformation deliberately'],
    knownInfo: ['The blue mask is ever so friendly', 'Silver keeps to themselves in the garden']
  },

  // Library NPCs (4)
  {
    id: 'doctor_grimm',
    name: 'Doctor Grimm',
    mask: 'black',
    personality: 'secretive',
    frequentedRoom: 'library',
    secrets: ['Knows the party\'s true purpose', 'Has documents hidden in the library'],
    knownInfo: ['Knowledge is power. The nervous ones know something']
  },
  {
    id: 'viscount_azure',
    name: 'Viscount Azure',
    mask: 'blue',
    personality: 'confident',
    frequentedRoom: 'library',
    secrets: ['Looking for blackmail material'],
    knownInfo: ['I\'ve noticed the green mask seems nervous', 'The cellar holds interesting secrets'],
    hasRichDialogue: true,
    portrait: 'portrait_viscount_azure'
  },
  {
    id: 'miss_violet',
    name: 'Miss Violet',
    mask: 'purple',
    personality: 'aloof',
    frequentedRoom: 'library',
    secrets: ['Actually illiterate, pretending to read'],
    knownInfo: ['The ballroom is full of gossips', 'Trust no one in gold']
  },
  {
    id: 'lord_emerald',
    name: 'Lord Emerald',
    mask: 'green',
    personality: 'friendly',
    frequentedRoom: 'library',
    secrets: ['Meeting someone secretly'],
    knownInfo: ['The silver mask in the garden seems lonely', 'Red masks tend to be nervous types']
  },

  // Cellar NPCs (3)
  {
    id: 'smuggler_jack',
    name: 'Mysterious Stranger',
    mask: 'black',
    personality: 'secretive',
    frequentedRoom: 'cellar',
    secrets: ['Running illegal goods through the party'],
    knownInfo: ['People don\'t come here often. The confident ones have something to hide']
  },
  {
    id: 'wine_merchant',
    name: 'Wine Merchant',
    mask: 'gold',
    personality: 'gossipy',
    frequentedRoom: 'cellar',
    secrets: ['Watering down the wine'],
    knownInfo: ['I see everyone who sneaks down here. Purple and black masks visit often'],
    hasRichDialogue: true,
    portrait: 'portrait_wine_merchant'
  },
  {
    id: 'servant_maria',
    name: 'Maria the Servant',
    mask: 'white',
    personality: 'nervous',
    frequentedRoom: 'cellar',
    secrets: ['Overheard the murder plot'],
    knownInfo: ['I know more than I should... the friendly ones are not what they seem']
  }
];

// Helper to get NPC by ID
export function getNPCById(id: string): NPCData | undefined {
  return NPC_DATA.find(npc => npc.id === id);
}

// Helper to get NPCs by room
export function getNPCsByRoom(room: RoomId): NPCData[] {
  return NPC_DATA.filter(npc => npc.frequentedRoom === room);
}

// Helper to get NPCs by mask color
export function getNPCsByMask(mask: MaskType): NPCData[] {
  return NPC_DATA.filter(npc => npc.mask === mask);
}
