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
  it("puts function names in operators, not operands", () => {
    const m = analyzer.analyze(`
      double nextTerm(double vs) { return vs; }
      int main() {
        double vs;
        vs = nextTerm(vs);
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("nextTerm ( )"));
    assert.ok(!names(m.operands).some((n) => /nextTerm|main/.test(n)));
  });

  it("treats std::cout as one operator, not std + :: + cout", () => {
    const m = analyzer.analyze(`
      int main() {
        std::cout << "hi" << std::endl;
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("std::cout"));
    assert.ok(names(m.operators).includes("std::endl"));
    assert.ok(!names(m.operands).includes("cout"));
    assert.ok(!names(m.operands).includes("std"));
  });

  it("records string quotes as operator and quoted text as operand", () => {
    const m = analyzer.analyze(`
      int main() {
        char* msg;
        msg = "ready";
        return 0;
      }
    `);
    assert.ok(countOf(m.operators, '""') >= 1);
    assert.ok(names(m.operands).includes('"ready"'));
  });

  it("skips declarations and labels", () => {
    const m = analyzer.analyze(`
      int main() {
        int n;
        double eps;
      finish:
        n = 1;
        goto finish;
        return 0;
      }
    `);
    assert.equal(countOf(m.operands, "eps"), 0);
    assert.ok(!names(m.operators).includes("finish"));
    assert.ok(!names(m.operands).includes("finish"));
    assert.ok(names(m.operators).includes("goto"));
    assert.equal(countOf(m.operands, "n"), 1);
  });

  it("counts if...else as one operator and grouping parens separately from calls", () => {
    const m = analyzer.analyze(`
      int absValue(int v) {
        if (v < 0) { v = -v; }
        return v;
      }
      int main() {
        int y, n;
        y = absValue((2 * n - 1));
        return 0;
      }
    `);
    assert.equal(countOf(m.operators, "if...else"), 1);
    assert.ok(names(m.operators).includes("absValue ( )"));
    assert.ok(countOf(m.operators, "( )") >= 1);
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
  it("returns the lab reference totals", () => {
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample.cpp"), "utf8");
    const m = analyzer.analyze(src);
    assert.equal(m.eta1, 35);
    assert.equal(m.N1, 234);
    assert.equal(m.eta2, 34);
    assert.equal(m.N2, 134);
    assert.equal(m.eta, 69);
    assert.equal(m.N, 368);
    assert.equal(m.V, 2248);
    assert.ok(!m.operands.some((o) => /cin|cout|endl|nextTerm|absValue|printResult|readMode|main/.test(o.name)));
  });
});
