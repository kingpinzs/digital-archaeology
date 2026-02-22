// src/story/index.ts
// Export barrel for Story Mode components

export { StoryModeContainer } from './StoryModeContainer';
export type { StoryModeContainerOptions } from './StoryModeContainer';
export { StoryNav } from './StoryNav';
export type { StoryNavOptions } from './StoryNav';
export { YourRolePanel } from './YourRolePanel';
export { StoryContent } from './StoryContent';
export { ChapterHeader } from './ChapterHeader';
export { SceneSetting } from './SceneSetting';
export { CharacterCard } from './CharacterCard';
export { DialogueBlock } from './DialogueBlock';
export { ChoiceCard } from './ChoiceCard';
export { TechnicalNote } from './TechnicalNote';
export { EnterLabButton } from './EnterLabButton';
export { StoryActionsFooter } from './StoryActionsFooter';
export { ChallengeObjectives } from './ChallengeObjectives';
export type { RoleData, DiscoveryBadge, ChapterData, SceneSettingData, CharacterData, CharacterStat, DialogueData, ChoiceData, TechnicalNoteData, ChallengeData, ChallengeObjective, PersonaConstraint, PersonaData, SimulatorType, ChallengeContext } from './types';

// Story 10.14: Story content data structures and loader
export { StoryLoader, isStoryAct, isStoryChapter, isStoryScene, isStoryContent, isBranchContent, validateStoryContent } from './StoryLoader';
export type { StoryContent as StoryContentData, StoryAct, StoryChapter, StoryScene, StoryMetadata, ValidationResult, CpuStage, SceneType } from './content-types';
export { StoryLoadError, StoryValidationError } from './content-types';

// Story 10.15: Story progression engine
export { StoryEngine } from './StoryEngine';
export type { StoryStateChangedEvent, PersonaChangedEvent, MindsetChangedEvent } from './StoryEngine';
export { StoryStorage, STORY_STORAGE_KEY } from './StoryStorage';
export type { StoryPosition, StoryChoice, StoryProgress, StoryEngineState } from './StoryState';
export { createDefaultProgress, createDefaultEngineState } from './StoryState';

// Story 10.18: Historical Personas System
export { PersonaCard } from './PersonaCard';

// Story 10.19: Persona Profile Panel
export { PersonaProfilePanel } from './PersonaProfilePanel';

// Story 10.20: Persona Transition Narratives
export { PersonaTransitionPanel } from './PersonaTransitionPanel';
export type { PersonaTransitionPanelOptions } from './PersonaTransitionPanel';
export type { TransitionData } from './types';

// Story 10.16: Era badge and progress display
export { EraBadge } from './EraBadge';
export { ProgressDots } from './ProgressDots';
export type { ActProgress, ProgressDisplayData } from './ProgressDisplay';
export { createProgressDisplayData } from './ProgressDisplay';

// Story 10.17: Story Mode integration
export { StoryController } from './StoryController';
export type { StoryControllerCallbacks } from './StoryController';
export { SceneRenderer } from './SceneRenderer';
export type { SceneRenderContext, SceneRendererCallbacks } from './SceneRenderer';

// Phase 2: Story Browser for act/chapter navigation
export { StoryBrowser } from './StoryBrowser';
export type { StoryBrowserCallbacks, StoryBrowserData } from './StoryBrowser';

// Phase 3: Story Journal for journey log
export { StoryJournal } from './StoryJournal';
export type { StoryJournalCallbacks, StoryJournalData } from './StoryJournal';

// Story 10.21: Historical Mindset Time-Travel
export { MindsetProvider } from './MindsetProvider';
export { EraContextPanel } from './EraContextPanel';
export { HistoricalDecisionCard } from './HistoricalDecisionCard';
export { AnachronismFilter, createEraFilter } from './AnachronismFilter';
export { MindsetIntroScene } from './MindsetIntroScene';
export type { MindsetIntroSceneOptions } from './MindsetIntroScene';
export type { AnachronismResult, AnachronismMatch, AnachronismFilterOptions } from './AnachronismFilter';
export type { MindsetContext, EraTechnology, EraConstraint, EraProblem, HistoricalOption, HistoricalDecision } from './types';

// Story 10.22: Decision-Maker + Builder Mode
export { DecisionMakerScene } from './DecisionMakerScene';
export { BuilderModeScene } from './BuilderModeScene';
export { ConsequenceRevealPanel } from './ConsequenceRevealPanel';
export type { DecisionBuilderCycleEvent } from './StoryEngine';
export type { BuilderChallengeData, BranchContent } from './content-types';

// Story 10.23: First Discoverer's Mind Experience
export { DiscovererExperience } from './DiscovererExperience';
export type { DiscovererPhase } from './DiscovererExperience';
export { DISCOVERER_COMPLETE_KEY } from './StoryStorage';

// Time Travel Portal
export { TimeTravelPortal } from './TimeTravelPortal';
export type { PortalMode } from './TimeTravelPortal';

// Story 26.8: Time-Travel Replay
export { ReplayPanel } from './ReplayPanel';
export type { ReplayPanelCallbacks, ReplayPanelData } from './ReplayPanel';
export type { TimelineEntry } from './StoryState';
