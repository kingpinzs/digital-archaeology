# Time Travel Portal — Animated Vortex Visualization

**Date:** 2026-02-21
**Status:** Approved

## Summary

A full-screen animated swirling vortex that plays during story transitions — snappy (2s) for chapter transitions, cinematic (5s) for persona/act transitions. Built as a standalone Canvas 2D component that integrates with existing transition panels via SceneRenderer.

## Trigger & Flow

The portal plays for both chapter and persona transitions:

```
User clicks "Travel Forward in Time" (or persona transition triggers)
  → SceneRenderer calls portal.play('chapter' | 'persona')
  → Full-screen canvas overlay renders vortex animation
  → Promise resolves when animation completes
  → Transition panel content (ChapterTransitionPanel or PersonaTransitionPanel) appears
```

## Component: TimeTravelPortal

**File:** `src/story/TimeTravelPortal.ts`

### Public API

```typescript
class TimeTravelPortal {
  mount(container: HTMLElement): void    // Creates canvas + backdrop
  play(mode: 'chapter' | 'persona'): Promise<void>  // Animate, resolve on completion
  destroy(): void                        // Cleanup canvas + RAF
}
```

### Internal State

- `canvas: HTMLCanvasElement` — full-viewport, z-index above modal backdrop
- `ctx: CanvasRenderingContext2D` — 2D rendering context, HiDPI-aware
- `particles: Particle[]` — spiraling dots/streaks
- `rings: Ring[]` — concentric elliptical rings
- `animationFrameId: number` — for cancelAnimationFrame cleanup

## Visual Design: Three-Layer Vortex

### Layer 1 — Concentric Rings (depth illusion)

Elliptical rings centered on screen, scaled to create a tunnel perspective. Inner rings are smaller + brighter, outer rings larger + dimmer. Each ring rotates at a slightly different speed for parallax.

| Mode | Ring Count | Color Palette | Rotation |
|------|-----------|---------------|----------|
| Chapter | 8 rings | Copper-to-gold (`#b87333` → `#d4a574`) | 2 full rotations |
| Persona | 14 rings | Gold-to-blue (`#d4a574` → `#4a9eff`) + blue outer fringe | 3 rotations, accelerating |

Ring thickness pulses between thin and thick during persona transitions.

### Layer 2 — Spiraling Particles

Dots/streaks that spiral inward toward the center along logarithmic spiral paths, fading as they reach the center.

| Mode | Count | Trail Length | Extras |
|------|-------|-------------|--------|
| Chapter | 80 | Medium (3-5px streaks) | — |
| Persona | 150 | Long (8-12px with glow) | Occasional spark particles burst outward against inward flow |

### Layer 3 — Center Glow

Radial gradient at center that pulses brighter as animation progresses. Peaks at ~70% progress, then flashes white.

| Mode | Glow Radius | Flash |
|------|------------|-------|
| Chapter | 15% of viewport | Single bright flash |
| Persona | 25% of viewport | Double-pulse flash (flash, dim, flash again) |

Persona mode also adds a subtle 1-2px screen shake via canvas translate oscillation.

## Animation Phases

| Phase | Progress | Chapter (2s) | Persona (5s) | Visual |
|-------|----------|-------------|-------------|--------|
| Open | 0–30% | 0–0.6s | 0–1.5s | Rings scale from 0, particles spawn |
| Swirl | 30–70% | 0.6–1.4s | 1.5–3.5s | Full rotation, particles streaming |
| Flash | 70–85% | 1.4–1.7s | 3.5–4.25s | Center glow intensifies, white flash |
| Fade | 85–100% | 1.7–2s | 4.25–5s | Everything fades out |

## Color Palette

- **Chapter mode:** Warm copper-to-gold, matching `--persona-copper` (#b87333) and `--persona-gold` (#d4a574)
- **Persona mode:** Gold-to-blue gradient, bridging `--persona-gold` (#d4a574) and `--da-accent` (#4a9eff)
- **Background:** Near-black with slight warm tint, matching story mode dark bg

## Integration

### Files Modified

- **`src/story/SceneRenderer.ts`** — Import TimeTravelPortal, create instance, call `play()` before `panel.show()`

### Files Created

- **`src/story/TimeTravelPortal.ts`** — Portal component (~250-350 lines)
- **`src/styles/main.css`** — Canvas container positioning (~20 lines of CSS)

### Files Unchanged

- `ChapterTransitionPanel.ts` — No changes needed
- `PersonaTransitionPanel.ts` — No changes needed

## Accessibility

- Respects `prefers-reduced-motion`: if enabled, skip canvas animation entirely, use simple crossfade
- Canvas element gets `aria-hidden="true"` (purely decorative)
- Screen reader announcements remain in the transition panels (unchanged)

## Rendering Approach

Canvas 2D, consistent with existing `CircuitRenderer` and `AnimationController` patterns. No new dependencies. Uses `requestAnimationFrame` with proper cleanup via `cancelAnimationFrame`. HiDPI-aware via `devicePixelRatio` scaling (same pattern as CircuitRenderer).

## Performance Considerations

- Particle objects are pre-allocated and recycled (no GC pressure during animation)
- Canvas clears each frame with `clearRect` (no compositing buildup)
- Animation auto-cancels if `destroy()` is called mid-flight
- Chapter mode (80 particles, 8 rings) is lightweight — targets 60fps on mid-range devices
- Persona mode (150 particles, 14 rings) is heavier but only triggers on act changes (rare)
