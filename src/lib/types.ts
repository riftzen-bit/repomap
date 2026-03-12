export type SymbolKind =
  | "function"
  | "class"
  | "struct"
  | "interface"
  | "type"
  | "const";

export interface Symbol {
  name: string;
  kind: SymbolKind;
  line: number;
}

export interface Node {
  id: string;
  label: string;
  language: string;
  lines: number;
  symbols: Symbol[];
  imports: string[];
  importedBy: string[];
  isEntryPoint: boolean;
  isConfig: boolean;
  isOrphan: boolean;
  isHub: boolean;
}

export interface Edge {
  source: string;
  target: string;
  isCircular: boolean;
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
}

export interface ScanProgress {
  filesScanned: number;
  totalFiles: number;
  currentFile: string;
}

export interface FilePreview {
  content: string;
  language: string;
  lineCount: number;
}

export interface Filters {
  languages: string[];
  directories: string[];
  minConnections: number;
  maxDepth: number | null;
}
