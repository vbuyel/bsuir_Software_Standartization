import { FrequencyTable } from "./metrics.js";
import {
  PAIRS, STD_TYPES, STREAMS, TYPES,
} from "./vocabulary.js";

export class HalsteadClassifier {
  constructor(functionNames) {
    this.names = functionNames;
    this.ops = new FrequencyTable();
    this.ods = new FrequencyTable();
    this.doOpen = 0;
    this.kw = {
      if: (s) => this.header("if...else", s),
      else: (s) => { s.take(); return true; },
      do: (s) => { this.doOpen++; this.ops.add("do...while"); s.take(); return true; },
      while: (s) => this.whileStmt(s),
      for: (s) => this.header("for", s),
      switch: (s) => this.header("switch...case...default", s),
      case: (s) => this.caseStmt(s),
      default: (s) => { s.take(); if (s.peek?.value === ":") s.take(); return true; },
      break: (s) => this.bare("break", s),
      continue: (s) => this.bare("continue", s),
      return: (s) => this.bare("return", s),
      sizeof: (s) => this.bare("sizeof", s),
      goto: (s) => {
        this.ops.add("goto");
        s.take();
        if (s.peek?.type === "id") s.take();
        return false;
      },
    };
  }

  classify(stream) {
    let stmt = true;
    while (stream.peek) stmt = this.step(stream, stmt);
  }

  step(s, stmt) {
    const t = s.peek;
    if (stmt && this.isDecl(s)) {
      while (s.peek && s.peek.value !== ";") s.take();
      if (s.peek?.value === ";") s.take();
      return true;
    }
    if (stmt && t.type === "id" && s.at()?.value === ":" && t.value !== "case" && t.value !== "default") {
      s.take(); s.take();
      return true;
    }
    if (t.type === "number") { this.ods.add(s.take().value); return false; }
    if (t.type === "string" || t.type === "char") {
      const lit = s.take();
      this.ops.add(lit.type === "string" ? '""' : "''");
      if (lit.value) this.ods.add(lit.type === "string" ? `"${lit.value}"` : `'${lit.value}'`);
      return false;
    }
    if (t.type === "id") {
      const kw = this.kw[t.value];
      if (kw) return kw(s);
      return this.name(s);
    }
    if (PAIRS[t.value]) {
      this.ops.add(PAIRS[t.value]);
      const open = t.value;
      s.takePair((inner) => this.classify(inner));
      return open === "{";
    }
    if (t.value === "}" || t.value === ")" || t.value === "]") {
      const close = s.take().value;
      return close === "}";
    }
    if (t.value === ";") { this.ops.add(";"); s.take(); return true; }
    if (t.value === ",") { this.ops.add(","); s.take(); return false; }
    if (t.value === "?") { this.ops.add("?:"); s.take(); return false; }
    this.ops.add(s.take().value);
    return false;
  }

  isDecl(s) {
    const t = s.peek;
    if (t?.type !== "id") return false;
    if (t.value === "std" && s.at()?.value === "::") return STD_TYPES.has(s.at(2)?.value);
    return TYPES.has(t.value);
  }

  header(op, s) {
    this.ops.add(op);
    s.take();
    if (s.peek?.value === "(") s.takePair((inner) => this.classify(inner));
    return true;
  }

  bare(op, s) {
    this.ops.add(op);
    s.take();
    return false;
  }

  whileStmt(s) {
    const paren = s.i + 1;
    if (s.at()?.value === "(") {
      s.take();
      s.i = paren;
      const close = s.pairEnd();
      const doTail = this.doOpen > 0 && s.tokens[close + 1]?.value === ";" && close + 1 < s.end;
      if (doTail) {
        this.doOpen--;
        this.classify(s.child(paren + 1, close));
        s.i = close + 1;
        return true;
      }
      this.ops.add("while");
      this.classify(s.child(paren + 1, close));
      s.i = close + 1;
      return true;
    }
    this.ops.add("while");
    s.take();
    return true;
  }

  caseStmt(s) {
    s.take();
    const n = s.peek;
    if (n && (n.type === "number" || n.type === "id" || n.type === "char")) {
      if (n.type === "char") { this.ops.add("''"); this.ods.add(n.value); }
      else this.ods.add(n.value);
      s.take();
    }
    if (s.peek?.value === ":") s.take();
    return true;
  }

  name(s) {
    const parts = [s.take().value];
    while (s.peek && ["::", ".", "->"].includes(s.peek.value) && s.at()?.type === "id") {
      parts.push(s.take().value, s.take().value);
    }
    const text = parts.join("");
    const last = parts[parts.length - 1];
    const call = s.peek?.value === "(";
    const asOp = call || parts.length > 1 || STREAMS.has(last) || this.names.has(last);
    if (call) {
      this.ops.add(text + " ( )");
      s.takePair((inner) => this.classify(inner));
      return false;
    }
    (asOp ? this.ops : this.ods).add(text);
    return false;
  }
}
