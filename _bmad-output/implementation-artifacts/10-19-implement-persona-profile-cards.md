# Story 10.19: Implement Persona Profile Cards

Status: ready-for-dev

---

## Story

As a user,
I want to see rich persona profiles for each historical figure,
So that I understand who I am becoming in each era.

## Acceptance Criteria

1. **Given** a persona is introduced
   **When** I view their profile
   **Then** I see their name, years active, and photograph (if available)
   **And** I see their key contribution to computing
   **And** I see notable quotes in their own words
   **And** I see the constraints they faced (technical, economic, political)
   **And** I see what problem they were trying to solve

2. **Given** I am in the middle of an era
   **When** I access the persona profile
   **Then** I can review my persona's background at any time
   **And** the profile updates with discoveries made during the era

## Tasks / Subtasks

- [ ] Task 1: Extend PersonaData Interface (AC: #1)
  - [ ] 1.1 Add `keyContribution: string` field to PersonaData in `types.ts`
  - [ ] 1.2 Add `photograph?: string` field for image URL (optional, can be avatar as fallback)
  - [ ] 1.3 Add `additionalQuotes?: string[]` field for multiple authentic quotes
  - [ ] 1.4 Add `discoveriesUnlocked?: string[]` field to track discoveries during era
  - [ ] 1.5 Export updated interface

- [ ] Task 2: Create PersonaProfilePanel Component (AC: #1, #2)
  - [ ] 2.1 Create `src/story/PersonaProfilePanel.ts` as modal/sidebar panel
  - [ ] 2.2 Render persona name and years with large heading
  - [ ] 2.3 Display avatar/photograph prominently (120px circle)
  - [ ] 2.4 Show key contribution section with highlighted text
  - [ ] 2.5 Show background and motivation sections
  - [ ] 2.6 Render constraint badges (reuse from PersonaCard pattern)
  - [ ] 2.7 Display "Your Challenge" problem statement
  - [ ] 2.8 Show quotes carousel/list with pagination for multiple quotes
  - [ ] 2.9 Add close button and Escape key handler
  - [ ] 2.10 Implement show/hide methods

- [ ] Task 3: Add "Discoveries Made" Section (AC: #2)
  - [ ] 3.1 Create discoveries section that updates during era
  - [ ] 3.2 Subscribe to discovery events from StoryEngine
  - [ ] 3.3 Display earned discovery badges with icons
  - [ ] 3.4 Show "No discoveries yet" placeholder when empty
  - [ ] 3.5 Animate new discovery additions

- [ ] Task 4: Create Access Button in Story Mode (AC: #2)
  - [ ] 4.1 Add "View Persona" button to YourRolePanel
  - [ ] 4.2 Style with `da-view-persona-button` class
  - [ ] 4.3 Add keyboard shortcut (P key when in Story Mode)
  - [ ] 4.4 Button opens PersonaProfilePanel
  - [ ] 4.5 Button shows persona avatar as icon

- [ ] Task 5: Add CSS Styles for PersonaProfilePanel (AC: #1)
  - [ ] 5.1 Add `.da-persona-profile-panel` styles (modal/sidebar)
  - [ ] 5.2 Add `.da-persona-profile-header` with large avatar styling
  - [ ] 5.3 Add `.da-persona-profile-contribution` highlight styling
  - [ ] 5.4 Add `.da-persona-profile-quotes` carousel styling
  - [ ] 5.5 Add `.da-persona-profile-discoveries` section styling
  - [ ] 5.6 Add smooth slide-in animation for panel
  - [ ] 5.7 Add backdrop overlay when panel is open

- [ ] Task 6: Update Persona JSON Data (AC: #1)
  - [ ] 6.1 Add `keyContribution` to all existing personas (Babbage, Zuse, Eckert, Shockley, Faggin)
  - [ ] 6.2 Add `additionalQuotes` (2-3 quotes each) to all personas
  - [ ] 6.3 Validate JSON structure with new fields

- [ ] Task 7: Integrate with StoryEngine (AC: #2)
  - [ ] 7.1 Subscribe PersonaProfilePanel to `persona-changed` event
  - [ ] 7.2 Subscribe to discovery events for real-time updates
  - [ ] 7.3 Persist discoveries in StoryProgress (localStorage)
  - [ ] 7.4 Dispatch `persona-profile-opened` and `persona-profile-closed` events

- [ ] Task 8: Create Unit Tests (AC: #1, #2)
  - [ ] 8.1 Test PersonaProfilePanel renders all persona fields
  - [ ] 8.2 Test key contribution section displays
  - [ ] 8.3 Test multiple quotes cycle/display
  - [ ] 8.4 Test discoveries section updates dynamically
  - [ ] 8.5 Test access button in YourRolePanel
  - [ ] 8.6 Test keyboard shortcut (P key)
  - [ ] 8.7 Test panel open/close behavior
  - [ ] 8.8 Test Escape key closes panel

- [ ] Task 9: Export and Verify (AC: all)
  - [ ] 9.1 Export PersonaProfilePanel from `src/story/index.ts`
  - [ ] 9.2 Run `npm test` - all tests pass
  - [ ] 9.3 Run `npm run build` - build succeeds
  - [ ] 9.4 Manual test: Open persona profile from YourRolePanel

---

## Dev Notes

### Previous Story Intelligence (Story 10.18)

**Critical Assets Available:**

Story 10.18 implemented the Historical Personas System with:
- `PersonaData` interface in `src/story/types.ts:167-190`
- `PersonaCard` component for initial persona introduction (274 lines)
- `PersonaConstraint` interface with 4 types: technical, economic, political, knowledge
- Persona data files in `public/story/personas/` for 5 personas
- `persona-changed` event from StoryEngine
- YourRolePanel already subscribes to persona changes
- StoryEngine tracks `currentPersona` in StoryProgress

**PersonaCard Component Pattern:**
```typescript
// From src/story/PersonaCard.ts
export class PersonaCard {
  private element: HTMLElement | null = null;
  private personaData: PersonaData | null = null;

  mount(container: HTMLElement): void { ... }
  setPersonaData(data: PersonaData): void { ... }
  show(): void { ... }
  hide(): void { ... }
  destroy(): void { ... }
}
```

**YourRolePanel Already Has:**
```typescript
// From src/story/YourRolePanel.ts
- setPersona(persona: PersonaData | null): void
- handlePersonaChanged(event: Event): void
- updatePersonaDisplay(): void
- Avatar display, name, era, constraint icons
```

### Difference Between PersonaCard and PersonaProfilePanel

| Aspect | PersonaCard (10.18) | PersonaProfilePanel (10.19) |
|--------|---------------------|---------------------------|
| Purpose | Initial introduction | Detailed review anytime |
| Display | Inline in scene flow | Modal/sidebar panel |
| Trigger | First scene of act | User clicks "View Persona" |
| Content | Essential intro | Full profile + discoveries |
| Quotes | Single quote | Multiple quotes with cycling |
| Updates | Static | Dynamic discoveries |

### Architecture Compliance

**Required Locations:**
- Create: `src/story/PersonaProfilePanel.ts` - New detailed profile panel
- Create: `src/story/PersonaProfilePanel.test.ts` - Unit tests
- Modify: `src/story/types.ts` - Extend PersonaData interface
- Modify: `src/story/YourRolePanel.ts` - Add "View Persona" button
- Modify: `src/story/YourRolePanel.test.ts` - Add button tests
- Modify: `src/styles/main.css` - Add panel styles
- Modify: `src/story/index.ts` - Export new component
- Modify: `public/story/personas/*.json` - Add new fields

### File Structure Requirements

```
src/story/
├── PersonaProfilePanel.ts       # NEW: Detailed persona profile panel
├── PersonaProfilePanel.test.ts  # NEW: Unit tests
├── PersonaCard.ts               # (unchanged) Initial persona introduction
├── YourRolePanel.ts             # MODIFY: Add "View Persona" button
├── types.ts                     # MODIFY: Extend PersonaData
├── index.ts                     # MODIFY: Export PersonaProfilePanel

public/story/personas/
├── faggin-1971.json             # MODIFY: Add keyContribution, additionalQuotes
├── babbage-1837.json            # MODIFY: Add keyContribution, additionalQuotes
├── zuse-1941.json               # MODIFY: Add keyContribution, additionalQuotes
├── eckert-1946.json             # MODIFY: Add keyContribution, additionalQuotes
├── shockley-1955.json           # MODIFY: Add keyContribution, additionalQuotes
└── index.json                   # (unchanged)
```

### UI Layout for PersonaProfilePanel

```
+--------------------------------------------------------+
| PERSONA PROFILE                              [×] Close |
+--------------------------------------------------------+
|                                                        |
|    [       ]   Federico Faggin                         |
|    [ 👨‍🔬 ]   (1941-)                                    |
|    [       ]   Era: 1970-1971                          |
|                                                        |
+--------------------------------------------------------+
| KEY CONTRIBUTION                                        |
|   Invented silicon gate technology and designed the     |
|   Intel 4004, the world's first commercial              |
|   microprocessor.                                       |
+--------------------------------------------------------+
| YOUR BACKGROUND                                         |
|   You immigrated from Italy to Silicon Valley in        |
|   1968. At Fairchild, you invented silicon gate...      |
+--------------------------------------------------------+
| YOUR CONSTRAINTS                                        |
|   ⚙️ Only 2,300 transistors possible on a chip         |
|   💰 Busicom is paying, and they want calculators      |
|   📚 No one has ever built a CPU this small            |
|   🏛️ Management sees Intel as a memory company         |
+--------------------------------------------------------+
| YOUR CHALLENGE                                          |
|   Can you fit an entire CPU into 2,300 transistors?    |
+--------------------------------------------------------+
| DISCOVERIES MADE THIS ERA                               |
|   ✅ Binary representation                              |
|   ✅ Register architecture                              |
|   ⬜ (More to discover...)                              |
+--------------------------------------------------------+
| IN THEIR WORDS                                          |
|   "The microprocessor was not invented. It was         |
|   discovered."                    [◀] 1/3 [▶]          |
+--------------------------------------------------------+
```

### Extended PersonaData Interface

```typescript
// types.ts additions
export interface PersonaData {
  /** Existing fields from 10.18 */
  id: string;
  name: string;
  years: string;
  era: string;
  avatar: string;
  quote: string;
  background: string;
  motivation: string;
  constraints: PersonaConstraint[];
  problem: string;
  speechPattern?: string;

  /** NEW in 10.19 */
  keyContribution: string;           // 1-2 sentence summary of their main achievement
  photograph?: string;               // URL to historical photo (optional)
  additionalQuotes?: string[];       // More authentic quotes for carousel
  discoveriesUnlocked?: string[];    // Discovery IDs unlocked during this era
}
```

### Sample Updated Persona JSON

```json
{
  "id": "faggin-1971",
  "name": "Federico Faggin",
  "years": "1941-",
  "era": "1970-1971",
  "avatar": "👨‍🔬",
  "keyContribution": "Invented silicon gate technology and designed the Intel 4004, the world's first commercial microprocessor on a single chip.",
  "quote": "The microprocessor was not invented. It was discovered. The technology was ready, and we found it.",
  "additionalQuotes": [
    "I was able to bring together the pieces: the design methodology, the silicon gate technology, and the system architecture.",
    "Working at Intel in those early days was like being in a startup. We didn't know what couldn't be done.",
    "The 4004 was a computer on a chip. Not just a calculator - a general purpose computer."
  ],
  "background": "You immigrated from Italy to Silicon Valley in 1968...",
  "motivation": "Busicom, a Japanese calculator company, needs custom chips...",
  "constraints": [
    { "type": "technical", "description": "Only 2,300 transistors possible on a chip" },
    { "type": "economic", "description": "Busicom is paying, and they want calculators" },
    { "type": "knowledge", "description": "No one has ever built a CPU this small" },
    { "type": "political", "description": "Management sees Intel as a memory company" }
  ],
  "problem": "Can you fit an entire CPU into 2,300 transistors?"
}
```

### Event Flow for Persona Profile

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interaction                            │
│   Click "View Persona" button OR Press 'P' key                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PersonaProfilePanel                            │
│   - Opens as modal with backdrop                                │
│   - Fetches current persona from StoryEngine                    │
│   - Displays full profile                                       │
│   - Subscribes to discovery updates                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ dispatches
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              Events                                               │
│   'persona-profile-opened' - Panel is now visible                │
│   'persona-profile-closed' - Panel was dismissed                 │
└──────────────────────────────────────────────────────────────────┘
```

### Testing Requirements

**PersonaProfilePanel Tests:**
```typescript
describe('PersonaProfilePanel', () => {
  it('should render persona name and years', () => { ... });
  it('should display key contribution section', () => { ... });
  it('should render all constraint badges', () => { ... });
  it('should cycle through multiple quotes', () => { ... });
  it('should show discoveries section', () => { ... });
  it('should close on Escape key', () => { ... });
  it('should close on backdrop click', () => { ... });
  it('should dispatch persona-profile-opened on show', () => { ... });
  it('should dispatch persona-profile-closed on hide', () => { ... });
});

describe('YourRolePanel View Persona button', () => {
  it('should render view persona button when persona is set', () => { ... });
  it('should hide button when no persona', () => { ... });
  it('should open PersonaProfilePanel on click', () => { ... });
});
```

### Accessibility Checklist

- [ ] **Keyboard Navigation**
  - [ ] Panel opens with "View Persona" button click or 'P' key
  - [ ] Tab through interactive elements (close button, quote navigation)
  - [ ] Escape key closes panel
  - [ ] Focus trapped inside modal when open
  - [ ] Focus returns to trigger button on close
- [ ] **ARIA Attributes**
  - [ ] Panel has `role="dialog"` and `aria-modal="true"`
  - [ ] `aria-labelledby` points to persona name heading
  - [ ] Close button has `aria-label="Close persona profile"`
  - [ ] Quote navigation has `aria-label` for current quote index
  - [ ] Constraint badges have descriptive `aria-label`
- [ ] **Focus Management** - Focus moves to panel on open, returns on close
- [ ] **Color Contrast** - All text meets WCAG AA on dark background
- [ ] **XSS Prevention** - All persona text rendered via textContent, not innerHTML
- [ ] **Screen Reader Announcements** - Panel open/close announced via aria-live

### Project Structure Notes

- Follows established PersonaCard patterns from Story 10.18
- Modal pattern matches HDL viewer panel from Epic 7
- Event-driven updates match YourRolePanel subscription pattern
- Reuses constraint badge rendering from PersonaCard

### References

- [Source: src/story/PersonaCard.ts] - Component pattern and constraint rendering
- [Source: src/story/types.ts:167-190] - PersonaData interface to extend
- [Source: src/story/YourRolePanel.ts] - Add trigger button, existing persona display
- [Source: src/story/StoryEngine.ts] - Event subscription pattern
- [Source: public/story/personas/faggin-1971.json] - Existing persona data to extend
- [Source: _bmad-output/implementation-artifacts/10-18-create-historical-personas-system.md] - Previous story learnings
- [Source: _bmad-output/planning-artifacts/epics.md#Story-10.19] - Requirements

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

