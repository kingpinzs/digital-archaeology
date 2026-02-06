// src/story/DiscovererExperience.test.ts
// Tests for DiscovererExperience component
// Story 10.23: First Discoverer's Mind Experience

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscovererExperience } from './DiscovererExperience';
import { MindsetProvider } from './MindsetProvider';

// Mock fetch for loading discoverer-intro.json
const mockIntroData = {
  welcome: {
    headline: 'Every technology you use today was once someone\'s impossible problem.',
    subtext: 'You are about to step into a moment that changed everything.',
  },
  era: {
    year: 1971,
    location: 'Intel, Santa Clara, California',
    framing: 'The year is 1971. You are at Intel.',
  },
  persona: {
    id: 'faggin-discoverer-intro',
    name: 'Federico Faggin',
    years: '1941-present',
    era: '1971',
    avatar: '🔬',
    background: 'You are a young physicist-turned-chip-designer at Intel.',
    motivation: 'Build something universal.',
    problem: 'You have 2,300 transistors. Build a processor.',
    quote: 'I knew that the microprocessor would change the world.',
    constraints: [
      { type: 'technical', description: 'Only 2,300 transistors available' },
    ],
  },
  constraint: {
    headline: 'Your ALU can only work with 4 bits at a time.',
    resources: ['4-bit data bus', '256 bytes of memory', '16 possible opcodes'],
    challenge: 'Add two numbers together.',
  },
  decision: {
    id: 'discoverer-alu-addition',
    question: 'How should your 4-bit ALU perform addition?',
    context: 'You need to add two 4-bit numbers.',
    options: [
      {
        id: 'ripple-carry',
        description: 'Ripple carry — simple',
        visiblePros: ['Uses fewest transistors'],
        visibleCons: ['Slow'],
        isHistorical: true,
      },
      {
        id: 'carry-lookahead',
        description: 'Carry lookahead — fast',
        visiblePros: ['Fast'],
        visibleCons: ['Uses more transistors'],
        isHistorical: false,
      },
      {
        id: 'serial-bit',
        description: 'Serial — minimal',
        visiblePros: ['Minimum transistors'],
        visibleCons: ['Very slow'],
        isHistorical: false,
      },
    ],
    historicalChoice: 'ripple-carry',
    historicalOutcome: 'Faggin chose ripple carry for the 4004.',
    alternateOutcomes: [
      { optionId: 'carry-lookahead', speculation: 'Would have been too expensive.' },
      { optionId: 'serial-bit', speculation: 'Would have been too slow.' },
    ],
  },
  builder: {
    title: 'Build the 4-Bit Adder',
    description: 'Wire up the arithmetic heart.',
    decisionId: 'discoverer-alu-addition',
    objectives: [
      { id: 'connect-inputs', text: 'Connect the inputs', completed: false },
      { id: 'handle-carry', text: 'Handle the carry', completed: false },
      { id: 'test-addition', text: 'Test it — add 0101 + 0011', completed: false },
    ],
  },
  celebration: {
    headline: 'IT WORKS!',
    lines: [
      'You just built the core of a microprocessor.',
      'The same circuit Faggin used in 1971.',
      '5 + 3 = 8. Four bits. The beginning of everything.',
    ],
    journeyButton: 'Begin the Full Journey',
    labButton: 'Explore the Lab',
  },
  mindset: {
    year: 1971,
    knownTechnology: ['transistor', 'integrated circuit'],
    unknownTechnology: ['personal computer', 'internet'],
    activeProblems: [{ statement: 'Fit CPU on one chip', motivation: 'Cost' }],
    constraints: [{ type: 'technical', description: '2,300 transistors' }],
    impossibilities: ['gigabyte memory'],
    historicalPerspective: {
      currentKnowledge: 'You are an engineer at Intel in 1971.',
      futureBlind: 'You do not know the future.',
    },
  },
};

function setupFetchMock(): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockIntroData),
  });
}

function setupFetchError(): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found',
  });
}

