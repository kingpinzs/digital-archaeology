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
export type { RoleData, DiscoveryBadge, ChapterData, SceneSettingData, CharacterData, CharacterStat, DialogueData, ChoiceData, TechnicalNoteData, ChallengeData, ChallengeObjective } from './types';

// Story 10.14: Story content data structures and loader
export { StoryLoader, isStoryAct, isStoryChapter, isStoryScene, isStoryContent, validateStoryContent } from './StoryLoader';
export type { StoryContent as StoryContentData, StoryAct, StoryChapter, StoryScene, StoryMetadata, ValidationResult, CpuStage, SceneType } from './content-types';
export { StoryLoadError, StoryValidationError } from './content-types';

// Story 10.15: Story progression engine
export { StoryEngine } from './StoryEngine';
export type { StoryStateChangedEvent } from './StoryEngine';
export { StoryStorage, STORY_STORAGE_KEY } from './StoryStorage';
export type { StoryPosition, StoryChoice, StoryProgress, StoryEngineState } from './StoryState';
export { createDefaultProgress, createDefaultEngineState } from './StoryState';
