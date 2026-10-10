import { analyzeControlFlow } from "./controlFlow.js";
import { computeGilb } from "./gilb.js";
import { CppLexer } from "./lexer.js";
import { countOperators } from "./operators.js";

export class GilbAnalyzer {
  constructor(lexer = new CppLexer()) {
    this.lexer = lexer;
  }

  analyze(source) {
    const cleaned = this.lexer.clean(source);
    const tokens = this.lexer.tokenize(cleaned);
    const flow = analyzeControlFlow(tokens);
    const Nop = countOperators(tokens);
    return computeGilb(flow, Nop);
  }
}
