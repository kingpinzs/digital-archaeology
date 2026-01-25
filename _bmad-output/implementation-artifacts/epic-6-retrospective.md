# Epic 6 Retrospective: Circuit Visualization

**Date:** 2026-01-25
**Facilitator:** Bob (Scrum Master)
**Attendees:** Sam (Tech Lead), Dev (Developer), Tessa (Test Engineer), Priya (Product Manager), Jeremy (Product Owner)

---

## Epic Summary

**Goal:** Users can see the CPU circuit animate and understand how instructions execute

**Stories Delivered:** 13 (6.1 - 6.13)
**Original Scope:** 10 stories (6.1 - 6.10)
**Stories Added Mid-Epic:** 3 (6.11, 6.12, 6.13)

---

## What Went Well

1. **Clean architecture** - Proper separation between CircuitRenderer, CircuitLoader, SignalAnimator, and linking systems
2. **Signal animation system** - 30fps animation with proper signal propagation timing
3. **High test coverage** - Every story had unit tests
4. **Educational value delivered** - Users can see gates light up, click code to highlight gates, watch signals flow
5. **Polished interactions** - Zoom, pan, tooltips all feel intuitive

---

## What Went Wrong

### Critical Gap: Missing Integration Story

**Finding:** Epic 6 was marked "done" with stories 6.1-6.10, but the **integration story (6.13) didn't exist in the epic definition**.

| Evidence | Detail |
|----------|--------|
| Last committed epics.md | Only 12 stories (6.1 - 6.12) |
| Story 6.13 | Not in epic definition until post-completion |
| sprint-status.yaml | All 13 stories marked "done" |
| Story files 6-11, 6-12, 6-13 | Created after epic was thought complete |

**Impact:** We built a beautiful circuit viewer that was completely disconnected from the actual running CPU. The goal was "users can see the CPU circuit animate" but we had no story ensuring the circuit connected to the emulator.

### Root Cause: Bottom-Up Story Planning

Stories were written bottom-up (technical implementation details):
1. Render gates
2. Render wires
3. Add zoom
4. Add pan
5. Add tooltips
6. Add linking

...but nobody wrote the story that says "connect this to the actual running CPU."

### Secondary Issues

1. **CSS specificity problems** - Layout bugs from complex nested grid areas
2. **Story dependencies** - Code-to-circuit and circuit-to-code linking had to wait for multiple prior stories
3. **Visual testing gaps** - Unit tests cover logic but not appearance
4. **Late integration stories** - 6.11, 6.12, 6.13 felt rushed

---

## Lessons Learned

### Planning

1. **Start with the integration story, then decompose** - Not the reverse
2. **Epic acceptance criteria must be testable** - "See circuit animate" is vague; "stepping code updates wire colors" is testable
3. **Integration stories belong at the START, not the end**

### Technical

4. **CSS specificity matters** - Use compound selectors for state classes that override layout
5. **Animation performance requires care** - requestAnimationFrame, avoid layout thrashing
6. **Bi-directional features need shared data models**

### Testing

7. **Canvas components need different testing strategies** - Coordinate-based and state-based assertions
8. **Write the E2E test before the first story** - If we can't describe the test, we don't understand the goal

---

## Action Items

| Action | Owner | Priority | Status |
|--------|-------|----------|--------|
| Every epic MUST have integration story written FIRST | Priya | Critical | New Process |
| Epic-level acceptance test before ANY story work | Tessa | Critical | New Process |
| Audit all backlog epics for missing integration stories | Bob | High | Pending |
| Create CSS architecture guide with specificity rules | Dev | Medium | Pending |
| Add canvas snapshot testing infrastructure | Tessa | Low | Pending |
| Document emulator-to-circuit data format | Sam | Medium | Pending |

---

## Pattern Identified: Epic 10 Has Same Issue

During this retrospective, we audited Epic 10 (Story Mode Experience) and found:

- **Epic Goal:** "Users experience immersive narrative providing context and motivation"
- **Done (10.1-10.17):** UI shell, components, toggle, engine, integration
- **Backlog (10.18-10.23):** Personas, time-travel mindset, decision-maker mode

**Verdict:** Stories 10.18-10.23 ARE the immersive experience, not optional enhancements. Epic 10 cannot be marked done until these are complete.

**Decision by Product Owner:** Epic 10 remains "in-progress" until 10.18-10.23 are done.

---

## Process Changes Going Forward

### New Rule: Experience-First Story Writing

Every epic should answer: **"What is the ONE story that proves this epic works?"**

That story gets written FIRST, not last.

**Example for Epic 6:**
- Wrong order: 6.1 (render canvas) -> 6.2 (load data) -> ... -> 6.13 (integrate with emulator)
- Right order: 6.13 (integrate with emulator) -> decompose into 6.1, 6.2, etc.

### New Rule: Infrastructure vs Experience Audit

Before starting any epic, classify stories:
- **Infrastructure:** Scaffolding that enables the experience
- **Experience:** What the user actually feels/does

If all "Experience" stories are in the second half or backlog, the epic is planned wrong.

---

## Retrospective Status

- [x] Epic identified and reviewed
- [x] Team assembled and participated
- [x] What went well documented
- [x] What went wrong documented
- [x] Root causes identified
- [x] Lessons learned captured
- [x] Action items assigned
- [x] Process changes defined
- [x] Product Owner decisions recorded
