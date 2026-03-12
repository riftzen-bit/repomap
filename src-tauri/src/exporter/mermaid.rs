use std::collections::HashSet;
use std::fs;
use std::path::Path;

use crate::graph::types::GraphData;

/// Generate a Mermaid.js flowchart from graph data and write it to a file.
pub fn export_mermaid(graph: &GraphData, path: &str) -> Result<(), String> {
    let mut output = String::from("graph LR\n");

    // Collect all node IDs that participate in edges
    let mut referenced_nodes: HashSet<&str> = HashSet::new();
    for edge in &graph.edges {
        referenced_nodes.insert(&edge.source);
        referenced_nodes.insert(&edge.target);
    }

    // Emit node definitions for nodes with edges
    for node in &graph.nodes {
        if referenced_nodes.contains(node.id.as_str()) {
            let safe_id = sanitize_id(&node.id);
            output.push_str(&format!("    {safe_id}[\"{label}\"]\n", label = node.label));
        }
    }

    output.push('\n');

    // Collect circular edges for styling
    let mut circular_edge_indices: Vec<usize> = Vec::new();
    let mut edge_index: usize = 0;

    // Emit edges
    for edge in &graph.edges {
        let source_id = sanitize_id(&edge.source);
        let target_id = sanitize_id(&edge.target);

        output.push_str(&format!("    {source_id} --> {target_id}\n"));

        if edge.is_circular {
            circular_edge_indices.push(edge_index);
        }
        edge_index += 1;
    }

    // Add red styling for circular dependency edges
    if !circular_edge_indices.is_empty() {
        output.push('\n');
        let indices: Vec<String> = circular_edge_indices.iter().map(|i| i.to_string()).collect();
        output.push_str(&format!(
            "    linkStyle {} stroke:#ff4444,stroke-width:2px\n",
            indices.join(",")
        ));
    }

    // Ensure parent directory exists
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {e}"))?;
    }

    fs::write(path, output).map_err(|e| format!("Failed to write file: {e}"))?;

    Ok(())
}

/// Sanitize a file path into a valid Mermaid node ID.
/// Replaces /, ., -, and spaces with underscores.
fn sanitize_id(path: &str) -> String {
    path.chars()
        .map(|c| match c {
            '/' | '.' | '-' | ' ' | '@' | '(' | ')' | '[' | ']'
            | '+' | '#' | '{' | '}' | '<' | '>' | '&' | '"' | ';' | '\'' => '_',
            _ if !c.is_ascii() => '_',
            _ => c,
        })
        .collect()
}
