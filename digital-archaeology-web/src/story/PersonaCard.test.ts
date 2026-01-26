// src/story/PersonaCard.test.ts
// Tests for the PersonaCard component
// Story 10.18: Create Historical Personas System

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersonaCard } from './PersonaCard';
import type { PersonaData } from './types';

describe('PersonaCard', () => {
  let container: HTMLElement;
  let personaCard: PersonaCard;

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
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    personaCard?.destroy();
    container.remove();
  });

  describe('Task 2.1: Component Rendering', () => {
    it('should render persona card structure when mounted', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const card = container.querySelector('.da-persona-card');
      expect(card).not.toBeNull();
    });

    it('should have role="region" and aria-label for accessibility', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const card = container.querySelector('.da-persona-card');
      expect(card?.getAttribute('role')).toBe('region');
      expect(card?.getAttribute('aria-label')).toBe('Your persona');
    });
  });

  describe('Task 2.2: "You are..." Header', () => {
    it('should render "YOU ARE" label', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const label = container.querySelector('.da-persona-card-label');
      expect(label?.textContent).toBe('YOU ARE');
    });

    it('should display persona name in header', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const name = container.querySelector('.da-persona-card-name');
      expect(name?.textContent).toBe('Federico Faggin');
    });

    it('should display years in header', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const years = container.querySelector('.da-persona-card-years');
      expect(years?.textContent).toBe('(1941-)');
    });
  });

  describe('Task 2.3: Era Display', () => {
    it('should display era prominently', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const era = container.querySelector('.da-persona-card-era');
      expect(era?.textContent).toBe("It's 1970-1971...");
    });
  });

  describe('Task 2.4: Background Section', () => {
    it('should display background text', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const background = container.querySelector('.da-persona-card-background');
      expect(background?.textContent).toBe('You immigrated from Italy to Silicon Valley in 1968.');
    });

    it('should display motivation text', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const motivation = container.querySelector('.da-persona-card-motivation');
      expect(motivation?.textContent).toBe('Busicom needs custom chips. But what if one programmable chip could do it all?');
    });
  });

  describe('Task 2.5: Constraints Badges', () => {
    it('should render all constraint badges', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const badges = container.querySelectorAll('.da-constraint-badge');
      expect(badges.length).toBe(4);
    });

    it('should have correct constraint type classes', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      expect(container.querySelector('.da-constraint-badge--technical')).not.toBeNull();
      expect(container.querySelector('.da-constraint-badge--economic')).not.toBeNull();
      expect(container.querySelector('.da-constraint-badge--political')).not.toBeNull();
      expect(container.querySelector('.da-constraint-badge--knowledge')).not.toBeNull();
    });

    it('should display constraint descriptions', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const badges = container.querySelectorAll('.da-constraint-badge-text');
      const texts = Array.from(badges).map(b => b.textContent);

      expect(texts).toContain('Only 2,300 transistors possible');
      expect(texts).toContain('Busicom wants calculators, not computers');
    });

    it('should have aria-label on constraint badges', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const badge = container.querySelector('.da-constraint-badge--technical');
      expect(badge?.getAttribute('aria-label')).toContain('Technical constraint');
    });

    it('should display correct icons for constraint types', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const technicalIcon = container.querySelector('.da-constraint-badge--technical .da-constraint-badge-icon');
      expect(technicalIcon?.textContent).toBe('⚙️');

      const economicIcon = container.querySelector('.da-constraint-badge--economic .da-constraint-badge-icon');
      expect(economicIcon?.textContent).toBe('💰');
    });
  });

  describe('Task 2.6: Challenge Section', () => {
    it('should display "YOUR CHALLENGE" label', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const label = container.querySelector('.da-persona-card-challenge-label');
      expect(label?.textContent).toBe('YOUR CHALLENGE');
    });

    it('should display problem statement', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const problem = container.querySelector('.da-persona-card-problem');
      expect(problem?.textContent).toBe('Can you fit an entire CPU into 2,300 transistors?');
    });
  });

  describe('Task 2.7: Quote Section', () => {
    it('should render quote in blockquote', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const quote = container.querySelector('.da-persona-card-quote');
      expect(quote?.tagName.toLowerCase()).toBe('blockquote');
      expect(quote?.getAttribute('role')).toBe('blockquote');
    });

    it('should display quote with quotation marks', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const quoteText = container.querySelector('.da-persona-card-quote-text');
      expect(quoteText?.textContent).toBe('"The microprocessor was not invented. It was discovered."');
    });
  });

  describe('Task 2.8: CSS Class Structure', () => {
    it('should have da-persona-card class on root element', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const card = container.querySelector('.da-persona-card');
      expect(card).not.toBeNull();
    });

    it('should have all section classes', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      expect(container.querySelector('.da-persona-card-header')).not.toBeNull();
      expect(container.querySelector('.da-persona-card-era')).not.toBeNull();
      expect(container.querySelector('.da-persona-card-constraints')).not.toBeNull();
      expect(container.querySelector('.da-persona-card-challenge')).not.toBeNull();
      expect(container.querySelector('.da-persona-card-quote')).not.toBeNull();
    });
  });

  describe('Avatar Display', () => {
    it('should display avatar emoji', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      const avatar = container.querySelector('.da-persona-card-avatar');
      expect(avatar?.textContent).toBe('👨‍🔬');
    });

    it('should have aria-label on avatar', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const avatar = container.querySelector('.da-persona-card-avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('Persona avatar');
    });
  });

  describe('Data Management', () => {
    it('should return persona data via getPersonaData()', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);

      expect(personaCard.getPersonaData()).toEqual(mockPersonaData);
    });

    it('should return null if no persona data set', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      expect(personaCard.getPersonaData()).toBeNull();
    });

    it('should update display when setPersonaData called multiple times', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      personaCard.setPersonaData(mockPersonaData);
      expect(container.querySelector('.da-persona-card-name')?.textContent).toBe('Federico Faggin');

      const newData: PersonaData = {
        ...mockPersonaData,
        id: 'turing-1936',
        name: 'Alan Turing',
        era: '1936',
      };
      personaCard.setPersonaData(newData);
      expect(container.querySelector('.da-persona-card-name')?.textContent).toBe('Alan Turing');
    });
  });

  describe('Visibility Control', () => {
    it('should show persona card via show()', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.hide();
      personaCard.show();

      const card = container.querySelector('.da-persona-card');
      expect(card?.classList.contains('da-persona-card--hidden')).toBe(false);
    });

    it('should hide persona card via hide()', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.hide();

      const card = container.querySelector('.da-persona-card');
      expect(card?.classList.contains('da-persona-card--hidden')).toBe(true);
    });

    it('should report visibility via isVisible()', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      expect(personaCard.isVisible()).toBe(true);
      personaCard.hide();
      expect(personaCard.isVisible()).toBe(false);
    });
  });

  describe('Element Access', () => {
    it('should return element via getElement()', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      const element = personaCard.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-persona-card')).toBe(true);
    });

    it('should return null before mount', () => {
      personaCard = new PersonaCard();
      expect(personaCard.getElement()).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);

      expect(container.querySelector('.da-persona-card')).not.toBeNull();
      personaCard.destroy();
      expect(container.querySelector('.da-persona-card')).toBeNull();
    });

    it('should return null from getElement after destroy', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.destroy();

      expect(personaCard.getElement()).toBeNull();
    });

    it('should return null from getPersonaData after destroy', () => {
      personaCard = new PersonaCard();
      personaCard.mount(container);
      personaCard.setPersonaData(mockPersonaData);
      personaCard.destroy();

      expect(personaCard.getPersonaData()).toBeNull();
    });
  });

  describe('Pre-mount Data Setting', () => {
    it('should apply data set before mount when mounted', () => {
      personaCard = new PersonaCard();
      personaCard.setPersonaData(mockPersonaData);
      personaCard.mount(container);

      const name = container.querySelector('.da-persona-card-name');
      expect(name?.textContent).toBe('Federico Faggin');
    });
  });
});
