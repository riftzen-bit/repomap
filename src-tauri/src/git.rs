use std::path::Path;
use std::process::Command;

/// Run a git command with a 5-second timeout.
/// Returns stdout as String, or an error message.
pub fn git_command(args: &[&str], root: &Path) -> Result<String, String> {
    let child = Command::new("git")
        .args(args)
        .current_dir(root)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run git: {e}"))?;

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
