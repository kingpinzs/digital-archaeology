// src/literature/LiteratureBrowser.ts
// Modal browser component for educational literature articles
// Story 20.1: Create Literature Browser

import type {
  LiteratureArticle,
  LiteratureCategory,
  LiteratureBrowserCallbacks,
  LiteratureBrowserData,
  ContextFilter,
} from './types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
import { CATEGORY_METADATA, getCategoryArticleCount, getCategoryTotalReadTime } from './literatureMetadata';
import { matchesTags } from './helpContextMap';
import { getHintsForArticle, ARTICLES_WITH_HINTS } from './hintData';
import { getDeepDiveForArticle, ARTICLES_WITH_DEEP_DIVES } from './deepDiveData';

const EXIT_DURATION_MS = 300;

/** Maps each category to its CSS color variable reference. */
const CATEGORY_COLOR_VARS: Record<LiteratureCategory, string> = {
  basic: 'var(--da-literature-basic)',
  intermediate: 'var(--da-literature-intermediate)',
  advanced: 'var(--da-literature-advanced)',
};

/**
 * Modal browser for browsing and filtering educational literature articles.
 * Follows AchievementGallery/StoryBrowser modal pattern with:
 * - Double-invocation guard on open()
 * - Focus trap and focus restoration
 * - Double rAF for enter animation
 * - Escape/backdrop dismiss
 * - Real-time search + category filtering
 */
export class LiteratureBrowser {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  private callbacks: LiteratureBrowserCallbacks | null = null;
  private articles: readonly LiteratureArticle[] = [];
  private readArticleIds: ReadonlySet<string> = new Set();

  private activeCategory: LiteratureCategory | null = null;
  private searchQuery: string = '';
  private contextFilter: ContextFilter | null = null;

  // Hint system state (Story 20.5)
  private hintProgress: Record<string, number> = {};
  private activeHintArticleId: string | null = null;

  // Deep-dive state (Story 20.6)
  private activeDeepDiveArticleId: string | null = null;

