// src/literature/index.ts
// Barrel exports for the Literature module
// Story 20.1: Create Literature Browser

export { LiteratureBrowser } from './LiteratureBrowser';
export { ReadingProgressStorage } from './ReadingProgressStorage';
export { HintProgressStorage } from './HintProgressStorage';
export { getHintsForArticle, getHintCount, ARTICLES_WITH_HINTS } from './hintData';
export { getDeepDiveForArticle, ARTICLES_WITH_DEEP_DIVES } from './deepDiveData';
export {
  getDepthLayersForArticle,
  ARTICLES_WITH_DEPTH_LAYERS,
  DEPTH_LAYER_LABELS,
  DEPTH_LAYER_ORDER,
} from './depthLayerData';
export type { DepthLayers, DepthLayerName, AcademicReference, ResourceLink } from './depthLayerData';
export { DepthPreferenceStorage } from './DepthPreferenceStorage';
export {
  CURATED_RESOURCES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
  RESOURCE_TYPE_ORDER,
  getResourcesByType,
  getResourceCount,
  getAllEras,
} from './curatedResources';
export type { CuratedResource, CuratedResourceType } from './curatedResources';
export {
  LITERATURE_ARTICLES,
  CATEGORY_METADATA,
  getArticlesByCategory,
  getArticlesWithMetadata,
  findArticleById,
  getCategoryArticleCount,
  getCategoryTotalReadTime,
  getCategoryStages,
} from './literatureMetadata';
export {
  HELP_CONTEXT_MAP,
  matchesTags,
  getContextFilter,
} from './helpContextMap';
export type {
  LiteratureArticle,
  LiteratureCategory,
  CategoryMetadata,
  LiteratureBrowserCallbacks,
  LiteratureBrowserData,
  HelpContext,
  ContextFilter,
} from './types';
export { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
