pub mod detector;
pub mod ignore;
pub mod walker;

pub use detector::detect_language;
pub use walker::scan_files;
