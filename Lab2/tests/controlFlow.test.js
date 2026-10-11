import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeControlFlow } from "../js/controlFlow.js";
import { CppLexer } from "../js/lexer.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lexer = new CppLexer();

function flow(src) {
  return analyzeControlFlow(lexer.tokenize(lexer.clean(src)));
}

test("for { if } → if.depth === 1, CLI === 1", () => {
  const f = flow(`
    int main() {
      for (int i = 0; i < 3; i++) {
        if (i == 1) { i = i + 1; }
      }
    }
  `);
  const iff = f.constructs.find((c) => c.kind === "if");
  const fr = f.constructs.find((c) => c.kind === "for");
  assert.equal(fr.depth, 0);
  assert.equal(iff.depth, 1);
  assert.equal(f.CLI, 1);
  assert.equal(f.CL, 2);
});

test("do-while: do counts once, trailer while does not", () => {
  const f = flow(`
    int main() {
      int k = 0;
      do { k = k + 1; } while (k < 3);
    }
  `);
  assert.ok(f.constructs.some((c) => c.kind === "do" && c.countsForCL));
  assert.ok(!f.constructs.some((c) => c.kind === "while"));
  assert.equal(f.CL, 1);
});

test("default does not increase CL; cases do", () => {
  const f = flow(`
    int main() {
      switch (x) {
      case 1: break;
      case 2: break;
      default: break;
      }
    }
  `);
  assert.equal(f.constructs.filter((c) => c.kind === "case").length, 2);
  assert.ok(f.constructs.some((c) => c.kind === "default" && !c.countsForCL));
  assert.ok(f.constructs.some((c) => c.kind === "switch" && !c.countsForCL));
  assert.equal(f.CL, 2);
});

test("switch with 4 case + default → CL = 4, CLI = 3 (n-2)", () => {
  const f = flow(`
    int main() {
      switch (x) {
      case 1: break;
      case 2: break;
      case 3: break;
      case 4: break;
      default: break;
      }
    }
  `);
  const cases = f.constructs.filter((c) => c.kind === "case");
  assert.equal(f.CL, 4);
  assert.equal(f.CLI, 3);
  assert.deepEqual(cases.map((c) => c.depth), [0, 1, 2, 3]);
});

test("switch without default: all cases count with IF-equivalent depths", () => {
  const f = flow(`
    int main() {
      switch (t) {
      case 0: break;
      case 1: break;
      }
    }
  `);
  assert.equal(f.CL, 2);
  assert.equal(f.CLI, 1);
  assert.ok(!f.constructs.some((c) => c.kind === "default"));
});

test("else does not increase CL; else if does", () => {
  const f = flow(`
    int main() {
      if (a) { x = 1; }
      else if (b) { x = 2; }
      else { x = 3; }
    }
  `);
  assert.equal(f.constructs.filter((c) => c.kind === "if" && c.countsForCL).length, 1);
  assert.equal(f.constructs.filter((c) => c.kind === "else if" && c.countsForCL).length, 1);
  assert.equal(f.constructs.filter((c) => c.kind === "else" && !c.countsForCL).length, 1);
  assert.equal(f.CL, 2);
});

test("sample.cpp has expected CL and CLI", () => {
  const src = readFileSync(join(root, "sample.cpp"), "utf8");
  const f = flow(src);
  assert.equal(f.CL, 10);
  // if { switch { case@1, case@2 } } → CLI = 2
  assert.equal(f.CLI, 2);
  const kinds = f.constructs.filter((c) => c.countsForCL).map((c) => c.kind);
  assert.deepEqual(kinds, [
    "while", "for", "if", "do", "if", "case", "case", "while", "case", "case",
  ]);
});
