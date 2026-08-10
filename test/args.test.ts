import { describe, expect, it } from "vitest";
import { assertKnownFlags, parseFlags, parseLimit } from "../src/args.js";

describe("parseFlags", () => {
  it("splits positionals and --key value flags", () => {
    const { positionals, flags } = parseFlags(["wget", "--limit", "5"]);
    expect(positionals).toEqual(["wget"]);
    expect(flags).toEqual({ limit: "5" });
  });

  it("supports --key=value form", () => {
    const { flags } = parseFlags(["--limit=10"]);
    expect(flags).toEqual({ limit: "10" });
  });

  it("treats booleans-list flags as boolean even followed by a non-flag token", () => {
    const { positionals, flags } = parseFlags(["--full", "wget"], ["full"]);
    expect(positionals).toEqual(["wget"]);
    expect(flags).toEqual({ full: true });
  });

  it("treats a trailing flag with no following value as boolean", () => {
    const { flags } = parseFlags(["--cask"]);
    expect(flags).toEqual({ cask: true });
  });
});

describe("assertKnownFlags", () => {
  it("passes when all flags are allowed", () => {
    expect(() =>
      assertKnownFlags({ cask: true, full: true }, ["full", "cask"], "usage")
    ).not.toThrow();
  });

  it("throws VALIDATION_ERROR on an unrecognized flag", () => {
    expect(() =>
      assertKnownFlags({ stat: "x" }, ["full", "cask"], "usage")
    ).toThrowError(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });
});

describe("parseLimit", () => {
  it("falls back when the value is missing or not numeric", () => {
    expect(parseLimit(undefined, 20, 100)).toBe(20);
    expect(parseLimit(true, 20, 100)).toBe(20);
    expect(parseLimit("abc", 20, 100)).toBe(20);
  });

  it("clamps to the max", () => {
    expect(parseLimit("500", 20, 100)).toBe(100);
  });

  it("parses a valid value", () => {
    expect(parseLimit("30", 20, 100)).toBe(30);
  });
});
