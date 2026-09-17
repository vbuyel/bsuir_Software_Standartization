import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchPair, TokenStream } from "../js/stream.js";

describe("matchPair", () => {
  it("finds matching parentheses with nesting", () => {
    const tokens = ["(", "(", "x", ")", ")"].map((value) => ({ value }));
    assert.equal(matchPair(tokens, 0), 4);
    assert.equal(matchPair(tokens, 1), 3);
  });

  it("returns -1 when the pair is not closed", () => {
    const tokens = ["(", "x"].map((value) => ({ value }));
    assert.equal(matchPair(tokens, 0), -1);
  });
});

describe("TokenStream", () => {
  it("walks tokens with peek, at and take", () => {
    const s = new TokenStream([
      { type: "id", value: "x" },
      { type: "op", value: "=" },
      { type: "number", value: "1" },
    ]);
    assert.equal(s.peek.value, "x");
    assert.equal(s.at().value, "=");
    assert.equal(s.take().value, "x");
    assert.equal(s.peek.value, "=");
  });

  it("visits the inside of a pair and skips the closer", () => {
    const s = new TokenStream(["(", "a", ",", "b", ")"].map((value) => ({ value })));
    const inner = [];
    s.takePair((child) => {
      while (child.peek) inner.push(child.take().value);
    });
    assert.deepEqual(inner, ["a", ",", "b"]);
    assert.equal(s.peek, null);
  });
});
