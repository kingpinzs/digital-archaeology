# Story 20.13: Depth When You Want It

Status: done

## Story

As a learner,
I want to access deeper content WHEN I WANT IT, not forced on me,
so that I can go as deep as I'm curious without being overwhelmed.

## Acceptance Criteria

1. **Given** I click an article card, **When** the detail view opens, **Then** I see layered depth options
2. **Given** I am viewing an article detail, **When** I see the Quick Summary, **Then** it is always visible (not collapsed)
3. **Given** I see a depth layer (Core Concept, Deep Dive, Academic, Media, Interactive), **When** I click it, **Then** it expands to show content
4. **Given** I expand a layer, **When** I expand it again later, **Then** my preference is remembered
5. **Given** I am viewing layers, **When** deeper content is available, **Then** I see a "Want to go deeper?" suggestion
6. **Given** I am viewing a detail view, **When** I click "Back", **Then** I return to the article grid

## Tasks / Subtasks

- [ ] Task 1: Create depth layer data model and content (AC: 1-3, 5)
- [ ] Task 2: Create depth preference storage (AC: 4)
- [ ] Task 3: Build article detail sub-view with collapsible layers (AC: 1-3, 5, 6)
- [ ] Task 4: Wire into LiteratureBrowser and App.ts (AC: 1, 6)
- [ ] Task 5: Write tests (AC: 1-6)

## Dev Notes

### Architecture

```
depthLayerData.ts (content) + DepthPreferenceStorage.ts (prefs) → LiteratureBrowser (detail view)
```

Reuses sub-view pattern from hints/deep-dives: hide grid, show panel, back button.
Cross-references existing deep-dive content and curated resources.
