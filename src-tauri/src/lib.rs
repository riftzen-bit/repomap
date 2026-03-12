mod cache;
mod commands;
mod git;
mod graph;
mod exporter;
mod parser;
mod scanner;
mod watcher;

use std::sync::Mutex;

use graph::types::GraphData;

/// Shared app state: the last scanned graph, accessible from export commands.
pub type GraphState = Mutex<Option<GraphData>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(None::<GraphData>))
        .manage(watcher::new_watcher_state())
        .invoke_handler(tauri::generate_handler![
            commands::scan_project,
            commands::cancel_scan,
            commands::get_file_preview,
            commands::export_json,
            commands::export_mermaid,
            commands::get_change_frequencies,
            commands::get_git_blame,
            commands::start_file_watcher,
            commands::stop_file_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
