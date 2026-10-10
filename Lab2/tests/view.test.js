import assert from "node:assert/strict";
import { test } from "node:test";
import { GilbMetrics } from "../js/gilb.js";
import { GilbView } from "../js/view.js";

test("view renders CL, cl, CLI", () => {
  const metricsEl = { innerHTML: "" };
  const tableEl = { innerHTML: "" };
  const view = new GilbView(metricsEl, tableEl);
  view.render(new GilbMetrics(2, 10, 1, [
    { kind: "for", depth: 0, countsForCL: true },
    { kind: "if", depth: 1, countsForCL: true },
  ]));
  assert.match(metricsEl.innerHTML, /CL = 2/);
  assert.match(metricsEl.innerHTML, /CLI = 1/);
  assert.match(metricsEl.innerHTML, /10/);
  assert.match(tableEl.innerHTML, /for/);
  assert.match(tableEl.innerHTML, /if/);
});
