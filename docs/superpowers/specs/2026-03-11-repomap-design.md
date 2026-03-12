# RepoMap — Interactive Codebase Visualizer

## Design Spec — 2026-03-11

---

## 1. What Is RepoMap?

A **cross-platform desktop app** that scans any codebase and generates an **interactive, visual dependency graph** — letting developers see how files, modules, and symbols connect to each other.

**One sentence:** "Drop a project folder → see its architecture instantly."

### Why It Matters

| Problem | Current Solutions | Gap |
|---------|-------------------|-----|
| Joining a new codebase is overwhelming | Read README, grep around | No visual overview |
| Sourcetrail was the gold standard | Archived 2021, forks are WIP/C++ only | No modern, multi-lang replacement |
| CodeSee mapped codebases visually | Acquired by GitKraken 2024, gone | No standalone tool left |
| Emerge exists but is rough | Python CLI, browser-based, ~1K stars | No desktop app, poor UX |

**RepoMap fills a real, validated gap in developer tooling.**

---

## 2. Target Audience

- Developers onboarding to new codebases
- Tech leads reviewing architecture & dependencies
- Teams doing refactoring or migration planning
- Open source contributors trying to understand a project fast

---

## 3. Core Features (MVP)

### 3.1 Project Scanner (Rust Backend)
- Scan project directory recursively
- Detect languages via file extensions + shebang lines
- Parse imports/dependencies using **tree-sitter** (supports 20+ languages)
- Build a directed dependency graph: `File A → imports → File B`
- Extract symbols: functions, classes, structs, interfaces
- Detect: circular dependencies, orphan files (no imports/importers), hub files (too many connections)

**Supported languages (MVP):**
- Go, Rust, TypeScript/JavaScript, Python, Java, C/C++, Ruby, PHP

### 3.2 Interactive Graph Visualization (Frontend)
- **Force-directed layout** (default) — clusters naturally form
- **Hierarchical/tree layout** — top-down dependency flow
- **Circular layout** — see connections at a glance
- Click node → sidebar shows: file path, symbols, code preview
- Hover → highlight all connections (imports + importers)
- Zoom, pan, drag nodes
- Search: find file/symbol by name → focus + highlight
- Filter by: language, directory, depth level, connection count

### 3.3 Insights Panel
- **Circular dependencies** — highlighted in red
- **Orphan files** — files no one imports (potential dead code)
- **Hub files** — files imported by 10+ others (potential god objects)
- **Complexity heatmap** — node size/color based on: lines of code, import count, symbol count
- **Directory clustering** — auto-group by folder structure

### 3.4 Export
- Export graph as **SVG** or **PNG** (via Cytoscape.js `cy.svg()` / `cy.png()` on frontend)
- Export dependency data as **JSON** (Rust backend — raw graph data)
- Export as **Mermaid.js** diagram (Rust backend — paste into docs/PRs)

---

## 4. Architecture

