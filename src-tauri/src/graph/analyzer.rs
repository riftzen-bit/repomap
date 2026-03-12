use std::collections::HashMap;
use super::types::Node;

/// Find circular dependencies using Tarjan's strongly connected components algorithm.
/// Returns cycles (SCCs with more than one node).
pub fn find_circular_deps(
    nodes: &HashMap<String, Node>,
    edges: &[(String, String)],
) -> Vec<Vec<String>> {
    let mut adj: HashMap<&str, Vec<&str>> = HashMap::new();
    for (source, target) in edges {
        adj.entry(source.as_str()).or_default().push(target.as_str());
    }

    let mut index_counter: u32 = 0;
    let mut stack: Vec<&str> = Vec::new();
    let mut on_stack: HashMap<&str, bool> = HashMap::new();
    let mut indices: HashMap<&str, u32> = HashMap::new();
    let mut lowlinks: HashMap<&str, u32> = HashMap::new();
    let mut result: Vec<Vec<String>> = Vec::new();

    for node_id in nodes.keys() {
        if !indices.contains_key(node_id.as_str()) {
            strongconnect(
                node_id.as_str(),
                &adj,
                &mut index_counter,
                &mut stack,
                &mut on_stack,
                &mut indices,
                &mut lowlinks,
                &mut result,
            );
        }
    }

    // Only return cycles (SCCs with 2+ nodes)
    result.retain(|scc| scc.len() > 1);
    result
}

fn strongconnect<'a>(
    v: &'a str,
    adj: &HashMap<&str, Vec<&'a str>>,
    index_counter: &mut u32,
    stack: &mut Vec<&'a str>,
    on_stack: &mut HashMap<&'a str, bool>,
    indices: &mut HashMap<&'a str, u32>,
    lowlinks: &mut HashMap<&'a str, u32>,
    result: &mut Vec<Vec<String>>,
) {
    indices.insert(v, *index_counter);
    lowlinks.insert(v, *index_counter);
    *index_counter += 1;
    stack.push(v);
    on_stack.insert(v, true);

    if let Some(neighbors) = adj.get(v) {
        for &w in neighbors {
            if !indices.contains_key(w) {
                strongconnect(w, adj, index_counter, stack, on_stack, indices, lowlinks, result);
                let w_low = *lowlinks.get(w).unwrap();
                let v_low = lowlinks.get_mut(v).unwrap();
                if w_low < *v_low {
                    *v_low = w_low;
                }
            } else if *on_stack.get(w).unwrap_or(&false) {
                let w_idx = *indices.get(w).unwrap();
                let v_low = lowlinks.get_mut(v).unwrap();
                if w_idx < *v_low {
                    *v_low = w_idx;
                }
            }
        }
    }

    if lowlinks.get(v) == indices.get(v) {
        let mut scc = Vec::new();
        loop {
            let w = stack.pop().unwrap();
            on_stack.insert(w, false);
            scc.push(w.to_string());
            if w == v {
                break;
            }
        }
        result.push(scc);
    }
}
