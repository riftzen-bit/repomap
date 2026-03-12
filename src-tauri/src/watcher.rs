use std::sync::{Arc, Mutex};

use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::Emitter;

pub type WatcherState = Arc<Mutex<Option<RecommendedWatcher>>>;

pub fn new_watcher_state() -> WatcherState {
    Arc::new(Mutex::new(None))
}

pub fn start_watching(
    path: &str,
    app: tauri::AppHandle,
    state: &WatcherState,
) -> Result<(), String> {
    // Drop any existing watcher first
    stop_watching(state);

    let app_handle = app.clone();
    let mut watcher = RecommendedWatcher::new(
        move |result: notify::Result<notify::Event>| {
            if let Ok(event) = result {
                let is_relevant = matches!(
                    event.kind,
                    EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
                );
                if is_relevant {
                    let _ = app_handle.emit("file-changed", ());
                }
            }
        },
        notify::Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {e}"))?;

    watcher
        .watch(std::path::Path::new(path), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch path: {e}"))?;

    let mut lock = state.lock().map_err(|e| format!("Watcher lock error: {e}"))?;
    *lock = Some(watcher);

    Ok(())
}

pub fn stop_watching(state: &WatcherState) {
    if let Ok(mut lock) = state.lock() {
        *lock = None;
    }
}
