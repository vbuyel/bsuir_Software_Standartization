import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { HalsteadAnalyzer } from "../js/analyzer.js";

const analyzer = new HalsteadAnalyzer();
const names = (list) => list.map((item) => item.name);
const countOf = (list, name) => list.find((item) => item.name === name)?.count ?? 0;

describe("HalsteadAnalyzer classification", () => {
  it("skips parentheses after function names and counts function names as operators", () => {
    const m = analyzer.analyze(`
      double nextTerm(double vs) { return vs; }
      int main() {
        double vs;
        vs = nextTerm(vs);
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("nextTerm"));
    assert.ok(names(m.operators).includes("main"));
    // Parens were directly after nextTerm and main, so ( ) is not counted here
    assert.equal(countOf(m.operators, "( )"), 0);
    assert.ok(!names(m.operands).some((n) => /nextTerm|main/.test(n)));
  });

  it("counts parentheses in control statements and expressions, but skips them after functions", () => {
    const m = analyzer.analyze(`
      int main() {
        int x;
        x = (1 + 2) * 3;
        if (x > 5) {
          x = abs(x);
        }
        return 0;
      }
    `);
    // (1 + 2) is grouping paren -> 1
    // if (x > 5) is control statement paren -> 1
    // abs(x) is function call paren -> skipped!
    // main() is function paren -> skipped!
    assert.equal(countOf(m.operators, "( )"), 2);
    assert.ok(names(m.operators).includes("abs"));
    assert.ok(names(m.operators).includes("if"));
  });

  it("treats std::cout as std + :: + cout operators", () => {
    const m = analyzer.analyze(`
      int main() {
        std::cout << "hi" << std::endl;
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("std"));
    assert.ok(names(m.operators).includes("::"));
    assert.ok(names(m.operators).includes("cout"));
    assert.ok(names(m.operators).includes("endl"));
    assert.ok(!names(m.operands).includes("cout"));
    assert.ok(!names(m.operands).includes("std"));
  });

  it("records quoted text as operand and does not create synthetic quotes operator", () => {
    const m = analyzer.analyze(`
      int main() {
        string msg;
        msg = "ready";
        return 0;
      }
    `);
    assert.equal(countOf(m.operators, '""'), 0);
    assert.ok(names(m.operands).includes('"ready"'));
  });

  it("counts types and declared variables as operands", () => {
    const m = analyzer.analyze(`
      int main() {
        int n;
        double eps;
        n = 1;
        return 0;
      }
    `);
    assert.ok(names(m.operands).includes("int"));
    assert.ok(names(m.operands).includes("double"));
    assert.ok(!names(m.operators).includes("int"));
    assert.ok(!names(m.operators).includes("double"));
    assert.ok(names(m.operands).includes("eps"));
    assert.ok(names(m.operands).includes("n"));
    assert.equal(countOf(m.operators, ";"), 4);
  });

  it("counts composite if...else statement as one operator", () => {
    const m = analyzer.analyze(`
      int absValue(int v) {
        if (v < 0) { v = -v; } else { v = v; }
        return v;
      }
    `);
    assert.equal(countOf(m.operators, "if...else"), 1);
    assert.equal(countOf(m.operators, "if"), 0);
    assert.equal(countOf(m.operators, "else"), 0);
  });

  it("counts do...while as one composite operator and while loop separately", () => {
    const m = analyzer.analyze(`
      int main() {
        int i;
        i = 0;
        do {
          i = i + 1;
        } while (i < 5);
        while (i > 0) {
          i = i - 1;
        }
        return 0;
      }
    `);
    assert.equal(countOf(m.operators, "do...while"), 1);
    assert.equal(countOf(m.operators, "while"), 1);
    assert.equal(countOf(m.operators, "do"), 0);
  });

  it("keeps N1 and N2 equal to the sums of frequencies", () => {
    const m = analyzer.analyze(`
      int main() {
        int x;
        x = 1 + 2;
        return x;
      }
    `);
    const sumOps = m.operators.reduce((s, i) => s + i.count, 0);
    const sumOds = m.operands.reduce((s, i) => s + i.count, 0);
    assert.equal(m.N1, sumOps);
    assert.equal(m.N2, sumOds);
  });
});

describe("HalsteadAnalyzer on sample.cpp", () => {
  it("returns the exact metrics for sample.cpp with composite operators and types as operands", () => {
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample.cpp"), "utf8");
    const m = analyzer.analyze(src);
    assert.equal(m.eta1, 41);
    assert.equal(m.N1, 312);
    assert.equal(m.eta2, 40);
    assert.equal(m.N2, 174);
    assert.equal(m.eta, 81);
    assert.equal(m.N, 486);
    assert.equal(m.V, 3081.2);
    assert.equal(countOf(m.operators, "if...else"), 3);
    assert.equal(countOf(m.operators, "if"), 2);
    assert.equal(countOf(m.operators, "do...while"), 1);
    assert.equal(countOf(m.operators, "while"), 1);
    assert.equal(countOf(m.operators, "( )"), 11);
    assert.ok(names(m.operands).includes("double"));
    assert.ok(names(m.operands).includes("int"));
    assert.ok(!m.operands.some((o) => /cin|cout|endl|nextTerm|absValue|printResult|readMode|main/.test(o.name)));
  });
});
