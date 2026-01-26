// src/story/PersonaProfilePanel.test.ts
// Tests for the PersonaProfilePanel component
// Story 10.19: Implement Persona Profile Cards

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersonaProfilePanel } from './PersonaProfilePanel';
import type { PersonaData } from './types';

describe('PersonaProfilePanel', () => {
  let container: HTMLElement;
  let panel: PersonaProfilePanel;

  const mockPersonaData: PersonaData = {
    id: 'faggin-1971',
    name: 'Federico Faggin',
    years: '1941-',
    era: '1970-1971',
    avatar: '👨‍🔬',
    quote: 'The microprocessor was not invented. It was discovered.',
    background: 'You immigrated from Italy to Silicon Valley in 1968.',
    motivation: 'Busicom needs custom chips. But what if one programmable chip could do it all?',
    constraints: [
      { type: 'technical', description: 'Only 2,300 transistors possible' },
      { type: 'economic', description: 'Busicom wants calculators, not computers' },
      { type: 'political', description: 'Management sees Intel as a memory company' },
      { type: 'knowledge', description: 'No one has built a CPU this small before' },
    ],
    problem: 'Can you fit an entire CPU into 2,300 transistors?',
    keyContribution: 'Invented silicon gate technology and designed the Intel 4004.',
    additionalQuotes: [
      'I was able to bring together the pieces.',
      'Working at Intel was like being in a startup.',
      'The 4004 was a computer on a chip.',
    ],
    discoveriesUnlocked: ['binary-representation', 'register-architecture'],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    panel?.destroy();
    container.remove();
    vi.clearAllMocks();
  });

  describe('Task 2.1: Component Structure', () => {
    it('should render panel as modal when mounted', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-profile-panel');
      expect(panelElement).not.toBeNull();
    });

    it('should have role="dialog" and aria-modal for accessibility', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-profile-panel');
      expect(panelElement?.getAttribute('role')).toBe('dialog');
      expect(panelElement?.getAttribute('aria-modal')).toBe('true');
    });

    it('should render backdrop overlay', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const backdrop = container.querySelector('.da-persona-profile-backdrop');
      expect(backdrop).not.toBeNull();
    });
  });

  describe('Task 2.2: Persona Name and Years', () => {
    it('should render persona name with large heading', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const name = container.querySelector('.da-persona-profile-name');
      expect(name?.textContent).toBe('Federico Faggin');
    });

    it('should render persona years', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const years = container.querySelector('.da-persona-profile-years');
      expect(years?.textContent).toContain('1941-');
    });
  });

  describe('Task 2.3: Avatar Display', () => {
    it('should display avatar prominently', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const avatar = container.querySelector('.da-persona-profile-avatar');
      expect(avatar?.textContent).toBe('👨‍🔬');
    });
  });

  describe('Task 2.4: Key Contribution Section', () => {
    it('should show key contribution section with highlighted text', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const contribution = container.querySelector('.da-persona-profile-contribution');
      expect(contribution).not.toBeNull();
      expect(contribution?.textContent).toContain('Intel 4004');
    });

    it('should handle persona without keyContribution gracefully', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const personaWithoutContribution = { ...mockPersonaData };
      delete personaWithoutContribution.keyContribution;
      panel.setPersonaData(personaWithoutContribution);

      // Should not throw and contribution section should be hidden or empty
      const contribution = container.querySelector('.da-persona-profile-contribution');
      expect(contribution?.classList.contains('da-hidden') || contribution?.textContent === '').toBe(true);
    });
  });

  describe('Task 2.5: Background and Motivation', () => {
    it('should show background section', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const background = container.querySelector('.da-persona-profile-background');
      expect(background?.textContent).toContain('immigrated from Italy');
    });

    it('should show motivation section', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const motivation = container.querySelector('.da-persona-profile-motivation');
      expect(motivation?.textContent).toContain('Busicom');
    });
  });

  describe('Task 2.6: Constraint Badges', () => {
    it('should render all constraint badges', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const badges = container.querySelectorAll('.da-constraint-badge');
      expect(badges.length).toBe(4);
    });

    it('should show constraint type icons', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const technicalBadge = container.querySelector('.da-constraint-badge--technical');
      expect(technicalBadge).not.toBeNull();
    });
  });

  describe('Task 2.7: Problem Statement', () => {
    it('should display "Your Challenge" problem statement', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const problem = container.querySelector('.da-persona-profile-challenge');
      expect(problem?.textContent).toContain('2,300 transistors');
    });
  });

  describe('Task 2.8: Quotes Carousel', () => {
    it('should show quotes section with pagination', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const quotes = container.querySelector('.da-persona-profile-quotes');
      expect(quotes).not.toBeNull();
    });

    it('should display first quote initially', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const quoteText = container.querySelector('.da-persona-profile-quote-text');
      expect(quoteText?.textContent).toContain('microprocessor was not invented');
    });

    it('should show navigation buttons for multiple quotes', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const prevButton = container.querySelector('.da-persona-profile-quote-prev');
      const nextButton = container.querySelector('.da-persona-profile-quote-next');
      expect(prevButton).not.toBeNull();
      expect(nextButton).not.toBeNull();
    });

    it('should cycle through quotes on next button click', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const nextButton = container.querySelector('.da-persona-profile-quote-next') as HTMLElement;
      nextButton?.click();

      const quoteText = container.querySelector('.da-persona-profile-quote-text');
      expect(quoteText?.textContent).toContain('bring together the pieces');
    });

    it('should wrap around when cycling past last quote', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const nextButton = container.querySelector('.da-persona-profile-quote-next') as HTMLElement;
      // Main quote + 3 additional = 4 quotes, click 4 times to wrap
      nextButton?.click();
      nextButton?.click();
      nextButton?.click();
      nextButton?.click();

      const quoteText = container.querySelector('.da-persona-profile-quote-text');
      expect(quoteText?.textContent).toContain('microprocessor was not invented');
    });
  });

  describe('Task 2.9: Close Button and Escape Key', () => {
    it('should have close button', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const closeButton = container.querySelector('.da-persona-profile-close');
      expect(closeButton).not.toBeNull();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close persona profile');
    });

    it('should close panel when close button clicked', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const closeButton = container.querySelector('.da-persona-profile-close') as HTMLElement;
      closeButton?.click();

      expect(panel.isVisible()).toBe(false);
    });

    it('should close panel when Escape key pressed', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(panel.isVisible()).toBe(false);
    });

    it('should close panel when backdrop clicked', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const backdrop = container.querySelector('.da-persona-profile-backdrop') as HTMLElement;
      backdrop?.click();

      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('Task 2.10: Show/Hide Methods', () => {
    it('should be hidden by default', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(false);
    });

    it('should show panel when show() is called', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      expect(panel.isVisible()).toBe(true);
    });

    it('should hide panel when hide() is called', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();
      panel.hide();

      expect(panel.isVisible()).toBe(false);
    });

    it('should dispatch persona-profile-opened event on show', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const listener = vi.fn();
      window.addEventListener('persona-profile-opened', listener);
      panel.show();

      expect(listener).toHaveBeenCalled();
      window.removeEventListener('persona-profile-opened', listener);
    });

    it('should dispatch persona-profile-closed event on hide', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const listener = vi.fn();
      window.addEventListener('persona-profile-closed', listener);
      panel.hide();

      expect(listener).toHaveBeenCalled();
      window.removeEventListener('persona-profile-closed', listener);
    });
  });

  describe('Discoveries Section (Task 3)', () => {
    it('should show discoveries section', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const discoveries = container.querySelector('.da-persona-profile-discoveries');
      expect(discoveries).not.toBeNull();
    });

    it('should display earned discovery badges', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const badges = container.querySelectorAll('.da-persona-profile-discovery-badge');
      expect(badges.length).toBe(2); // binary-representation and register-architecture
    });

    it('should show placeholder when no discoveries', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const personaNoDiscoveries = { ...mockPersonaData, discoveriesUnlocked: [] };
      panel.setPersonaData(personaNoDiscoveries);

      const placeholder = container.querySelector('.da-persona-profile-no-discoveries');
      expect(placeholder?.textContent).toContain('No discoveries yet');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labelledby pointing to persona name', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-profile-panel');
      const nameId = container.querySelector('.da-persona-profile-name')?.getAttribute('id');
      expect(panelElement?.getAttribute('aria-labelledby')).toBe(nameId);
    });

    it('should trap focus inside modal when open', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const closeButton = container.querySelector('.da-persona-profile-close') as HTMLElement;
      expect(document.activeElement).toBe(closeButton);
    });

    it('should have aria-live region for announcements', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should announce when panel opens', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Persona profile opened');
    });

    it('should announce when panel closes', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();
      panel.hide();

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Persona profile closed');
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.show();
      panel.destroy();

      // Escape should not throw or cause issues
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });

    it('should remove DOM elements on destroy', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.destroy();

      const panelElement = container.querySelector('.da-persona-profile-panel');
      expect(panelElement).toBeNull();
    });
  });

  describe('Story 10.19 Task 7: Event Subscriptions', () => {
    it('should open panel on view-persona-requested event', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const event = new CustomEvent('view-persona-requested', {
        detail: { persona: mockPersonaData },
      });
      window.dispatchEvent(event);

      expect(panel.isVisible()).toBe(true);
      expect(panel.getPersonaData()).toEqual(mockPersonaData);
    });

    it('should update persona data on persona-changed event', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.setPersonaData(mockPersonaData);

      const newPersona = {
        ...mockPersonaData,
        id: 'babbage-1837',
        name: 'Charles Babbage',
        avatar: '🎩',
      };

      const event = new CustomEvent('persona-changed', {
        detail: { persona: newPersona },
      });
      window.dispatchEvent(event);

      expect(panel.getPersonaData()).toEqual(newPersona);
      const name = container.querySelector('.da-persona-profile-name');
      expect(name?.textContent).toBe('Charles Babbage');
    });

    it('should not open panel if view-persona-requested has no persona', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);

      const event = new CustomEvent('view-persona-requested', {
        detail: {},
      });
      window.dispatchEvent(event);

      expect(panel.isVisible()).toBe(false);
    });

    it('should remove event listeners on destroy', () => {
      panel = new PersonaProfilePanel();
      panel.mount(container);
      panel.destroy();

      // Dispatch view-persona-requested - should not cause issues
      const event = new CustomEvent('view-persona-requested', {
        detail: { persona: mockPersonaData },
      });
      expect(() => window.dispatchEvent(event)).not.toThrow();
    });
  });
});
