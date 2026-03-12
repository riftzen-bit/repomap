pub mod imports;
pub mod symbols;

use crate::graph::types::Symbol;
use tree_sitter::Parser;
use tree_sitter_language::LanguageFn;

pub struct ParseResult {
    pub imports: Vec<String>,
    pub symbols: Vec<Symbol>,
}

/// Parse a file and extract imports + symbols.
pub fn parse_file(content: &str, language: &str) -> ParseResult {
    let empty = ParseResult {
        imports: Vec::new(),
        symbols: Vec::new(),
    };

    let lang_fn = match get_language(language) {
        Some(l) => l,
        None => return empty,
    };

    let mut parser = Parser::new();
    if parser.set_language(&lang_fn.into()).is_err() {
        return empty;
    }

    let tree = match parser.parse(content, None) {
        Some(t) => t,
        None => return empty,
    };

    let source = content.as_bytes();

    ParseResult {
        imports: imports::extract_imports(&tree, source, language),
        symbols: symbols::extract_symbols(&tree, source, language),
    }
}

fn get_language(language: &str) -> Option<LanguageFn> {
    match language {
        "go" => Some(tree_sitter_go::LANGUAGE),
        "rust" => Some(tree_sitter_rust::LANGUAGE),
        "javascript" | "jsx" => Some(tree_sitter_javascript::LANGUAGE),
        "typescript" => Some(tree_sitter_typescript::LANGUAGE_TYPESCRIPT),
        "tsx" => Some(tree_sitter_typescript::LANGUAGE_TSX),
        "python" => Some(tree_sitter_python::LANGUAGE),
        "java" => Some(tree_sitter_java::LANGUAGE),
        "c" | "cpp" => Some(tree_sitter_cpp::LANGUAGE),
        "ruby" => Some(tree_sitter_ruby::LANGUAGE),
        "php" => Some(tree_sitter_php::LANGUAGE_PHP),
        _ => None,
    }
}