```
┌─────────────────────────────────────────────┐
│                 Tauri v2 Shell               │
├──────────────────┬──────────────────────────┤
│   Rust Backend   │     React Frontend       │
│                  │                          │
│  ┌────────────┐  │  ┌────────────────────┐  │
│  │ Scanner    │  │  │ Graph View         │  │
│  │ (walkdir)  │──┤──│ (Cytoscape.js)     │  │
│  └────────────┘  │  └────────────────────┘  │
│  ┌────────────┐  │  ┌────────────────────┐  │
│  │ Parser     │  │  │ Sidebar            │  │
│  │ (tree-     │──┤──│ (Code preview,     │  │
│  │  sitter)   │  │  │  file info)        │  │
│  └────────────┘  │  └────────────────────┘  │
│  ┌────────────┐  │  ┌────────────────────┐  │
│  │ Graph      │  │  │ Insights Panel     │  │
│  │ Builder    │──┤──│ (Metrics, issues)  │  │
│  └────────────┘  │  └────────────────────┘  │
│  ┌────────────┐  │  ┌────────────────────┐  │
│  │ Exporter   │  │  │ Controls Bar       │  │
│  │ (JSON/     │──┤──│ (Layout, filter,   │  │
│  │  Mermaid)  │  │  │  search, export)   │  │
│  └────────────┘  │  └────────────────────┘  │
└──────────────────┴──────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop shell | **Tauri v2** | Tiny binary, cross-platform, Rust backend |
| Backend | **Rust** | Fast file scanning, tree-sitter is native Rust, memory safe |
| AST parsing | **tree-sitter** + language grammars | Supports 40+ languages, incremental parsing, battle-tested |
| File walking | **walkdir** crate | Fast recursive directory traversal |
| Parallelism | **Rayon** crate | Data-parallel CPU-bound parsing across threads |
| Frontend framework | **React + TypeScript** | Mature ecosystem, component model fits this UI |
| Graph rendering | **Cytoscape.js** (>=3.31) | Purpose-built for graph/network visualization. Built-in WebGL renderer (`webgl: true`) for large graphs, with canvas fallback |
| Styling | **Tailwind CSS v4** | Fast iteration, design tokens via CSS @theme |
| Code preview | **Shiki** (syntax highlighter) | Same engine as VS Code, theme-aware |
| Build | **Vite** | Fast dev, HMR |

### Why Cytoscape.js over D3.js?

- D3 is a general-purpose viz library — graph rendering requires building everything from scratch
- Cytoscape.js is **specifically designed for graph/network visualization**
- Built-in: layouts, zoom/pan, node selection, edge styling, animation, search, compound nodes
- Built-in WebGL renderer since v3.31 (`webgl: true`) for 10K+ node performance (still preview — canvas fallback retained)
- Has ecosystem: 50+ extensions for extra layouts, context menus, tooltips

---

## 5. Visual Design Direction

### Aesthetic: **"Terminal Noir"** — Dark, atmospheric, technical

NOT another generic dev tool with blue/purple gradients on white. RepoMap should feel like a **command center** — the kind of tool a senior engineer keeps open on a second monitor.

### Design Tokens

```css
/* Color palette — inspired by terminal/radar aesthetic */
--bg-primary: #0a0a0f;        /* Near-black with blue tint */
--bg-secondary: #12121a;      /* Panels, sidebars */
--bg-elevated: #1a1a26;       /* Cards, hover states */
--border: #2a2a3a;             /* Subtle grid lines */

--text-primary: #e0e0e8;      /* High contrast readable */
--text-secondary: #7a7a8e;    /* Labels, metadata */
--text-muted: #4a4a5e;        /* Hints, placeholders */

--accent-cyan: #00d4ff;       /* Primary accent — nodes, links */
--accent-green: #00ff88;      /* Healthy/connected nodes */
--accent-amber: #ffaa00;      /* Warnings — hub files */
--accent-red: #ff3355;        /* Errors — circular deps */
--accent-purple: #aa66ff;     /* Selected/focused state */

--glow-cyan: 0 0 20px rgba(0, 212, 255, 0.3);
--glow-red: 0 0 20px rgba(255, 51, 85, 0.3);
```

### Typography

| Use | Font | Why |
|-----|------|-----|
| UI labels, headings | **JetBrains Mono** | Technical, engineered feel, designed for code |
| Body text, descriptions | **IBM Plex Sans** | Clean, professional, pairs well with monospace |
| Code preview | **JetBrains Mono** | Consistent with UI, ligature support |

### Graph Node Styling

```
Node types by visual:
  ● Small circle    = leaf file (0-1 imports)
  ● Medium circle   = normal file (2-5 imports)
  ● Large circle    = hub file (10+ importers)
  ◆ Diamond         = entry point (main, index)
  ▲ Triangle        = config file

