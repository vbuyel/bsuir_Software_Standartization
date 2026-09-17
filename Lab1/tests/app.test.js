import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HalsteadApp } from "../js/app.js";

function fakeEl(value = "") {
  const listeners = new Map();
  return {
    value,
    innerHTML: "",
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    click() {
      listeners.get("click")?.();
    },
  };
}

describe("HalsteadApp button", () => {
  it("recalculates metrics when Рассчитать метрики is clicked", async () => {
    const calls = [];
    const source = fakeEl("int main() { return 0; }");
    const button = fakeEl();
    const view = { render(result) { calls.push(result); } };
    const analyzer = {
      analyze(src) {
        return { source: src, eta1: src.includes("+") ? 2 : 1 };
      },
    };

    const app = new HalsteadApp(analyzer, view, source, button);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false });
    try {
      await app.start();
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(calls.length, 1);
    assert.equal(calls[0].eta1, 1);

    source.value = "int main() { x = 1 + 2; return 0; }";
    button.click();

    assert.equal(calls.length, 2);
    assert.equal(calls[1].eta1, 2);
    assert.match(calls[1].source, /\+/);
  });

  it("loads sample.cpp into the textarea on start", async () => {
    const source = fakeEl("");
    const button = fakeEl();
    const view = { render() {} };
    const analyzer = { analyze: () => ({}) };
    const app = new HalsteadApp(analyzer, view, source, button);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "int main() { return 1; }",
    });
    try {
      await app.start();
    } finally {
      globalThis.fetch = originalFetch;
    }
    assert.equal(source.value, "int main() { return 1; }");
  });
});
