// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Linux display server compatibility: set safe defaults before GTK/WebKit init
    #[cfg(target_os = "linux")]
    {
        use std::env;

        // Prevent WebKitGTK crash on some Wayland compositors with NVIDIA/AMD drivers
        if env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }

        // Auto-detect display server if GDK_BACKEND not explicitly set
        if env::var("GDK_BACKEND").is_err() {
            if env::var("WAYLAND_DISPLAY").is_ok() {
                env::set_var("GDK_BACKEND", "wayland,x11");
            } else if env::var("DISPLAY").is_ok() {
                env::set_var("GDK_BACKEND", "x11");
            }
        }
    }

    repomap_lib::run()
}
