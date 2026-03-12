use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

use super::detector::detect_language;
use super::ignore::IgnoreRules;
use super::MAX_FILE_SIZE;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    pub path: PathBuf,
    pub relative_path: String,
    pub language: String,
    pub lines: u32,
}

/// Recursively scan a project directory and return metadata for every
/// recognized source file.
pub fn scan_files(root: &Path) -> Result<Vec<ScannedFile>, String> {
    let root = root
        .canonicalize()
        .map_err(|e| format!("Invalid project path: {e}"))?;

    let rules = IgnoreRules::new(&root);
    let mut files: Vec<ScannedFile> = Vec::new();

    let walker = WalkDir::new(&root)
        .follow_links(false)
        .max_depth(50)
        .into_iter();

    for entry in walker.filter_entry(|e| !rules.is_ignored(e.path(), e.file_type().is_dir())) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue, // skip permission errors, broken symlinks, etc.
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();

        // Skip files that are too large
        let file_size = match fs::metadata(path) {
            Ok(m) => m.len(),
            Err(_) => continue,
        };
        if file_size > MAX_FILE_SIZE {
            continue;
        }

        let language = match detect_language(path) {
            Some(lang) => lang,
            None => continue, // skip files we don't recognize
        };

        let lines = count_lines(path);

        let relative_path = path
            .strip_prefix(&root)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/");

        files.push(ScannedFile {
            path: path.to_path_buf(),
            relative_path,
            language,
            lines,
        });
    }

    files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

    Ok(files)
}

/// Count lines in a file. Returns 0 if the file can't be read.
fn count_lines(path: &Path) -> u32 {
    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return 0,
    };
    let reader = BufReader::new(file);
    reader.lines().count() as u32
}
