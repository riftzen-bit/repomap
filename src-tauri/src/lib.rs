mod commands;
mod git;
mod scanner;
mod parser;
mod graph;
mod exporter;

use std::sync::Mutex;

use graph::types::GraphData;

/// Shared app state: the last scanned graph, accessible from export commands.
pub type GraphState = Mutex<Option<GraphData>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(None::<GraphData>))
        .invoke_handler(tauri::generate_handler![
            commands::scan_project,
            commands::cancel_scan,
            commands::get_file_preview,
            commands::export_json,
            commands::export_mermaid,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
