use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

/// Detect the programming language of a file by extension, falling back to
/// shebang inspection when no extension is present.
pub fn detect_language(path: &Path) -> Option<String> {
    // Try extension first
    if let Some(lang) = detect_by_extension(path) {
        return Some(lang);
    }

    // Fall back to shebang
    detect_by_shebang(path)
}

fn detect_by_extension(path: &Path) -> Option<String> {
    let ext = path.extension()?.to_str()?.to_lowercase();
    let lang = match ext.as_str() {
        "go" => "go",
        "rs" => "rust",
        "ts" => "typescript",
        "tsx" => "tsx",
        "js" => "javascript",
        "jsx" => "jsx",
        "py" => "python",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "rb" => "ruby",
        "php" => "php",
        _ => return None,
    };
    Some(lang.to_string())
}

fn detect_by_shebang(path: &Path) -> Option<String> {
    let file = File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let mut first_line = String::new();
    // Limit read to avoid consuming a huge binary line
    let bytes_read = reader.read_line(&mut first_line).ok()?;
    if bytes_read == 0 || bytes_read > 256 {
        return None;
    }

    if !first_line.starts_with("#!") {
        return None;
    }

    let line = first_line.to_lowercase();

    // Match common shebang patterns: #!/usr/bin/env python3, #!/usr/bin/python, etc.
    let interpreters: &[(&[&str], &str)] = &[
        (&["python3", "python"], "python"),
        (&["node", "nodejs"], "javascript"),
        (&["ruby"], "ruby"),
        (&["php"], "php"),
    ];

    for (names, lang) in interpreters {
        for name in *names {
            if line.contains(name) {
                return Some(lang.to_string());
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_extension_detection() {
        let cases = vec![
            ("main.go", Some("go")),
            ("lib.rs", Some("rust")),
            ("index.ts", Some("typescript")),
            ("App.tsx", Some("tsx")),
            ("app.js", Some("javascript")),
            ("Component.jsx", Some("jsx")),
            ("script.py", Some("python")),
            ("Main.java", Some("java")),
            ("util.c", Some("c")),
            ("header.h", Some("c")),
            ("engine.cpp", Some("cpp")),
            ("engine.cc", Some("cpp")),
            ("engine.cxx", Some("cpp")),
            ("types.hpp", Some("cpp")),
            ("server.rb", Some("ruby")),
            ("index.php", Some("php")),
            ("readme.md", None),
            ("data.json", None),
            ("Makefile", None),
        ];

        for (filename, expected) in cases {
            let path = PathBuf::from(filename);
            let result = detect_by_extension(&path);
            assert_eq!(
                result.as_deref(),
                expected,
                "Extension detection failed for {filename}"
            );
        }
    }
}
