# Batch 4: Balanced Features — Design Spec

**Date**: 2026-03-12
**Target**: Professional developers
**Pain points**: Onboarding, refactor risk, tech debt visibility, code review context
**Direction**: Desktop-first + Git integration
**Scope**: 7 features, breadth over depth

---

## Shared: Git Command Helper (Rust)

Both Feature 1 and Feature 2 invoke git via `std::process::Command`. A shared `git.rs` module handles:
- `git_command(args: &[&str], root: &Path) -> Result<String, Error>` — runs git with 5s timeout
- Error handling: git not installed, not a git repo, permission denied
- NUL byte (`\x00`) delimiter for structured output parsing (avoids pipe/comma conflicts)

---

## Feature 1: Git Blame Overlay

**Purpose**: Show who last modified a file and when, directly in the sidebar.

**Implementation**:
- New Tauri command `get_git_blame(path)` via shared `git.rs`
- Format: `git log -1 --format=%an%x00%at%x00%s -- <file>` (NUL-delimited, Unix timestamp)
- Returns `{ author: string, timestamp: number, message: string }`
- Frontend formats timestamp to relative time (e.g., "3 days ago") using JS `Intl.RelativeTimeFormat`
- FileInfo component renders blame info below existing metrics
- Only fetches on node selection (lazy, not pre-computed)
- 5s timeout; graceful fallback if not git-tracked or git not available

**Data flow**: Node selected → invoke `get_git_blame` → display in FileInfo

---

## Feature 2: File Change Heatmap

**Purpose**: Visualize which files change most frequently — high-churn files are refactor risks.

**Implementation**:
- New Tauri command `get_change_frequencies(root)` via shared `git.rs`
- Command: `git log --max-count=500 --format= --name-only` (bounded to last 500 commits)
- Returns `Record<string, number>` (file path → change count)
- Normalization in frontend: `value = count / maxCount` → 0-1 range
- Color gradient uses theme-aware CSS variables: `--heatmap-cold` (green) → `--heatmap-warm` (yellow) → `--heatmap-hot` (red)
- Cytoscape node colors overridden via `node.style('background-color', interpolatedColor)`
- New toggle "Heatmap" in ControlsBar
- **Mutual exclusion**: heatmap and impact mode cannot be active simultaneously — toggling one disables the other
- Store state: `heatmapMode: boolean`, `heatmapData: Record<string, number> | null`
- Heatmap data fetched once per scan, cached in store
- Path normalization: trim trailing slashes, use forward slashes on all platforms

**Data flow**: Toggle heatmap → (disable impact mode if active) → fetch frequencies (if not cached) → override node colors

---

## Feature 3: Health Score Panel

**Purpose**: Give a quick 0-100 health score for the codebase based on existing metrics.

**Implementation**:
- Pure frontend calculation from existing `Insights` data — no backend changes
- Derived value: `avgEdgesPerNode = insights.totalEdges / insights.totalFiles`
- Formula: `score = 100 - circularPenalty - orphanPenalty - hubConcentrationPenalty - avgCouplingPenalty`
  - `circularPenalty`: `min(30, circularDeps.length * 5)` — not normalized by repo size; even a few circular deps are serious
  - `orphanPenalty`: `min(20, (orphanFiles.length / totalFiles) * 100)` — normalized by percentage
  - `hubConcentrationPenalty`: `min(25, hubFiles.length * 3)`
  - `avgCouplingPenalty`: `min(25, avgEdgesPerNode > 5 ? (avgEdgesPerNode - 5) * 5 : 0)`
- Display in ProjectOverview panel when no node selected
- Circular gauge visualization with color (red < 50, yellow 50-75, green > 75)
- Breakdown tooltip showing each penalty component

**Data flow**: graphData.insights → computeHealthScore() → render gauge in ProjectOverview

---

## Feature 4: File Watcher + Auto-rescan

**Purpose**: Automatically detect file changes and update the graph without manual rescan.

**Prerequisite**: Feature 8 (Graph Caching) must be implemented first — without caching, every file save triggers a full re-parse which is too slow for real-time use.

**Implementation**:
- Rust: add `notify = "7"` to Cargo.toml
- Watcher lifecycle: stored in `Arc<Mutex<Option<RecommendedWatcher>>>` in Tauri app state
  - `start_watching(path)` → stops existing watcher (if any), creates new one
  - `stop_watching()` → drops watcher, cleans up
  - On `scan_project` with new path → automatically calls `stop_watching` then `start_watching`
- Debounce: spawn Tokio task with `tokio::time::sleep(Duration::from_secs(2))` reset on each new event via `tokio::sync::watch` channel
- Tauri event: `file-changed` with list of changed paths
- Respect .gitignore patterns (reuse existing `ignore` crate logic from scanner)
- Exclude `.repomap-cache/` directory from watch events
- Frontend: listen for event, show subtle "Files changed — updating..." toast, trigger cached rescan

