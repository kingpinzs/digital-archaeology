// src/story/content-types.ts
// Type definitions for story content data structures
// Story 10.14: Implement Story Content Data Structure

import type {
  SceneSettingData,
  CharacterData,
  DialogueData,
  ChoiceData,
  TechnicalNoteData,
  ChallengeData,
  ChallengeObjective,
  PersonaData,
  TransitionData,
  MindsetContext,
  HistoricalDecision,
} from './types';

/**
 * Metadata about the story content.
 */
export interface StoryMetadata {
  /** Title of the story (e.g., "Digital Archaeology") */
  title: string;
  /** Author or team name */
  author: string;
  /** ISO date string of last update */
  lastUpdated: string;
}

/** Valid scene types determining which content is primary */
export type SceneType = 'narrative' | 'dialogue' | 'choice' | 'challenge' | 'persona' | 'transition' | 'decision' | 'builder';

/**
 * Data for a chapter or act transition scene.
 * Chapter transitions are lighter (brief narrative + summary).
 * Act transitions are epic (PersonaTransitionPanel with persona swap).
 */
export interface SceneTransitionData {
  /** Outgoing era label (e.g., "Mesopotamia, 3000 BC") */
  outgoingEra: string;
  /** Incoming era label (e.g., "Egypt, 1500 BC") */
  incomingEra: string;
  /** Number of years between eras */
  yearsElapsed: number;
  /** Narrative paragraphs for the time-travel bridge */
  narrative: string[];
  /** Summary of the chapter being left */
  summary?: {
    /** Title of the chapter just completed */
    chapterTitle: string;
    /** Key concepts learned in that chapter */
    concepts: string[];
  };
  /** True = epic act transition using PersonaTransitionPanel */
  actTransition?: boolean;
}

/**
 * Represents a scene within a chapter.
 * Scenes are the atomic units of story content.
 */
export interface StoryScene {
  /** Unique identifier (e.g., "scene-1-1-1") */
  id: string;
  /** Scene type determines which content is primary */
  type: SceneType;
  /** Optional scene setting description */
  setting?: SceneSettingData;
  /** Narrative paragraphs for story text */
  narrative?: string[];
  /** Characters appearing in this scene */
  characters?: CharacterData[];
  /** Dialogue blocks for character speech */
  dialogues?: DialogueData[];
  /** Player choice options */
  choices?: ChoiceData[];
  /** Technical explanations bridging narrative and concepts */
  technicalNotes?: TechnicalNoteData[];
  /** Challenge objectives for Lab Mode */
  challenge?: ChallengeData;
  /** Historical decision for decision scenes (Story 10.22) */
  decision?: HistoricalDecision;
  /** Builder challenge data for builder scenes (Story 10.22) */
  builderChallenge?: BuilderChallengeData;
  /** Persona data for persona introduction scenes (Story 10.18) */
  persona?: PersonaData;
  /** Transition data for transition scenes (chapter/act bridges) */
  transition?: SceneTransitionData;
  /** ID of the next scene (for linear progression) */
  nextScene?: string;
  /** Story 26.14: "IT WORKS!" connection data shown after challenge completion */
  itWorks?: ItWorksData;
}

/**
 * Story 26.14: Type of connection link shown after an "IT WORKS!" moment.
 * - idea: connects to a related concept or topic
 * - thinker: connects to a historical figure who discovered something similar
 * - future: connects to a future technology this enables
 * - next-step: suggests what to try or explore next
 */
export type ConnectionLinkType = 'idea' | 'thinker' | 'future' | 'next-step';

/**
 * Story 26.14: A single connection link within the "IT WORKS!" panel.
 * Represents one thread in the web of knowledge.
 */
export interface ConnectionLink {
  /** Type of connection (determines icon and section grouping) */
  type: ConnectionLinkType;
  /** Human-readable connection text */
  text: string;
  /** Optional act number for "explore this topic" navigation */
  targetActNumber?: number;
}

/**
 * Story 26.14: Data for the "IT WORKS!" connection panel.
 * Shown after a successful discovery/challenge completion to connect
 * the player's achievement to the broader web of computing knowledge.
 */
export interface ItWorksData {
  /** Celebration headline (e.g., "IT WORKS! You built a working ALU!") */
  headline: string;
  /** Connection links to other ideas, thinkers, and future paths */
  connections: ConnectionLink[];
}

/**
 * Data for a builder challenge that follows a decision scene.
 * Links to the decision that led to this challenge and defines
 * what the learner needs to build.
 * Story 10.22: Decision-Maker + Builder Mode
 */
