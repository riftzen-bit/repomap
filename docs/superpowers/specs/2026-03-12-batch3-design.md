# RepoMap Batch 3 — Stability, Features & Coverage

**Date:** 2026-03-12
**Status:** Approved (post-review revision)
**Review:** 3 critical + 6 important issues from spec review resolved
**Depends on:** Batch 2 (testing foundation + depth slider completed; graph caching + node clustering NOT started; SearchInput + InsightsBar component tests planned in Batch 2 were NOT implemented — re-planned here)

## Overview

Three parallel workstreams: (1) fix existing bugs and stability issues, (2) add high-impact features for devs and vibe coders, (3) expand test coverage to critical components.

## Context

### Current State
- 136 tests pass across 4 files (graphStore, colors, cytoscape-config, graph-utils), build clean, 0 type errors
- Test coverage ~10% (only pure logic modules tested, NO component tests exist)
- `@vitest/coverage-v8` not installed — `test:coverage` script fails
- Bundle size ~1.1MB gzip — Shiki grammars are a significant portion (validate with `vite-bundle-visualizer` before setting reduction target)
- Batch 2 Part 3 (Graph Caching) and Part 4 (Node Clustering) not started
- `Filters` interface is duplicated in `graphStore.ts` and `useGraph.ts` — should consolidate to `types.ts`

### Target Users
- **Developers**: Need dependency impact analysis, fast re-opens, clean graphs for large repos
- **Vibe coders**: Need visual clarity, quick insights, simple interactions
- **All users**: Need stability, performance, zero bugs

## Part 1: Bug Fixes & Stability

### 1A: ~~Fix Memory Leak in useGraph.ts~~ — NOT A BUG

**Status:** Verified — `useGraph.ts` line 129-132 already has proper cleanup:
```typescript
return () => {
  cy.destroy();
  cyRef.current = null;
};
```
No action needed.

### 1B: Install Coverage Plugin

**Problem:** `npm run test:coverage` fails because `@vitest/coverage-v8` is not installed.

**Fix:**
- Install `@vitest/coverage-v8` as devDependency
- Verify `test:coverage` produces HTML report
- Do NOT set coverage thresholds yet — measure actual coverage after Part 3 tests are written, then set thresholds based on reality

### 1C: Bundle Size Optimization

**Problem:** Shiki bundles language grammars. RepoMap only uses CodePreview (not on first paint).

**Fix:**
- Lazy-load Shiki via dynamic `import("shiki")` in CodePreview — code preview is not rendered until a node is selected
- Run `vite-bundle-visualizer` before and after to measure actual improvement
- Remove hard percentage target from success criteria — measure and report actual reduction

### 1D: Consolidate Duplicate Filters Interface

**Problem:** `Filters` interface is defined identically in both `src/stores/graphStore.ts` (line 4-9) and `src/components/graph/useGraph.ts` (line 22-27). These will diverge as we add `impactMode`.

**Fix:**
- Move `Filters` interface to `src/lib/types.ts`
- Import from `types.ts` in both graphStore and useGraph
- Must be done BEFORE adding new store fields

## Part 2: High-Impact Features

### 2A: Dependency Impact Analysis

**What:** Select a file → see a heatmap of "impact radius" — which files would be affected if this file changes.

**Behavior:**
- When a node is selected, a new "Impact" toggle appears in the sidebar (FileInfo section)
- Toggle ON → graph highlights affected files with color intensity based on distance:
  - Direct dependents (importedBy): bright orange (depth 1)
  - 2 hops: medium orange (depth 2)
  - 3 hops: lighter orange (depth 3)
  - 4+ hops: faintest orange (depth 4+)
- Sidebar shows impact summary: "X files directly affected, Y files indirectly affected"
- Toggle OFF → return to normal view

**Algorithm:**
- **NEW function required:** `getImpactedNodes(startNodeId, edges)` — a **reverse-only BFS** that follows edges where `target === currentNode` to find `source` (i.e., "who imports this file?"). This is fundamentally different from `getNodesWithinDepth` which is bidirectional.
- Do NOT reuse `getNodesWithinDepth` — it traverses in both directions and would show files the selected file depends on, not just files affected by changes to it.
- Returns `Map<nodeId, depth>` for color intensity mapping.
- Impact highlighting uses CSS classes (impact-1, impact-2, impact-3, impact-far, impact-none) rather than computed opacity values, for cleaner separation.