  // Bound handlers for cleanup
  private readonly boundHandleKeydown: (e: KeyboardEvent) => void;
  private readonly boundHandleBackdropClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);
  }

  /**
   * Mount the browser to a parent element. Does not show the modal.
   */
  mount(parent: HTMLElement): void {
    this.container = parent;
  }

  /**
   * Open the modal with article data.
   * Double-invocation guard: if already open, returns early.
   */
  open(data: LiteratureBrowserData, callbacks: LiteratureBrowserCallbacks): void {
    // Double-invocation guard
    if (this.overlay) {
      return;
    }

    this.callbacks = callbacks;
    this.articles = data.articles;
    this.readArticleIds = data.readArticleIds ?? new Set();
    this.activeCategory = null;
    this.searchQuery = '';
    this.contextFilter = data.contextFilter ?? null;
    this.hintProgress = { ...(data.hintProgress ?? {}) };
    this.activeHintArticleId = null;
    this.activeDeepDiveArticleId = null;

    // Save focus for restoration
    this.previouslyFocusedElement = document.activeElement;

    // Build and mount the modal
    this.overlay = this.render();
    if (this.container) {
      this.container.appendChild(this.overlay);
    } else {
      document.body.appendChild(this.overlay);
    }

    // Attach event listeners
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Double rAF for enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.overlay?.classList.add('da-literature-browser--entering');
      });
    });

    // Focus the search input
    const searchInput = this.overlay.querySelector('.da-literature-browser__search') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
    }
  }

  /**
   * Close the modal with exit animation.
   */
  close(): void {
    if (!this.overlay) {
      return;
    }

    this.contextFilter = null;
    this.overlay.classList.remove('da-literature-browser--entering');
    this.overlay.classList.add('da-literature-browser--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
    }, EXIT_DURATION_MS);
  }

  /**
   * Check whether the browser modal is currently open.
   */
  isOpen(): boolean {
    return this.overlay !== null;
  }

  /**
   * Tear down: remove overlay, clear references. Safe to call multiple times.
   * Does NOT fire onClose — programmatic teardown is not a user-initiated close.
   */
  destroy(): void {
    this.removeOverlay(false);
    this.container = null;
    this.callbacks = null;
  }

  // ---------------------------------------------------------------------------
  // Private — rendering
  // ---------------------------------------------------------------------------

  private render(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'da-literature-browser';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'da-literature-browser-title');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-literature-browser__backdrop';
    backdrop.addEventListener('click', this.boundHandleBackdropClick);
    overlay.appendChild(backdrop);

    // Content panel
    const content = document.createElement('div');
    content.className = 'da-literature-browser__content';
    overlay.appendChild(content);

    // Header
    content.appendChild(this.renderHeader());

    // Filters
    content.appendChild(this.renderFilters());

    // Context banner (Story 20.3)
    if (this.contextFilter) {
      content.appendChild(this.renderContextBanner());
    }

    // Grid
    const grid = this.renderGrid(this.getFilteredArticles());
    grid.className = 'da-literature-browser__grid';
    content.appendChild(grid);

    return overlay;
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-literature-browser__header';

    const title = document.createElement('h2');
    title.id = 'da-literature-browser-title';
    title.className = 'da-literature-browser__title';
    title.textContent = 'Literature Library';
    header.appendChild(title);

    // Reading stats (Story 20.4 — AC 3)
    header.appendChild(this.renderReadingStats());

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'da-literature-browser__search';
    searchInput.placeholder = 'Search articles...';
    searchInput.setAttribute('aria-label', 'Search literature articles');
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.updateFilters();
      this.updateGrid();
    });
    header.appendChild(searchInput);

    // Clear progress button (Story 20.4 — AC 5)
    if (this.readArticleIds.size > 0) {
      header.appendChild(this.buildClearProgressButton());
    }

    // Reset hints button (Story 20.5 — AC 6)
    const hasHintProgress = Object.keys(this.hintProgress).length > 0 &&
      Object.values(this.hintProgress).some(v => v > 0);
    if (hasHintProgress) {
      const resetHintsBtn = document.createElement('button');
      resetHintsBtn.type = 'button';
      resetHintsBtn.className = 'da-literature-browser__reset-hints-btn';
      resetHintsBtn.textContent = 'Reset hints';
      resetHintsBtn.setAttribute('aria-label', 'Reset all hint progress');
      resetHintsBtn.addEventListener('click', () => {
        this.callbacks?.onResetHints?.();
        this.hintProgress = {};
        this.updateGrid();
      });
      header.appendChild(resetHintsBtn);
    }

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'da-literature-browser__close';
    closeButton.setAttribute('aria-label', 'Close literature browser');
    closeButton.textContent = '\u00D7'; // ×
    closeButton.addEventListener('click', () => {
      this.close();
    });
    header.appendChild(closeButton);

    return header;
  }

  private renderFilters(): HTMLElement {
    const filters = document.createElement('div');
    filters.className = 'da-literature-browser__filters';
    filters.setAttribute('role', 'toolbar');
    filters.setAttribute('aria-label', 'Filter by category');

    // Use context-filtered articles as the base for chip counts
    const baseArticles = this.getContextFilteredArticles();

    // "All" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'da-literature-filter';
    allChip.dataset.category = 'all';
    if (this.activeCategory === null) {
      allChip.classList.add('da-literature-filter--active');
    }
    allChip.textContent = `All (${baseArticles.length})`;
    allChip.addEventListener('click', () => {
      this.activeCategory = null;
      this.updateFilters();
      this.updateGrid();
    });
    filters.appendChild(allChip);

    // Category chips
    for (const category of CATEGORY_ORDER) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'da-literature-filter';
      chip.dataset.category = category;
      if (this.activeCategory === category) {
        chip.classList.add('da-literature-filter--active');
      }
      chip.textContent = `${CATEGORY_LABELS[category]} (${baseArticles.filter(a => a.category === category).length})`;
      chip.addEventListener('click', () => {
        if (this.activeCategory === category) {
          this.activeCategory = null;
        } else {
          this.activeCategory = category;
        }
        this.updateFilters();
        this.updateGrid();
      });
      filters.appendChild(chip);
    }

    return filters;
  }

  private renderGrid(articles: readonly LiteratureArticle[]): HTMLElement {
    const grid = document.createElement('div');

    if (articles.length === 0) {
      const noResults = document.createElement('p');
      noResults.className = 'da-literature-browser__no-results';
      noResults.textContent = 'No articles match your search.';
      grid.appendChild(noResults);
      return grid;
    }

    // Expanded category hero when filtering to a single category
    if (this.activeCategory !== null) {
      const heroArticles = articles.filter(a => a.category === this.activeCategory);
      const heroTime = heroArticles.reduce((sum, a) => sum + a.estimatedReadTime, 0);
      grid.appendChild(this.renderCategoryHero(this.activeCategory, heroArticles.length, heroTime));
    }

    // Group by category
    for (const category of CATEGORY_ORDER) {
      const categoryArticles = articles.filter(a => a.category === category);
      if (categoryArticles.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'da-literature-browser__section';

      const categoryReadTime = categoryArticles.reduce((sum, a) => sum + a.estimatedReadTime, 0);
      section.appendChild(this.renderSectionHeader(category, categoryArticles.length, categoryReadTime));

      const cardGrid = document.createElement('div');
      cardGrid.className = 'da-literature-browser__card-grid';

      for (const article of categoryArticles) {
        cardGrid.appendChild(this.renderCard(article));
      }

      section.appendChild(cardGrid);
      grid.appendChild(section);
    }

    return grid;
  }

  private renderCard(article: LiteratureArticle): HTMLElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `da-literature-card da-literature-card--${article.category}`;
    const isRead = this.readArticleIds.has(article.id);
    const readSuffix = isRead ? ', read' : '';
    card.setAttribute('aria-label', `${article.title} — ${CATEGORY_LABELS[article.category]}, ${article.estimatedReadTime} min read${readSuffix}`);

    if (isRead) {
      card.classList.add('da-literature-card--read');
      // Checkmark badge (Story 20.4 — AC 2)
      const readBadge = document.createElement('span');
      readBadge.className = 'da-literature-card__read-badge';
      readBadge.textContent = '\u2713'; // ✓
      readBadge.setAttribute('aria-hidden', 'true');
      card.appendChild(readBadge);
    }

    const title = document.createElement('span');
    title.className = 'da-literature-card__title';
    title.textContent = article.title;
    card.appendChild(title);

    const description = document.createElement('span');
    description.className = 'da-literature-card__description';
    description.textContent = article.description;
    card.appendChild(description);

    const meta = document.createElement('span');
    meta.className = 'da-literature-card__meta';

    const badge = document.createElement('span');
    badge.className = `da-literature-card__badge da-literature-card__badge--${article.category}`;
    badge.textContent = CATEGORY_LABELS[article.category];
    meta.appendChild(badge);

    const time = document.createElement('span');
    time.className = 'da-literature-card__time';
    time.textContent = `${article.estimatedReadTime} min`;
    meta.appendChild(time);

    // Hint button (Story 20.5 — AC 1)
    if (ARTICLES_WITH_HINTS.has(article.id)) {
      const hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = 'da-literature-card__hint-btn';
      const revealedCount = this.hintProgress[article.id] ?? 0;
      hintBtn.textContent = revealedCount > 0 ? `Hints (${revealedCount})` : 'Hints';
      hintBtn.setAttribute('aria-label', `Show hints for ${article.title}`);
      hintBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
        this.showHintPanel(article.id);
      });
      meta.appendChild(hintBtn);
    }

    // Deep-dive button (Story 20.6 — AC 1)
    if (ARTICLES_WITH_DEEP_DIVES.has(article.id)) {
      const deepDiveBtn = document.createElement('button');
      deepDiveBtn.type = 'button';
      deepDiveBtn.className = 'da-literature-card__deep-dive-btn';
      deepDiveBtn.textContent = 'Deep Dive';
      deepDiveBtn.setAttribute('aria-label', `Deep dive into ${article.title}`);
      deepDiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showDeepDivePanel(article.id);
      });
      meta.appendChild(deepDiveBtn);
    }

    card.appendChild(meta);

    card.addEventListener('click', () => {
      this.callbacks?.onArticleSelect(article);
    });

    return card;
  }

  private renderSectionHeader(category: LiteratureCategory, articleCount: number, totalTime?: number): HTMLElement {
    const meta = CATEGORY_METADATA[category];
    const displayTime = totalTime ?? getCategoryTotalReadTime(category);
    const articleWord = articleCount === 1 ? 'article' : 'articles';

    const header = document.createElement('div');
    header.className = 'da-literature-browser__section-header';

    const topRow = document.createElement('div');
    topRow.className = 'da-literature-browser__section-header-row';

    const icon = document.createElement('span');
    icon.className = 'da-literature-browser__section-icon';
    icon.textContent = meta.icon;
    topRow.appendChild(icon);

    const label = document.createElement('h3');
    label.className = 'da-literature-browser__section-label';
    label.textContent = meta.label;
    topRow.appendChild(label);

    const metaSpan = document.createElement('span');
    metaSpan.className = 'da-literature-browser__section-meta';
    // Per-category read count (Story 20.4 — AC 4)
    const catReadCount = this.articles
      .filter(a => a.category === category)
      .filter(a => this.readArticleIds.has(a.id)).length;
    const totalCatCount = this.articles.filter(a => a.category === category).length;
    const readSuffix = catReadCount > 0 ? ` \u00B7 ${catReadCount}/${totalCatCount} read` : '';
    metaSpan.textContent = `${articleCount} ${articleWord} \u00B7 ~${displayTime} min${readSuffix}`;
    topRow.appendChild(metaSpan);

    header.appendChild(topRow);

    // One-line description (AC 2, 4) — only in "all categories" view (hero handles filtered view)
    if (this.activeCategory === null) {
      const desc = document.createElement('p');
      desc.className = 'da-literature-browser__section-description';
      desc.textContent = meta.description;
      header.appendChild(desc);
    }

    return header;
  }

  private renderCategoryHero(category: LiteratureCategory, filteredCount?: number, filteredTime?: number): HTMLElement {
    const meta = CATEGORY_METADATA[category];
    const articleCount = filteredCount ?? getCategoryArticleCount(category);
    const totalTime = filteredTime ?? getCategoryTotalReadTime(category);
    const articleWord = articleCount === 1 ? 'article' : 'articles';

    const hero = document.createElement('div');
    hero.className = 'da-literature-browser__category-hero';

    const heroHeader = document.createElement('div');
    heroHeader.className = 'da-literature-browser__category-hero-header';

    const icon = document.createElement('span');
    icon.className = 'da-literature-browser__section-icon';
    icon.textContent = meta.icon;
    heroHeader.appendChild(icon);

    const title = document.createElement('h3');
    title.className = 'da-literature-browser__section-label';
    title.textContent = meta.label;
    heroHeader.appendChild(title);

    const metaSpan = document.createElement('span');
    metaSpan.className = 'da-literature-browser__section-meta';
    metaSpan.textContent = `${articleCount} ${articleWord} \u00B7 ~${totalTime} min`;
    heroHeader.appendChild(metaSpan);

    hero.appendChild(heroHeader);

    const description = document.createElement('p');
    description.className = 'da-literature-browser__category-hero-description';
    description.textContent = meta.description;
    hero.appendChild(description);

    const stagesRow = document.createElement('div');
    stagesRow.className = 'da-literature-browser__category-hero-stages';
    for (const stage of meta.relatedStages) {
      const badge = document.createElement('span');
      badge.className = 'da-literature-browser__stage-badge';
      badge.style.setProperty('--da-stage-color', CATEGORY_COLOR_VARS[category]);
      badge.textContent = stage;
      stagesRow.appendChild(badge);
    }
    hero.appendChild(stagesRow);

    return hero;
  }

  private renderContextBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'da-literature-browser__context-banner';

    const label = document.createElement('span');
    label.textContent = `Showing articles for: ${this.contextFilter?.contextLabel ?? 'Help'}`;
    banner.appendChild(label);

    const showAllBtn = document.createElement('button');
    showAllBtn.type = 'button';
    showAllBtn.className = 'da-literature-browser__show-all-btn';
    showAllBtn.textContent = 'Show all articles';
    showAllBtn.addEventListener('click', () => {
      this.contextFilter = null;
      this.removeContextBanner();
      this.updateFilters();
      this.updateGrid();
    });
    banner.appendChild(showAllBtn);

    return banner;
  }

  private renderReadingStats(): HTMLElement {
    const stats = document.createElement('span');
    stats.className = 'da-literature-browser__reading-stats';
    const readCount = this.articles.filter(a => this.readArticleIds.has(a.id)).length;
    const totalCount = this.articles.length;
    stats.textContent = readCount > 0 ? `${readCount} of ${totalCount} read` : '';
    return stats;
  }

  private buildClearProgressButton(): HTMLElement {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'da-literature-browser__clear-progress-btn';
    clearBtn.textContent = 'Clear progress';
    clearBtn.setAttribute('aria-label', 'Clear all reading progress');
    clearBtn.addEventListener('click', () => {
      this.readArticleIds = new Set();
      this.callbacks?.onClearProgress?.();
      this.updateReadingStats();
      this.updateGrid();
    });
    return clearBtn;
  }

  private updateReadingStats(): void {
    if (!this.overlay) return;
    const stats = this.overlay.querySelector('.da-literature-browser__reading-stats');
    if (!stats) return;
    const readCount = this.articles.filter(a => this.readArticleIds.has(a.id)).length;
    const totalCount = this.articles.length;
    stats.textContent = readCount > 0 ? `${readCount} of ${totalCount} read` : '';

    const existingClearBtn = this.overlay.querySelector('.da-literature-browser__clear-progress-btn');
    if (readCount === 0 && existingClearBtn) {
      existingClearBtn.remove();
    } else if (readCount > 0 && !existingClearBtn) {
      // Re-add the button (it was previously removed when count hit zero)
      const header = this.overlay.querySelector('.da-literature-browser__header');
      const closeBtn = header?.querySelector('.da-literature-browser__close');
      if (header && closeBtn) {
        header.insertBefore(this.buildClearProgressButton(), closeBtn);
      }
    }
  }

  /**
   * Mark an article as read and update the display in-place.
   * Called by App.ts when an article is selected.
   */
  markArticleRead(articleId: string): void {
    if (this.readArticleIds.has(articleId)) return;
    const updated = new Set(this.readArticleIds);
    updated.add(articleId);
    this.readArticleIds = updated;
    this.updateReadingStats();
    this.updateGrid();
  }

  private removeContextBanner(): void {
    if (!this.overlay) return;
    const banner = this.overlay.querySelector('.da-literature-browser__context-banner');
    if (banner) banner.remove();
  }

  // ---------------------------------------------------------------------------
  // Private — hint panel (Story 20.5)
  // ---------------------------------------------------------------------------

  private showHintPanel(articleId: string): void {
    this.activeHintArticleId = articleId;
    // Reveal at least the first hint if none revealed yet
    const hintData = getHintsForArticle(articleId);
    if (!hintData) return;
    if ((this.hintProgress[articleId] ?? 0) === 0) {
      this.hintProgress[articleId] = 1;
      this.callbacks?.onHintReveal?.(articleId, 0);
    }
    this.updateHintPanel();
  }

  private updateHintPanel(): void {
    if (!this.overlay || !this.activeHintArticleId) return;
    const content = this.overlay.querySelector('.da-literature-browser__content');
    if (!content) return;

    // Remove existing hint panel
    const existing = content.querySelector('.da-hint-panel');
    if (existing) existing.remove();

    // Hide grid and filters while showing hints
    const grid = content.querySelector('.da-literature-browser__grid') as HTMLElement | null;
    const filters = content.querySelector('.da-literature-browser__filters') as HTMLElement | null;
    const banner = content.querySelector('.da-literature-browser__context-banner') as HTMLElement | null;
    if (grid) grid.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (banner) banner.style.display = 'none';

    const panel = this.renderHintPanel();
    content.appendChild(panel);

    // Focus the back button for keyboard navigation continuity
    const backBtn = panel.querySelector('.da-hint-panel__back') as HTMLButtonElement | null;
    if (backBtn) backBtn.focus();
  }

  private closeHintPanel(): void {
    if (!this.overlay) return;
    this.activeHintArticleId = null;
    const content = this.overlay.querySelector('.da-literature-browser__content');
    if (!content) return;

    const panel = content.querySelector('.da-hint-panel');
    if (panel) panel.remove();

    // Restore grid and filters
    const grid = content.querySelector('.da-literature-browser__grid') as HTMLElement | null;
    const filters = content.querySelector('.da-literature-browser__filters') as HTMLElement | null;
    const banner = content.querySelector('.da-literature-browser__context-banner') as HTMLElement | null;
    if (grid) grid.style.display = '';
    if (filters) filters.style.display = '';
    if (banner) banner.style.display = '';

    // Re-render grid to update hint button labels
    this.updateGrid();
  }

  private renderHintPanel(): HTMLElement {
    const articleId = this.activeHintArticleId!;
    const hintData = getHintsForArticle(articleId)!;
    const article = this.articles.find(a => a.id === articleId);
    const revealedCount = this.hintProgress[articleId] ?? 0;
    const totalHints = hintData.hints.length;

    const panel = document.createElement('div');
    panel.className = 'da-hint-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'da-hint-panel__header';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'da-hint-panel__back';
    backBtn.textContent = '\u2190 Back';
    backBtn.setAttribute('aria-label', 'Back to articles');
    backBtn.addEventListener('click', () => this.closeHintPanel());
    header.appendChild(backBtn);

    const title = document.createElement('h3');
    title.className = 'da-hint-panel__title';
    title.textContent = article?.title ?? 'Hints';
    header.appendChild(title);

    const progress = document.createElement('span');
    progress.className = 'da-hint-panel__progress';
    progress.textContent = `Hint ${revealedCount} of ${totalHints}`;
    header.appendChild(progress);

    panel.appendChild(header);

    // Hints list
    const hintsList = document.createElement('div');
    hintsList.className = 'da-hint-panel__hints';

    for (let i = 0; i < revealedCount; i++) {
      const hint = document.createElement('div');
      hint.className = 'da-hint-panel__hint';

      const hintNumber = document.createElement('span');
      hintNumber.className = 'da-hint-panel__hint-number';
      hintNumber.textContent = `${i + 1}`;
      hint.appendChild(hintNumber);

      const hintText = document.createElement('p');
      hintText.className = 'da-hint-panel__hint-text';
      hintText.textContent = hintData.hints[i];
      hint.appendChild(hintText);

      hintsList.appendChild(hint);
    }

    panel.appendChild(hintsList);

    // Next hint button (if more hints available)
    if (revealedCount < totalHints) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'da-hint-panel__next-btn';
      nextBtn.textContent = `Show next hint (${revealedCount + 1} of ${totalHints})`;
      nextBtn.addEventListener('click', () => {
        this.hintProgress[articleId] = (this.hintProgress[articleId] ?? 0) + 1;
        this.callbacks?.onHintReveal?.(articleId, this.hintProgress[articleId] - 1);
        this.updateHintPanel();
      });
      panel.appendChild(nextBtn);
    } else {
      const complete = document.createElement('p');
      complete.className = 'da-hint-panel__complete';
      complete.textContent = 'All hints revealed!';
      panel.appendChild(complete);
    }

    return panel;
  }

  // ---------------------------------------------------------------------------
  // Private — deep-dive panel (Story 20.6)
  // ---------------------------------------------------------------------------

  private showDeepDivePanel(articleId: string): void {
    this.activeDeepDiveArticleId = articleId;
    this.updateDeepDivePanel();
  }

  private updateDeepDivePanel(): void {
    if (!this.overlay || !this.activeDeepDiveArticleId) return;
    const content = this.overlay.querySelector('.da-literature-browser__content');
    if (!content) return;

    // Remove existing panel
    const existing = content.querySelector('.da-deep-dive-panel');
    if (existing) existing.remove();

    // Hide grid, filters, and context banner
    const grid = content.querySelector('.da-literature-browser__grid') as HTMLElement | null;
    const filters = content.querySelector('.da-literature-browser__filters') as HTMLElement | null;
    const banner = content.querySelector('.da-literature-browser__context-banner') as HTMLElement | null;
    if (grid) grid.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (banner) banner.style.display = 'none';

    const panel = this.renderDeepDivePanel();
    content.appendChild(panel);

    const backBtn = panel.querySelector('.da-deep-dive-panel__back') as HTMLButtonElement | null;
    if (backBtn) backBtn.focus();
  }

  private closeDeepDivePanel(): void {
    if (!this.overlay) return;
    this.activeDeepDiveArticleId = null;
    const content = this.overlay.querySelector('.da-literature-browser__content');
    if (!content) return;

    const panel = content.querySelector('.da-deep-dive-panel');
    if (panel) panel.remove();

    const grid = content.querySelector('.da-literature-browser__grid') as HTMLElement | null;
    const filters = content.querySelector('.da-literature-browser__filters') as HTMLElement | null;
    const banner = content.querySelector('.da-literature-browser__context-banner') as HTMLElement | null;
    if (grid) grid.style.display = '';
    if (filters) filters.style.display = '';
    if (banner) banner.style.display = '';
  }

  private renderDeepDivePanel(): HTMLElement {
    const articleId = this.activeDeepDiveArticleId!;
    const deepDive = getDeepDiveForArticle(articleId)!;
    const article = this.articles.find(a => a.id === articleId);

    const panel = document.createElement('div');
    panel.className = 'da-deep-dive-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'da-deep-dive-panel__header';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'da-deep-dive-panel__back';
    backBtn.textContent = '\u2190 Back';
    backBtn.setAttribute('aria-label', 'Back to articles');
    backBtn.addEventListener('click', () => this.closeDeepDivePanel());
    header.appendChild(backBtn);

    const title = document.createElement('h3');
    title.className = 'da-deep-dive-panel__title';
    title.textContent = article?.title ?? 'Deep Dive';
    header.appendChild(title);

    panel.appendChild(header);

    // Sections
    const sections: Array<{ heading: string; content: string }> = [
      { heading: 'Technical Explanation', content: deepDive.explanation },
      { heading: 'Historical Context', content: deepDive.historicalContext },
      { heading: 'Design Trade-Offs', content: deepDive.tradeOffs },
      { heading: 'Real-World Examples', content: deepDive.realWorldExamples },
    ];

    for (const section of sections) {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'da-deep-dive-panel__section';

      const heading = document.createElement('h4');
      heading.className = 'da-deep-dive-panel__section-heading';
      heading.textContent = section.heading;
      sectionEl.appendChild(heading);

      const content = document.createElement('p');
      content.className = 'da-deep-dive-panel__section-content';
      content.textContent = section.content;
      sectionEl.appendChild(content);

      panel.appendChild(sectionEl);
    }

    return panel;
  }

  // ---------------------------------------------------------------------------
  // Private — filtering
  // ---------------------------------------------------------------------------

  /** Check whether a single article matches the current search query. */
  private matchesSearch(article: LiteratureArticle, query: string): boolean {
    return (
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  /**
   * Get articles after applying context filter only (tags + stages).
   * Provides the correct base set for chip counts and search filtering.
   */
  private getContextFilteredArticles(): readonly LiteratureArticle[] {
    let filtered: readonly LiteratureArticle[] = this.articles;

    if (this.contextFilter?.tags) {
      const ctxTags = this.contextFilter.tags;
      filtered = filtered.filter(a => matchesTags(a, ctxTags));
    }

    if (this.contextFilter?.stages && this.contextFilter.stages.length > 0) {
      const ctxStages = this.contextFilter.stages;
      const stageFiltered = filtered.filter(a =>
        a.relatedStages.some(s => ctxStages.includes(s))
      );
      if (stageFiltered.length > 0) {
        filtered = stageFiltered;
      }
    }

    return filtered;
  }

  /**
   * Get articles filtered by search query only (no category filter).
   * Used for updating chip counts to reflect search narrowing per category.
   * Respects context filter as the base article set.
   */
  private getSearchFilteredArticles(): readonly LiteratureArticle[] {
    const base = this.getContextFilteredArticles();
    if (this.searchQuery.trim() === '') {
      return base;
    }
    const query = this.searchQuery.trim().toLowerCase();
    return base.filter(a => this.matchesSearch(a, query));
  }

  private getFilteredArticles(): readonly LiteratureArticle[] {
    let filtered = this.getContextFilteredArticles();

    // Category filter
    if (this.activeCategory !== null) {
      const cat = this.activeCategory;
      filtered = filtered.filter(a => a.category === cat);
    }

    // Search filter
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(a => this.matchesSearch(a, query));
    }

    return filtered;
  }

  private updateGrid(): void {
    if (!this.overlay) return;
    const content = this.overlay.querySelector('.da-literature-browser__content');
    if (!content) return;

    // Remove old grid
    const oldGrid = content.querySelector('.da-literature-browser__grid');
    if (oldGrid) {
      oldGrid.remove();
    }

    // Render new grid
    const grid = this.renderGrid(this.getFilteredArticles());
    grid.className = 'da-literature-browser__grid';
    content.appendChild(grid);
  }

  private updateFilters(): void {
    if (!this.overlay) return;
    const baseArticles = this.getContextFilteredArticles();
    const hasSearch = this.searchQuery.trim() !== '';
    const filteredArticles = hasSearch ? this.getSearchFilteredArticles() : null;

    const filters = this.overlay.querySelectorAll('.da-literature-filter');
    filters.forEach(chip => {
      const el = chip as HTMLElement;
      const cat = el.dataset.category;
      if (cat === 'all') {
        el.classList.toggle('da-literature-filter--active', this.activeCategory === null);
        if (hasSearch && filteredArticles) {
          el.textContent = `All (${filteredArticles.length}/${baseArticles.length})`;
        } else {
          el.textContent = `All (${baseArticles.length})`;
        }
      } else if (cat && cat in CATEGORY_LABELS) {
        const category = cat as LiteratureCategory;
        el.classList.toggle('da-literature-filter--active', this.activeCategory === category);
        const totalCount = baseArticles.filter(a => a.category === category).length;
        if (hasSearch && filteredArticles) {
          const filteredCount = filteredArticles.filter(a => a.category === category).length;
          el.textContent = `${CATEGORY_LABELS[category]} (${filteredCount}/${totalCount})`;
        } else {
          el.textContent = `${CATEGORY_LABELS[category]} (${totalCount})`;
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private — event handlers
  // ---------------------------------------------------------------------------

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    // Arrow key navigation within the filter toolbar (WAI-ARIA toolbar pattern)
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && this.overlay) {
      const toolbar = this.overlay.querySelector('.da-literature-browser__filters');
      if (toolbar && toolbar.contains(document.activeElement)) {
        e.preventDefault();
        const chips = Array.from(toolbar.querySelectorAll<HTMLElement>('.da-literature-filter'));
        const currentIndex = chips.indexOf(document.activeElement as HTMLElement);
        if (currentIndex === -1) return;

        let nextIndex: number;
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % chips.length;
        } else {
          nextIndex = (currentIndex - 1 + chips.length) % chips.length;
        }
        chips[nextIndex].focus();
      }
    }

    // Focus trap: keep Tab within the modal
    if (e.key === 'Tab' && this.overlay) {
      const focusable = this.overlay.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  private handleBackdropClick(e: MouseEvent): void {
    // Only close if the click target is the backdrop itself
    if ((e.target as HTMLElement).classList.contains('da-literature-browser__backdrop')) {
      this.close();
    }
  }

  // ---------------------------------------------------------------------------
  // Private — cleanup
  // ---------------------------------------------------------------------------

  private removeOverlay(fireOnClose: boolean = true): void {
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }

    document.removeEventListener('keydown', this.boundHandleKeydown);

    const hadOverlay = this.overlay !== null;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Restore focus
    if (
      this.previouslyFocusedElement &&
      document.contains(this.previouslyFocusedElement) &&
      this.previouslyFocusedElement instanceof HTMLElement
    ) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;

    // Only fire onClose when the overlay was actually removed (guards double-close)
    // and when explicitly requested (destroy() passes false)
    if (hadOverlay && fireOnClose) {
      this.callbacks?.onClose();
    }
  }
}
