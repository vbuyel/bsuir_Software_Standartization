import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CppLexer } from "../js/lexer.js";

const lexer = new CppLexer();

describe("CppLexer.clean", () => {
  it("strips line and block comments", () => {
    const out = lexer.clean("a // hide\nb /* hide */ c");
    assert.match(out, /a/);
    assert.match(out, /b/);
    assert.match(out, /c/);
    assert.doesNotMatch(out, /hide/);
  });

  it("drops preprocessor lines", () => {
    const out = lexer.clean("#include <iostream>\nint x;");
    assert.doesNotMatch(out, /iostream/);
    assert.match(out, /int x;/);
  });

  it("keeps string contents that look like comments", () => {
    const out = lexer.clean('s = "// not comment";');
    assert.match(out, /\/\/ not comment/);
  });
});

describe("CppLexer.tokenize", () => {
  it("recognizes identifiers, numbers and multi-char operators", () => {
    const tokens = lexer.tokenize("n <= 3 && x == 0.1");
    assert.deepEqual(
      tokens.map((t) => t.value),
      ["n", "<=", "3", "&&", "x", "==", "0.1"]
    );
  });

  it("keeps string content without quotes", () => {
    const tokens = lexer.tokenize('cout << "hello";');
    const str = tokens.find((t) => t.type === "string");
    assert.equal(str.value, "hello");
    assert.equal(str.quote, '"');
  });

  it("tokenizes :: and << as single operators", () => {
    const values = lexer.tokenize("std::cout << x").map((t) => t.value);
    assert.deepEqual(values, ["std", "::", "cout", "<<", "x"]);
  });
});