**Interaction with maxDepth filter:**
- Impact Mode operates independently of the depth filter
- Nodes hidden by `maxDepth` remain hidden — impact colors apply only to visible nodes
- Impact Mode and depth filter can be active simultaneously without conflict

**Why this matters:**
- Devs: "If I refactor this utility, how much of the app breaks?"
- Vibe coders: "Is it safe to change this file?"

**Data model additions:**
- `graphStore`: add `impactMode: boolean` (default false)
- `impactMode` auto-resets when node is deselected (same as `maxDepth`)
- `useGraph.ts`: new effect that applies impact highlighting when mode is active
- No backend changes needed — computed from existing edge data

### 2B: Node Clustering by Directory

Implements Batch 2 Part 4 spec. Summary:
- Cytoscape compound nodes group files by directory
- Only available with force (fcose) layout
- Toggle button in ControlsBar (hidden when layout != force)
- Click cluster label → filter to that directory
- Grouping: top-level dirs, or second-level if >80% share one top-level

**Store changes required:**
- Add `clusteringEnabled: boolean` to graphStore (default false)
- `setLayout` auto-disables clustering when switching to non-force layout

### ~~2C: Graph Caching (Rust Backend)~~ — DEFERRED

**Status:** Removed from Batch 3 scope.

**Reason:** Graph Caching requires Rust-side implementation (`cache.rs` module, bincode serialization, mtime comparison) which is outside the scope of frontend-only changes. The `scan_project` Tauri command signature change (`force: bool` parameter) and `useScanner.ts` plumbing are deferred until the Rust cache module exists.

**Future:** Will be addressed in a dedicated Rust-focused batch.

## Part 3: Test Coverage Expansion

### Priority Test Targets

| Component | Why Priority |
|-----------|-------------|
| `SearchInput.tsx` | Core interaction: debounce, keyboard nav, dropdown (planned in Batch 2, not implemented) |
| `InsightsBar.tsx` | Data display logic, filter counts, language breakdown (planned in Batch 2, not implemented) |
| `FileInfo.tsx` | Metadata display, badge rendering, new Impact toggle |

### Test Approach
- Use `@testing-library/react` for component tests
- Mock Tauri IPC (already set up in `test-utils/setup.ts`)
- Mock Zustand store for isolated component testing where needed
- Test user interactions: click, type, keyboard events
- Test conditional rendering: selected vs unselected states
- Measure coverage after tests written, then set thresholds

## Implementation Order

### Phase 1 — Foundation (Sequential)
1. **1B: Coverage Plugin** — install, verify
2. **1D: Consolidate Filters** — prerequisite for new store fields

### Phase 2 — Features (Parallel)
3. **2A: Impact Analysis** — new graph-utils function + store + UI
4. **2B: Node Clustering** — clustering utility + store + cytoscape integration

### Phase 3 — Quality (Parallel)
5. **Part 3: Component Tests** — SearchInput, InsightsBar, FileInfo
6. **1C: Bundle Optimization** — lazy-load Shiki, measure improvement

## Out of Scope

- Graph Caching (Rust implementation) — deferred to Rust-focused batch
- `useScanner.ts` force parameter plumbing — blocked on Rust cache
- Symbol-level graph (function-to-function dependencies)
- Light theme
- Git blame integration
- File watching (auto-rescan on file change)
- Multi-node selection

## Success Criteria

- Zero known bugs
- Memory management verified (cleanup already present in useGraph.ts — no leak)
- Impact Analysis works: select node → toggle → see reverse-dependency heatmap
- Node Clustering toggleable on force layout with directory grouping
- All new + existing tests pass
- Component test suites for SearchInput, InsightsBar, FileInfo
- Bundle size measured and reduced via Shiki lazy-loading (actual % reported)
- Filters interface consolidated to single source of truth
