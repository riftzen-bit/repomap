pub mod types;
pub mod analyzer;

use std::collections::HashMap;
use types::*;

pub struct GraphBuilder {
    nodes: HashMap<String, Node>,
    edges: Vec<(String, String)>,
}

impl GraphBuilder {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            edges: Vec::new(),
        }
    }

    pub fn add_node(&mut self, node: Node) {
        self.nodes.insert(node.id.clone(), node);
    }

    pub fn add_edge(&mut self, source: String, target: String) {
        self.edges.push((source, target));
    }

    pub fn build(mut self) -> GraphData {
        // Resolve edges: only keep edges where both source and target exist
        let valid_edges: Vec<(String, String)> = self
            .edges
            .into_iter()
            .filter(|(s, t)| self.nodes.contains_key(s) && self.nodes.contains_key(t))
            .collect();

        // Build imported_by from edges
        for (source, target) in &valid_edges {
            if let Some(node) = self.nodes.get_mut(target) {
                if !node.imported_by.contains(source) {
                    node.imported_by.push(source.clone());
                }
            }
        }

        // Detect circular dependencies
        let circular_cycles = analyzer::find_circular_deps(&self.nodes, &valid_edges);
        let circular_edge_set: std::collections::HashSet<(String, String)> = circular_cycles
            .iter()
            .flat_map(|cycle| {
                cycle
                    .windows(2)
                    .map(|w| (w[0].clone(), w[1].clone()))
                    .chain(std::iter::once((
                        cycle.last().unwrap().clone(),
                        cycle.first().unwrap().clone(),
                    )))
            })
            .collect();

        // Build final edges
        let edges: Vec<Edge> = valid_edges
            .iter()
            .map(|(s, t)| Edge {
                source: s.clone(),
                target: t.clone(),
                is_circular: circular_edge_set.contains(&(s.clone(), t.clone())),
            })
            .collect();

        // Mark orphans and hubs
        for node in self.nodes.values_mut() {
            node.is_orphan = node.imports.is_empty() && node.imported_by.is_empty();
            node.is_hub = node.imported_by.len() >= 10;
        }

        // Build insights
        let mut languages: HashMap<String, u32> = HashMap::new();
        let mut orphan_files = Vec::new();
        let mut hub_files = Vec::new();

        for node in self.nodes.values() {
            *languages.entry(node.language.clone()).or_insert(0) += 1;
            if node.is_orphan {
                orphan_files.push(node.id.clone());
            }
            if node.is_hub {
                hub_files.push(node.id.clone());
            }
        }

        let insights = Insights {
            total_files: self.nodes.len() as u32,
            total_edges: edges.len() as u32,
            circular_deps: circular_cycles,
            orphan_files,
            hub_files,
            languages,
        };

        GraphData {
            nodes: self.nodes.into_values().collect(),
            edges,
            insights,
        }
    }
}
