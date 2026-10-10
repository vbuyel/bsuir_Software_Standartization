const set = (s) => new Set(s.trim().split(/\s+/));

/** Keywords that count as operators in N_op. */
export const OPERATOR_KEYWORDS = set(
  "if else while do for switch case default break continue return goto"
);

export const MULTI_OPS = [
  ">>=", "<<=", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>", "++", "--",
  "->", "::", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
];

export const CLOSING_BRACKETS = new Set([")", "}", "]"]);
