// src/literature/LiteratureBrowser.test.ts
// Comprehensive tests for LiteratureBrowser modal component
// Story 20.1: Create Literature Browser — Task 8.3

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LiteratureBrowser } from './LiteratureBrowser';
import { LITERATURE_ARTICLES } from './literatureMetadata';
import type { LiteratureBrowserCallbacks, LiteratureBrowserData } from './types';

describe('LiteratureBrowser', () => {
  let browser: LiteratureBrowser;
  let callbacks: LiteratureBrowserCallbacks;
  let mockData: LiteratureBrowserData;

  beforeEach(() => {
    callbacks = {
      onArticleSelect: vi.fn(),
      onClose: vi.fn(),
    };

    mockData = {
      articles: LITERATURE_ARTICLES,
    };

    browser = new LiteratureBrowser();
  });

  afterEach(() => {
    browser.destroy();
    // Clean up any lingering DOM elements
    document.querySelectorAll('.da-literature-browser').forEach(el => el.remove());
  });

  // ---------------------------------------------------------------------------
  // Lifecycle: mount / open / close / destroy
  // ---------------------------------------------------------------------------

  describe('mount', () => {
    it('should store container reference', () => {
      const container = document.createElement('div');
      browser.mount(container);

      browser.open(mockData, callbacks);
      expect(container.querySelector('.da-literature-browser')).not.toBeNull();
    });

    it('should fall back to document.body when not mounted', () => {
      // Do NOT call mount — open should append to body
      browser.open(mockData, callbacks);
      expect(document.body.querySelector('.da-literature-browser')).not.toBeNull();
    });
  });

  describe('open', () => {
    it('should create the modal overlay', () => {
      browser.open(mockData, callbacks);

      expect(document.querySelector('.da-literature-browser')).not.toBeNull();
    });

    it('should create backdrop element', () => {
      browser.open(mockData, callbacks);

      expect(document.querySelector('.da-literature-browser__backdrop')).not.toBeNull();
    });

    it('should create content panel', () => {
      browser.open(mockData, callbacks);

      expect(document.querySelector('.da-literature-browser__content')).not.toBeNull();
    });

    it('should report isOpen as true', () => {
      expect(browser.isOpen()).toBe(false);
      browser.open(mockData, callbacks);
      expect(browser.isOpen()).toBe(true);
    });

    it('should render the title "Literature Library"', () => {
      browser.open(mockData, callbacks);

      const title = document.querySelector('.da-literature-browser__title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('Literature Library');
    });

    it('should render a search input', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      expect(search).not.toBeNull();
      expect(search.type).toBe('search');
      expect(search.placeholder).toBe('Search articles...');
    });

    it('should render a close button', () => {
      browser.open(mockData, callbacks);

      const closeBtn = document.querySelector('.da-literature-browser__close');
      expect(closeBtn).not.toBeNull();
    });
  });

  describe('double-invocation guard', () => {
    it('should not create a second overlay when already open', () => {
      browser.open(mockData, callbacks);
      browser.open(mockData, callbacks);

      const overlays = document.querySelectorAll('.da-literature-browser');
      expect(overlays.length).toBe(1);
    });
  });

  describe('close', () => {
    it('should add exiting class on close', () => {
      browser.open(mockData, callbacks);
      browser.close();

      const overlay = document.querySelector('.da-literature-browser');
      expect(overlay?.classList.contains('da-literature-browser--exiting')).toBe(true);
    });

    it('should remove overlay after exit timeout', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);
      browser.close();

      // Still exists during exit animation
      expect(document.querySelector('.da-literature-browser')).not.toBeNull();

      // After timeout, removed
      vi.advanceTimersByTime(300);
      expect(document.querySelector('.da-literature-browser')).toBeNull();

      vi.useRealTimers();
    });

    it('should call onClose callback after exit', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);
      browser.close();
      vi.advanceTimersByTime(300);

      expect(callbacks.onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should report isOpen as false after full close', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);
      browser.close();
      vi.advanceTimersByTime(300);

      expect(browser.isOpen()).toBe(false);
      vi.useRealTimers();
    });

    it('should not throw when close is called without open', () => {
      expect(() => browser.close()).not.toThrow();
    });

    it('should only fire onClose once when close is called twice (M2 fix)', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);

      browser.close();
      browser.close(); // second call during exit animation

      vi.advanceTimersByTime(600); // well past both timeouts

      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('close button click', () => {
    it('should close modal when close button is clicked', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);

      const closeBtn = document.querySelector('.da-literature-browser__close') as HTMLElement;
      closeBtn.click();
      vi.advanceTimersByTime(300);

      expect(browser.isOpen()).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should remove overlay immediately', () => {
      browser.open(mockData, callbacks);
      browser.destroy();

      expect(document.querySelector('.da-literature-browser')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      browser.open(mockData, callbacks);
      browser.destroy();
      expect(() => browser.destroy()).not.toThrow();
    });

    it('should report isOpen as false after destroy', () => {
      browser.open(mockData, callbacks);
      browser.destroy();
      expect(browser.isOpen()).toBe(false);
    });

    it('should NOT fire onClose callback (M3 fix — programmatic teardown)', () => {
      browser.open(mockData, callbacks);
      browser.destroy();

      expect(callbacks.onClose).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA & accessibility (AC 7)
  // ---------------------------------------------------------------------------

  describe('ARIA attributes', () => {
    it('should set role="dialog" on overlay', () => {
      browser.open(mockData, callbacks);

      const overlay = document.querySelector('.da-literature-browser');
      expect(overlay?.getAttribute('role')).toBe('dialog');
    });

    it('should set aria-modal="true" on overlay', () => {
      browser.open(mockData, callbacks);

      const overlay = document.querySelector('.da-literature-browser');
      expect(overlay?.getAttribute('aria-modal')).toBe('true');
    });

    it('should set aria-labelledby pointing to the title', () => {
      browser.open(mockData, callbacks);

      const overlay = document.querySelector('.da-literature-browser');
      const titleId = overlay?.getAttribute('aria-labelledby');
      expect(titleId).toBe('da-literature-browser-title');

      const title = document.getElementById(titleId!);
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('Literature Library');
    });

    it('should set aria-label on search input', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search');
      expect(search?.getAttribute('aria-label')).toBe('Search literature articles');
    });

    it('should set aria-label on close button', () => {
      browser.open(mockData, callbacks);

      const closeBtn = document.querySelector('.da-literature-browser__close');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close literature browser');
    });

    it('should set role="toolbar" on filters', () => {
      browser.open(mockData, callbacks);

      const filters = document.querySelector('.da-literature-browser__filters');
      expect(filters?.getAttribute('role')).toBe('toolbar');
      expect(filters?.getAttribute('aria-label')).toBe('Filter by category');
    });

    it('should set aria-label on article cards', () => {
      browser.open(mockData, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBeGreaterThan(0);

      // Check first card has meaningful aria-label
      const firstCard = cards[0];
      const ariaLabel = firstCard.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('min read');
    });
  });

  // ---------------------------------------------------------------------------
  // Escape key dismiss (AC 6)
  // ---------------------------------------------------------------------------

  describe('Escape key dismiss', () => {
    it('should close on Escape key', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      vi.advanceTimersByTime(300);
      expect(browser.isOpen()).toBe(false);
      expect(callbacks.onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not respond to Escape after close', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);
      browser.close();
      vi.advanceTimersByTime(300);

      // Reset mock
      (callbacks.onClose as ReturnType<typeof vi.fn>).mockClear();

      // Dispatch Escape again — should not call onClose again
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(callbacks.onClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // Backdrop click dismiss (AC 6)
  // ---------------------------------------------------------------------------

  describe('backdrop click dismiss', () => {
    it('should close when clicking backdrop', () => {
      vi.useFakeTimers();
      browser.open(mockData, callbacks);

      const backdrop = document.querySelector('.da-literature-browser__backdrop') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: backdrop });
      backdrop.dispatchEvent(event);

      vi.advanceTimersByTime(300);
      expect(browser.isOpen()).toBe(false);
      vi.useRealTimers();
    });

    it('should not close when clicking content panel', () => {
      browser.open(mockData, callbacks);

      const content = document.querySelector('.da-literature-browser__content') as HTMLElement;
      content.click();

      expect(browser.isOpen()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Focus management (AC 6, 7)
  // ---------------------------------------------------------------------------

  describe('focus management', () => {
    it('should save and restore focus on close', () => {
      vi.useFakeTimers();

      const button = document.createElement('button');
      button.textContent = 'Trigger';
      document.body.appendChild(button);
      button.focus();
      expect(document.activeElement).toBe(button);

      browser.open(mockData, callbacks);
      browser.close();
      vi.advanceTimersByTime(300);

      expect(document.activeElement).toBe(button);

      button.remove();
      vi.useRealTimers();
    });

    it('should restore focus after destroy', () => {
      const button = document.createElement('button');
      button.textContent = 'Trigger';
      document.body.appendChild(button);
      button.focus();

      browser.open(mockData, callbacks);
      browser.destroy();

      expect(document.activeElement).toBe(button);

      button.remove();
    });
  });

  describe('focus trap', () => {
    it('should trap Tab at end of modal (wrap to first)', () => {
      browser.open(mockData, callbacks);

      const overlay = document.querySelector('.da-literature-browser')!;
      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      expect(focusable.length).toBeGreaterThan(0);

      const last = focusable[focusable.length - 1];
      const first = focusable[0];

      // Focus the last element
      last.focus();
      expect(document.activeElement).toBe(last);

      // Dispatch Tab (should wrap to first)
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      document.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(first);
    });

    it('should trap Shift+Tab at start of modal (wrap to last)', () => {
      browser.open(mockData, callbacks);

      const overlay = document.querySelector('.da-literature-browser')!;
      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      expect(focusable.length).toBeGreaterThan(0);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Focus the first element
      first.focus();
      expect(document.activeElement).toBe(first);

      // Dispatch Shift+Tab (should wrap to last)
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
      document.dispatchEvent(shiftTabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(last);
    });
  });

  // ---------------------------------------------------------------------------
  // Arrow key navigation within toolbar (AC 7, M1 fix)
  // ---------------------------------------------------------------------------

  describe('arrow key navigation in toolbar', () => {
    it('should move focus right with ArrowRight within filter chips', () => {
      browser.open(mockData, callbacks);

      const chips = document.querySelectorAll<HTMLElement>('.da-literature-filter');
      expect(chips.length).toBe(4);

      // Focus "All" chip (index 0)
      chips[0].focus();
      expect(document.activeElement).toBe(chips[0]);

      // Press ArrowRight → should move to index 1 (Basic)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(chips[1]);
    });

    it('should move focus left with ArrowLeft within filter chips', () => {
      browser.open(mockData, callbacks);

      const chips = document.querySelectorAll<HTMLElement>('.da-literature-filter');

      // Focus "Basic" chip (index 1)
      chips[1].focus();
      expect(document.activeElement).toBe(chips[1]);

      // Press ArrowLeft → should move to index 0 (All)
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(chips[0]);
    });

    it('should wrap ArrowRight from last chip to first', () => {
      browser.open(mockData, callbacks);

      const chips = document.querySelectorAll<HTMLElement>('.da-literature-filter');

      // Focus last chip (index 3 — Advanced)
      chips[3].focus();
      expect(document.activeElement).toBe(chips[3]);

      // Press ArrowRight → should wrap to index 0 (All)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(chips[0]);
    });

    it('should wrap ArrowLeft from first chip to last', () => {
      browser.open(mockData, callbacks);

      const chips = document.querySelectorAll<HTMLElement>('.da-literature-filter');

      // Focus first chip (index 0 — All)
      chips[0].focus();
      expect(document.activeElement).toBe(chips[0]);

      // Press ArrowLeft → should wrap to index 3 (Advanced)
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(chips[3]);
    });

    it('should not move focus when arrow key is pressed outside toolbar', () => {
      browser.open(mockData, callbacks);

      // Focus the search input (not in toolbar)
      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.focus();
      expect(document.activeElement).toBe(search);

      // Press ArrowRight → focus should stay on search
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(search);
    });
  });

  // ---------------------------------------------------------------------------
  // Article rendering (AC 1, 2)
  // ---------------------------------------------------------------------------

  describe('article rendering', () => {
    it('should render all 20 article cards', () => {
      browser.open(mockData, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(20);
    });

    it('should render cards as buttons', () => {
      browser.open(mockData, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      for (const card of cards) {
        expect(card.tagName).toBe('BUTTON');
      }
    });

    it('should render 3 category sections', () => {
      browser.open(mockData, callbacks);

      const sections = document.querySelectorAll('.da-literature-browser__section');
      expect(sections.length).toBe(3);
    });

    it('should render section headers matching category labels', () => {
      browser.open(mockData, callbacks);

      const headers = document.querySelectorAll('.da-literature-browser__section-header');
      expect(headers.length).toBe(3);

      // Section headers are now rich elements (Story 20.2) — check the label element
      const labels = document.querySelectorAll('.da-literature-browser__section-label');
      expect(labels.length).toBe(3);
      expect(labels[0].textContent).toBe('Basic');
      expect(labels[1].textContent).toBe('Intermediate');
      expect(labels[2].textContent).toBe('Advanced');
    });

    it('should render card titles', () => {
      browser.open(mockData, callbacks);

      const titles = document.querySelectorAll('.da-literature-card__title');
      expect(titles.length).toBe(20);
      expect(titles[0].textContent).toBe('Binary Numbers & Digital Representation');
    });

    it('should render card descriptions', () => {
      browser.open(mockData, callbacks);

      const descriptions = document.querySelectorAll('.da-literature-card__description');
      expect(descriptions.length).toBe(20);
      expect(descriptions[0].textContent).toBeTruthy();
    });

    it('should render card badges with category', () => {
      browser.open(mockData, callbacks);

      const badges = document.querySelectorAll('.da-literature-card__badge');
      expect(badges.length).toBe(20);
      expect(badges[0].textContent).toBe('Basic');
    });

    it('should render card read times', () => {
      browser.open(mockData, callbacks);

      const times = document.querySelectorAll('.da-literature-card__time');
      expect(times.length).toBe(20);
      expect(times[0].textContent).toContain('min');
    });

    it('should apply category-specific CSS class to cards', () => {
      browser.open(mockData, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      // First 6 should be basic
      for (let i = 0; i < 6; i++) {
        expect(cards[i].classList.contains('da-literature-card--basic')).toBe(true);
      }
      // Next 6 should be intermediate
      for (let i = 6; i < 12; i++) {
        expect(cards[i].classList.contains('da-literature-card--intermediate')).toBe(true);
      }
      // Last 8 should be advanced
      for (let i = 12; i < 20; i++) {
        expect(cards[i].classList.contains('da-literature-card--advanced')).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Read article indicators
  // ---------------------------------------------------------------------------

  describe('read article indicators', () => {
    it('should mark read articles with --read class', () => {
      const dataWithRead: LiteratureBrowserData = {
        articles: LITERATURE_ARTICLES,
        readArticleIds: new Set(['lit-01', 'lit-03']),
      };

      browser.open(dataWithRead, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards[0].classList.contains('da-literature-card--read')).toBe(true);
      expect(cards[1].classList.contains('da-literature-card--read')).toBe(false);
      expect(cards[2].classList.contains('da-literature-card--read')).toBe(true);
    });

    it('should not mark any cards as read when readArticleIds is not provided', () => {
      browser.open(mockData, callbacks);

      const readCards = document.querySelectorAll('.da-literature-card--read');
      expect(readCards.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Article selection callback (AC 5)
  // ---------------------------------------------------------------------------

  describe('article selection', () => {
    it('should call onArticleSelect when a card is clicked', () => {
      browser.open(mockData, callbacks);

      const cards = document.querySelectorAll('.da-literature-card');
      (cards[0] as HTMLElement).click();

      expect(callbacks.onArticleSelect).toHaveBeenCalledTimes(1);
      expect(callbacks.onArticleSelect).toHaveBeenCalledWith(LITERATURE_ARTICLES[0]);
    });

    it('should pass the correct article for any card', () => {
      browser.open(mockData, callbacks);

      // Click the 7th card (first intermediate article, lit-07)
      const cards = document.querySelectorAll('.da-literature-card');
      (cards[6] as HTMLElement).click();

      expect(callbacks.onArticleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'lit-07' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Search filtering (AC 3)
  // ---------------------------------------------------------------------------

  describe('search filtering', () => {
    it('should filter articles by title match', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'Pipelining';
      search.dispatchEvent(new Event('input'));

      const cards = document.querySelectorAll('.da-literature-card');
      // "Instruction Pipelining" should match
      expect(cards.length).toBeGreaterThanOrEqual(1);

      const titles = Array.from(document.querySelectorAll('.da-literature-card__title'))
        .map(el => el.textContent);
      expect(titles.some(t => t?.toLowerCase().includes('pipelining'))).toBe(true);
    });

    it('should filter articles by description match', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'flip-flop';
      search.dispatchEvent(new Event('input'));

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter articles by tag match', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'karnaugh';
      search.dispatchEvent(new Event('input'));

      // Only lit-03 has the "karnaugh" tag
      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(1);
    });

    it('should be case-insensitive', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'BINARY';
      search.dispatchEvent(new Event('input'));

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "No results" when search yields empty', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'xyznonexistent123';
      search.dispatchEvent(new Event('input'));

      const noResults = document.querySelector('.da-literature-browser__no-results');
      expect(noResults).not.toBeNull();
      expect(noResults!.textContent).toBe('No articles match your search.');
    });

    it('should restore all articles when search is cleared', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'Pipeline';
      search.dispatchEvent(new Event('input'));

      const filteredCards = document.querySelectorAll('.da-literature-card');
      expect(filteredCards.length).toBeLessThan(20);

      search.value = '';
      search.dispatchEvent(new Event('input'));

      const allCards = document.querySelectorAll('.da-literature-card');
      expect(allCards.length).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // Category filtering (AC 4)
  // ---------------------------------------------------------------------------

  describe('category filtering', () => {
    it('should render filter chips (All + 3 categories)', () => {
      browser.open(mockData, callbacks);

      const filters = document.querySelectorAll('.da-literature-filter');
      expect(filters.length).toBe(4); // All, Basic, Intermediate, Advanced
    });

    it('should have "All" chip active by default', () => {
      browser.open(mockData, callbacks);

      const allChip = document.querySelector('.da-literature-filter[data-category="all"]');
      expect(allChip?.classList.contains('da-literature-filter--active')).toBe(true);
    });

    it('should filter to Basic when Basic chip is clicked', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(6);

      // All should be basic
      for (const card of cards) {
        expect(card.classList.contains('da-literature-card--basic')).toBe(true);
      }
    });

    it('should filter to Intermediate when Intermediate chip is clicked', () => {
      browser.open(mockData, callbacks);

      const intermediateChip = document.querySelector('.da-literature-filter[data-category="intermediate"]') as HTMLElement;
      intermediateChip.click();

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(6);
    });

    it('should filter to Advanced when Advanced chip is clicked', () => {
      browser.open(mockData, callbacks);

      const advancedChip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;
      advancedChip.click();

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(8);
    });

    it('should toggle filter off when active category chip is clicked again (AC 4)', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(6);

      // Click again to clear
      basicChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(20);
    });

    it('should update active chip visual state', () => {
      browser.open(mockData, callbacks);

      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;

      // Initially All is active
      expect(allChip.classList.contains('da-literature-filter--active')).toBe(true);
      expect(basicChip.classList.contains('da-literature-filter--active')).toBe(false);

      // Click Basic
      basicChip.click();

      expect(allChip.classList.contains('da-literature-filter--active')).toBe(false);
      expect(basicChip.classList.contains('da-literature-filter--active')).toBe(true);
    });

    it('should restore "All" active state when filter is cleared', () => {
      browser.open(mockData, callbacks);

      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;

      basicChip.click();
      basicChip.click(); // Toggle off

      expect(allChip.classList.contains('da-literature-filter--active')).toBe(true);
    });

    it('should switch between categories when different chip is clicked', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      const advancedChip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;

      basicChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(6);

      advancedChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(8);

      // Verify visual state
      expect(basicChip.classList.contains('da-literature-filter--active')).toBe(false);
      expect(advancedChip.classList.contains('da-literature-filter--active')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Combined search + category filtering (AC 3 + 4)
  // ---------------------------------------------------------------------------

  describe('combined filtering', () => {
    it('should combine search and category filters', () => {
      browser.open(mockData, callbacks);

      // Filter to Advanced
      const advancedChip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;
      advancedChip.click();

      // Then search for "pipeline"
      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'pipeline';
      search.dispatchEvent(new Event('input'));

      const cards = document.querySelectorAll('.da-literature-card');
      // Should find only advanced articles matching "pipeline"
      expect(cards.length).toBeGreaterThanOrEqual(1);
      for (const card of cards) {
        expect(card.classList.contains('da-literature-card--advanced')).toBe(true);
      }
    });

    it('should show no results when combined filters yield empty', () => {
      browser.open(mockData, callbacks);

      // Filter to Basic
      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      // Search for an advanced-only term
      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'superscalar';
      search.dispatchEvent(new Event('input'));

      const noResults = document.querySelector('.da-literature-browser__no-results');
      expect(noResults).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // "All" chip click
  // ---------------------------------------------------------------------------

  describe('All chip click', () => {
    it('should clear category filter when All chip is clicked', () => {
      browser.open(mockData, callbacks);

      // Filter to Basic first
      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(6);

      // Click All to clear
      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      allChip.click();
      expect(document.querySelectorAll('.da-literature-card').length).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.2: Filter chip counts (AC 1)
  // ---------------------------------------------------------------------------

  describe('filter chip counts (Story 20.2, AC 1)', () => {
    it('should show "All (20)" on the All chip', () => {
      browser.open(mockData, callbacks);

      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      expect(allChip.textContent).toBe('All (20)');
    });

    it('should show "Basic (6)" on the Basic chip', () => {
      browser.open(mockData, callbacks);

      const chip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      expect(chip.textContent).toBe('Basic (6)');
    });

    it('should show "Intermediate (6)" on the Intermediate chip', () => {
      browser.open(mockData, callbacks);

      const chip = document.querySelector('.da-literature-filter[data-category="intermediate"]') as HTMLElement;
      expect(chip.textContent).toBe('Intermediate (6)');
    });

    it('should show "Advanced (8)" on the Advanced chip', () => {
      browser.open(mockData, callbacks);

      const chip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;
      expect(chip.textContent).toBe('Advanced (8)');
    });

    it('should show filtered count during search (e.g. "Basic (x/6)")', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'binary';
      search.dispatchEvent(new Event('input'));

      const chip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      expect(chip.textContent).toMatch(/^Basic \(\d+\/6\)$/);
    });

    it('should show filtered total count on All chip during search', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'pipeline';
      search.dispatchEvent(new Event('input'));

      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      expect(allChip.textContent).toMatch(/^All \(\d+\/20\)$/);
    });

    it('should restore normal counts when search is cleared', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'pipeline';
      search.dispatchEvent(new Event('input'));

      // Verify filtered format
      const allChip = document.querySelector('.da-literature-filter[data-category="all"]') as HTMLElement;
      expect(allChip.textContent).toMatch(/\/20\)/);

      // Clear search
      search.value = '';
      search.dispatchEvent(new Event('input'));

      expect(allChip.textContent).toBe('All (20)');
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.2: Rich section headers (AC 2, 4)
  // ---------------------------------------------------------------------------

  describe('rich section headers (Story 20.2, AC 2, 4)', () => {
    it('should render section headers with icon elements', () => {
      browser.open(mockData, callbacks);

      const icons = document.querySelectorAll('.da-literature-browser__section-icon');
      expect(icons.length).toBe(3);
      // Each icon should be a non-empty string (emoji)
      for (const icon of icons) {
        expect(icon.textContent).toBeTruthy();
      }
    });

    it('should render section headers with label elements', () => {
      browser.open(mockData, callbacks);

      const labels = document.querySelectorAll('.da-literature-browser__section-label');
      expect(labels.length).toBe(3);
      expect(labels[0].textContent).toBe('Basic');
      expect(labels[1].textContent).toBe('Intermediate');
      expect(labels[2].textContent).toBe('Advanced');
    });

    it('should render section headers with meta showing article count and read time', () => {
      browser.open(mockData, callbacks);

      const metas = document.querySelectorAll('.da-literature-browser__section-meta');
      expect(metas.length).toBe(3);

      // Each meta should contain "N article(s) \u00B7 ~M min"
      for (const meta of metas) {
        expect(meta.textContent).toMatch(/\d+ articles? \u00B7 ~\d+ min/);
      }
    });

    it('should show correct article count and read time for Basic section', () => {
      browser.open(mockData, callbacks);

      const metas = document.querySelectorAll('.da-literature-browser__section-meta');
      expect(metas[0].textContent).toBe('6 articles \u00B7 ~56 min');
    });

    it('should show correct article count and read time for Intermediate section', () => {
      browser.open(mockData, callbacks);

      const metas = document.querySelectorAll('.da-literature-browser__section-meta');
      expect(metas[1].textContent).toBe('6 articles \u00B7 ~71 min');
    });

    it('should show correct article count and read time for Advanced section', () => {
      browser.open(mockData, callbacks);

      const metas = document.querySelectorAll('.da-literature-browser__section-meta');
      expect(metas[2].textContent).toBe('8 articles \u00B7 ~111 min');
    });

    it('should show filtered read time when search narrows results (H1 fix)', () => {
      browser.open(mockData, callbacks);

      // Search for "binary" — should match lit-01 (8 min) in basic and lit-07 (12 min) in intermediate
      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'binary';
      search.dispatchEvent(new Event('input'));

      // Category totals for comparison — read time must be < category total when showing fewer articles
      const categoryTotals: Record<string, { count: number; time: number }> = {
        Basic: { count: 6, time: 56 },
        Intermediate: { count: 6, time: 71 },
        Advanced: { count: 8, time: 111 },
      };

      const headers = document.querySelectorAll('.da-literature-browser__section-header');
      for (const header of headers) {
        const label = header.querySelector('.da-literature-browser__section-label')!.textContent!;
        const metaText = header.querySelector('.da-literature-browser__section-meta')!.textContent!;
        const match = metaText.match(/^(\d+) articles? \u00B7 ~(\d+) min$/);
        expect(match).not.toBeNull();
        const articleCount = parseInt(match![1], 10);
        const readTime = parseInt(match![2], 10);
        const total = categoryTotals[label];
        if (total && articleCount < total.count) {
          expect(readTime).toBeLessThan(total.time);
        }
      }
    });

    it('should render section descriptions in "all categories" view (H2 fix)', () => {
      browser.open(mockData, callbacks);

      const descriptions = document.querySelectorAll('.da-literature-browser__section-description');
      expect(descriptions.length).toBe(3);
      expect(descriptions[0].textContent).toContain('Foundational digital concepts');
      expect(descriptions[1].textContent).toContain('Instruction encoding');
      expect(descriptions[2].textContent).toContain('Pipelining, caching');
    });

    it('should NOT render section descriptions when filtered to a single category (hero handles it)', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const descriptions = document.querySelectorAll('.da-literature-browser__section-description');
      expect(descriptions.length).toBe(0);
    });

    it('should show singular "article" when section has 1 result (M3 fix)', () => {
      browser.open(mockData, callbacks);

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'karnaugh';
      search.dispatchEvent(new Event('input'));

      // Only 1 article matches — meta should say "1 article", not "1 articles"
      const headers = document.querySelectorAll('.da-literature-browser__section-header');
      expect(headers.length).toBe(1);
      const meta = headers[0].querySelector('.da-literature-browser__section-meta');
      expect(meta!.textContent).toMatch(/^1 article \u00B7 ~\d+ min$/);
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.2: Expanded category hero (AC 5)
  // ---------------------------------------------------------------------------

  describe('category hero (Story 20.2, AC 5)', () => {
    it('should NOT render category hero when no category is filtered', () => {
      browser.open(mockData, callbacks);

      const hero = document.querySelector('.da-literature-browser__category-hero');
      expect(hero).toBeNull();
    });

    it('should render category hero when filtering to Basic', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const hero = document.querySelector('.da-literature-browser__category-hero');
      expect(hero).not.toBeNull();
    });

    it('should render category hero with full description', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const description = document.querySelector('.da-literature-browser__category-hero-description');
      expect(description).not.toBeNull();
      expect(description!.textContent).toContain('Foundational digital concepts');
    });

    it('should render category hero with stage badges', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const badges = document.querySelectorAll('.da-literature-browser__stage-badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
      expect(badges[0].textContent).toBe('micro4');
    });

    it('should render multiple stage badges for intermediate category', () => {
      browser.open(mockData, callbacks);

      const intermediateChip = document.querySelector('.da-literature-filter[data-category="intermediate"]') as HTMLElement;
      intermediateChip.click();

      const badges = document.querySelectorAll('.da-literature-browser__stage-badge');
      expect(badges.length).toBe(3); // micro4, micro8, micro16
    });

    it('should render 3 stage badges for advanced category', () => {
      browser.open(mockData, callbacks);

      const advancedChip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;
      advancedChip.click();

      const badges = document.querySelectorAll('.da-literature-browser__stage-badge');
      expect(badges.length).toBe(3); // micro32, micro32p, micro32s
    });

    it('should remove category hero when filter is cleared', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();
      expect(document.querySelector('.da-literature-browser__category-hero')).not.toBeNull();

      // Click again to clear filter
      basicChip.click();
      expect(document.querySelector('.da-literature-browser__category-hero')).toBeNull();
    });

    it('should update category hero when switching categories', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      const advancedChip = document.querySelector('.da-literature-filter[data-category="advanced"]') as HTMLElement;

      basicChip.click();
      let description = document.querySelector('.da-literature-browser__category-hero-description');
      expect(description!.textContent).toContain('Foundational digital concepts');

      advancedChip.click();
      description = document.querySelector('.da-literature-browser__category-hero-description');
      expect(description!.textContent).toContain('Pipelining, caching');
    });

    it('should render category hero header with icon, title, and meta', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const heroHeader = document.querySelector('.da-literature-browser__category-hero-header');
      expect(heroHeader).not.toBeNull();

      // Should contain icon, h3, and meta span
      const icon = heroHeader!.querySelector('.da-literature-browser__section-icon');
      expect(icon).not.toBeNull();

      const h3 = heroHeader!.querySelector('h3');
      expect(h3).not.toBeNull();
      expect(h3!.textContent).toBe('Basic');
    });

    it('should show filtered counts in hero during search (H1 hero fix)', () => {
      browser.open(mockData, callbacks);

      // Filter to basic, then search for "binary"
      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const search = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      search.value = 'binary';
      search.dispatchEvent(new Event('input'));

      const heroMeta = document.querySelector('.da-literature-browser__category-hero-header .da-literature-browser__section-meta');
      expect(heroMeta).not.toBeNull();
      // Should show filtered count (1 article matching "binary" in basic), not static total (6)
      expect(heroMeta!.textContent).toMatch(/^1 article \u00B7 ~8 min$/);
    });

    it('should show full category counts in hero when no search is active', () => {
      browser.open(mockData, callbacks);

      const basicChip = document.querySelector('.da-literature-filter[data-category="basic"]') as HTMLElement;
      basicChip.click();

      const heroMeta = document.querySelector('.da-literature-browser__category-hero-header .da-literature-browser__section-meta');
      expect(heroMeta).not.toBeNull();
      expect(heroMeta!.textContent).toBe('6 articles \u00B7 ~56 min');
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.3: Contextual help filtering
  // ---------------------------------------------------------------------------

  describe('contextual help filtering (Story 20.3)', () => {
    it('should show only matching articles when contextFilter with tags is provided', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic'], contextLabel: 'Circuit Panel' },
        },
        callbacks,
      );

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.length).toBeLessThan(LITERATURE_ARTICLES.length);
    });

    it('should render context banner when contextFilter is active', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates'], contextLabel: 'Circuit Panel' },
        },
        callbacks,
      );

      const banner = document.querySelector('.da-literature-browser__context-banner');
      expect(banner).not.toBeNull();
      expect(banner!.textContent).toContain('Circuit Panel');
    });

    it('should show "Show all articles" button in context banner', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates'], contextLabel: 'Circuit Panel' },
        },
        callbacks,
      );

      const showAllBtn = document.querySelector('.da-literature-browser__show-all-btn');
      expect(showAllBtn).not.toBeNull();
      expect(showAllBtn!.textContent).toBe('Show all articles');
    });

    it('should clear context filter and show all articles when "Show all" is clicked', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates'], contextLabel: 'Circuit Panel' },
        },
        callbacks,
      );

      const filteredCount = document.querySelectorAll('.da-literature-card').length;

      const showAllBtn = document.querySelector('.da-literature-browser__show-all-btn') as HTMLButtonElement;
      showAllBtn.click();

      const allCount = document.querySelectorAll('.da-literature-card').length;
      expect(allCount).toBe(LITERATURE_ARTICLES.length);
      expect(allCount).toBeGreaterThan(filteredCount);

      // Banner should be removed
      const banner = document.querySelector('.da-literature-browser__context-banner');
      expect(banner).toBeNull();
    });

    it('should not render context banner when no contextFilter is provided', () => {
      browser.open({ articles: LITERATURE_ARTICLES }, callbacks);

      const banner = document.querySelector('.da-literature-browser__context-banner');
      expect(banner).toBeNull();
    });

    it('should clear contextFilter on close', () => {
      vi.useFakeTimers();
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates'], contextLabel: 'Circuit Panel' },
        },
        callbacks,
      );

      browser.close();
      vi.advanceTimersByTime(300);

      // Re-open without context filter — should show all articles
      browser.open({ articles: LITERATURE_ARTICLES }, callbacks);
      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBe(LITERATURE_ARTICLES.length);
      vi.useRealTimers();
    });

    it('should combine context filter with category filter', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['memory', 'ram', 'cache', 'hierarchy'], contextLabel: 'Memory' },
        },
        callbacks,
      );

      const contextCount = document.querySelectorAll('.da-literature-card').length;

      // Click "Basic" filter chip
      const filterChips = document.querySelectorAll('.da-literature-filter');
      const basicChip = Array.from(filterChips).find(c => c.textContent?.startsWith('Basic'));
      if (basicChip) {
        (basicChip as HTMLButtonElement).click();
        const filteredCount = document.querySelectorAll('.da-literature-card').length;
        expect(filteredCount).toBeLessThanOrEqual(contextCount);
      }
    });

    it('should combine context filter with search filter', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic', 'alu', 'boolean'], contextLabel: 'Circuit' },
        },
        callbacks,
      );

      const contextCount = document.querySelectorAll('.da-literature-card').length;

      const searchInput = document.querySelector('.da-literature-browser__search') as HTMLInputElement;
      searchInput.value = 'alu';
      searchInput.dispatchEvent(new Event('input'));

      const searchedCount = document.querySelectorAll('.da-literature-card').length;
      expect(searchedCount).toBeLessThanOrEqual(contextCount);
      expect(searchedCount).toBeGreaterThanOrEqual(1);
    });

    it('should narrow by stage when contextFilter includes stages (F2 fix)', () => {
      // Open with circuit tags + micro4 stage — should show only micro4-related circuit articles
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic', 'alu', 'boolean'], stages: ['micro4'], contextLabel: 'Circuit' },
        },
        callbacks,
      );

      const stageCount = document.querySelectorAll('.da-literature-card').length;

      browser.close();
      vi.useFakeTimers();
      vi.advanceTimersByTime(300);
      vi.useRealTimers();

      // Open with same tags but no stage — should show at least as many
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic', 'alu', 'boolean'], contextLabel: 'Circuit' },
        },
        callbacks,
      );

      const noStageCount = document.querySelectorAll('.da-literature-card').length;
      expect(stageCount).toBeLessThanOrEqual(noStageCount);
      expect(stageCount).toBeGreaterThanOrEqual(1); // fallback ensures at least 1
    });

    it('should fall back to tag-only when stage filter yields zero (F2 fix)', () => {
      // Use a stage that likely has no circuit-tagged articles
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic'], stages: ['micro32s'], contextLabel: 'Circuit' },
        },
        callbacks,
      );

      const cards = document.querySelectorAll('.da-literature-card');
      expect(cards.length).toBeGreaterThanOrEqual(1); // falls back to tag-only
    });

    it('should show context-filtered counts in filter chips (F3 fix)', () => {
      browser.open(
        {
          articles: LITERATURE_ARTICLES,
          contextFilter: { tags: ['gates', 'logic', 'alu', 'boolean'], contextLabel: 'Circuit' },
        },
        callbacks,
      );

      const contextCards = document.querySelectorAll('.da-literature-card').length;
      const allChip = document.querySelector('.da-literature-filter[data-category="all"]');
      expect(allChip).not.toBeNull();
      // The "All" chip should show the context-filtered count, not the full 20
      expect(allChip!.textContent).toBe(`All (${contextCards})`);
      expect(contextCards).toBeLessThan(LITERATURE_ARTICLES.length);
    });
  });
});