Colors by language:
  Cyan (#00d4ff)    = TypeScript/JavaScript
  Green (#00ff88)   = Go
  Orange (#ff8800)  = Rust
  Yellow (#ffcc00)  = Python
  Blue (#4488ff)    = Java
  Pink (#ff66aa)    = Ruby
  Purple (#aa66ff)  = PHP
  Silver (#99aabb)  = C/C++
  Red (#ff3355)     = circular dependency indicator
  Gray (#4a4a5e)    = orphan file

Edge styling:
  ── thin gray (#2a2a3a)    = normal dependency
  ━━ thick cyan (#00d4ff)   = selected/hovered
  ╌╌ dashed red (#ff3355)   = circular dependency (animated)
```

### Layout Wireframe

```
┌──────────────────────────────────────────────────────┐
│  ┌─ Title Bar ────────────────────────────────────┐  │
│  │ ◉ RepoMap    │ project-name │  ─  □  ✕         │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ Controls Bar ─────────────────────────────────┐  │
│  │ [Open Folder] │ Layout: ◉Force ○Tree ○Circle  │  │
│  │ [Search...  ] │ Filter: [Lang▾] [Dir▾] [Depth]│  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ Main Area ──────────────────┬─ Sidebar ───────┐  │
│  │                              │                 │  │
│  │     Interactive              │  File Info      │  │
│  │     Graph                    │  ────────────   │  │
│  │     Canvas                   │  path/to/file   │  │
│  │                              │  Language: Go   │  │
│  │         ●───●                │  Lines: 234     │  │
│  │        / \   \               │  Imports: 5     │  │
│  │       ●   ●   ●             │  Imported by: 8 │  │
│  │      / \                     │                 │  │
│  │     ●   ●                    │  ── Code ─────  │  │
│  │                              │  func main() {  │  │
│  │                              │    ...          │  │
│  │                              │  }              │  │
│  │                              │                 │  │
│  ├─ Insights Bar ───────────────┤                 │  │
│  │ ⚠ 3 circular │ 12 orphans │ 5 hubs │ 847 files│  │
│  └──────────────────────────────┴─────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Visual Atmosphere

- **Background**: subtle dot-grid pattern (like graph paper) on the canvas
- **Nodes**: soft glow effect on hover/selection (CSS box-shadow with accent colors)
- **Edges**: animated dashed line for circular dependencies (CSS animation)
- **Loading state**: scanning animation with file count ticker
- **Transitions**: smooth 300ms ease for layout switches, node focus
- **Canvas**: dark with very faint grid — nodes "float" like a constellation map

---

## 6. Tauri IPC Contract

### Commands (Rust → Frontend)

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `scan_project` | `path: String` | `()` — data streamed via events | Start scanning a project directory |
| `cancel_scan` | — | `()` | Cancel an in-progress scan |
| `get_file_preview` | `path: String, max_lines: u32` | `FilePreview { content, language, line_count }` | Read file content for sidebar code preview |
| `export_json` | `graph: GraphData, output_path: String` | `String` (written file path) | Export graph data as JSON |
| `export_mermaid` | `graph: GraphData, output_path: String` | `String` (written file path) | Export graph as Mermaid diagram |

### Events (Rust → Frontend, streamed during scan)

| Event | Payload | Description |
|-------|---------|-------------|
| `scan:progress` | `{ files_scanned: u32, total_files: u32, current_file: String }` | Progress updates during scan |
| `scan:complete` | `GraphData { nodes: Node[], edges: Edge[], insights: Insights }` | Final graph data when scan finishes |
| `scan:error` | `{ message: String, file_path: Option<String> }` | Non-fatal errors (skipped files) |

### Core Types

```typescript
interface Node {
  id: string;              // relative file path as unique ID
  label: string;           // filename
  language: string;        // detected language
  lines: number;           // lines of code
  symbols: Symbol[];       // extracted functions, classes, etc.
  imports: string[];       // IDs of files this node imports
  imported_by: string[];   // IDs of files that import this node
  is_entry_point: boolean; // main.go, index.ts, etc.
  is_config: boolean;      // config/build files
  is_orphan: boolean;      // no imports and no importers
  is_hub: boolean;         // imported by 10+ files
}

interface Edge {
  source: string;          // importer file ID
  target: string;          // imported file ID
  is_circular: boolean;    // part of a dependency cycle
}

interface Symbol {
  name: string;
  kind: "function" | "class" | "struct" | "interface" | "type" | "const";
  line: number;
}

interface Insights {
  total_files: number;
  total_edges: number;
  circular_deps: string[][];   // array of cycles, each cycle = array of file IDs
  orphan_files: string[];      // file IDs with no connections
  hub_files: string[];         // file IDs imported by 10+ others
  languages: Record<string, number>; // language → file count
}
```

---

## 7. Data Flow

```
1. User clicks [Open Folder]
   → Tauri file dialog → select project directory

2. Rust backend: scan_project(path)
   → walkdir: recursive file list
   → filter: ignore .git, node_modules, vendor, target, __pycache__, build, dist
   → detect language per file (extension + shebang)
   → Rayon parallel: parse each file with tree-sitter → extract imports + symbols
   → build directed graph: { nodes: Node[], edges: Edge[] }
   → detect issues: circular deps (Tarjan's algorithm), orphans, hubs
   → emit scan:progress events during scan
   → emit scan:complete with full GraphData when done

3. Frontend receives GraphData via Tauri event listener
   → Store in Zustand graphStore
   → Cytoscape.js renders graph with force-directed layout
   → Insights panel shows metrics
   → Sidebar ready for node selection

4. User interacts:
   → Click node → sidebar shows details + code preview (via get_file_preview command)
   → Change layout → Cytoscape re-layouts with animation
   → Filter → hide/show nodes by criteria (frontend-only, no backend call)
   → Export SVG/PNG → Cytoscape cy.svg() / cy.png() (frontend)
   → Export JSON/Mermaid → Tauri command (backend writes file)
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Folder has no parseable files | Show empty state: "No supported source files found" with list of supported languages |
| Permission denied on file/dir | Skip silently, emit `scan:error` event, increment skipped counter in insights |
| Binary/unparseable file | tree-sitter returns empty — skip, no error |
| User cancels long scan | `cancel_scan` sets atomic flag, scanner checks between files and stops |
| Project too large (>50K files) | Show warning before scanning: "This project has X files. Scanning may take a while. Continue?" |
| Corrupt tree-sitter parse | Catch panic, skip file, log to `scan:error` |

---

## 8. Rust Backend Modules

```
src-tauri/src/
├── lib.rs              // Tauri setup + commands registration
├── commands.rs         // Tauri IPC command handlers
├── scanner/
│   ├── mod.rs          // scan_project() entry point
│   ├── walker.rs       // walkdir + file filtering
│   ├── detector.rs     // language detection (extension + shebang)
│   └── ignore.rs       // .gitignore + default ignore patterns
├── parser/
│   ├── mod.rs          // parse_file() dispatcher by language
│   ├── imports.rs      // extract imports per language
│   ├── symbols.rs      // extract symbols (fn, class, struct)
│   └── languages/      // per-language tree-sitter queries
│       ├── go.rs
│       ├── rust.rs
│       ├── typescript.rs
│       ├── python.rs
│       ├── java.rs
│       ├── cpp.rs
│       ├── ruby.rs
│       └── php.rs
├── graph/
│   ├── mod.rs          // Graph struct + builder
│   ├── analyzer.rs     // circular deps (Tarjan), orphans, hubs
│   └── types.rs        // Node, Edge, GraphData, Insights types
└── exporter/
    ├── mod.rs          // export dispatcher
    ├── json.rs         // JSON export (raw graph data)
    └── mermaid.rs      // Mermaid.js diagram export
```

---

## 9. Frontend Structure

```
src/
├── App.tsx                   // Root layout
├── main.tsx                  // Entry point
├── styles/
│   ├── global.css            // @theme tokens, base styles, fonts
│   └── graph.css             // Cytoscape custom styles
├── components/
│   ├── layout/
│   │   ├── TitleBar.tsx      // Custom draggable title bar
│   │   ├── ControlsBar.tsx   // Open, search, layout switch, filters
│   │   └── InsightsBar.tsx   // Bottom metrics strip
│   ├── graph/
│   │   ├── GraphCanvas.tsx   // Cytoscape container + initialization
│   │   ├── GraphControls.tsx // Zoom, fit, reset buttons (overlay)
│   │   └── useGraph.ts      // Graph lifecycle + interactions hook
│   ├── sidebar/
│   │   ├── Sidebar.tsx       // Container — collapses when nothing selected
│   │   ├── FileInfo.tsx      // Metadata display (language, lines, imports)
│   │   ├── CodePreview.tsx   // Shiki syntax highlighted preview
│   │   └── ConnectionList.tsx// Imports & imported-by clickable lists
│   ├── filters/
│   │   ├── LanguageFilter.tsx
│   │   ├── DirectoryFilter.tsx
│   │   └── DepthFilter.tsx
│   ├── states/
│   │   ├── EmptyState.tsx    // "Open a folder to get started"
│   │   ├── ScanningState.tsx // Progress bar + file counter
│   │   └── ErrorState.tsx    // "No supported files found"
│   └── common/
│       ├── SearchInput.tsx
│       ├── Tooltip.tsx
│       └── Badge.tsx
├── hooks/
│   ├── useScanner.ts         // Tauri IPC: scan + cancel commands
│   ├── useExporter.ts        // Tauri IPC: export commands + cy.svg()/cy.png()
│   └── useScanProgress.ts    // Listen to scan:progress / scan:complete events
├── lib/
│   ├── cytoscape-config.ts   // Layout configs, node/edge style mappings
│   ├── colors.ts             // Language → color mapping
│   └── types.ts              // Shared TypeScript types (mirrors Rust types)
└── stores/
    └── graphStore.ts         // Zustand store
```

### Zustand Store Shape

```typescript
interface GraphStore {
  // Data
  graphData: GraphData | null;

  // UI state
  selectedNodeId: string | null;
  layout: "force" | "tree" | "circle";
  scanStatus: "idle" | "scanning" | "complete" | "error";
  scanProgress: { filesScanned: number; totalFiles: number } | null;

  // Filters
  filters: {
    languages: string[];     // empty = show all
    directories: string[];   // empty = show all
    minConnections: number;  // 0 = show all
  };

  // Actions
  setGraphData: (data: GraphData) => void;
  selectNode: (id: string | null) => void;
  setLayout: (layout: "force" | "tree" | "circle") => void;
  setScanStatus: (status: GraphStore["scanStatus"]) => void;
  updateScanProgress: (progress: GraphStore["scanProgress"]) => void;
  updateFilters: (filters: Partial<GraphStore["filters"]>) => void;
  reset: () => void;
}
```

---

## 10. Performance Considerations

| Concern | Solution |
|---------|----------|
| Large repos (10K+ files) | Rayon thread pool for parallel parsing, stream progress events to frontend |
| Graph rendering 5K+ nodes | Cytoscape.js built-in WebGL renderer (`webgl: true`, >=3.31, preview — canvas fallback retained) |
| Initial parse time | Cache parsed graph to `.repomap/cache.json` in project dir |
| Re-scan after file changes | Incremental: hash files, only re-parse changed ones |
| Memory on huge repos | Process files in batches, don't hold all ASTs in memory simultaneously |
| Layout calculation | Web Worker for Cytoscape layout computation |

---

## 11. MVP Scope — What's In, What's Out

### In (v0.1)
- [x] Open folder + scan with progress indicator
- [x] 8 language support (Go, Rust, TS/JS, Python, Java, C/C++, Ruby, PHP)
- [x] 3 layout modes: force-directed, hierarchical, circular
- [x] Click node → file info + code preview
- [x] Hover → highlight connections
- [x] Circular dependency detection
- [x] Orphan file detection
- [x] Hub file detection
- [x] Search by filename
- [x] Filter by language
- [x] Export as JSON and Mermaid (backend), SVG/PNG (frontend)
- [x] Dark "Terminal Noir" theme
- [x] Cancel scan support
- [x] Error/empty states

### Out (future)
- Light theme
- Symbol-level graph (function → function calls)
- Git blame integration
- Real-time file watching
- Multiple project tabs
- Plugin system
- Diff view (compare two scans)
- CLI mode (headless scan + export)
- AI-powered architecture explanations

---

## 12. Competitive Positioning

| Feature | Sourcetrail (archived 2021) | Emerge | Understand (commercial) | **RepoMap** |
|---------|---------------------------|--------|------------------------|-------------|
| Status | Archived, community forks | Active but niche (~1K stars) | Active, paid license | **New, active, free** |
| Platform | Desktop (Qt, ~200MB) | Browser (Python deps) | Desktop (heavy) | **Desktop (Tauri, <20MB)** |
| Languages | C++, Java, Python | Many (regex-based) | 20+ (proprietary) | **8+ (tree-sitter)** |
| Graph interaction | Good (custom Qt) | Basic (D3/Bootstrap) | Good | **Excellent (Cytoscape.js)** |
| Circular dep detection | Partial (highlights in graph) | Yes (metric-based) | Yes | **Yes (Tarjan's algorithm)** |
| Modern UI | Dated (2018 Qt widgets) | Bootstrap generic | Dated | **Custom dark "Terminal Noir"** |
| Export formats | Limited | HTML | Various | **SVG, PNG, JSON, Mermaid** |
| Code preview | Yes (full IDE feel) | No | Yes | **Yes (Shiki syntax highlight)** |
| Open source | Yes (archived) | Yes | No | **Yes** |
| Install complexity | Build from source / old binaries | pip install + config YAML | Installer + license | **Single binary download** |

---

## 13. Name & Branding

**Name:** `repomap`
**Tagline:** "See your code. Understand your architecture."
**Domain potential:** repomap.dev
**GitHub:** riftzen-bit/repomap

---

## 14. Success Criteria

1. Scan a 1000-file Go/TS project in under 5 seconds
2. Render interactive graph with smooth 60fps interaction
3. Binary size under 20MB
4. Detect circular dependencies accurately
5. Ship cross-platform: Linux, macOS, Windows
6. Handle edge cases gracefully (empty projects, permission errors, huge repos)
