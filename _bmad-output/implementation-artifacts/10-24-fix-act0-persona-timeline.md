# Story 10.24: Fix Act 0 Persona Timeline (Bug Fix)

Status: review

---

## Story

As a learner,
I want to see historically accurate personas for each era within Act 0,
So that I experience the correct person for the correct time period (not Babbage in 35,000 BC).

## Bug Description

**Current Behavior:** When entering Act 0 Chapter 0-1 (35,000 BC - 3000 BC), users see:
```
YOU ARE 🎩
Charles Babbage
(1791-1871)
It's 1837...
```

**Expected Behavior:** Users should see a persona appropriate to the prehistoric era being presented (35,000 BC - 3000 BC), not Charles Babbage who lived in the 1800s.

**Root Cause:** The `act-0-mechanical.json` file has:
- Act-level persona: Babbage (1837)
- Chapter 0-1 year: "35,000 BC - 3000 BC"
- First scene (`scene-0-1-0`): Type `persona` showing Babbage

The persona introduction happens BEFORE the prehistoric content, creating a jarring anachronism.

## Acceptance Criteria

1. **Given** I enter Act 0, Chapter 0-1 (35,000 BC - 3000 BC)
   **When** I see the persona introduction
   **Then** I see a prehistoric-era appropriate persona (fictional or narrator)
   **And** the setting matches the prehistoric era, NOT 1837 London

2. **Given** Act 0 covers multiple eras (35,000 BC to 1840s)
   **When** I progress through each chapter
   **Then** each chapter has an era-appropriate persona:
   - Chapter 0-1 (35,000 BC - 3000 BC): Prehistoric persona
   - Later chapters: Appropriate persona for that era
   - Final chapters (1800s): Charles Babbage

3. **Given** a persona is shown
   **When** I view the persona card
   **Then** the year, era, and setting all match consistently
   **And** no anachronisms exist (e.g., no "1837 London" for prehistoric content)

4. **Given** the act-level persona field
   **When** Act 0 loads
   **Then** it either uses a generic "narrator" persona OR the first chapter's persona
   **And** the act-level persona does NOT override chapter-specific personas

## Tasks / Subtasks

