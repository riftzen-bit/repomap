pub mod detector;
pub mod ignore;
pub mod walker;

pub use detector::detect_language;
pub use walker::scan_files;

/// Maximum file size to process (1 MiB). Files larger than this are skipped.
pub const MAX_FILE_SIZE: u64 = 1_024 * 1_024;
