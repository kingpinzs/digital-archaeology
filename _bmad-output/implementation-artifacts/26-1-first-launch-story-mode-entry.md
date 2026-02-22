# Story 26.1: First Launch - Story Mode Entry

Status: ready-for-dev

## Story

As a new player,
I want to start immediately in the story,
So that I'm immersed from the first moment.

## Acceptance Criteria

1. **Given** I open Digital Archaeology for the first time **When** the application loads **Then** I land directly in Story Mode at Act 0, Scene 1 **And** there is no menu, launcher, or mode selection screen **And** the narrative begins immediately **And** I am playing the Mechanical Era story

2. **Given** I am a returning player with saved progress **When** the application loads **Then** my last mode (story or lab) is restored as before **And** existing behavior is unchanged

3. **Given** I am a first-time user **When** the app starts in Story Mode **Then** the DiscovererExperience still runs (it's in-story, not a separate launcher) **And** it transitions seamlessly into Act 0 Scene 1 after

4. **Given** the URL hash is explicitly `#/lab/micro4` **When** I open the app for the first time **Then** URL hash takes priority over first-launch story default **And** I land in Lab mode as requested

## Tasks / Subtasks

- [x] Task 1: Change default theme from 'lab' to 'story' for first-time users (AC: #1, #2)
  - [x] 1.1: Write failing test — `getTheme()` returns `'story'` when no localStorage key exists
  - [x] 1.2: Update `getTheme()` in `theme.ts` to return `'story'` instead of `'lab'` as default
  - [x] 1.3: Fix existing tests that expected `'lab'` as default
  - [x] 1.4: Run tests to confirm passing

- [x] Task 2: Ensure URL hash overrides first-launch default (AC: #4)
  - [x] 2.1: Write test — first-time user with `#/lab/micro4` hash lands in lab mode
  - [x] 2.2: Verify `initializeFromRoute()` in App.ts already handles this (no change needed if URL parsing runs after default)
  - [x] 2.3: Run tests to confirm

- [x] Task 3: Ensure returning users keep their persisted mode (AC: #2)
  - [x] 3.1: Write test — returning user with `da-theme: 'lab'` in localStorage stays in lab
  - [x] 3.2: Verify `getTheme()` reads localStorage first (existing behavior, should already work)
  - [x] 3.3: Run tests to confirm

- [x] Task 4: Verify DiscovererExperience still works in story-first flow (AC: #3)
  - [x] 4.1: Write integration test — first-time user initializes story mode, DiscovererExperience is triggered
  - [x] 4.2: Verify StoryModeContainer shows DiscovererExperience when isFirstTimeUser()
  - [x] 4.3: Run tests to confirm

- [x] Task 5: Commit

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

- Named exports only (no default exports)
- Strict TypeScript — no `any`, explicit `null`
- CSS variables only for colors — no hardcoded hex
- Co-located tests (`*.test.ts`), Vitest
- `--da-*` prefix for Lab Mode CSS vars, `--story-*` / `--persona-*` for Story Mode

### Key Files to Modify

1. **`src/ui/theme.ts`** (line 77) — Change default return from `'lab'` to `'story'`
2. **`src/ui/theme.test.ts`** — Update default behavior tests
3. **`src/ui/App.ts`** — Verify `initializeFromRoute()` override works correctly (likely no changes needed)

### What NOT to Change

- `DiscovererExperience` — already handles first-time users within story mode
- `StoryController.initialize()` — already checks `isFirstTimeUser()` and triggers discoverer
- `StoryModeContainer` — already mounts discoverer experience when needed
- The existing localStorage read path in `getTheme()` — returning users must keep their setting

### Previous Story Intelligence

Story 10.1 (`implement-story-lab-mode-toggle`) established the theme system with `'lab'` as default. Story 10.23 (`first-discoverer-mind-experience`) added the DiscovererExperience onboarding. Both are fully implemented and working.

The theme system has backward compatibility for old `'builder'` mode stored in localStorage → treated as `'lab'`.

### Project Structure Notes

- `src/ui/theme.ts` — Pure function module, no class, no side effects
- `src/ui/App.ts` — Root orchestrator, ~4500 lines, handles all mode switching
- `src/story/StoryController.ts` — Story mode orchestrator, ~500 lines
- `src/story/StoryModeContainer.ts` — DOM shell for story mode

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 26.1]
- [Source: digital-archaeology-web/src/ui/theme.ts — getTheme() line 55-78]
- [Source: digital-archaeology-web/src/ui/App.ts — initializeFromRoute() line 1033-1058]
- [Source: digital-archaeology-web/src/story/StoryController.ts — isFirstTimeUser() line 342-343]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

### Code Review

### File List

### Change Log
