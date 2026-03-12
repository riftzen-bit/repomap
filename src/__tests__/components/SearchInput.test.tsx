import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../../components/common/SearchInput";

const mockFocusNode = vi.fn();
const mockGraphData = {
  nodes: [
    { id: "src/index.ts", label: "src/index.ts" },
    { id: "src/utils.ts", label: "src/utils.ts" },
    { id: "lib/helpers.ts", label: "lib/helpers.ts" },
  ],
  edges: [],
  insights: { totalFiles: 3, totalEdges: 0, circularDeps: [], orphanFiles: [], hubFiles: [], languageBreakdown: {} },
};

vi.mock("../../stores/graphStore", () => ({
  useGraphStore: vi.fn((selector) =>
    selector({ graphData: mockGraphData, focusNode: mockFocusNode })
  ),
}));

describe("SearchInput", () => {
  beforeEach(() => {
    mockFocusNode.mockClear();
  });

  it("renders search input", () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText("Search files...")).toBeTruthy();
  });

  it("shows results after typing with debounce", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByPlaceholderText("Search files..."), "index");

    await waitFor(() => {
      expect(screen.getByText("src/index.ts")).toBeTruthy();
    }, { timeout: 500 });
  });

  it("selects result with Enter key", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search files...");
    await user.type(input, "index");

    await waitFor(() => {
      expect(screen.getByText("src/index.ts")).toBeTruthy();
    }, { timeout: 500 });

    await user.keyboard("{Enter}");
    expect(mockFocusNode).toHaveBeenCalledWith("src/index.ts");
  });

  it("shows clear button when input has text", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByPlaceholderText("Search files..."), "test");

    expect(screen.getByLabelText("Clear search")).toBeTruthy();
  });

  it("closes dropdown on Escape", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByPlaceholderText("Search files..."), "src");

    await waitFor(() => {
      expect(screen.getByText("src/index.ts")).toBeTruthy();
    }, { timeout: 500 });

    await user.keyboard("{Escape}");

    expect(screen.queryByText("src/index.ts")).toBeNull();
  });
});
