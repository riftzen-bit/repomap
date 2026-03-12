# RepoMap Batch 2 — Testing Foundation + High-Impact Features

**Date:** 2026-03-11
**Status:** Approved (post-review revision)
**Review:** 3 critical + 10 important issues resolved

## Overview

Two priorities: (1) establish automated testing as foundation, (2) add three features that create the biggest impact for users working with large codebases.

## Part 1: Testing Foundation

### What

- Install Vitest + @testing-library/react + jsdom
- Add `vitest.config.ts` with jsdom environment and setupFiles
- Add `test` and `test:coverage` scripts to package.json
- Write unit tests for pure logic (graphStore, colors.ts)
- Write component tests for SearchInput and InsightsBar

### Why

Zero tests means every future change is a risk. TDD requires a testing infrastructure to exist first. This is non-negotiable foundation work.

### Scope

| Source Path | Tests | Priority |
|-------------|-------|----------|
| `src/stores/graphStore.ts` | All actions: setGraphData, selectNode, focusNode, setLayout, setScanStatus, setError, updateFilters, reset | HIGH |
| `src/lib/colors.ts` | getLanguageColor mapping, fallback color, getLanguageColorWithAlpha RGBA conversion | HIGH |
| `src/components/common/SearchInput.tsx` | Debounced search, keyboard nav (arrow/enter/escape), clear button | MEDIUM |
| `src/components/layout/InsightsBar.tsx` | Metric rendering, filter count display, language breakdown | MEDIUM |

### Configuration

- `vitest.config.ts` — jsdom environment, setupFiles pointing to test setup
- `src/test-utils/setup.ts` — jsdom globals, mock `@tauri-apps/api` (invoke, listen), mock `@tauri-apps/plugin-dialog` (open)

### Approach

- Vitest with jsdom environment for React components
- No mocking of Zustand store — test the real store directly
- Mock only Tauri IPC calls since they require the native runtime
- Target: 80%+ coverage on tested modules

### Testing per Feature

Each feature (Parts 2-4) includes its own test scope:
- Part 2: Test BFS traversal logic, depth filter state, filter intersection
- Part 3: Rust unit tests for cache read/write/invalidation
- Part 4: Test compound node generation, directory grouping logic

### File Structure

```
src/
  __tests__/
    stores/
      graphStore.test.ts
    lib/
      colors.test.ts
    components/
      SearchInput.test.tsx
      InsightsBar.test.tsx
  test-utils/
    setup.ts
vitest.config.ts
```

## Part 2: Dependency Depth Slider

### What

A slider in ControlsBar that controls how many "hops" of dependencies to show from the currently selected node.

### Behavior

- **Range:** `null` (show all — default, no depth filtering) or `1` to `5` (hop count)
- **Default:** `null` — slider shows "All" position, no depth filtering active
- **When node selected:** Slider enabled. Value 1 = only immediate neighbors, 5 = five hops out
- **When no node selected:** Slider disabled with tooltip "Select a node first"
- **Filter interaction:** Depth filter uses **intersection** with existing filters (language, directory, minConnections). A node must pass ALL active filters to be visible.
- **Overlap with showOnlyConnected:** The existing "Show Only Connected" context menu action is depth=1 equivalent. When depth slider is active, "Show Only Connected" sets slider to 1 instead of using its own logic. They share the same code path.

### Implementation

- Add `maxDepth: number | null` to graphStore filters (null = disabled)
- In `useGraph.ts`, compute BFS via `useMemo` keyed on `(selectedNodeId, maxDepth, graphData)` — avoids recomputing on every render
- Debounce slider input by 100ms to prevent layout thrashing on drag
- Apply via Cytoscape `display: none/element` (same as existing filters)
- UI: Range input slider in ControlsBar, styled to match existing aesthetic

### Data Flow

```
User moves slider → debounce 100ms → graphStore.updateFilters({ maxDepth: N })
→ useGraph.ts reads selectedNodeId + maxDepth
→ useMemo: BFS from selectedNodeId, collect nodes within N hops → Set<string>
→ applyFilters: node must pass language + directory + minConnections + depth (intersection)
→ Cytoscape.style("display", "none") for excluded nodes
→ Edges auto-hidden when source/target hidden
```

