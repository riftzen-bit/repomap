use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

use crate::graph::types::Symbol;

const CACHE_DIR: &str = ".repomap-cache";

/// Compute SHA-256 hex hash of content.
pub fn content_hash(content: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content);
    format!("{:x}", hasher.finalize())
}

/// Compute SHA-256 hex hash of a file path (for cache filename).
fn path_hash(path: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Cache index: maps relative file paths to their content hashes.
#[derive(serde::Serialize, serde::Deserialize, Default)]
pub struct CacheIndex {
    pub entries: HashMap<String, String>,
}

/// Cached parse result for a single file.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct CachedParseResult {
    pub symbols: Vec<Symbol>,
    pub imports: Vec<String>,
}

pub struct FileCache {
    cache_dir: PathBuf,
}

impl FileCache {
    pub fn new(project_root: &Path) -> Self {
        let cache_dir = project_root.join(CACHE_DIR);
        Self { cache_dir }
    }

    /// Load cache index, or return empty if missing/corrupt.
    pub fn load_index(&self) -> CacheIndex {
        let index_path = self.cache_dir.join("index.json");
        std::fs::read_to_string(&index_path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    /// Save cache index.
    pub fn save_index(&self, index: &CacheIndex) -> Result<(), String> {
        std::fs::create_dir_all(&self.cache_dir)
            .map_err(|e| format!("Failed to create cache dir: {e}"))?;
        let json = serde_json::to_string(index)
            .map_err(|e| format!("Failed to serialize cache index: {e}"))?;
        std::fs::write(self.cache_dir.join("index.json"), json)
            .map_err(|e| format!("Failed to write cache index: {e}"))?;
        Ok(())
    }

    /// Check if file has a valid cache entry.
    pub fn get(
        &self,
        relative_path: &str,
        current_hash: &str,
        index: &CacheIndex,
    ) -> Option<CachedParseResult> {
        let cached_hash = index.entries.get(relative_path)?;
        if cached_hash != current_hash {
            return None;
        }

        let cache_file = self
            .cache_dir
            .join(format!("{}.json", path_hash(relative_path)));
        let content = std::fs::read_to_string(&cache_file).ok()?;
        serde_json::from_str(&content).ok()
    }

    /// Write cache entry.
    pub fn put(
        &self,
        relative_path: &str,
        _content_hash_val: &str,
        result: &CachedParseResult,
    ) -> Result<(), String> {
        std::fs::create_dir_all(&self.cache_dir)
            .map_err(|e| format!("Failed to create cache dir: {e}"))?;

        let cache_file = self
            .cache_dir
            .join(format!("{}.json", path_hash(relative_path)));
        let json = serde_json::to_string(result)
            .map_err(|e| format!("Failed to serialize cache entry: {e}"))?;
        std::fs::write(&cache_file, json)
            .map_err(|e| format!("Failed to write cache entry: {e}"))?;

        Ok(())
    }

    /// Garbage collect: remove cache entries for files that no longer exist.
    pub fn gc(&self, index: &mut CacheIndex, project_root: &Path) {
        let stale_paths: Vec<String> = index
            .entries
            .keys()
            .filter(|path| !project_root.join(path).exists())
            .cloned()
            .collect();

        for path in &stale_paths {
            let cache_file = self
                .cache_dir
                .join(format!("{}.json", path_hash(path)));
            let _ = std::fs::remove_file(cache_file);
            index.entries.remove(path);
        }
    }
}
