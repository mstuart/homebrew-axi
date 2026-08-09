// Generates skills/homebrew-axi/SKILL.md from the shared CLI guidance so the
// installable skill never drifts from what `homebrew-axi` prints.
//
//   npm run build:skill            # write the file
//   npm run build:skill -- --check # fail (exit 1) if the committed file is stale
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createSkillMarkdown } from "../src/skill.js";

const target = new URL("../skills/homebrew-axi/SKILL.md", import.meta.url);
const expected = createSkillMarkdown();
const check = process.argv.includes("--check");

if (check) {
  let actual: string | null = null;
  try {
    actual = await readFile(target, "utf8");
  } catch {
    // missing file falls through to the mismatch branch below
  }
  if (actual !== expected) {
    console.error(
      "skills/homebrew-axi/SKILL.md is out of date. Run `npm run build:skill` and commit the result.",
    );
    process.exit(1);
  }
  console.log("skills/homebrew-axi/SKILL.md is up to date.");
} else {
  await mkdir(new URL("../skills/homebrew-axi/", import.meta.url), {
    recursive: true,
  });
  await writeFile(target, expected);
  console.log(`Wrote ${fileURLToPath(target)}`);
}
