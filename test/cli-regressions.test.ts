import { beforeEach, expect, it, vi } from "vitest";
import { fetchCask, fetchFormula } from "../src/api.js";
import { assertKnownFlags, parseFlags } from "../src/args.js";
import { brewExec } from "../src/brew.js";
import { infoCommand } from "../src/commands/info.js";
import { installedCommand } from "../src/commands/installed.js";

vi.mock("../src/api.js", () => ({
  fetchCask: vi.fn(),
  fetchFormula: vi.fn(),
  installsForPeriod: vi.fn(),
}));
vi.mock("../src/brew.js", () => ({ brewExec: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchFormula).mockResolvedValue({ name: "wget" });
});

it("rejects an empty unknown flag name before reading metadata", async () => {
  const { flags } = parseFlags(["--=ignored"]);
  expect(() => assertKnownFlags(flags, [], "usage")).toThrowError(
    expect.objectContaining({ code: "VALIDATION_ERROR" })
  );
  await expect(infoCommand(["wget", "--=ignored"])).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
  });
  expect(fetchFormula).not.toHaveBeenCalled();
});

it("rejects --fields without a field list before fetching", async () => {
  await expect(infoCommand(["wget", "--fields"])).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
  });
  expect(fetchFormula).not.toHaveBeenCalled();
});

it("keeps casks out of the formula inventory and shared count", async () => {
  vi.mocked(brewExec).mockImplementation((args) => {
    if (args.includes("--cask")) {
      return Promise.resolve("app 2.0\n");
    }
    if (args.includes("--formula")) {
      return Promise.resolve("wget 1.0\n");
    }
    return Promise.resolve("wget 1.0\napp 2.0\n");
  });
  const result = await installedCommand([]);
  expect(result.count).toBe(2);
  expect(result.formulae).toEqual([{ name: "wget", version: "1.0" }]);
  expect(result.casks).toEqual([{ name: "app", version: "2.0" }]);
});

it("retains cask selection in the full-description suggestion", async () => {
  vi.mocked(fetchCask).mockResolvedValue({
    desc: "description ".repeat(100),
    token: "app",
  });
  const result = await infoCommand(["app", "--cask"]);
  expect(result.help).toContain(
    "Run `homebrew-axi info app --cask --full` for the complete description"
  );
});
