use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use rayon::prelude::*;
use tauri::{Emitter, Manager};

use crate::cache::{self, CachedParseResult, FileCache};
use crate::graph::types::{FilePreview, Node, ScanProgress};
use crate::graph::GraphBuilder;
use crate::parser;
use crate::scanner::{self, MAX_FILE_SIZE};
use crate::GraphState;

static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn scan_project(
    app: tauri::AppHandle,
    state: tauri::State<'_, GraphState>,
    path: String,
) -> Result<(), String> {
    CANCEL_FLAG.store(false, Ordering::SeqCst);

    let root = Path::new(&path);
    if !root.is_dir() {
        let msg = format!("Not a valid directory: {path}");
        let _ = app.emit("scan:error", &msg);
        return Err(msg);
    }

    // Step 1: Scan files
    let files = scanner::scan_files(root)?;
    let total = files.len() as u32;

    if total == 0 {
        let _ = app.emit("scan:error", "No recognized source files found");
        return Err("No recognized source files found".to_string());
    }

    // Set up file cache
    let canon_root = root
        .canonicalize()
        .unwrap_or_else(|_| root.to_path_buf());
    let file_cache = FileCache::new(&canon_root);
    let mut cache_index = file_cache.load_index();
    file_cache.gc(&mut cache_index, &canon_root);
    let cache_index = Mutex::new(cache_index);

    // Step 2: Parse files in parallel with rayon (with cache)
    let parsed: Vec<_> = files
        .par_iter()
        .filter_map(|scanned| {
            if CANCEL_FLAG.load(Ordering::Relaxed) {
                return None;
            }

            // Skip files that are too large
            let metadata = match fs::metadata(&scanned.path) {
                Ok(m) => m,
                Err(_) => return None,
            };
            if metadata.len() > MAX_FILE_SIZE {
                return None;
            }

            // Read raw bytes first to detect binary content
            let raw = match fs::read(&scanned.path) {
                Ok(r) => r,
                Err(_) => return None,
            };
            if is_binary_content(&raw) {
                return None;
            }

            let content = match String::from_utf8(raw) {
                Ok(s) => s,
                Err(_) => return None, // not valid UTF-8, skip
            };

            // Check cache before parsing
            let hash = cache::content_hash(content.as_bytes());
            {
                let idx = cache_index.lock().unwrap_or_else(|e| e.into_inner());
                if let Some(cached) = file_cache.get(&scanned.relative_path, &hash, &idx) {
                    // Cache hit: update index entry and return cached result
                    drop(idx);
                    let mut idx = cache_index.lock().unwrap_or_else(|e| e.into_inner());
                    idx.entries.insert(scanned.relative_path.clone(), hash);
                    let result = parser::ParseResult {
                        symbols: cached.symbols,
                        imports: cached.imports,
                    };
                    return Some((scanned.clone(), result));
                }
            }

            // Cache miss: parse and store
            let result = parser::parse_file(&content, &scanned.language);

            let cached = CachedParseResult {
                symbols: result.symbols.clone(),
                imports: result.imports.clone(),
            };
            let _ = file_cache.put(&scanned.relative_path, &hash, &cached);

            {
                let mut idx = cache_index.lock().unwrap_or_else(|e| e.into_inner());
                idx.entries.insert(scanned.relative_path.clone(), hash);
            }

            Some((scanned.clone(), result))
        })
        .collect();

    // Check cancellation
    if CANCEL_FLAG.load(Ordering::Relaxed) {
        let _ = app.emit("scan:error", "Scan cancelled");
        return Err("Scan cancelled".to_string());
    }

    // Save updated cache index (best-effort, don't fail scan on cache errors)
    let final_index = cache_index.into_inner().unwrap();
    let _ = file_cache.save_index(&final_index);

    // Step 3: Build graph on main thread, emitting progress
    let mut builder = GraphBuilder::new();
    let mut processed: u32 = 0;
    let parsed_total = parsed.len() as u32;
    let all_file_paths: Vec<&str> = parsed.iter().map(|(s, _)| s.relative_path.as_str()).collect();

    for (scanned, parse_result) in &parsed {
        if CANCEL_FLAG.load(Ordering::Relaxed) {
            let _ = app.emit("scan:error", "Scan cancelled");
            return Err("Scan cancelled".to_string());
        }

        processed += 1;

        let _ = app.emit(
            "scan:progress",
            ScanProgress {
                files_scanned: processed,
                total_files: parsed_total,
                current_file: scanned.relative_path.clone(),
            },
        );

        let is_entry = is_entry_point(&scanned.relative_path, &scanned.language);
        let is_config = is_config_file(&scanned.relative_path);

        let node = Node {
            id: scanned.relative_path.clone(),
            label: scanned.relative_path.clone(),
            language: scanned.language.clone(),
            lines: scanned.lines,
            symbols: parse_result.symbols.clone(),
            imports: parse_result.imports.clone(),
            imported_by: Vec::new(),
            is_entry_point: is_entry,
            is_config,
            is_orphan: false,
            is_hub: false,
        };

        // Resolve import paths to file IDs and add edges
        for import in &parse_result.imports {
            if let Some(target) = resolve_import(
                import,
                &scanned.relative_path,
                &scanned.language,
                &all_file_paths,
            ) {
                builder.add_edge(scanned.relative_path.clone(), target);
            }
        }

        builder.add_node(node);
    }

    // Step 4: Build final graph, store in state, and emit
    let graph = builder.build();
    {
        let mut stored = state.lock().map_err(|e| format!("State lock error: {e}"))?;
        *stored = Some(graph.clone());
    }
    let _ = app.emit("scan:complete", &graph);

    // Auto-start file watcher after successful scan
    let watcher_state = app.state::<crate::watcher::WatcherState>();
    let _ = crate::watcher::start_watching(&path, app.clone(), &watcher_state);

    Ok(())
}

