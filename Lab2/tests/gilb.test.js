import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeControlFlow } from "../js/controlFlow.js";
import { computeGilb } from "../js/gilb.js";
import { CppLexer } from "../js/lexer.js";
import { countOperators } from "../js/operators.js";

const lexer = new CppLexer();

test("cl = CL / N_op", () => {
  const src = `int main() { if (a) { x = 1; } }`;
  const tokens = lexer.tokenize(lexer.clean(src));
  const flow = analyzeControlFlow(tokens);
  const Nop = countOperators(tokens);
  const m = computeGilb(flow, Nop);
  assert.equal(m.CL, 1);
  assert.ok(Nop > m.CL);
  assert.equal(m.cl, m.CL / m.Nop);
});

test("closing brackets are not double-counted in N_op", () => {
  const tokens = lexer.tokenize(lexer.clean(`int main() { x = 1; }`));
  const n = countOperators(tokens);
  // (, {, =, ;  — not ), }
  assert.ok(n >= 4);
  assert.ok(!tokens.filter((t) => t.value === ")").every(() => false));
  const withCloses = tokens.filter((t) => t.type === "op").length;
  assert.ok(n < withCloses);
});