export interface BuilderChallengeData {
  /** Challenge title (e.g., "Build Segment Registers") */
  title: string;
  /** Description of what to build */
  description: string;
  /** ID of the decision that led to this challenge (optional) */
  decisionId?: string;
  /** Objectives to complete in the builder */
  objectives: ChallengeObjective[];
  /** Context string to pass to Lab Mode (optional) */
  labContext?: string;
}

/**
 * Represents a chapter within an act.
 * Chapters group related scenes together.
 */
export interface StoryChapter {
  /** Unique identifier (e.g., "chapter-1-1") */
  id: string;
  /** Chapter number within the act */
  number: number;
  /** Chapter title (e.g., "First Day") */
  title: string;
  /** Chapter subtitle (e.g., "Junior Engineer at Fairchild") */
  subtitle: string;
  /** Year for historical context (e.g., "1971") */
  year: string;
  /** Scenes within this chapter */
  scenes: StoryScene[];
}

/**
 * Valid CPU stages corresponding to the 11-act computing evolution.
 * Pre-microprocessor era (Acts 0-3):
 *   - mechanical: Act 0 - Abacus through Babbage (3000 BC - 1840s)
 *   - relay: Act 1 - Electromechanical era (1890s - 1945)
 *   - vacuum: Act 2 - Vacuum tube computers (1945 - 1955)
 *   - transistor: Act 3 - Semiconductor revolution (1955 - 1970)
 * Microprocessor era (Acts 4-9):
 *   - micro4: Act 4 - First microprocessor (1971)
 *   - micro8: Act 5 - 8-bit era (1974-1978)
 *   - micro16: Act 6 - 16-bit era (1978-1985)
 *   - micro32: Act 7 - 32-bit era (1985-1995)
 *   - micro32p: Act 8 - Pipelined (1989-1995)
 *   - micro32s: Act 9 - Superscalar (1995+)
 * Future computing era (Act 10):
 *   - future: Act 10 - Chiplets, Quantum, Neuromorphic, TPUs, RISC-V (2015+)
 */
export type CpuStage =
  | 'mechanical'
  | 'relay'
  | 'vacuum'
  | 'transistor'
  | 'micro4'
  | 'micro8'
  | 'micro16'
  | 'micro32'
  | 'micro32p'
  | 'micro32s'
  | 'future';

/**
 * Story 26.9: A self-contained alternate timeline path embedded in an act.
 * Contains its own scenes that the player navigates when they branch
 * off the golden path at a specific choice.
 */
export interface BranchContent {
  /** Branch ID (e.g., "branch-stack-machine") */
  id: string;
  /** Human-readable label (e.g., "What if stack machines won?") */
  label: string;
  /** Scene ID where the branch diverges from the golden path */
  divergeSceneId: string;
  /** Choice ID that triggers entry into this branch */
  choiceId: string;
  /** Scenes forming this alternate timeline (ordered) */
  scenes: StoryScene[];
  /** Scene ID where this branch rejoins the golden path (optional) */
  rejoinsAtSceneId?: string;
}

/**
 * Represents an act in the story.
 * Acts are major story divisions corresponding to computing eras.
 * The story spans 10 acts from 3000 BC (abacus) to modern superscalar CPUs.
 */
export interface StoryAct {
  /** Unique identifier (e.g., "act-0", "act-4") */
  id: string;
  /** Act number (0-9) */
  number: number;
  /** Act title (e.g., "The Humbling Beginning") */
  title: string;
  /** Act description/summary */
  description: string;
  /** Historical era (e.g., "1971") */
  era: string;
  /** CPU stage for this act */
  cpuStage: CpuStage;
  /** Chapters within this act */
  chapters: StoryChapter[];
  /** Historical persona the user adopts for this act (Story 10.18) */
  persona?: PersonaData;
  /** Transition narrative from previous era to this one (Story 10.20) */
  transition?: TransitionData;
  /** Historical mindset context for this act (Story 10.21) */
  mindset?: MindsetContext;
  /** Alternate timeline branches available in this act (Story 26.9) */
  branches?: BranchContent[];
}

/**
 * Root container for all story content.
 * Loaded from JSON files in public/story/.
 */
export interface StoryContent {
  /** Schema version for compatibility checking */
  version: string;
  /** Story metadata */
  metadata: StoryMetadata;
  /** All acts in the story */
  acts: StoryAct[];
}

/**
 * Result of content validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Error thrown when story content loading fails.
 */
export class StoryLoadError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StoryLoadError';
    this.cause = cause;
  }
}

/**
 * Error thrown when story content validation fails.
 */
export class StoryValidationError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'StoryValidationError';
    this.errors = errors;
  }
}
