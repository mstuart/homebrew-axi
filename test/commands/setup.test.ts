import { afterEach, describe, expect, it, vi } from "vitest";

const installSessionStartHooksMock = vi.fn();

vi.mock("axi-sdk-js", async () => {
  const actual = await vi.importActual<typeof import("axi-sdk-js")>("axi-sdk-js");
  return {
    ...actual,
    installSessionStartHooks: (...args: unknown[]) => installSessionStartHooksMock(...args),
  };
});

describe("setup", () => {
  afterEach(() => installSessionStartHooksMock.mockReset());

  it("installs hooks with the homebrew-axi marker on `setup hooks`", async () => {
    const { setupCommand } = await import("../../src/commands/setup.js");
    const out = await setupCommand(["hooks"]);
    expect(installSessionStartHooksMock).toHaveBeenCalledWith({
      marker: "homebrew-axi",
      binaryNames: ["homebrew-axi"],
    });
    expect(out.setup).toBe("hooks installed or already up to date");
  });

  it("rejects any other setup command", async () => {
    const { setupCommand } = await import("../../src/commands/setup.js");
    await expect(setupCommand(["wat"])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(setupCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(installSessionStartHooksMock).not.toHaveBeenCalled();
  });
});
