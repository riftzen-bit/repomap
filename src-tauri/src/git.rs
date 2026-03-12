use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant};

const GIT_TIMEOUT: Duration = Duration::from_secs(5);

/// Run a git command with a 5-second timeout.
/// Returns stdout as String, or an error message.
pub fn git_command(args: &[&str], root: &Path) -> Result<String, String> {
    let mut child = Command::new("git")
        .args(args)
        .current_dir(root)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run git: {e}"))?;

    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) => {
                if start.elapsed() > GIT_TIMEOUT {
                    let _ = child.kill();
                    return Err("Git command timed out after 5 seconds".to_string());
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            Err(e) => return Err(format!("Git command failed: {e}")),
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Git command failed: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Git error: {stderr}"));
    }

    String::from_utf8(output.stdout)
        .map_err(|e| format!("Invalid UTF-8 in git output: {e}"))
}
