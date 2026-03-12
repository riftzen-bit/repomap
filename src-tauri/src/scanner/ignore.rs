use ignore::gitignore::{Gitignore, GitignoreBuilder};
use std::path::Path;

const IGNORED_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "vendor",
    "target",
    "__pycache__",
    "build",
    "dist",
    ".next",
    ".nuxt",
    ".venv",
    ".tox",
    ".mypy_cache",
    ".pytest_cache",
];

const IGNORED_FILES: &[&str] = &[".DS_Store", "thumbs.db", "Thumbs.db"];

const IGNORED_EXTENSIONS: &[&str] = &[
    // Images
    "png", "jpg", "jpeg", "gif", "bmp", "ico", "svg", "webp", "tiff", "tif",
    // Fonts
    "woff", "woff2", "ttf", "otf", "eot",
    // Compiled / binary
    "exe", "dll", "so", "dylib", "o", "a", "class", "pyc", "pyo", "wasm",
    // Archives
    "zip", "tar", "gz", "bz2", "xz", "7z", "rar",
    // Media
    "mp3", "mp4", "avi", "mov", "flac", "wav", "ogg",
    // Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
];

const LOCK_FILES: &[&str] = &[
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "go.sum",
    "Gemfile.lock",
    "poetry.lock",
    "composer.lock",
];

pub fn default_ignore_patterns() -> Vec<&'static str> {
    let mut patterns = Vec::new();
    patterns.extend_from_slice(IGNORED_DIRS);
    patterns.extend_from_slice(IGNORED_FILES);
    patterns.extend_from_slice(LOCK_FILES);
    patterns
}

/// Build a gitignore matcher from the project root's .gitignore file.
/// Returns `None` if no .gitignore exists or it fails to parse.
fn load_gitignore(root: &Path) -> Option<Gitignore> {
    let gitignore_path = root.join(".gitignore");
    if !gitignore_path.is_file() {
        return None;
    }

    let mut builder = GitignoreBuilder::new(root);
    builder.add(&gitignore_path);
    builder.build().ok()
}

/// Determine whether a path should be skipped during scanning.
///
/// Checks directory names, file names, binary extensions, lock files,
/// and the project's `.gitignore` rules.
pub fn should_ignore(path: &Path, root: &Path) -> bool {
    // Check each component of the relative path for ignored directory names
    if let Ok(rel) = path.strip_prefix(root) {
        for component in rel.components() {
            let name = component.as_os_str().to_string_lossy();
            if IGNORED_DIRS.iter().any(|&d| d == name) {
                return true;
            }
        }
    }

    if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
        // Exact file name matches
        if IGNORED_FILES.iter().any(|&f| f == file_name) {
            return true;
        }

        // Lock files
        if LOCK_FILES.iter().any(|&lf| lf == file_name) {
            return true;
        }

        // Hidden files/directories (dotfiles other than .gitignore)
        if file_name.starts_with('.') && file_name != ".gitignore" {
            return true;
        }
    }

    // Binary / non-source extensions
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        let ext_lower = ext.to_lowercase();
        if IGNORED_EXTENSIONS.iter().any(|&e| e == ext_lower) {
            return true;
        }
    }

    false
}

/// Extended ignore check that also consults `.gitignore` rules.
pub struct IgnoreRules {
    gitignore: Option<Gitignore>,
    root: std::path::PathBuf,
}

impl IgnoreRules {
    pub fn new(root: &Path) -> Self {
        Self {
            gitignore: load_gitignore(root),
            root: root.to_path_buf(),
        }
    }

    /// Returns true if the path should be ignored.
    pub fn is_ignored(&self, path: &Path, is_dir: bool) -> bool {
        if should_ignore(path, &self.root) {
            return true;
        }

        // Check .gitignore rules
        if let Some(ref gi) = self.gitignore {
            if gi.matched(path, is_dir).is_ignore() {
                return true;
            }
        }

        false
    }
}
