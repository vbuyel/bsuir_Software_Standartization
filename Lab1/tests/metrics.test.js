import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FrequencyTable, HalsteadMetrics } from "../js/metrics.js";

describe("FrequencyTable", () => {
  it("counts unique names and total occurrences", () => {
    const t = new FrequencyTable();
    t.add(";");
    t.add("=");
    t.add(";");
    assert.equal(t.total, 3);
    assert.deepEqual(t.toList(), [
      { name: ";", count: 2 },
      { name: "=", count: 1 },
    ]);
  });

  it("ignores empty names", () => {
    const t = new FrequencyTable();
    t.add("");
    t.add(null);
    assert.equal(t.total, 0);
    assert.equal(t.toList().length, 0);
  });
});

describe("HalsteadMetrics", () => {
  it("computes basic and derived metrics", () => {
    const ops = new FrequencyTable();
    const ods = new FrequencyTable();
    ops.add(";"); ops.add(";"); ops.add("=");
    ods.add("x"); ods.add("x"); ods.add("1");
    const m = new HalsteadMetrics(ops, ods);
    assert.equal(m.eta1, 2);
    assert.equal(m.eta2, 2);
    assert.equal(m.N1, 3);
    assert.equal(m.N2, 3);
    assert.equal(m.eta, 4);
    assert.equal(m.N, 6);
    assert.equal(m.V, Math.round(6 * Math.log2(4)));
  });

  it("matches the PDF example volume rounding", () => {
    const ops = new FrequencyTable();
    const ods = new FrequencyTable();
    for (let i = 0; i < 14; i++) ops.add("op" + i);
    for (let i = 0; i < 7; i++) ods.add("od" + i);
    for (let i = 0; i < 33 - 14; i++) ops.add("op0");
    for (let i = 0; i < 28 - 7; i++) ods.add("od0");
    const m = new HalsteadMetrics(ops, ods);
    assert.equal(m.eta1, 14);
    assert.equal(m.eta2, 7);
    assert.equal(m.N1, 33);
    assert.equal(m.N2, 28);
    assert.equal(m.eta, 21);
    assert.equal(m.N, 61);
    assert.equal(m.V, 268);
  });

  it("returns zero volume for empty program", () => {
    const m = new HalsteadMetrics(new FrequencyTable(), new FrequencyTable());
    assert.equal(m.V, 0);
    assert.equal(m.eta, 0);
    assert.equal(m.N, 0);
  });
});
