import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileInfo } from "../../components/sidebar/FileInfo";
import type { Node, Insights } from "../../lib/types";

// Mock graphStore for ImpactToggle
const mockSetImpactMode = vi.fn();
vi.mock("../../stores/graphStore", () => ({
  useGraphStore: vi.fn((selector: any) =>
    selector({
      impactMode: false,
      setImpactMode: mockSetImpactMode,
      graphData: {
        nodes: [],
        edges: [
          { source: "src/main.tsx", target: "src/components/App.tsx", isCircular: false },
        ],
        insights: {
          totalFiles: 0,
          totalEdges: 0,
          circularDeps: [],
          orphanFiles: [],
          hubFiles: [],
          languageBreakdown: {},
        },
      },
    }),
  ),
}));

const mockNode: Node = {
  id: "src/components/App.tsx",
  label: "src/components/App.tsx",
  language: "typescript",
  lines: 150,
  symbols: [
    { name: "App", kind: "function", line: 10 },
    { name: "Props", kind: "interface", line: 1 },
  ],
  imports: ["src/utils.ts", "src/hooks/useAuth.ts"],
  importedBy: ["src/main.tsx"],
  isEntryPoint: false,
  isConfig: false,
  isOrphan: false,
  isHub: false,
};

const mockInsights: Insights = {
  totalFiles: 10,
  totalEdges: 5,
  circularDeps: [],
  orphanFiles: [],
  hubFiles: ["src/components/App.tsx"],
  languageBreakdown: { typescript: 10 },
};

describe("FileInfo", () => {
  it("renders file path", () => {
    render(<FileInfo node={mockNode} insights={mockInsights} />);
    expect(screen.getByText("src/components/App.tsx")).toBeTruthy();
  });

  it("renders language badge", () => {
    render(<FileInfo node={mockNode} insights={mockInsights} />);
    expect(screen.getByText("typescript")).toBeTruthy();
  });

  it("shows Hub File badge when node is hub", () => {
    render(<FileInfo node={mockNode} insights={mockInsights} />);
    expect(screen.getByText("Hub File")).toBeTruthy();
  });

  it("renders metrics", () => {
    render(<FileInfo node={mockNode} insights={mockInsights} />);
    expect(screen.getByText("150")).toBeTruthy(); // Lines
    expect(screen.getByText("Lines")).toBeTruthy();
    expect(screen.getByText("Imports")).toBeTruthy();
    expect(screen.getByText("Imported by")).toBeTruthy();
  });

  it("toggles symbols section", async () => {
    const user = userEvent.setup();
    render(<FileInfo node={mockNode} insights={mockInsights} />);

    const toggleButton = screen.getByText(/Symbols \(2\)/);
    await user.click(toggleButton);

    expect(screen.getByText("App")).toBeTruthy();
    expect(screen.getByText("Props")).toBeTruthy();
  });

  it("shows Impact Analysis button when node has dependents", () => {
    render(<FileInfo node={mockNode} insights={mockInsights} />);
    expect(screen.getByText("Impact Analysis")).toBeTruthy();
  });
});