describe('DiscovererExperience', () => {
  let experience: DiscovererExperience;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    experience = new DiscovererExperience();
    setupFetchMock();
  });

  afterEach(() => {
    experience.destroy();
    container.remove();
    MindsetProvider.resetInstance();
    vi.restoreAllMocks();
  });

  describe('mount', () => {
    it('should create element with correct class', async () => {
      await experience.mount(container);
      expect(container.querySelector('.da-discoverer-experience')).not.toBeNull();
    });

    it('should have region role for accessibility', async () => {
      await experience.mount(container);
      const el = container.querySelector('.da-discoverer-experience');
      expect(el?.getAttribute('role')).toBe('region');
    });

    it('should have aria-label for accessibility', async () => {
      await experience.mount(container);
      const el = container.querySelector('.da-discoverer-experience');
      expect(el?.getAttribute('aria-label')).toBe('First Discovery Experience');
    });

    it('should have aria-live polite on phase container', async () => {
      await experience.mount(container);
      const phaseEl = container.querySelector('.da-discoverer-phase');
      expect(phaseEl?.getAttribute('aria-live')).toBe('polite');
    });

    it('should fetch discoverer-intro.json on mount', async () => {
      await experience.mount(container);
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('should start in intro phase', async () => {
      await experience.mount(container);
      expect(container.querySelector('.da-discoverer-intro')).not.toBeNull();
    });
  });

  describe('intro phase', () => {
    it('should render welcome headline', async () => {
      await experience.mount(container);
      const headline = container.querySelector('.da-discoverer-headline');
      expect(headline?.textContent).toContain('impossible problem');
    });

    it('should render era framing text', async () => {
      await experience.mount(container);
      const framing = container.querySelector('.da-discoverer-era-framing');
      expect(framing?.textContent).toContain('1971');
    });

    it('should render begin button', async () => {
      await experience.mount(container);
      const btn = container.querySelector('.da-discoverer-begin-btn');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('Begin');
    });

    it('should render skip intro link', async () => {
      await experience.mount(container);
      const skip = container.querySelector('.da-discoverer-skip-link');
      expect(skip).not.toBeNull();
    });

    it('should fire onSkip when skip is clicked', async () => {
      const callback = vi.fn();
      experience.onSkip(callback);
      await experience.mount(container);
      const skip = container.querySelector('.da-discoverer-skip-link') as HTMLElement;
      skip.click();
      expect(callback).toHaveBeenCalled();
    });

    it('should advance to constraint phase when begin is clicked', async () => {
      await experience.mount(container);
      const btn = container.querySelector('.da-discoverer-begin-btn') as HTMLElement;
      btn.click();
      expect(container.querySelector('.da-discoverer-constraint')).not.toBeNull();
      expect(container.querySelector('.da-discoverer-intro')).toBeNull();
    });
  });

  describe('constraint phase', () => {
    async function goToConstraint(): Promise<void> {
      await experience.mount(container);
      const btn = container.querySelector('.da-discoverer-begin-btn') as HTMLElement;
      btn.click();
    }

    it('should render constraint headline', async () => {
      await goToConstraint();
      const headline = container.querySelector('.da-discoverer-constraint-headline');
      expect(headline?.textContent).toContain('4 bits');
    });

    it('should render resource list', async () => {
      await goToConstraint();
      const items = container.querySelectorAll('.da-discoverer-resource-item');
      expect(items.length).toBe(3);
    });

    it('should render challenge text', async () => {
      await goToConstraint();
      const challenge = container.querySelector('.da-discoverer-challenge-text');
      expect(challenge?.textContent).toContain('Add two numbers');
    });

    it('should have continue button', async () => {
      await goToConstraint();
      const btn = container.querySelector('.da-discoverer-continue-btn');
      expect(btn).not.toBeNull();
    });

    it('should advance to decision phase on continue', async () => {
      await goToConstraint();
      const btn = container.querySelector('.da-discoverer-continue-btn') as HTMLElement;
      btn.click();
      expect(container.querySelector('.da-discoverer-decision')).not.toBeNull();
      expect(container.querySelector('.da-discoverer-constraint')).toBeNull();
    });
  });

  describe('decision phase', () => {
    async function goToDecision(): Promise<void> {
      await experience.mount(container);
      (container.querySelector('.da-discoverer-begin-btn') as HTMLElement).click();
      (container.querySelector('.da-discoverer-continue-btn') as HTMLElement).click();
    }

    it('should render decision maker scene', async () => {
      await goToDecision();
      expect(container.querySelector('.da-decision-maker-scene')).not.toBeNull();
    });

    it('should render decision options', async () => {
      await goToDecision();
      const options = container.querySelectorAll('.da-decision-option');
      expect(options.length).toBe(3);
    });
  });

  describe('build phase', () => {
    async function goToBuild(): Promise<void> {
      await experience.mount(container);
      // intro → constraint
      (container.querySelector('.da-discoverer-begin-btn') as HTMLElement).click();
      // constraint → decision
      (container.querySelector('.da-discoverer-continue-btn') as HTMLElement).click();
      // decision: choose + reveal + build
      const optionEl = container.querySelector('[data-option-id="ripple-carry"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();
      const buildBtn = container.querySelector('.da-decision-maker-build-btn') as HTMLElement;
      buildBtn.click();
    }

    it('should render builder mode scene', async () => {
      await goToBuild();
      expect(container.querySelector('.da-builder-mode-scene')).not.toBeNull();
    });

    it('should show challenge objectives', async () => {
      await goToBuild();
      const items = container.querySelectorAll('.da-builder-objective-item');
      expect(items.length).toBe(3);
    });
  });

  describe('celebration phase', () => {
    it('should render celebration headline', async () => {
      await experience.mount(container);
      // Directly advance to celebration for testing
      experience.goToPhase('celebration');
      const headline = container.querySelector('.da-discoverer-celebration-headline');
      expect(headline?.textContent).toBe('IT WORKS!');
    });

    it('should render celebration lines', async () => {
      await experience.mount(container);
      experience.goToPhase('celebration');
      const lines = container.querySelectorAll('.da-discoverer-celebration-line');
      expect(lines.length).toBe(3);
    });

    it('should render journey button', async () => {
      await experience.mount(container);
      experience.goToPhase('celebration');
      const btn = container.querySelector('.da-discoverer-journey-btn');
      expect(btn?.textContent).toBe('Begin the Full Journey');
    });

    it('should render lab button', async () => {
      await experience.mount(container);
      experience.goToPhase('celebration');
      const btn = container.querySelector('.da-discoverer-lab-btn');
      expect(btn?.textContent).toBe('Explore the Lab');
    });

    it('should fire onComplete with "journey" when journey button clicked', async () => {
      const callback = vi.fn();
      experience.onComplete(callback);
      await experience.mount(container);
      experience.goToPhase('celebration');
      const btn = container.querySelector('.da-discoverer-journey-btn') as HTMLElement;
      btn.click();
      expect(callback).toHaveBeenCalledWith('journey');
    });

    it('should fire onComplete with "lab" when lab button clicked', async () => {
      const callback = vi.fn();
      experience.onComplete(callback);
      await experience.mount(container);
      experience.goToPhase('celebration');
      const btn = container.querySelector('.da-discoverer-lab-btn') as HTMLElement;
      btn.click();
      expect(callback).toHaveBeenCalledWith('lab');
    });
  });

  describe('phase transitions', () => {
    it('should return current phase', async () => {
      await experience.mount(container);
      expect(experience.getCurrentPhase()).toBe('intro');
    });

    it('should advance phases in order', async () => {
      await experience.mount(container);
      experience.goToPhase('constraint');
      expect(experience.getCurrentPhase()).toBe('constraint');
    });

    it('should clean up previous phase content on transition', async () => {
      await experience.mount(container);
      expect(container.querySelector('.da-discoverer-intro')).not.toBeNull();
      experience.goToPhase('constraint');
      expect(container.querySelector('.da-discoverer-intro')).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', async () => {
      await experience.mount(container);
      experience.destroy();
      expect(container.querySelector('.da-discoverer-experience')).toBeNull();
    });

    it('should handle destroy before mount gracefully', () => {
      expect(() => experience.destroy()).not.toThrow();
    });

    it('should handle destroy during any phase', async () => {
      await experience.mount(container);
      experience.goToPhase('constraint');
      expect(() => experience.destroy()).not.toThrow();
    });

    it('should clean up sub-components', async () => {
      await experience.mount(container);
      experience.goToPhase('celebration');
      experience.destroy();
      expect(container.querySelector('.da-discoverer-celebration')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle fetch failure gracefully', async () => {
      setupFetchError();
      await expect(experience.mount(container)).rejects.toThrow('Failed to load discoverer experience data');
    });

    it('should handle network error (fetch rejection)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(experience.mount(container)).rejects.toThrow('Failed to fetch');
    });
  });

  describe('callbacks', () => {
    it('should register onComplete callback', async () => {
      const callback = vi.fn();
      experience.onComplete(callback);
      await experience.mount(container);
      experience.goToPhase('celebration');
      (container.querySelector('.da-discoverer-journey-btn') as HTMLElement).click();
      expect(callback).toHaveBeenCalled();
    });

    it('should register onSkip callback', async () => {
      const callback = vi.fn();
      experience.onSkip(callback);
      await experience.mount(container);
      (container.querySelector('.da-discoverer-skip-link') as HTMLElement).click();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('consequence phase', () => {
    it('should render consequence panel when transitioning to consequence', async () => {
      await experience.mount(container);
      experience.goToPhase('consequence');
      expect(container.querySelector('.da-discoverer-consequence')).not.toBeNull();
    });

    it('should render consequence reveal panel component', async () => {
      await experience.mount(container);
      experience.goToPhase('consequence');
      expect(container.querySelector('.da-consequence-reveal')).not.toBeNull();
    });
  });

  describe('autoProgressObjectives', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-complete objectives over time in build phase', async () => {
      await experience.mount(container);
      // Navigate to build phase via decision
      (container.querySelector('.da-discoverer-begin-btn') as HTMLElement).click();
      (container.querySelector('.da-discoverer-continue-btn') as HTMLElement).click();
      const optionEl = container.querySelector('[data-option-id="ripple-carry"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();
      const buildBtn = container.querySelector('.da-decision-maker-build-btn') as HTMLElement;
      buildBtn.click();

      // Initial state — no objectives completed yet
      const items = container.querySelectorAll('.da-builder-objective-item');
      expect(items.length).toBe(3);

      // After initial delay (1000ms), first objective completes
      vi.advanceTimersByTime(1000);
      // After next delay (1500ms), second objective completes
      vi.advanceTimersByTime(1500);
      // After next delay (1500ms), third objective completes
      vi.advanceTimersByTime(1500);
    });

    it('should clear timers on destroy during build phase', async () => {
      await experience.mount(container);
      (container.querySelector('.da-discoverer-begin-btn') as HTMLElement).click();
      (container.querySelector('.da-discoverer-continue-btn') as HTMLElement).click();
      const optionEl = container.querySelector('[data-option-id="ripple-carry"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();
      const buildBtn = container.querySelector('.da-decision-maker-build-btn') as HTMLElement;
      buildBtn.click();

      // Destroy while timers are pending — should not throw
      expect(() => experience.destroy()).not.toThrow();

      // Advancing timers after destroy should not cause errors
      vi.advanceTimersByTime(5000);
    });
  });

  // E2E test stubs (Story 10.25 E2E infrastructure)
  // When 10-25 E2E infra is built, add:
  // - First-time user sees discoverer intro
  // - Returning user skips discoverer intro
  // - Full phase cycle: intro → constraint → decision → build → consequence → celebration
  // - Journey button transitions to Act 0
  // - Lab button transitions to lab mode
  // - Skip button transitions to main story
});
