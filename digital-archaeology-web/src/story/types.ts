// src/story/types.ts
// Type definitions for Story Mode components
// Story 10.4: Create "Your Role" Panel
// Story 10.5: Create Chapter Header Component
// Story 10.6: Create Scene Setting Component
// Story 10.7: Create Character Card Component
// Story 10.8: Create Dialogue Block Component
// Story 10.9: Create Choice Card Component
// Story 10.10: Create Technical Note Component
// Story 10.13: Create Challenge Objectives in Lab Mode
// Story 10.18: Create Historical Personas System
// Story 10.21: Historical Mindset Time-Travel

/**
 * Represents a discovery badge earned by the player.
 */
export interface DiscoveryBadge {
  /** Unique identifier for the discovery */
  id: string;
  /** Display name of the discovery */
  name: string;
  /** Emoji or icon class for the badge */
  icon: string;
  /** When the discovery was earned (optional) */
  earnedAt?: Date;
}

/**
 * Represents the player's role/character data in the story.
 */
export interface RoleData {
  /** Character name (e.g., "Junior Engineer") */
  name: string;
  /** Historical era (e.g., "1971") */
  era: string;
  /** Company/location (e.g., "Fairchild Semiconductor") */
  location: string;
  /** Current story progress (e.g., "Act 1 / Chapter 1") */
  progress: string;
  /** Experience level (e.g., "Novice", "Apprentice", "Journeyman") */
  experience: string;
  /** List of earned discoveries */
  discoveries: DiscoveryBadge[];
}

/**
 * Represents chapter information for the story header.
 */
export interface ChapterData {
  /** Act number (displayed as Roman numerals) */
  actNumber: number;
  /** Year for historical context (e.g., "1971") */
  year: string;
  /** Chapter title (e.g., "The Humbling Beginning") */
  title: string;
  /** Subtitle describing the chapter theme */
  subtitle: string;
}

/**
 * Data for a scene setting description.
 */
export interface SceneSettingData {
  /** The scene description text (atmospheric/setting details) */
  text: string;
}

/**
 * A key-value stat displayed on a character card.
 */
export interface CharacterStat {
  /** The stat label (e.g., "Expertise", "Years at Fairchild") */
  label: string;
  /** The stat value (e.g., "Digital Logic, ALU Design", "6") */
  value: string;
}

/**
 * Represents a character/NPC in the story.
 */
export interface CharacterData {
  /** Avatar display - emoji string for MVP (e.g., "👩‍🔬") */
  avatar: string;
  /** Character's full name (e.g., "Dr. Sarah Chen") */
  name: string;
  /** Character's title/role (e.g., "Senior Design Engineer") */
  title: string;
  /** Character's background/bio (2-3 sentences) */
  bio: string;
  /** Key stats displayed at bottom of card */
  stats: CharacterStat[];
}

/**
 * Represents a line of dialogue from a character.
 */
export interface DialogueData {
  /** The name of the speaker (e.g., "Dr. Chen") */
  speaker: string;
  /** The dialogue text spoken by the character */
  text: string;
}

/**
 * Represents a choice option in the story.
 */
export interface ChoiceData {
  /** Unique identifier for this choice */
  id: string;
  /** Emoji or icon character for the choice */
  icon: string;
  /** Short title for the choice (e.g., "Investigate Carry Look-Ahead") */
  title: string;
  /** Longer description explaining the choice */
  description: string;
}

/**
 * Represents a technical note that bridges narrative and technical content.
 * Displayed with blue accent styling matching Lab Mode.
 */
export interface TechnicalNoteData {
  /** The explanatory text content */
  content: string;
  /** Optional inline code snippet to display in monospace font */
  codeSnippet?: string;
}

/**
 * Represents a single objective in a challenge.
 */
export interface ChallengeObjective {
  /** Unique identifier for this objective */
  id: string;
  /** Description of the objective */
  text: string;
  /** Whether the objective is completed */
  completed: boolean;
}

/**
 * Represents challenge data displayed in Lab Mode.
 * Shows story-driven objectives with completion tracking.
 */
export interface ChallengeData {
  /** Challenge title (e.g., "CARRY LOOK-AHEAD") */
  title: string;
  /** List of objectives to complete */
  objectives: ChallengeObjective[];
}

/**
 * Represents a constraint faced by a historical persona.
 * Story 10.18: Create Historical Personas System
 */
export interface PersonaConstraint {
  /** Type of constraint affecting the persona */
  type: 'technical' | 'economic' | 'political' | 'knowledge';
  /** Description of the constraint */
  description: string;
}

/**
 * Represents a historical computing pioneer persona that the user adopts.
 * Used for immersive storytelling where the user "becomes" a historical figure.
 * Story 10.18: Create Historical Personas System
 * Story 10.19: Implement Persona Profile Cards - Extended with keyContribution, photograph, additionalQuotes, discoveriesUnlocked
 */
