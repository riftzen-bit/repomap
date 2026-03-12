export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "constant"
  | "variable"
  | "method"
  | "trait"
  | "struct"
  | "module";

export interface Symbol {
  name: string;
  kind: SymbolKind;
  line: number;
  exported: boolean;
}

export interface Node {
  id: string;
  path: string;
  filename: string;
  language: string;
  size: number;
  symbols: Symbol[];
  importCount: number;
  exportCount: number;
}

export interface Edge {
  source: string;
  target: string;
  symbols: string[];
}

export interface Insights {
  totalFiles: number;
  totalEdges: number;
  circularDeps: string[][];
  orphanFiles: string[];
  hubFiles: string[];
  languageBreakdown: Record<string, number>;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  insights: Insights;
  rootDir: string;
  projectName: string;
}

export interface ScanProgress {
  filesScanned: number;
  totalFiles: number;
  currentFile: string;
}

export interface FilePreview {
  path: string;
  content: string;
  language: string;
}