#[tauri::command]
pub async fn start_file_watcher(
    app: tauri::AppHandle,
    watcher_state: tauri::State<'_, crate::watcher::WatcherState>,
    path: String,
) -> Result<(), String> {
    crate::watcher::start_watching(&path, app, &watcher_state)
}

#[tauri::command]
pub async fn stop_file_watcher(
    watcher_state: tauri::State<'_, crate::watcher::WatcherState>,
) -> Result<(), String> {
    crate::watcher::stop_watching(&watcher_state);
    Ok(())
}

#[tauri::command]
pub async fn cancel_scan() -> Result<(), String> {
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn get_file_preview(path: String, max_lines: u32) -> Result<FilePreview, String> {
    let file_path = Path::new(&path);

    if !file_path.is_file() {
        return Err(format!("File not found: {path}"));
    }

    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read file: {e}"))?;

    let lines: Vec<&str> = content.lines().collect();
    let line_count = lines.len() as u32;
    let truncated = if max_lines > 0 && line_count > max_lines {
        lines[..max_lines as usize].join("\n")
    } else {
        content.clone()
    };

    let language = scanner::detect_language(file_path).unwrap_or_else(|| "text".to_string());

    Ok(FilePreview {
        content: truncated,
        language,
        line_count,
    })
}

#[tauri::command]
pub async fn export_json(
    state: tauri::State<'_, GraphState>,
    output_path: String,
) -> Result<String, String> {
    let stored = state.lock().map_err(|e| format!("State lock error: {e}"))?;
    let graph = stored.as_ref().ok_or("No graph data available. Scan a project first.")?;

    crate::exporter::json::export_json(graph, &output_path)?;

    Ok(output_path)
}

#[tauri::command]
pub async fn export_mermaid(
    state: tauri::State<'_, GraphState>,
    output_path: String,
) -> Result<String, String> {
    let stored = state.lock().map_err(|e| format!("State lock error: {e}"))?;
    let graph = stored.as_ref().ok_or("No graph data available. Scan a project first.")?;

    crate::exporter::mermaid::export_mermaid(graph, &output_path)?;

    Ok(output_path)
}

#[tauri::command]
pub async fn get_change_frequencies(root: String) -> Result<std::collections::HashMap<String, u32>, String> {
    let root_path = std::path::Path::new(&root);
    let output = crate::git::git_command(
        &["log", "--max-count=500", "--format=", "--name-only"],
        root_path,
    )?;

    let mut counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();
    for line in output.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            *counts.entry(trimmed.to_string()).or_insert(0) += 1;
        }
    }

    Ok(counts)
}

#[derive(serde::Serialize)]
pub struct GitBlameResponse {
    pub author: String,
    pub timestamp: i64,
    pub message: String,
}

#[tauri::command]
pub async fn get_git_blame(path: String, root: String) -> Result<GitBlameResponse, String> {
    let root_path = std::path::Path::new(&root);
    let output = crate::git::git_command(
        &["log", "-1", "--format=%an%x00%at%x00%s", "--", &path],
        root_path,
    )?;

    let trimmed = output.trim();
    if trimmed.is_empty() {
        return Err("File not tracked by git".to_string());
    }

    let parts: Vec<&str> = trimmed.splitn(3, '\0').collect();
    if parts.len() < 3 {
        return Err("Unexpected git output format".to_string());
    }

    let timestamp: i64 = parts[1].parse().map_err(|_| "Invalid timestamp".to_string())?;

    Ok(GitBlameResponse {
        author: parts[0].to_string(),
        timestamp,
        message: parts[2].to_string(),
    })
}

