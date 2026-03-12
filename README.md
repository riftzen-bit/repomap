<p align="center">
  <img src="public/icon.svg" width="80" height="80" alt="RepoMap" />
</p>

<h1 align="center">RepoMap</h1>

<p align="center">
  <strong>See your codebase. Actually see it.</strong><br/>
  <sub>Interactive dependency graph visualizer for any project. Rust-powered. Offline-first.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tauri-v2-blue?style=flat-square" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/react-19-61dafb?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/rust-backend-dea584?style=flat-square" alt="Rust" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## The Problem

You open a new codebase. 847 files. Where do you start?

`main.ts` imports `config.ts` which imports `utils/` which imports... *everything*. You grep, you `Ctrl+click`, you draw arrows on a napkin. An hour later you still don't know what depends on what.

**RepoMap fixes this in 3 seconds.** Point it at any directory. It scans, parses, and renders the entire dependency graph — live, interactive, beautiful.

---

## What It Does

```
                    ┌─────────────┐
                    │  Open Folder │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Rust scans  │  rayon parallel parse
                    │  & parses    │  tree-sitter grammars
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │   Cytoscape.js renders  │
              │   interactive graph     │
              └────────────┬────────────┘
                           │
          ┌────────┬───────┼───────┬────────┐
          ▼        ▼       ▼       ▼        ▼
       Impact   Health  Heatmap  Code    Bookmarks
       analysis  score  (git)    preview  & search
```

### Graph Visualization

Three layout engines, switch instantly:

| Layout | Engine | Best For |
|--------|--------|----------|
| **Force** | fCOSE | Exploring clusters and natural groupings |
| **Tree** | Dagre | Understanding hierarchy and data flow |
| **Circle** | Built-in | Quick overview of all connections |

- **Hover** any node to highlight its neighborhood
- **Click** to select and see file details
- **Right-click** for context menu (bookmark, hide, focus neighbors, isolate)
- **Drag** to pan, scroll to zoom, minimap for navigation
- Automatic **directory clustering** for codebases with 30+ files

### Analysis Tools

- **Impact Analysis** — Select a file, toggle impact mode. See every downstream dependent color-coded by depth (1-hop = bright, far = faded). Answer: "if I change this file, what breaks?"
- **Health Score** — Circular gauge scoring your codebase 0-100. Penalties for: circular dependencies, orphan files, hub files (too many connections), high coupling ratio
- **Git Heatmap** — Color overlay showing change frequency from git log. Green = stable, red = hot. Find your churn hotspots
- **Insights Bar** — At-a-glance stats: total files, edges, circular deps, orphans, hubs, language breakdown

### File Intelligence

- **Code Preview** — Syntax-highlighted with Shiki, lazy-loaded, paginated. Adapts to dark/light theme
- **Symbol Extraction** — Functions, classes, structs, interfaces, types, exports — parsed by tree-sitter, not regex
- **Git Blame** — Last author, commit message, relative time per file
- **Connection List** — Imports and imported-by with circular dependency warnings

### Productivity

| Feature | How |
|---------|-----|
| **Bookmarks** | `Ctrl+D` on selected node. Gold border. Persisted per project |
| **Search** | `Ctrl+F`. Fuzzy file search with keyboard navigation |
| **Filters** | By language, directory, minimum connections |
| **Depth Slider** | Limit graph to N hops from selected node |
| **Export** | SVG, PNG, JSON, Mermaid — all via native save dialog |

### Desktop Experience

- Custom titlebar with draggable area
- Dark and light themes with smooth CSS transitions
- File watcher — auto-rescan on changes (2s debounce)
- SHA-256 content-hash caching — rescans only changed files
- All keyboard shortcuts listed with `?`

---

## Supported Languages

| Language | Import Parsing | Symbol Extraction |
|----------|:-:|:-:|
| TypeScript / TSX | yes | yes |
| JavaScript / JSX | yes | yes |
| Go | yes | yes |
| Rust | yes | yes |
| Python | yes | yes |
| Java | yes | yes |
| C / C++ | yes | yes |
| Ruby | yes | yes |
| PHP | yes | yes |