## Part 3: Graph Caching

### What

Save scan results to a platform cache directory. On rescan, compare file modification times — only re-parse changed files.

### Behavior

- **Cache location:** `~/.cache/repomap/{sha256(projectRoot)}/cache.bin` (Linux), or Tauri `app_cache_dir` for cross-platform
- **Cache format:** Binary (bincode) with a version header. Version mismatch → full invalidation
- **Cache key per file:** File path + mtime + file size
- **Cached data per file:** Raw parse results only (symbols + raw import strings). Edges, importedBy, entry/config/orphan/hub flags are recomputed from cached parse results — because these depend on the full file set.
- **On scan start:** Load cache, compare mtimes, re-parse only changed/new files, remove deleted files
- **On scan complete:** Atomic write — write to temp file, then rename to cache path
- **Manual invalidation:** Hold Shift + click Rescan → force full scan (passes `force: true` to Tauri command)

### Implementation

- Rust-side: New `cache.rs` module in `src-tauri/src/`
- `CacheFile` struct: `{ version: u32, entries: HashMap<String, CachedEntry> }`
- `CachedEntry`: `{ mtime: u64, size: u64, symbols: Vec<Symbol>, raw_imports: Vec<String> }`
- Modify `scan_project` Tauri command to accept `force: bool` parameter
- Frontend: Modify `useScanner.ts` → `startScan(path, force?)` → `invoke("scan_project", { path, force })`
- ControlsBar: Rescan button detects Shift key on click event

### Performance Impact

- First scan: Same as current (+ small write overhead for cache)
- Subsequent scans: 80-95% faster for large repos (only parse changed files)
- Cache file size: ~2-5KB per source file (bincode is compact)

## Part 4: Node Clustering by Directory

### What

Visual grouping of nodes by directory using Cytoscape compound nodes. **Only available with force (fcose) layout** — dagre and circular do not support compound nodes.

### Behavior

- **Auto-enabled** when total nodes > 30 AND layout is "force"
- **Toggle:** Button in ControlsBar (disabled/hidden when layout is dagre/circular)
- **Visual:** Translucent background rectangles behind clustered nodes, labeled with directory name
- **Interaction:** Click cluster label → apply directory filter for that directory (uses existing `updateFilters({ directories: [dir] })`)
- **User override:** Manual toggle state takes precedence over auto-enable threshold. Once user explicitly toggles, auto-enable is suppressed until layout changes.

### Directory Grouping Strategy

- If the project has multiple top-level directories → group by top-level (`src`, `lib`, `test`)
- If >80% of files share one top-level directory (e.g., all in `src/`) → group by second-level (`src/components`, `src/lib`, `src/hooks`)
- Directories with only 1 file are not grouped (remain ungrouped)

### Implementation

- Compound nodes injected in `buildCytoscapeElements` when clustering is enabled
- New state in graphStore: `clusteringEnabled: boolean`
- Compound node styling: subtle dashed border, 5% opacity fill using theme `bg-surface` color
- Depth filtering (Part 2) operates on the flat node graph, ignoring compound structure — BFS traversal crosses compound boundaries freely

### Layout Compatibility

| Layout | Compound Nodes | Clustering |
|--------|---------------|------------|
| Force (fcose) | Supported natively | Enabled |
| Tree (dagre) | Not supported | Auto-disabled |
| Circular | Not supported | Auto-disabled |

## Implementation Order

1. **Testing Foundation** — must be first (enables TDD for features 2-4)
2. **Dependency Depth Slider** — contained scope, high UX impact, frontend-only
3. **Graph Caching** — Rust-side change, high performance impact
4. **Node Clustering** — visual enhancement, fcose-only, medium complexity

## Out of Scope

- Symbol-level graph (function-to-function) — future batch
- Light theme — future batch
- Git blame integration — future batch
- File watching (auto-rescan) — future batch
- Multi-node selection — future batch
