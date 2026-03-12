use tree_sitter::{Node, Tree};

/// Extract import paths from a parsed AST.
pub fn extract_imports(tree: &Tree, source: &[u8], language: &str) -> Vec<String> {
    let mut imports = Vec::new();
    let root = tree.root_node();
    collect_imports(&root, source, language, &mut imports);
    imports
}

fn collect_imports(node: &Node, source: &[u8], language: &str, imports: &mut Vec<String>) {
    match language {
        "go" => collect_go_imports(node, source, imports),
        "rust" => collect_rust_imports(node, source, imports),
        "javascript" | "jsx" | "typescript" | "tsx" => {
            collect_js_ts_imports(node, source, imports);
        }
        "python" => collect_python_imports(node, source, imports),
        "java" => collect_java_imports(node, source, imports),
        "c" | "cpp" => collect_c_cpp_imports(node, source, imports),
        "ruby" => collect_ruby_imports(node, source, imports),
        "php" => collect_php_imports(node, source, imports),
        _ => {}
    }
}

// ---------------------------------------------------------------------------
// Go: import "path" and import ( "path1" \n "path2" )
// ---------------------------------------------------------------------------
fn collect_go_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            if n.kind() == "import_declaration" {
                extract_go_import_specs(&n, source, imports);
            }
        }

        // Depth-first traversal: try child, then sibling, then uncle
        if visit && cursor.goto_first_child() {
            visit = true;
            continue;
        }
        if cursor.goto_next_sibling() {
            visit = true;
            continue;
        }
        // Walk up until we can go to a sibling
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

fn extract_go_import_specs(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    if !cursor.goto_first_child() {
        return;
    }
    loop {
        let child = cursor.node();
        match child.kind() {
            "import_spec" | "interpreted_string_literal" => {
                if let Some(path) = extract_string_content(&child, source) {
                    imports.push(path);
                }
            }
            "import_spec_list" => {
                // Recurse into grouped imports
                let mut inner = child.walk();
                if inner.goto_first_child() {
                    loop {
                        let spec = inner.node();
                        if spec.kind() == "import_spec" || spec.kind() == "interpreted_string_literal"
                        {
                            if let Some(path) = extract_string_content(&spec, source) {
                                imports.push(path);
                            }
                        }
                        if !inner.goto_next_sibling() {
                            break;
                        }
                    }
                }
            }
            _ => {}
        }
        if !cursor.goto_next_sibling() {
            break;
        }
    }
}

