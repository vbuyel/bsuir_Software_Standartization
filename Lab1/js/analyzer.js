import { HalsteadClassifier } from "./classifier.js";
import { CppLexer } from "./lexer.js";
import { HalsteadMetrics } from "./metrics.js";
import { matchPair, TokenStream } from "./stream.js";
import { LIB_FUNCS, NOT_FUNC } from "./vocabulary.js";

export class HalsteadAnalyzer {
  constructor(lexer = new CppLexer()) {
    this.lexer = lexer;
  }

  analyze(source) {
    const tokens = this.lexer.tokenize(this.lexer.clean(source));
    const funcs = this.findFunctions(tokens);
    const names = new Set(LIB_FUNCS);
    funcs.forEach((fn) => names.add(fn.name));
    const classifier = new HalsteadClassifier(names);
    funcs.forEach((fn) => classifier.classify(new TokenStream(fn.body)));
    return new HalsteadMetrics(classifier.ops, classifier.ods);
  }

  findFunctions(tokens) {
    const funcs = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type !== "id" || NOT_FUNC.has(t.value) || tokens[i + 1]?.value !== "(") continue;
      const close = matchPair(tokens, i + 1);
      if (close < 0 || tokens[close + 1]?.value !== "{") continue;
      const bodyEnd = matchPair(tokens, close + 1);
      if (bodyEnd < 0) continue;
      funcs.push({ name: t.value, body: tokens.slice(close + 1, bodyEnd + 1) });
      i = bodyEnd;
    }
    return funcs;
  }
}
