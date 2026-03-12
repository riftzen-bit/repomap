import { describe, it, expect } from "vitest";
import {
  getLanguageColor,
  getLanguageColorWithAlpha,
} from "../../lib/colors";

const FALLBACK = "#a89f93";

describe("getLanguageColor", () => {
  it("returns the correct hex for typescript", () => {
    expect(getLanguageColor("typescript")).toBe("#5da4e8");
  });

  it("returns the correct hex for tsx", () => {
    expect(getLanguageColor("tsx")).toBe("#5da4e8");
  });

  it("returns the correct hex for javascript", () => {
    expect(getLanguageColor("javascript")).toBe("#ecd24a");
  });

  it("returns the correct hex for jsx", () => {
    expect(getLanguageColor("jsx")).toBe("#ecd24a");
  });

  it("returns the correct hex for go", () => {
    expect(getLanguageColor("go")).toBe("#6ad4a0");
  });

  it("returns the correct hex for rust", () => {
    expect(getLanguageColor("rust")).toBe("#f08040");
  });

  it("returns the correct hex for python", () => {
    expect(getLanguageColor("python")).toBe("#f7d44f");
  });

  it("returns the correct hex for java", () => {
    expect(getLanguageColor("java")).toBe("#b07ee8");
  });

  it("returns the correct hex for ruby", () => {
    expect(getLanguageColor("ruby")).toBe("#e85050");
  });

  it("returns the correct hex for php", () => {
    expect(getLanguageColor("php")).toBe("#9b8fef");
  });

  it("returns the correct hex for c", () => {
    expect(getLanguageColor("c")).toBe("#c8c0b4");
  });

  it("returns the correct hex for cpp", () => {
    expect(getLanguageColor("cpp")).toBe("#c8c0b4");
  });

  it("is case-insensitive for TypeScript", () => {
    expect(getLanguageColor("TypeScript")).toBe(getLanguageColor("typescript"));
  });

  it("is case-insensitive for PYTHON", () => {
    expect(getLanguageColor("PYTHON")).toBe(getLanguageColor("python"));
  });

  it("is case-insensitive for Go", () => {
    expect(getLanguageColor("Go")).toBe(getLanguageColor("go"));
  });

  it("returns fallback for unknown language", () => {
    expect(getLanguageColor("cobol")).toBe(FALLBACK);
  });

  it("returns fallback for empty string", () => {
    expect(getLanguageColor("")).toBe(FALLBACK);
  });
});

describe("getLanguageColorWithAlpha", () => {
  it("converts typescript hex to correct rgba components", () => {
    // #5da4e8 → r=93, g=164, b=232
    expect(getLanguageColorWithAlpha("typescript", 1)).toBe(
      "rgba(93, 164, 232, 1)",
    );
  });

  it("uses alpha=0 correctly", () => {
    expect(getLanguageColorWithAlpha("typescript", 0)).toBe(
      "rgba(93, 164, 232, 0)",
    );
  });

  it("uses alpha=0.5 correctly", () => {
    expect(getLanguageColorWithAlpha("typescript", 0.5)).toBe(
      "rgba(93, 164, 232, 0.5)",
    );
  });

  it("uses alpha=1 correctly", () => {
    expect(getLanguageColorWithAlpha("rust", 1)).toBe(
      // #f08040 → r=240, g=128, b=64
      "rgba(240, 128, 64, 1)",
    );
  });

  it("uses fallback color for unknown language with given alpha", () => {
    // #a89f93 → r=168, g=159, b=147
    expect(getLanguageColorWithAlpha("unknown", 0.8)).toBe(
      "rgba(168, 159, 147, 0.8)",
    );
  });

  it("uses fallback color for empty string", () => {
    // #a89f93 → r=168, g=159, b=147
    expect(getLanguageColorWithAlpha("", 1)).toBe("rgba(168, 159, 147, 1)");
  });
});
