import { CLOSING_BRACKETS, OPERATOR_KEYWORDS } from "./vocabulary.js";

/**
 * Count program operators N_op for relative Gilb complexity cl = CL / N_op.
 * Operators: punctuation/ops from the lexer + control keywords; closing brackets
 * of pairs are skipped (pair counted by the opener).
 */
export function countOperators(tokens) {
  let n = 0;
  for (const t of tokens) {
    if (t.type === "op") {
      if (CLOSING_BRACKETS.has(t.value)) continue;
      n++;
      continue;
    }
    if (t.type === "id" && OPERATOR_KEYWORDS.has(t.value)) {
      n++;
    }
  }
  return n;
}
