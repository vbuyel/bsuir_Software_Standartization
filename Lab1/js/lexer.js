import { MULTI_OPS } from "./vocabulary.js";

class Cursor {
  constructor(s) {
    this.s = s;
    this.i = 0;
  }
  get done() { return this.i >= this.s.length; }
  get c() { return this.s[this.i]; }
  eat() { return this.s[this.i++]; }
  starts(t) { return this.s.startsWith(t, this.i); }
  takeWhile(re) {
    const a = this.i;
    while (!this.done && re.test(this.c)) this.i++;
    return this.s.slice(a, this.i);
  }
}

export class CppLexer {
  clean(src) {
    const sc = new Cursor(src);
    let out = "";
    let lineStart = true;

    const skipQuoted = (q) => {
      out += sc.eat();
      while (!sc.done && sc.c !== q) {
        if (sc.c === "\\") { out += sc.eat() + (sc.eat() || ""); continue; }
        out += sc.eat();
      }
      if (!sc.done) out += sc.eat();
    };

    while (!sc.done) {
      if (lineStart) {
        let k = sc.i;
        while (src[k] === " " || src[k] === "\t") k++;
        if (src[k] === "#") {
          while (k < src.length && src[k] !== "\n") k++;
          out += "\n";
          sc.i = k + (src[k] === "\n" ? 1 : 0);
          lineStart = true;
          continue;
        }
      }
      if (sc.starts("//")) { while (!sc.done && sc.c !== "\n") sc.i++; continue; }
      if (sc.starts("/*")) {
        sc.i += 2;
        while (!sc.done && !sc.starts("*/")) { if (sc.c === "\n") out += "\n"; sc.i++; }
        sc.i += 2;
        continue;
      }
      if (sc.c === '"' || sc.c === "'") { skipQuoted(sc.c); lineStart = false; continue; }
      if (sc.c === "\n") lineStart = true;
      else if (sc.c !== " " && sc.c !== "\t") lineStart = false;
      out += sc.eat();
    }
    return out;
  }

  tokenize(src) {
    const sc = new Cursor(src);
    const tokens = [];
    const push = (type, value, extra) => tokens.push(Object.assign({ type, value }, extra));

    while (!sc.done) {
      if (/\s/.test(sc.c)) { sc.i++; continue; }
      if (/[A-Za-z_]/.test(sc.c)) { push("id", sc.takeWhile(/[A-Za-z0-9_]/)); continue; }
      if (/\d/.test(sc.c) || (sc.c === "." && /\d/.test(src[sc.i + 1]))) {
        let v = sc.takeWhile(/\d/);
        if (sc.c === ".") { v += sc.eat() + sc.takeWhile(/\d/); }
        if (sc.c === "e" || sc.c === "E") {
          v += sc.eat();
          if (sc.c === "+" || sc.c === "-") v += sc.eat();
          v += sc.takeWhile(/\d/);
        }
        push("number", v);
        continue;
      }
      if (sc.c === '"' || sc.c === "'") {
        const q = sc.eat();
        let content = "";
        while (!sc.done && sc.c !== q) {
          if (sc.c === "\\") { content += sc.eat() + (sc.eat() || ""); continue; }
          content += sc.eat();
        }
        sc.i++;
        push(q === '"' ? "string" : "char", content, { quote: q });
        continue;
      }
      const op = MULTI_OPS.find((o) => sc.starts(o));
      if (op) { push("op", op); sc.i += op.length; continue; }
      push("op", sc.eat());
    }
    return tokens;
  }
}