---

## Tech Stack

```
┌────────────────────────────────────────────────┐
│  Tauri v2 Desktop Shell                        │
├──────────────────────┬─────────────────────────┤
│  React 19 Frontend   │  Rust Backend           │
│                      │                         │
│  Zustand 5 (state)   │  rayon (parallel parse) │
│  Cytoscape.js (graph)│  tree-sitter (AST)      │
│  Shiki (highlight)   │  notify (file watcher)  │
│  Tailwind v4 (CSS)   │  sha2 (cache hashing)   │
│  Outfit + Fira Code  │  walkdir + ignore        │
└──────────────────────┴─────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) 1.77+
- Linux system deps:
  - **Ubuntu/Debian**: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev`
  - **Fedora**: `sudo dnf install webkit2gtk4.1-devel gtk3-devel libayatana-appindicator-gtk3-devel`
  - **Arch**: `sudo pacman -S webkit2gtk-4.1 gtk3 libayatana-appindicator`

### Run

```bash
git clone https://github.com/riftzen-bit/repomap.git
cd repomap
pnpm install
pnpm start        # opens desktop app
```

Click **Open Folder** (or `Ctrl+O`) and pick any project directory.

---

## Development

```bash
pnpm dev           # frontend dev server (no Tauri shell)
pnpm test          # run all 206 tests
pnpm test:coverage # coverage report
npx tsc --noEmit   # type check
cd src-tauri && cargo check  # check Rust
```

### Build for Production

```bash
pnpm tauri build
```

Outputs `.deb`, `.rpm`, `.AppImage` in `src-tauri/target/release/bundle/`.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+O` | Open folder |
| `Ctrl+F` | Focus search |
| `Ctrl+D` | Toggle bookmark |
| `Ctrl+1` `2` `3` | Force / Tree / Circle layout |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `Ctrl+0` | Fit to screen |
| `Escape` | Deselect node |
| `?` | Toggle shortcut help |

---

## Architecture

```
src/                              React frontend
├── components/
│   ├── graph/                    GraphCanvas, useGraph, controls, minimap, context menu
│   ├── sidebar/                  FileInfo, CodePreview, GitBlame, Bookmarks, HealthGauge
│   ├── layout/                   TitleBar, ControlsBar, InsightsBar
│   ├── common/                   Badge, Tooltip, SearchInput, KeyboardHelp
│   └── states/                   EmptyState, ScanningState, ErrorState
├── hooks/                        useScanner, useExporter, useKeyboardShortcuts
├── stores/                       Zustand store (graphStore)
├── lib/                          types, colors, health, heatmap, clustering, graph-utils
└── styles/                       Tailwind v4 theme (dark + light)

src-tauri/src/                    Rust backend
├── commands.rs                   Tauri IPC handlers
├── scanner/                      File discovery, language detection, .gitignore
├── parser/                       tree-sitter symbol + import extraction
├── graph/                        Graph builder, Tarjan SCC, hub analysis
├── exporter/                     JSON + Mermaid export
├── cache.rs                      SHA-256 content-hash cache
├── git.rs                        Git command runner (5s timeout)
└── watcher.rs                    notify file watcher
```

---

## How It Works

1. **Scan** — `walkdir` discovers files, respecting `.gitignore` via the `ignore` crate
2. **Parse** — `rayon` parallel-parses each file with language-specific `tree-sitter` grammars, extracting symbols and imports. Results are cached by SHA-256 content hash
3. **Resolve** — Import strings are resolved to actual file paths (handles extensionless imports, directory indexes, relative paths)
4. **Build** — Graph builder creates nodes + edges, runs Tarjan's algorithm for cycle detection, identifies hubs and orphans
5. **Render** — Cytoscape.js renders the graph with force/tree/circle layouts. Filters, clustering, impact analysis, and heatmap are applied as overlay layers
6. **Watch** — `notify` crate watches the directory. On file changes, only changed files are re-parsed (cache hit for unchanged files)

---

## License

MIT
