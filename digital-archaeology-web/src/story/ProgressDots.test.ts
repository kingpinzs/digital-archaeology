// src/story/ProgressDots.test.ts
// Tests for ProgressDots component
// Story 10.16: Display Era Badge and Progress
// Updated for 0-based act numbering (acts 0-10)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressDots } from './ProgressDots';
import { createProgressDisplayData } from './ProgressDisplay';

describe('ProgressDots', () => {
  let container: HTMLElement;
  let progressDots: ProgressDots;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    progressDots?.destroy();
    container.remove();
  });

  describe('Task 3: Component Rendering', () => {
    it('should render progress dots container with correct class', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);

      const wrapper = container.querySelector('.da-story-nav-progress-dots');
      expect(wrapper).not.toBeNull();
    });

    it('should render as a span element', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);

      const wrapper = container.querySelector('.da-story-nav-progress-dots');
      expect(wrapper?.tagName).toBe('SPAN');
    });

    it('should return element via getElement()', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);

      const element = progressDots.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-story-nav-progress-dots')).toBe(true);
    });

    it('should return null before mounting', () => {
      progressDots = new ProgressDots();
      expect(progressDots.getElement()).toBeNull();
    });
  });

  describe('Task 3: setProgress Method - Dot Count', () => {
    it('should render correct number of dots (5)', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots.length).toBe(5);
    });

    it('should render 3 dots when totalActs is 3', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 3));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots.length).toBe(3);
    });

    it('should return dots via getDots()', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 5));

      const dots = progressDots.getDots();
      expect(dots.length).toBe(5);
    });
  });

  describe('Task 3: setProgress Method - Current Act Highlighting', () => {
    it('should mark current act with active class', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      // Act 2 (0-indexed) should be at index 2
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[2].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should have only one active dot', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(1, 5));

      const activeDots = container.querySelectorAll('.da-progress-dot--active');
      expect(activeDots.length).toBe(1);
    });

    it('should update active dot when progress changes', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);

      // Start at act 0
      progressDots.setProgress(createProgressDisplayData(0, 5));
      expect(container.querySelectorAll('.da-progress-dot')[0].classList.contains('da-progress-dot--active')).toBe(true);

      // Move to act 3
      progressDots.setProgress(createProgressDisplayData(3, 5));
      expect(container.querySelectorAll('.da-progress-dot')[3].classList.contains('da-progress-dot--active')).toBe(true);
      expect(container.querySelectorAll('.da-progress-dot')[0].classList.contains('da-progress-dot--active')).toBe(false);
    });
  });

  describe('Task 3: setProgress Method - Completed Acts', () => {
    it('should mark completed acts with completed class', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      // Current act is 2, so acts 0 and 1 should be completed
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[0].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[1].classList.contains('da-progress-dot--completed')).toBe(true);
    });

    it('should not mark future acts as completed', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      // Current act is 2, so acts 3 and 4 should not be completed
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[3].classList.contains('da-progress-dot--completed')).toBe(false);
      expect(dots[4].classList.contains('da-progress-dot--completed')).toBe(false);
    });

    it('should not mark current act as completed', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      // Current act (index 2) should have active, not completed
      expect(dots[2].classList.contains('da-progress-dot--completed')).toBe(false);
      expect(dots[2].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should have correct completed count', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      // Current act is 3, so acts 0, 1, 2 are completed (3 total)
      progressDots.setProgress(createProgressDisplayData(3, 5));

      const completedDots = container.querySelectorAll('.da-progress-dot--completed');
      expect(completedDots.length).toBe(3);
    });
  });

  describe('Task 3: Accessibility - aria-label', () => {
    it('should have aria-label "Current act, Act X of Y" for active dot', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const activeDot = container.querySelector('.da-progress-dot--active');
      expect(activeDot?.getAttribute('aria-label')).toBe('Current act, Act 2 of 5');
    });

    it('should have aria-label "Completed, Act X of Y" for completed dot', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(2, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[0].getAttribute('aria-label')).toBe('Completed, Act 0 of 5');
      expect(dots[1].getAttribute('aria-label')).toBe('Completed, Act 1 of 5');
    });

    it('should have aria-label "Act X of Y" for pending dot', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(1, 5));

      const dots = container.querySelectorAll('.da-progress-dot');
      // Acts 2, 3, 4 are pending
      expect(dots[2].getAttribute('aria-label')).toBe('Act 2 of 5');
      expect(dots[3].getAttribute('aria-label')).toBe('Act 3 of 5');
      expect(dots[4].getAttribute('aria-label')).toBe('Act 4 of 5');
    });
  });

  describe('Task 3: getProgress Method', () => {
    it('should return current progress data', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      const data = createProgressDisplayData(2, 5);
      progressDots.setProgress(data);

      const progress = progressDots.getProgress();
      expect(progress).toEqual(data);
    });

    it('should return null when no progress set', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);

      expect(progressDots.getProgress()).toBeNull();
    });
  });

  describe('Task 3: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 5));

      expect(container.querySelector('.da-story-nav-progress-dots')).not.toBeNull();

      progressDots.destroy();

      expect(container.querySelector('.da-story-nav-progress-dots')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.destroy();

      expect(progressDots.getElement()).toBeNull();
    });

    it('should clear dots array on destroy', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 5));
      progressDots.destroy();

      expect(progressDots.getDots()).toHaveLength(0);
    });

    it('should clear progress data on destroy', () => {
      progressDots = new ProgressDots();
      progressDots.mount(container);
      progressDots.setProgress(createProgressDisplayData(0, 5));
      progressDots.destroy();

      expect(progressDots.getProgress()).toBeNull();
    });
  });
});

describe('createProgressDisplayData', () => {
  it('should create progress data with correct structure', () => {
    const data = createProgressDisplayData(2, 5);

    expect(data.currentActNumber).toBe(2);
    expect(data.totalActs).toBe(5);
    expect(data.acts).toHaveLength(5);
  });

  it('should mark acts before current as completed', () => {
    const data = createProgressDisplayData(2, 5);

    // Acts 0 and 1 are completed, act 2 is current
    expect(data.acts[0].isCompleted).toBe(true);
    expect(data.acts[1].isCompleted).toBe(true);
    expect(data.acts[2].isCompleted).toBe(false);
  });

  it('should mark current act correctly', () => {
    const data = createProgressDisplayData(2, 5);

    expect(data.acts[2].isCurrent).toBe(true);
    expect(data.acts[0].isCurrent).toBe(false);
    expect(data.acts[3].isCurrent).toBe(false);
  });

  it('should use default totalActs of 11', () => {
    const data = createProgressDisplayData(1);

    expect(data.totalActs).toBe(11);
    expect(data.acts).toHaveLength(11);
  });

  it('should set correct act numbers (0-indexed)', () => {
    const data = createProgressDisplayData(0, 5);

    expect(data.acts[0].actNumber).toBe(0);
    expect(data.acts[1].actNumber).toBe(1);
    expect(data.acts[2].actNumber).toBe(2);
    expect(data.acts[3].actNumber).toBe(3);
    expect(data.acts[4].actNumber).toBe(4);
  });
});