export interface PersonaData {
  /** Unique identifier (e.g., "faggin-1971") */
  id: string;
  /** Full name (e.g., "Federico Faggin") */
  name: string;
  /** Birth year or years active (e.g., "1941-") */
  years: string;
  /** Era string (e.g., "1970-1971") */
  era: string;
  /** Avatar emoji */
  avatar: string;
  /** Authentic quote from this person */
  quote: string;
  /** Background/biography paragraph */
  background: string;
  /** What drove them (motivation) */
  motivation: string;
  /** Constraints they faced */
  constraints: PersonaConstraint[];
  /** The problem they were trying to solve */
  problem: string;
  /** Optional: speech pattern hints for dialogue */
  speechPattern?: string;

  // Story 10.19: Extended fields for Persona Profile Cards
  /** 1-2 sentence summary of their main achievement (Story 10.19) */
  keyContribution?: string;
  /** URL to historical photograph, uses avatar as fallback if not provided (Story 10.19) */
  photograph?: string;
  /** Additional authentic quotes for carousel display (Story 10.19) */
  additionalQuotes?: string[];
  /** Discovery IDs unlocked during this era, updated dynamically (Story 10.19) */
  discoveriesUnlocked?: string[];
}

/**
 * Represents transition data between historical eras/personas.
 * Used for narrative bridges when moving between acts.
 * Story 10.20: Create Persona Transition Narratives
 */
export interface TransitionData {
  /** Outgoing persona ID (e.g., "babbage-1837") */
  outgoingPersonaId: string;
  /** Incoming persona ID (e.g., "zuse-1941") */
  incomingPersonaId: string;
  /** Years elapsed between eras (e.g., 104 for 1837→1941) */
  yearsElapsed: number;
  /** Narrative paragraphs explaining the passage of time */
  narrative: string[];
  /** Quote from outgoing persona about their legacy */
  outgoingQuote?: string;
  /** Quote from incoming persona about their inspiration */
  incomingQuote?: string;
  /** Era label for outgoing persona (e.g., "Mechanical") */
  outgoingEra: string;
  /** Era label for incoming persona (e.g., "Relay") */
  incomingEra: string;
}

/**
 * Represents a technology or concept available in a specific era.
 * Used for anachronism filtering and mindset establishment.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraTechnology {
  /** Technology name (e.g., "transistor", "integrated circuit") */
  name: string;
  /** Year invented/discovered */
  yearInvented: number;
  /** Year became commonly known/used */
  yearCommon: number;
  /** What it replaced or built upon */
  predecessors?: string[];
  /** Period-accurate terminology variants */
  periodTerms?: { year: number; term: string }[];
}

/**
 * Represents a constraint faced in a specific historical era.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraConstraint {
  /** Type of constraint */
  type: 'technical' | 'economic' | 'knowledge' | 'material' | 'political';
  /** Description of the constraint */
  description: string;
  /** Specific limitation (e.g., "64KB max addressable memory") */
  limitation?: string;
}

/**
 * Represents an active problem engineers faced in an era.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraProblem {
  /** Problem statement from their perspective */
  statement: string;
  /** Why this mattered to them */
  motivation: string;
  /** What approaches were being tried */
  currentApproaches?: string[];
}

/**
 * Context for establishing the historical mindset.
 * Filters out anachronisms and frames decisions without hindsight.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface MindsetContext {
  /** The year we're "in" (e.g., 1978) */
  year: number;
  /** Technologies that exist and are known at this time */
  knownTechnology: string[];
  /** Technologies that don't exist yet (concepts we must NOT reference) */
  unknownTechnology: string[];
  /** Active engineering problems people are working on */
  activeProblems: EraProblem[];
  /** Constraints engineers work under */
  constraints: EraConstraint[];
  /** Things that are impossible at this time (not just difficult) */
  impossibilities: string[];
  /** Historical perspective framing */
  historicalPerspective: {
    /** What knowledge is available to someone in this year */
    currentKnowledge: string;
    /** Explicit statement that we don't know the future */
    futureBlind: string;
  };
}

/**
 * Option for a historical decision without revealing history's choice.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface HistoricalOption {
  /** Option ID */
  id: string;
  /** Option description (period-accurate framing) */
  description: string;
  /** Pros visible from the era's perspective */
  visiblePros: string[];
  /** Cons visible from the era's perspective */
  visibleCons: string[];
  /** Is this what history chose? (hidden until reveal) */
  isHistorical: boolean;
}

/**
 * Decision card that presents choices WITHOUT revealing history's path.
 * Only after user chooses do we reveal what actually happened.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface HistoricalDecision {
  /** Decision ID */
  id: string;
  /** The decision framed from the era's perspective */
  question: string;
  /** Context explaining why this matters NOW (in that year) */
  context: string;
  /** Available options without historical outcome hints */
  options: HistoricalOption[];
  /** What history actually chose (revealed after user picks) */
  historicalChoice: string;
  /** Outcome of historical choice (revealed after) */
  historicalOutcome: string;
  /** What might have happened with other choices */
  alternateOutcomes: { optionId: string; speculation: string }[];
}