// ---------------------------------------------------------------------------
// Rust: use crate::foo, mod foo
// ---------------------------------------------------------------------------
fn collect_rust_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            match n.kind() {
                "use_declaration" => {
                    // The use path is typically the second child (after `use` keyword)
                    if let Some(path_node) = find_child_by_kind(&n, "scoped_identifier")
                        .or_else(|| find_child_by_kind(&n, "use_wildcard"))
                        .or_else(|| find_child_by_kind(&n, "scoped_use_list"))
                        .or_else(|| find_child_by_kind(&n, "identifier"))
                    {
                        if let Ok(text) = path_node.utf8_text(source) {
                            imports.push(text.to_string());
                        }
                    }
                }
                "mod_item" => {
                    // `mod foo;` — external module declaration (no body block)
                    let has_body = find_child_by_kind(&n, "declaration_list").is_some();
                    if !has_body {
                        if let Some(name_node) = find_child_by_kind(&n, "identifier") {
                            if let Ok(text) = name_node.utf8_text(source) {
                                imports.push(text.to_string());
                            }
                        }
                    }
                }
                _ => {}
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

// ---------------------------------------------------------------------------
// JavaScript / TypeScript / JSX / TSX
// ---------------------------------------------------------------------------
fn collect_js_ts_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            match n.kind() {
                "import_statement" => {
                    // Find the string source: import ... from "path"
                    if let Some(path) = find_child_string(&n, source) {
                        imports.push(path);
                    }
                }
                "call_expression" => {
                    // require("path") or dynamic import("path")
                    if let Some(func) = n.child(0) {
                        let is_require = func.kind() == "identifier"
                            && func.utf8_text(source).ok() == Some("require");
                        let is_import = func.kind() == "import";
                        if is_require || is_import {
                            if let Some(args) = find_child_by_kind(&n, "arguments") {
                                if let Some(path) = find_child_string(&args, source) {
                                    imports.push(path);
                                }
                            }
                        }
                    }
                }
                "export_statement" => {
                    // export ... from "path"
                    if let Some(path) = find_child_string(&n, source) {
                        imports.push(path);
                    }
                }
                _ => {}
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

// ---------------------------------------------------------------------------
// Python: import foo, from foo import bar
// ---------------------------------------------------------------------------
fn collect_python_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            match n.kind() {
                "import_statement" => {
                    // import foo.bar => dotted_name children
                    if let Some(name) = find_child_by_kind(&n, "dotted_name")
                        .or_else(|| find_child_by_kind(&n, "aliased_import"))
                    {
                        if let Ok(text) = name.utf8_text(source) {
                            imports.push(text.to_string());
                        }
                    }
                }
                "import_from_statement" => {
                    // from foo.bar import baz => module name is dotted_name
                    if let Some(module) = find_child_by_kind(&n, "dotted_name")
                        .or_else(|| find_child_by_kind(&n, "relative_import"))
                    {
                        if let Ok(text) = module.utf8_text(source) {
                            imports.push(text.to_string());
                        }
                    }
                }
                _ => {}
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

// ---------------------------------------------------------------------------
// Java: import com.foo.bar
// ---------------------------------------------------------------------------
fn collect_java_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            if n.kind() == "import_declaration" {
                // The scoped_identifier holds the full import path
                if let Some(path_node) = find_child_by_kind(&n, "scoped_identifier")
                    .or_else(|| find_child_by_kind(&n, "identifier"))
                {
                    if let Ok(text) = path_node.utf8_text(source) {
                        imports.push(text.to_string());
                    }
                }
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

// ---------------------------------------------------------------------------
// C / C++: #include "file.h", #include <file.h>
// ---------------------------------------------------------------------------
fn collect_c_cpp_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            if n.kind() == "preproc_include" {
                // path child is either string_literal or system_lib_string
                if let Some(path_node) = find_child_by_kind(&n, "string_literal")
                    .or_else(|| find_child_by_kind(&n, "system_lib_string"))
                {
                    if let Some(path) = extract_string_content(&path_node, source) {
                        imports.push(path);
                    } else if let Ok(text) = path_node.utf8_text(source) {
                        // system_lib_string: <foo.h> — strip angle brackets
                        let trimmed = text.trim_start_matches('<').trim_end_matches('>');
                        imports.push(trimmed.to_string());
                    }
                }
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

// ---------------------------------------------------------------------------
// Ruby: require "foo", require_relative "foo"
// ---------------------------------------------------------------------------
fn collect_ruby_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            if n.kind() == "call" || n.kind() == "method_call" {
                if let Some(method) = n.child(0) {
                    if let Ok(name) = method.utf8_text(source) {
                        if name == "require" || name == "require_relative" {
                            // Argument is typically the second child or inside argument_list
                            if let Some(arg) = find_child_by_kind(&n, "argument_list") {
                                if let Some(path) = find_child_string(&arg, source) {
                                    imports.push(path);
                                }
                            } else if let Some(path) = find_child_string(&n, source) {
                                imports.push(path);
                            }
                        }
                    }
                }
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

// ---------------------------------------------------------------------------
// PHP: use Foo\Bar, require "file", include "file"
// ---------------------------------------------------------------------------
fn collect_php_imports(node: &Node, source: &[u8], imports: &mut Vec<String>) {
    let mut cursor = node.walk();
    let mut visit = true;

    loop {
        if visit {
            let n = cursor.node();
            match n.kind() {
                "namespace_use_declaration" => {
                    // use Foo\Bar\Baz;
                    if let Some(clause) = find_child_by_kind(&n, "namespace_use_clause")
                        .or_else(|| find_child_by_kind(&n, "namespace_use_group_clause"))
                        .or_else(|| find_child_by_kind(&n, "qualified_name"))
                        .or_else(|| find_child_by_kind(&n, "name"))
                    {
                        if let Ok(text) = clause.utf8_text(source) {
                            imports.push(text.to_string());
                        }
                    }
                }
                "expression_statement" => {
                    // require "file"; include "file"; require_once "file"; include_once "file"
                    if let Some(child) = n.child(0) {
                        let kind = child.kind();
                        if kind == "require_expression"
                            || kind == "include_expression"
                            || kind == "require_once_expression"
                            || kind == "include_once_expression"
                        {
                            if let Some(path) = find_child_string(&child, source) {
                                imports.push(path);
                            }
                        }
                    }
                }
                _ => {}
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Find the first child of `node` with the given kind.
fn find_child_by_kind<'a>(node: &'a Node<'a>, kind: &str) -> Option<Node<'a>> {
    let mut cursor = node.walk();
    if !cursor.goto_first_child() {
        return None;
    }
    loop {
        if cursor.node().kind() == kind {
            return Some(cursor.node());
        }
        if !cursor.goto_next_sibling() {
            return None;
        }
    }
}

/// Find the first string-like child and return its unquoted content.
fn find_child_string(node: &Node, source: &[u8]) -> Option<String> {
    let mut cursor = node.walk();
    if !cursor.goto_first_child() {
        return None;
    }
    loop {
        let child = cursor.node();
        let kind = child.kind();
        if kind == "string" || kind == "string_literal" || kind == "interpreted_string_literal" {
            return extract_string_content(&child, source);
        }
        // Recurse one level for string_content inside string nodes
        if cursor.goto_first_child() {
            loop {
                let inner = cursor.node();
                if inner.kind() == "string"
                    || inner.kind() == "string_literal"
                    || inner.kind() == "string_content"
                {
                    return extract_string_content(&inner, source);
                }
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
        }
        if !cursor.goto_next_sibling() {
            return None;
        }
    }
}

/// Get the text content of a string node, stripping outer quotes.
fn extract_string_content(node: &Node, source: &[u8]) -> Option<String> {
    let text = node.utf8_text(source).ok()?;
    // If the node is string_content, it's already unquoted
    if node.kind() == "string_content" {
        return Some(text.to_string());
    }
    // Strip surrounding quotes (single, double, backtick)
    let trimmed = text
        .trim_start_matches('"')
        .trim_end_matches('"')
        .trim_start_matches('\'')
        .trim_end_matches('\'')
        .trim_start_matches('`')
        .trim_end_matches('`');
    Some(trimmed.to_string())
}
