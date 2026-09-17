import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HalsteadView } from "../js/view.js";
import { FrequencyTable, HalsteadMetrics } from "../js/metrics.js";

describe("HalsteadView", () => {
  it("renders the six basic metrics and three derived ones", () => {
    const ops = new FrequencyTable();
    const ods = new FrequencyTable();
    ops.add(";");
    ods.add("x");
    const tableEl = { innerHTML: "" };
    const derivedEl = { innerHTML: "" };
    new HalsteadView(tableEl, derivedEl).render(new HalsteadMetrics(ops, ods));
    assert.match(tableEl.innerHTML, /Оператор/);
    assert.match(tableEl.innerHTML, /Операнд/);
    assert.match(tableEl.innerHTML, /η<sub>1<\/sub> = 1/);
    assert.match(tableEl.innerHTML, /N<sub>1<\/sub> = 1/);
    assert.match(derivedEl.innerHTML, /Словарь программы/);
    assert.match(derivedEl.innerHTML, /Длина программы/);
    assert.match(derivedEl.innerHTML, /Объём программы/);
  });

  it("escapes HTML in token names", () => {
    const ops = new FrequencyTable();
    ops.add("<script>");
    const tableEl = { innerHTML: "" };
    const derivedEl = { innerHTML: "" };
    new HalsteadView(tableEl, derivedEl).render(
      new HalsteadMetrics(ops, new FrequencyTable())
    );
    assert.match(tableEl.innerHTML, /&lt;script&gt;/);
    assert.doesNotMatch(tableEl.innerHTML, /<script>/);
  });
});
