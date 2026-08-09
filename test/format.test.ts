import { describe, expect, it } from "vitest";
import { collapseWhitespace, isoDate, truncateLine } from "../src/format.js";

describe("format helpers", () => {
  it("collapses whitespace and newlines", () => {
    expect(collapseWhitespace("a\n\n  b   c")).toBe("a b c");
  });

  it("truncates long lines with an ellipsis", () => {
    expect(truncateLine("hello world", 5)).toBe("hello …");
    expect(truncateLine("short", 100)).toBe("short");
  });

  it("formats a date as YYYY-MM-DD", () => {
    expect(isoDate(new Date("2024-04-25T17:09:33.123Z"))).toBe("2024-04-25");
  });
});