- [x] Task 1: Design Prehistoric Persona for Chapter 0-1 (AC: #1, #2)
  - [x] 1.1 Create persona data for "The First Counter" (~35,000 BC)
    - id: "first-counter-35000bc"
    - name: "The First Counter" (or similar evocative name)
    - years: "~35,000 BC"
    - era: "35,000 BC"
    - avatar: Appropriate emoji (e.g., "🌙" for lunar cycle counting)
    - quote: Simple, evocative statement about counting
    - background: Brief description of prehistoric life
    - motivation: Why they needed to count
    - constraints: Lack of writing, symbols, etc.
    - problem: "How do you remember quantities?"
  - [x] 1.2 Create fictional but historically plausible character

- [x] Task 2: Design Additional Era-Appropriate Personas (AC: #2)
  - [x] 2.1 Audit all chapters in Act 0 and identify their time periods
    - Chapter 0-1: 35,000 BC - 3000 BC (The First Counter, Token Keeper, Kushim)
    - Chapter 0-1b: 1500 BC - 100 BC (Amenhotep, Archimedes, Marcus Aurelius Cotta)
    - Chapter 0-1c: 200 BC - 200 AD (Unknown Craftsman, Master Zhao)
    - Chapter 0-zero: 628 AD - 1202 AD (Brahmagupta, Al-Khwarizmi, Fibonacci)
    - Chapter 0-2: 1623-1694 (Schickard, Pascal, Leibniz)
    - Chapter 0-3: 1804 (Jacquard)
    - Chapter 0-4: 1833 (Babbage, Ada Lovelace)
  - [x] 2.2 For each major era, identify appropriate persona: Already present in JSON
  - [x] 2.3 Create persona data for each needed era: No additional needed - characters arrays in each chapter

- [x] Task 3: Update act-0-mechanical.json Structure (AC: #1, #3, #4)
  - [x] 3.1 Read current act-0-mechanical.json structure
  - [x] 3.2 Change act-level persona from Babbage to "The First Counter" (prehistoric)
  - [x] 3.3 Update scene-0-1-0 to use prehistoric persona instead of Babbage
  - [x] 3.4 Update scene-0-1-0 setting text from "London, 1837" to prehistoric Lebombo Mountains
  - [x] 3.5 Update narrative to match prehistoric context

- [x] Task 4: Update Each Chapter's First Scene Persona (AC: #2, #3)
  - [x] 4.1 For each chapter in Act 0, ensure first scene has correct persona
    - Note: Only scene-0-1-0 is type "persona"; others use "characters" arrays which are era-appropriate
  - [x] 4.2 Update persona introduction scenes to match chapter era
  - [x] 4.3 Verify setting text matches persona era for all persona scenes

- [x] Task 5: Maintain Babbage for Later Eras (AC: #2)
  - [x] 5.1 Identify which chapters should use Babbage (1800s content): Chapter 0-4 (1833)
  - [x] 5.2 Ensure Babbage persona is preserved for appropriate chapters: Babbage appears in chapter 0-4
  - [x] 5.3 Create smooth transition narrative from earlier personas to Babbage: N/A - uses characters arrays

- [x] Task 6: Test Persona Display (AC: all)
  - [x] 6.1 Verify Chapter 0-1 shows prehistoric persona, not Babbage: Fixed - now shows "The First Counter"
  - [x] 6.2 Verify each chapter shows its era-appropriate persona: Verified via grep audit
  - [x] 6.3 Verify no anachronisms in setting text or persona data: Fixed - setting now prehistoric
  - [x] 6.4 Run existing story tests to ensure no regressions: All 3269 tests pass

---

## Dev Notes

### Current Act 0 Structure Analysis

From `act-0-mechanical.json`:
- **Act-level**: era "3000 BC - 1840s", persona: Babbage (1837)
- **Chapter 0-1**: year "35,000 BC - 3000 BC" - THE PROBLEM AREA
- First scene (scene-0-1-0) is type "persona" with Babbage

### Proposed Personas for Act 0

| Era | Chapter | Persona | Type | Notes |
|-----|---------|---------|------|-------|
| 35,000 BC | 0-1 | "The First Counter" | Fictional | Lebombo Bone era |
| 3000 BC | TBD | Sumerian Scribe | Fictional/Semi | Cuneiform number system |
| 2000 BC | TBD | Babylonian Mathematician | Fictional | Sexagesimal system |
| 500 BC | TBD | Euclid (or Greek) | Historical | Formal mathematics |
| 250 BC | TBD | Archimedes | Historical | Mechanical calculations |
| 1837 | Final | Charles Babbage | Historical | Analytical Engine |

### Persona Data Template

```json
{
  "id": "first-counter-35000bc",
  "name": "The First Counter",
  "years": "~35,000 BC",
  "era": "35,000 BC",
  "avatar": "🌙",
  "quote": "Twenty-nine nights since the moon was dark. I must not forget.",
  "background": "In the Lebombo Mountains of what will one day be called Swaziland, you survive by knowing. Knowing when the herds move. Knowing when fruits ripen. Knowing how much you owe and are owed. Memory fails. But marks on bone do not.",
  "motivation": "The elders trade goods. They argue about debts. Who owes what? How many moons since the last gathering? You need a way to remember numbers that outlasts memory.",
  "constraints": [
    { "type": "technical", "description": "No writing system exists - only marks and scratches" },
    { "type": "knowledge", "description": "No concept of 'numbers' as abstract entities" },
    { "type": "material", "description": "Only bone, stone, and wood to work with" }
  ],
  "problem": "How do you remember a quantity when you cannot write?"
}
```

### Scene 0-1-0 Update

**Current Setting (WRONG):**
```json
"setting": {
  "text": "London, 1837. You stand in the workshop of the world's most ambitious inventor..."
}
```

**Corrected Setting:**
```json
"setting": {
  "text": "The Lebombo Mountains, southern Africa, ~35,000 BC. Firelight casts dancing shadows on cave walls. The smell of smoke and animal hides fills the air. Outside, the vast African night stretches endlessly. Inside, you work by the fire, a baboon's leg bone in your hands."
}
```

### File Location

- **Target file**: `digital-archaeology-web/public/story/act-0-mechanical.json`
- **May need to create**: `digital-archaeology-web/public/story/personas/` directory for persona data

### Backward Compatibility

- Existing PersonaCard, PersonaProfilePanel, PersonaTransitionPanel components should work with new personas
- New personas follow same PersonaData interface from types.ts
- No code changes needed - only JSON content updates

### Accessibility Checklist

- [x] N/A - This is a content/data fix, not a code change
- [ ] **Screen Reader** - Ensure persona names are descriptive and pronounceable
- [ ] **Color Contrast** - N/A (using existing styles)

### Project Structure Notes

- This is a **content fix only** - no TypeScript code changes
- JSON file location: `digital-archaeology-web/public/story/act-0-mechanical.json`
- Follows existing PersonaData interface from `src/story/types.ts`

### References

- [Source: digital-archaeology-web/public/story/act-0-mechanical.json:16-32] - Current Babbage persona
- [Source: digital-archaeology-web/public/story/act-0-mechanical.json:39-100] - Scene 0-1-0 with wrong setting
- [Source: digital-archaeology-web/src/story/types.ts:167-201] - PersonaData interface
- [Source: _bmad-output/project-context.md] - Coding standards

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Content fix only

### Completion Notes List

1. **Root Cause Identified:** Scene-0-1-0 (type: persona) was showing Babbage (1837) as the first persona even though Chapter 0-1 covers prehistoric era (35,000 BC - 3000 BC)

2. **Fix Applied:**
   - Updated act-level persona from "babbage-1837" to "first-counter-35000bc"
   - Updated scene-0-1-0 persona from Babbage to "The First Counter"
   - Updated scene-0-1-0 setting from "London, 1837" to "Lebombo Mountains, ~35,000 BC"
   - Updated narrative to match prehistoric context

3. **Verification:**
   - JSON validated successfully
   - All 3,269 tests pass (no regressions)
   - Audited all chapters - each has era-appropriate characters

4. **Technical Note:** Other chapters (0-1b through 0-4) use `characters` arrays within narrative scenes, not `persona` type scenes. These already display era-appropriate historical figures.

### File List

- `digital-archaeology-web/public/story/act-0-mechanical.json` (MODIFIED) - Updated act-level persona and scene-0-1-0
