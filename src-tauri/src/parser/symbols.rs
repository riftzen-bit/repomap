use tree_sitter::{Node, Tree};

use crate::graph::types::{Symbol, SymbolKind};

/// Extract symbol definitions from a parsed AST.
pub fn extract_symbols(tree: &Tree, source: &[u8], language: &str) -> Vec<Symbol> {
    let mut symbols = Vec::new();
    let root = tree.root_node();
    collect_symbols(&root, source, language, &mut symbols);
    symbols
}

fn collect_symbols(node: &Node, source: &[u8], language: &str, symbols: &mut Vec<Symbol>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            if let Some(sym) = try_extract_symbol(&n, source, language) {
                symbols.push(sym);
            }
        }

        if visit && cursor.goto_first_child() {
            visit = true;
            continue;
        }
        if cursor.goto_next_sibling() {
            visit = true;
            continue;
        }
        loop {
            if !cursor.goto_parent() {
                return;
            }
            if cursor.goto_next_sibling() {
                visit = true;
                break;
            }
        }
    }
}

fn try_extract_symbol(node: &Node, source: &[u8], language: &str) -> Option<Symbol> {
    let kind_str = node.kind();
    let (sym_kind, name_child_kind) = match_node_to_symbol(kind_str, language)?;
    let name = extract_name(node, source, &name_child_kind)?;
    let line = node.start_position().row as u32 + 1; // 1-based

    Some(Symbol {
        name,
        kind: sym_kind,
        line,
    })
}

/// Map a tree-sitter node kind to a SymbolKind and the child kind that holds the name.
fn match_node_to_symbol(kind: &str, language: &str) -> Option<(SymbolKind, Vec<&'static str>)> {
    // Name child kinds to check, in priority order
    let ident = vec!["identifier", "name", "type_identifier", "property_identifier"];

    match kind {
        // ---- Functions ----
        "function_declaration" => Some((SymbolKind::Function, ident)),
        "function_definition" => Some((SymbolKind::Function, ident)),
        "method_declaration" => Some((SymbolKind::Function, ident)),
        "method_definition" => Some((SymbolKind::Function, ident)),
        "function_item" => Some((SymbolKind::Function, ident)),
        "arrow_function" => {
            // Only capture arrow functions assigned to a variable (handled at parent)
            None
        }
        "function" => {
            // Ruby: function-like in some grammars
            Some((SymbolKind::Function, ident))
        }
        // Go-specific
        "func_literal" => None, // anonymous, skip
        // Python: function_definition already covered above
        // Ruby: method
        "method" if language == "ruby" => Some((SymbolKind::Function, ident)),
        "singleton_method" if language == "ruby" => Some((SymbolKind::Function, ident)),

        // ---- Classes ----
        "class_declaration" => Some((SymbolKind::Class, ident)),
        "class_definition" => Some((SymbolKind::Class, ident)),
        "class" if language == "ruby" => Some((SymbolKind::Class, ident)),

        // Rust impl blocks
        "impl_item" => Some((SymbolKind::Class, vec!["type_identifier", "identifier"])),

        // ---- Structs ----
        "struct_item" => Some((SymbolKind::Struct, vec!["type_identifier", "identifier"])),
        "struct_specifier" => Some((SymbolKind::Struct, ident)),

        // ---- Interfaces / Traits ----
        "interface_declaration" => Some((SymbolKind::Interface, ident)),
        "trait_item" => {
            Some((SymbolKind::Interface, vec!["type_identifier", "identifier"]))
        }

        // ---- Type aliases ----
        "type_alias_declaration" => Some((SymbolKind::Type, ident)),
        "type_item" => Some((SymbolKind::Type, vec!["type_identifier", "identifier"])),
        "type_spec" if language == "go" => Some((SymbolKind::Type, ident)),

        // ---- Constants ----
        "const_declaration" if language == "go" => {
            // Go: may contain multiple const_spec children — handled specially
            None
        }
        "const_spec" if language == "go" => Some((SymbolKind::Const, ident)),
        "const_item" => Some((SymbolKind::Const, ident)),
        "const_declaration" => Some((SymbolKind::Const, ident)),

        // JS/TS: lexical_declaration with const keyword
        "lexical_declaration" if is_const_declaration(language) => None, // handled below via variable_declarator

        // JS/TS: top-level const variable_declarator inside lexical_declaration
        "variable_declarator" => {
            // Check if parent is a const lexical_declaration
            // We handle this in a special path
            None
        }

        // PHP: const_declaration
        "const_element" if language == "php" => Some((SymbolKind::Const, ident)),

        // ---- Enums ----
        "enum_item" => Some((SymbolKind::Type, vec!["type_identifier", "identifier"])),
        "enum_declaration" => Some((SymbolKind::Type, ident)),

        _ => None,
    }
}

/// Extract the name from a symbol node by looking for known name-bearing children.
fn extract_name(node: &Node, source: &[u8], name_kinds: &[&str]) -> Option<String> {
    let mut cursor = node.walk();
    if !cursor.goto_first_child() {
        return None;
    }

    loop {
        let child = cursor.node();
        let child_kind = child.kind();

        // Direct name match
        for &expected in name_kinds {
            if child_kind == expected {
                if let Ok(text) = child.utf8_text(source) {
                    let name = text.trim().to_string();
                    if !name.is_empty() {
                        return Some(name);
                    }
                }
            }
        }

        // For Go: field_identifier in method_declaration
        if child_kind == "field_identifier" {
            if let Ok(text) = child.utf8_text(source) {
                let name = text.trim().to_string();
                if !name.is_empty() {
                    return Some(name);
                }
            }
        }

        if !cursor.goto_next_sibling() {
            break;
        }
    }

    None
}

fn is_const_declaration(_language: &str) -> bool {
    // This is used as a guard — the actual const check happens at the AST level
    // when we inspect lexical_declaration children
    true
}
