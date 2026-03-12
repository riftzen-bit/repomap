use std::fs;
use std::path::Path;

use crate::graph::types::GraphData;

/// Write GraphData as pretty-printed JSON to the given path.
pub fn export_json(graph: &GraphData, path: &str) -> Result<(), String> {
    let json = serde_json::to_string_pretty(graph)
        .map_err(|e| format!("Failed to serialize graph: {e}"))?;

    // Ensure parent directory exists
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {e}"))?;
    }

    fs::write(path, json).map_err(|e| format!("Failed to write file: {e}"))?;

    Ok(())
}
