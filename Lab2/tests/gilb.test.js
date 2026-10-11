import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeControlFlow } from "../js/controlFlow.js";
import { computeGilb } from "../js/gilb.js";
import { CppLexer } from "../js/lexer.js";
import { countOperators } from "../js/operators.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lexer = new CppLexer();

test("cl = CL / N_op", () => {
  const src = `int main() { if (a) { x = 1; } }`;
  const tokens = lexer.tokenize(lexer.clean(src));
  const flow = analyzeControlFlow(tokens);
  const Nop = countOperators(tokens);
  const m = computeGilb(flow, Nop);
  assert.equal(m.CL, 1);
  assert.equal(m.Nop, 2); // if + x = 1;
  assert.equal(m.cl, m.CL / m.Nop);
});

test("classic N_op ignores declarations and punctuation", () => {
  const tokens = lexer.tokenize(lexer.clean(`
    int main() {
      int x = 1;
      x = x + 1;
    }
  `));
  assert.equal(countOperators(tokens), 1); // only x = x + 1;
});

test("sample.cpp classic N_op is 26 (includes switch, excludes decls)", () => {
  const src = readFileSync(join(root, "sample.cpp"), "utf8");
  const tokens = lexer.tokenize(lexer.clean(src));
  assert.equal(countOperators(tokens), 26);
});
