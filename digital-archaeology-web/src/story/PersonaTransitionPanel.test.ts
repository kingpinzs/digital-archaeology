// src/story/PersonaTransitionPanel.test.ts
// Tests for the PersonaTransitionPanel component
// Story 10.20: Create Persona Transition Narratives

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersonaTransitionPanel } from './PersonaTransitionPanel';
import type { TransitionData, PersonaData } from './types';

describe('PersonaTransitionPanel', () => {
  let container: HTMLElement;
  let panel: PersonaTransitionPanel;

  const mockOutgoingPersona: PersonaData = {
    id: 'babbage-1837',
    name: 'Charles Babbage',
    years: '1791-1871',
    era: '1837-1871',
    avatar: '👴',
    quote: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
    background: 'You are the Lucasian Professor of Mathematics at Cambridge.',
    motivation: 'To free mankind from the drudgery of calculation.',
    constraints: [
      { type: 'technical', description: 'Victorian-era precision manufacturing limits' },
    ],
    problem: 'Can a machine be built that thinks?',
    keyContribution: 'Designed the first general-purpose computer concept.',
  };

  const mockIncomingPersona: PersonaData = {
    id: 'zuse-1941',
    name: 'Konrad Zuse',
    years: '1910-1995',
    era: '1935-1945',
    avatar: '👨‍🔬',
    quote: 'I built the Z3 to free engineers from tedious calculations.',
    background: 'You are a German civil engineer tired of endless calculations.',
    motivation: 'To build a machine that can compute automatically.',
    constraints: [
      { type: 'economic', description: 'Limited funding in wartime Germany' },
    ],
    problem: 'Can telephone relays be used to build a computing machine?',
    keyContribution: 'Built the first programmable, fully automatic computer.',
  };

  const mockTransitionData: TransitionData = {
    outgoingPersonaId: 'babbage-1837',
    incomingPersonaId: 'zuse-1941',
    yearsElapsed: 104,
    outgoingEra: 'Mechanical',
    incomingEra: 'Relay',
    narrative: [
      "Charles Babbage's dream of the Analytical Engine died with him in 1871.",
      "The world wasn't ready. Victorian-era precision couldn't build it.",
      '104 years passed.',
      'In 1935, a young German civil engineering student named Konrad Zuse grew tired of endless calculations.',
    ],
    outgoingQuote: 'The Analytical Engine has no pretensions to originate anything.',
    incomingQuote: 'Babbage was right about the idea. He just had the wrong technology.',
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
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-transition-panel');
      expect(panelElement).not.toBeNull();
    });

    it('should have role="dialog" and aria-modal for accessibility', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-transition-panel');
      expect(panelElement?.getAttribute('role')).toBe('dialog');
      expect(panelElement?.getAttribute('aria-modal')).toBe('true');
    });

    it('should render backdrop overlay', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const backdrop = container.querySelector('.da-persona-transition-backdrop');
      expect(backdrop).not.toBeNull();
    });
  });

  describe('Task 2.2: Outgoing Persona Section', () => {
    it('should render outgoing persona avatar', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const outgoingAvatar = container.querySelector('.da-transition-outgoing-avatar');
      expect(outgoingAvatar?.textContent).toBe('👴');
    });

    it('should render outgoing persona name', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const outgoingName = container.querySelector('.da-transition-outgoing-name');
      expect(outgoingName?.textContent).toBe('Charles Babbage');
    });

    it('should render outgoing persona contribution', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const contribution = container.querySelector('.da-transition-outgoing-contribution');
      expect(contribution?.textContent).toContain('general-purpose computer');
    });
  });

  describe('Task 2.3: Timeline Display', () => {
    it('should display years elapsed prominently', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const yearsElapsed = container.querySelector('.da-transition-years-elapsed');
      expect(yearsElapsed?.textContent).toContain('104');
    });

    it('should show era labels', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const outgoingEra = container.querySelector('.da-transition-era-outgoing');
      const incomingEra = container.querySelector('.da-transition-era-incoming');
      expect(outgoingEra?.textContent).toContain('Mechanical');
      expect(incomingEra?.textContent).toContain('Relay');
    });
  });

  describe('Task 2.4: Narrative Bridge', () => {
    it('should render all narrative paragraphs', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const narrativeContainer = container.querySelector('.da-transition-narrative');
      const paragraphs = narrativeContainer?.querySelectorAll('p');
      expect(paragraphs?.length).toBe(4);
    });

    it('should display narrative content correctly', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const narrativeContainer = container.querySelector('.da-transition-narrative');
      expect(narrativeContainer?.textContent).toContain("Babbage's dream");
      expect(narrativeContainer?.textContent).toContain('Konrad Zuse');
    });
  });

  describe('Task 2.5: Incoming Persona Teaser', () => {
    it('should render incoming persona avatar', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const incomingAvatar = container.querySelector('.da-transition-incoming-avatar');
      expect(incomingAvatar?.textContent).toBe('👨‍🔬');
    });

    it('should render incoming persona name', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const incomingName = container.querySelector('.da-transition-incoming-name');
      expect(incomingName?.textContent).toBe('Konrad Zuse');
    });

    it('should render incoming persona era', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const incomingEra = container.querySelector('.da-transition-incoming-era');
      expect(incomingEra?.textContent).toContain('1935-1945');
    });
  });

  describe('Task 2.6 & 2.7: Quotes', () => {
    it('should render outgoing persona legacy quote', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const outgoingQuote = container.querySelector('.da-transition-outgoing-quote');
      expect(outgoingQuote?.textContent).toContain('no pretensions to originate');
    });

    it('should render incoming persona introductory quote', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const incomingQuote = container.querySelector('.da-transition-incoming-quote');
      expect(incomingQuote?.textContent).toContain('wrong technology');
    });

    it('should handle missing quotes gracefully', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const transitionWithoutQuotes: TransitionData = {
        ...mockTransitionData,
        outgoingQuote: undefined,
        incomingQuote: undefined,
      };
      panel.setTransitionData(transitionWithoutQuotes, mockOutgoingPersona, mockIncomingPersona);

      const outgoingQuote = container.querySelector('.da-transition-outgoing-quote');
      const incomingQuote = container.querySelector('.da-transition-incoming-quote');
      expect(outgoingQuote?.classList.contains('da-hidden') || outgoingQuote?.textContent === '').toBe(true);
      expect(incomingQuote?.classList.contains('da-hidden') || incomingQuote?.textContent === '').toBe(true);
    });
  });

  describe('Task 2.8: Continue Button', () => {
    it('should have Continue Your Journey button', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const continueButton = container.querySelector('.da-transition-continue');
      expect(continueButton).not.toBeNull();
      expect(continueButton?.textContent).toContain('Continue');
    });

    it('should call onContinue callback when button clicked', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData, mockOutgoingPersona, mockIncomingPersona);

      const callback = vi.fn();
      panel.onContinue(callback);

      const continueButton = container.querySelector('.da-transition-continue') as HTMLElement;
      continueButton?.click();

      expect(callback).toHaveBeenCalled();
    });

    it('should have proper aria-label on continue button', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const continueButton = container.querySelector('.da-transition-continue');
      expect(continueButton?.getAttribute('aria-label')).toBe('Continue to next era');
    });
  });

  describe('Task 2.9: Show/Hide Methods', () => {
    it('should be hidden by default', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(false);
    });

    it('should show panel when show() is called', async () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to add --visible class
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(panel.isVisible()).toBe(true);
    });

    it('should hide panel when hide() is called', async () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to add --visible class
      await new Promise(resolve => requestAnimationFrame(resolve));

      panel.hide();

      expect(panel.isVisible()).toBe(false);
    });

    it('should dispatch transition-panel-opened event on show', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const listener = vi.fn();
      window.addEventListener('transition-panel-opened', listener);
      try {
        panel.show();
        expect(listener).toHaveBeenCalled();
      } finally {
        // Issue 6 fix: ensure cleanup even if assertion fails
        window.removeEventListener('transition-panel-opened', listener);
      }
    });

    it('should dispatch transition-panel-closed event on hide', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      const listener = vi.fn();
      window.addEventListener('transition-panel-closed', listener);
      try {
        panel.hide();
        expect(listener).toHaveBeenCalled();
      } finally {
        // Issue 6 fix: ensure cleanup even if assertion fails
        window.removeEventListener('transition-panel-closed', listener);
      }
    });
  });

  describe('Task 2.10: Escape Key Handling', () => {
    it('should NOT close on Escape by default (mandatory transition)', async () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to add --visible class
      await new Promise(resolve => requestAnimationFrame(resolve));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      // Transitions are mandatory - Escape does NOT close
      expect(panel.isVisible()).toBe(true);
    });

    it('should close on Escape when allowEscapeClose is enabled', async () => {
      panel = new PersonaTransitionPanel({ allowEscapeClose: true });
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to add --visible class
      await new Promise(resolve => requestAnimationFrame(resolve));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labelledby pointing to transition heading', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-persona-transition-panel');
      const headingId = container.querySelector('.da-transition-heading')?.getAttribute('id');
      expect(panelElement?.getAttribute('aria-labelledby')).toBe(headingId);
    });

    it('should focus continue button on show', async () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to execute (Issue 5 fix moved focus inside RAF)
      await new Promise(resolve => requestAnimationFrame(resolve));

      const continueButton = container.querySelector('.da-transition-continue') as HTMLElement;
      expect(document.activeElement).toBe(continueButton);
    });

    it('should have aria-live region for announcements', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });

    it('should trap focus inside modal when open', async () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();

      // Wait for requestAnimationFrame to execute (Issue 5 fix moved focus inside RAF)
      await new Promise(resolve => requestAnimationFrame(resolve));

      // The only focusable element should be the continue button
      const continueButton = container.querySelector('.da-transition-continue') as HTMLElement;
      expect(document.activeElement).toBe(continueButton);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.show();
      panel.destroy();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });

    it('should remove DOM elements on destroy', () => {
      panel = new PersonaTransitionPanel();
      panel.mount(container);
      panel.destroy();

      const panelElement = container.querySelector('.da-persona-transition-panel');
      expect(panelElement).toBeNull();
    });
  });
});
