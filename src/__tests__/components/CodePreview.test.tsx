import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { CodePreview } from "../../components/sidebar/CodePreview";

// Mock Shiki
vi.mock("shiki", () => ({
  codeToHtml: vi.fn().mockResolvedValue('<pre><code>const x = 1;</code></pre>'),
}));

// Mock graphStore
vi.mock("../../stores/graphStore", () => ({
  useGraphStore: vi.fn((selector) =>
    selector({ projectRoot: "/test/project" })
  ),
}));

describe("CodePreview", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockResolvedValue({
      content: "const x = 1;",
      language: "typescript",
      lineCount: 1,
    });
  });

  it("renders loading state initially", () => {
    render(<CodePreview filePath="src/index.ts" language="typescript" />);
    expect(screen.getByText("Loading preview...")).toBeTruthy();
  });

  it("renders highlighted code after load", async () => {
    render(<CodePreview filePath="src/index.ts" language="typescript" />);
    await waitFor(() => {
      expect(screen.queryByText("Loading preview...")).toBeNull();
    });
  });
});
