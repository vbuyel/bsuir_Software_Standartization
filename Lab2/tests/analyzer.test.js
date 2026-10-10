import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { GilbAnalyzer } from "../js/analyzer.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("analyzer returns CL, cl, CLI for sample.cpp", () => {
  const src = readFileSync(join(root, "sample.cpp"), "utf8");
  const m = new GilbAnalyzer().analyze(src);
  assert.equal(m.CL, 10);
  assert.equal(m.CLI, 2);
  assert.equal(m.Nop, 115);
  assert.equal(m.cl, m.CL / m.Nop);
  assert.ok(m.cl > 0 && m.cl < 1);
});
