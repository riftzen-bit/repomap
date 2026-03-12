# RepoMap

Interactive codebase dependency visualizer. Scan any project directory and explore file relationships through an interactive graph powered by Cytoscape.js.

Built with Tauri v2 (Rust backend) + React 19 + TypeScript.

## Features

**Graph Visualization**
- Three layout engines: force-directed (fCOSE), hierarchical tree (dagre), circular
- Node clustering by directory for large codebases (30+ files)
- Hover to highlight neighborhood, click to select, right-click for context menu
- Minimap for navigation in large graphs
- Zoom, pan, fit-to-screen controls

**Analysis**
- Impact analysis: select a file and see all downstream dependents color-coded by depth
- Health score: circular gauge scoring codebase quality (circular deps, orphans, hubs, coupling)
- Change heatmap: overlay git commit frequency as color gradient (green → yellow → red)
- Insights bar: total files, edges, circular dependencies, orphan files, hub files

**File Intelligence**
- Code preview with syntax highlighting (Shiki)
- Symbol extraction: functions, classes, structs, interfaces, types, constants
- Git blame: last author, commit message, and relative time for each file
- Language detection for 10+ languages

**Productivity**
- Bookmarks: pin important files with Ctrl+D, persisted per project in localStorage
- Search: fuzzy file search with Ctrl+F
- Directory and language filters
- Depth slider: limit visible graph to N hops from selected node
- Export: SVG, PNG, JSON, Mermaid diagram

**Desktop Experience**
- Custom title bar with minimize/maximize/close
- Dark and light themes with smooth transitions
- File watcher: auto-rescan on file changes (2s debounce)
- SHA-256 content-hash caching for fast rescans
- Keyboard shortcuts for all major actions

## Supported Languages

Go, Rust, TypeScript, JavaScript, Python, Java, C, C++, Ruby, PHP, JSX, TSX

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 |
| Backend | Rust (rayon, notify, sha2) |
| Frontend | React 19, Zustand 5, Cytoscape.js |
| Styling | Tailwind CSS v4 |
| Syntax highlight | Shiki |
| Fonts | Outfit (display), Fira Code (mono) |
| Testing | Vitest, Testing Library |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) 1.77+
- System dependencies for Tauri v2:
  - **Ubuntu/Debian**: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev`
  - **Fedora**: `sudo dnf install webkit2gtk4.1-devel gtk3-devel libayatana-appindicator-gtk3-devel`
  - **Arch**: `sudo pacman -S webkit2gtk-4.1 gtk3 libayatana-appindicator`

## Getting Started

```bash
# Clone
git clone https://github.com/riftzen-bit/repomap.git
cd repomap

# Install dependencies
pnpm install

# Run in development mode
pnpm start
```

The app opens at 1280x800. Click **Open Folder** or press `Ctrl+O` to scan a project.

## Development

```bash
# Frontend dev server only (no Tauri)
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
npx tsc --noEmit

# Check Rust backend
cd src-tauri && cargo check
```

## Build & Package

```bash
# Build for production
pnpm tauri build
```

Outputs `.deb`, `.rpm`, and `.AppImage` in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open folder |
| `Ctrl+F` | Focus search |
| `Ctrl+D` | Toggle bookmark on selected node |
| `Ctrl+1/2/3` | Switch layout (force/tree/circle) |
| `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Fit to screen |
| `Escape` | Deselect node |
| `?` | Toggle keyboard help |

## Architecture

```
src/                          # React frontend
├── components/
│   ├── graph/                # GraphCanvas, useGraph hook, controls, minimap, context menu
│   ├── sidebar/              # FileInfo, CodePreview, GitBlame, Bookmarks, HealthGauge
│   ├── layout/               # TitleBar, ControlsBar, InsightsBar
│   ├── filters/              # DirectoryFilter
│   ├── common/               # Badge, Tooltip, SearchInput, KeyboardHelp
│   └── states/               # EmptyState, ScanningState, ErrorState
├── hooks/                    # useScanner, useExporter, useKeyboardShortcuts, useRecentProjects
├── stores/                   # Zustand store (graphStore)
├── lib/                      # Utilities: types, colors, health, heatmap, clustering, graph-utils
└── styles/                   # Global CSS with theme variables

src-tauri/src/                # Rust backend
├── commands.rs               # Tauri command handlers (scan, export, git blame, watcher)
├── scanner/                  # File discovery, language detection, gitignore parsing
├── parser/                   # Symbol extraction and import parsing per language
├── graph/                    # Graph builder, cycle detection, hub analysis
├── exporter/                 # JSON and Mermaid export
├── cache.rs                  # SHA-256 content-hash file cache
├── git.rs                    # Git command runner with timeout
└── watcher.rs                # File system watcher (notify crate)
```

## License

MIT
