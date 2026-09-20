import { HalsteadClassifier } from "./classifier.js";
import { CppLexer } from "./lexer.js";
import { HalsteadMetrics } from "./metrics.js";
import { KEYWORDS, LITERAL_CONSTS, STD_ENTITIES, TYPES } from "./vocabulary.js";

export class HalsteadAnalyzer {
  constructor(lexer = new CppLexer()) {
    this.lexer = lexer;
  }

  analyze(source) {
    const cleaned = this.lexer.clean(source);
    const tokens = this.lexer.tokenize(cleaned);
    const functionNames = this.findFunctionNames(tokens);
    const classifier = new HalsteadClassifier(functionNames);
    classifier.classify(tokens);
    return new HalsteadMetrics(classifier.ops, classifier.ods);
  }

  findFunctionNames(tokens) {
    const names = new Set(STD_ENTITIES);
    for (let i = 0; i < tokens.length - 1; i++) {
      const t = tokens[i];
      const next = tokens[i + 1];
      if (
        t.type === "id" &&
        next.value === "(" &&
        !KEYWORDS.has(t.value) &&
        !TYPES.has(t.value) &&
        !LITERAL_CONSTS.has(t.value)
      ) {
        names.add(t.value);
      }
    }
    return names;
  }
}