**Data flow**: File saved → notify detects → debounce 2s → Tauri event → frontend triggers cached rescan → graph updates

---

## Feature 5: Bookmark/Pin Nodes

**Purpose**: Let developers mark important files for quick navigation.

**Implementation**:
- Store bookmarks in Zustand store: `bookmarks: string[]` (node IDs)
- Persist to localStorage with normalized key: `repomap:bookmarks:${projectRoot.replace(/\/+$/, '')}`
- Add bookmark: right-click context menu "Bookmark" or keyboard shortcut Ctrl+D (avoids Ctrl+B webview conflict)
- Remove bookmark: same toggle action
- Bookmarked nodes get CSS class `bookmarked` in Cytoscape
- Cytoscape stylesheet entry: `{ selector: 'node.bookmarked', style: { 'border-color': '#c9a84c', 'border-width': 3, 'border-style': 'double' } }`
- New "Bookmarks" section in sidebar (above ProjectOverview) — clickable list of bookmarked file paths
- Clear all bookmarks button in the section header

**Data flow**: User bookmarks → store updates → node gets CSS class → sidebar list updates

---

## Feature 6: Light Theme

**Purpose**: Support developers who prefer light backgrounds, especially in bright environments.

**Implementation**:
- Project uses Tailwind v4 with `@theme` in `global.css` — no `tailwind.config.js`
- Override CSS variables under `[data-theme="light"]` selector in `global.css`
- All existing tokens need light equivalents: bg-primary, bg-secondary, bg-elevated, bg-surface, text-primary, text-secondary, text-muted, border, accent-primary, accent-secondary, accent-warning, accent-danger, accent-info
- Toggle in TitleBar (sun/moon icon)
- Store: `theme: "dark" | "light"`, persist to localStorage
- Apply via `data-theme` attribute on `<html>` element
- **Cytoscape canvas handling**: Cytoscape does not read CSS variables at paint time. On theme change:
  1. Read computed CSS variable values via `getComputedStyle(document.documentElement).getPropertyValue('--color-...')`
  2. Rebuild Cytoscape stylesheet array with resolved colors
  3. Apply via `cy.style().fromJson(newStylesheet).update()`
- This requires making `cytoscapeStylesheet` a function that accepts resolved theme colors, not a static export

**Data flow**: Toggle → store updates → `data-theme` changes → CSS variables switch → read computed values → rebuild & apply Cytoscape styles

---

## ~~Feature 7: Export PNG/SVG~~ (ALREADY IMPLEMENTED)

Export PNG/SVG already exists in `src/hooks/useExporter.ts`. No work needed.

**Optional UI task**: If export buttons are not yet visible in GraphControls, add them. Otherwise skip entirely.

---

## Feature 7 (replacement): Graph Caching (Rust backend)

**Purpose**: Speed up rescans by only re-parsing files that changed.

**Implementation**:
- Cache location: project-local `.repomap-cache/` directory
- Scanner must explicitly exclude `.repomap-cache/` from file discovery (not just .gitignore suggestion)
- Cache key per file: content hash via SHA-256 (`sha2` crate already in Cargo.toml) — more reliable than mtime which has 2s resolution on FAT32
- Cache format: JSON via `serde_json` (already a dependency, no new crates needed)
- On scan: compute SHA-256 of file content → check cache → skip parsing if hash matches
- Garbage collection: at scan start, remove cache entries whose source file no longer exists
- Cache structure: one JSON file per source file, named by path hash
  ```
  .repomap-cache/
  ├── a1b2c3d4.json  // cached parse result for src/main.tsx
  ├── e5f6g7h8.json  // cached parse result for src/lib/types.ts
  └── index.json     // maps file paths → hash filenames
  ```

**Data flow**: Scan start → GC stale entries → per-file: hash content → cache hit? skip : parse & cache → build graph

---

## Dependencies Between Features

```
Phase 1 (parallel, no dependencies):
├── Feature 1: Git Blame (Rust git.rs + Frontend)
├── Feature 2: Heatmap (Rust git.rs + Frontend)
├── Feature 3: Health Score (Frontend only)
├── Feature 5: Bookmarks (Frontend only)
├── Feature 6: Light Theme (Frontend only)
└── Feature 7: Graph Caching (Rust only)

Phase 2 (after Feature 7 completes):
└── Feature 4: File Watcher (Rust + Frontend) — requires caching for acceptable UX
```

## Non-goals

- Symbol-level graph (too complex for this batch)
- CLI mode
- Web export / sharing
- Multi-project tabs
- Git diff between branches (future batch)
