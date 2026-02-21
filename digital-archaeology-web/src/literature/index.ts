// src/literature/index.ts
// Barrel exports for the Literature module
// Story 20.1: Create Literature Browser

export { LiteratureBrowser } from './LiteratureBrowser';
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
export type {
  LiteratureArticle,
  LiteratureCategory,
  CategoryMetadata,
  LiteratureBrowserCallbacks,
  LiteratureBrowserData,
} from './types';
export { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
