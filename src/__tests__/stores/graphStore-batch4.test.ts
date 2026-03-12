import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "../../stores/graphStore";

beforeEach(() => useGraphStore.getState().reset());

describe("bookmarks", () => {
  it("starts with empty bookmarks", () => {
    expect(useGraphStore.getState().bookmarks).toEqual([]);
  });

  it("toggleBookmark adds a bookmark", () => {
    useGraphStore.getState().toggleBookmark("src/main.ts");
    expect(useGraphStore.getState().bookmarks).toEqual(["src/main.ts"]);
  });

  it("toggleBookmark removes existing bookmark", () => {
    useGraphStore.getState().toggleBookmark("src/main.ts");
    useGraphStore.getState().toggleBookmark("src/main.ts");
    expect(useGraphStore.getState().bookmarks).toEqual([]);
  });

  it("clearBookmarks removes all", () => {
    useGraphStore.getState().toggleBookmark("a.ts");
    useGraphStore.getState().toggleBookmark("b.ts");
    useGraphStore.getState().clearBookmarks();
    expect(useGraphStore.getState().bookmarks).toEqual([]);
  });
});
