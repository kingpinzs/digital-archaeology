# Story 20.7: Curated Documentaries & Films

Status: done

## Story

As a user,
I want to discover documentaries and films about computing history,
so that I can deepen my understanding through visual storytelling.

## Acceptance Criteria

1. **Given** I am in the Literature Browser, **When** I click the "Resources" tab, **Then** I see curated documentaries and films
2. **And** each entry has title, year, and description
3. **And** entries are tagged by era (Turing, PC Era, Modern, etc.)
4. **And** I see where to watch (streaming service, YouTube, etc.)

## Tasks / Subtasks

- [ ] Task 1: Define curated resource data model and documentary content (AC: 1-4)
- [ ] Task 2: Add Resources tab to Literature Browser (AC: 1)
- [ ] Task 3: Render resource cards with documentary content (AC: 2-4)
- [ ] Task 4: Write tests (AC: 1-4)

## Dev Notes

### Architecture

```
curatedResources.ts (shared data) → LiteratureBrowser (Resources tab)
```

Batch implementation with stories 20-8 through 20-12 — shared data model and UI.