/// Heuristic: detect common entry point filenames.
fn is_entry_point(relative_path: &str, language: &str) -> bool {
    let filename = Path::new(relative_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    let stem = Path::new(relative_path)
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    match language {
        "javascript" | "jsx" | "typescript" | "tsx" => {
            matches!(stem, "index" | "main" | "app" | "App" | "server" | "entry")
        }
        "python" => matches!(filename, "main.py" | "__main__.py" | "app.py" | "manage.py"),
        "go" => filename == "main.go",
        "rust" => matches!(filename, "main.rs" | "lib.rs"),
        "java" => stem == "Main" || stem == "Application" || stem == "App",
        "ruby" => matches!(stem, "main" | "app" | "application" | "server"),
        "php" => matches!(stem, "index" | "app" | "artisan"),
        "c" | "cpp" => stem == "main",
        _ => false,
    }
}

/// Heuristic: detect config/build files.
fn is_config_file(relative_path: &str) -> bool {
    let filename = Path::new(relative_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    let config_names = [
        "Cargo.toml",
        "package.json",
        "tsconfig.json",
        "webpack.config",
        "vite.config",
        "next.config",
        "tailwind.config",
        "jest.config",
        "babel.config",
        "rollup.config",
        "esbuild.config",
        ".eslintrc",
        "pyproject.toml",
        "setup.py",
        "setup.cfg",
        "go.mod",
        "Makefile",
        "CMakeLists.txt",
        "Gemfile",
        "Rakefile",
        "composer.json",
        "build.gradle",
        "pom.xml",
    ];

    config_names.iter().any(|&name| filename.starts_with(name))
}

/// Attempt to resolve a raw import string to a file ID (relative path) in the scanned set.
///
/// This handles common patterns:
/// - Relative paths: "./foo" or "../bar"
/// - Extensionless imports (JS/TS add .ts, .js, .tsx, etc.)
/// - Directory index files (index.ts, index.js, __init__.py, mod.rs)
fn resolve_import(
    import: &str,
    source_file: &str,
    language: &str,
    all_files: &[&str],
) -> Option<String> {
    // For non-relative imports, try direct match first
    if all_files.contains(&import) {
        return Some(import.to_string());
    }

    let is_relative = import.starts_with('.') || import.starts_with('/');

    if is_relative {
        // Resolve relative to source file's directory
        let source_dir = Path::new(source_file).parent().unwrap_or(Path::new(""));
        let resolved = source_dir.join(import);
        let normalized = normalize_path(&resolved.to_string_lossy());

        // Try exact match
        if all_files.contains(&normalized.as_str()) {
            return Some(normalized);
        }

        // Try with extensions
        let extensions = get_extensions(language);
        for ext in &extensions {
            let with_ext = format!("{normalized}.{ext}");
            if all_files.contains(&with_ext.as_str()) {
                return Some(with_ext);
            }
        }

        // Try index files
        let index_files = get_index_files(language);
        for idx in &index_files {
            let with_index = format!("{normalized}/{idx}");
            if all_files.contains(&with_index.as_str()) {
                return Some(with_index);
            }
        }
    }

    None
}

/// Normalize a path by resolving `.` and `..` components and stripping trailing slashes.
fn normalize_path(path: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for part in path.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                parts.pop();
            }
            _ => parts.push(part),
        }
    }
    parts.join("/")
}

/// Quick check for binary content: look for NUL bytes in the first 8 KiB.
fn is_binary_content(buf: &[u8]) -> bool {
    let check_len = buf.len().min(8192);
    buf[..check_len].contains(&0)
}

/// Get file extensions to try for extensionless imports.
fn get_extensions(language: &str) -> Vec<&'static str> {
    match language {
        "javascript" | "jsx" => vec!["js", "jsx", "ts", "tsx", "json"],
        "typescript" | "tsx" => vec!["ts", "tsx", "js", "jsx", "json"],
        "python" => vec!["py"],
        "ruby" => vec!["rb"],
        "rust" => vec!["rs"],
        "go" => vec!["go"],
        "java" => vec!["java"],
        "c" => vec!["c", "h"],
        "cpp" => vec!["cpp", "cc", "cxx", "hpp", "h"],
        "php" => vec!["php"],
        _ => vec![],
    }
}

/// Get index filenames to check when an import points to a directory.
fn get_index_files(language: &str) -> Vec<&'static str> {
    match language {
        "javascript" | "jsx" => vec!["index.js", "index.jsx"],
        "typescript" | "tsx" => vec!["index.ts", "index.tsx", "index.js"],
        "python" => vec!["__init__.py"],
        "rust" => vec!["mod.rs"],
        "php" => vec!["index.php"],
        _ => vec![],
    }
}
