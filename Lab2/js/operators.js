/**
 * Count program operators N_op for relative Gilb complexity cl = CL / N_op.
 *
 * Classic language statements (not Halstead):
 *   +1: if / else if / for / while (not do-while trailer) / do / switch
 *   +1: each non-declaration statement ending in `;` (assigns, break, return, cout…)
 * Not counted: else, case, default (labels / no new statement), declarations,
 *              punctuation and brackets.
 */

const TYPE_WORDS = new Set(
  "int double float char bool void long short unsigned signed auto string wstring size_t wchar_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t vector map set list deque array const static volatile struct class enum typedef typename".split(
    /\s+/
  )
);

function skipParens(tokens, i) {
  if (i >= tokens.length || tokens[i].value !== "(") return i;
  let depth = 0;
  for (; i < tokens.length; i++) {
    const v = tokens[i].value;
    if (v === "(") depth++;
    else if (v === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return tokens.length;
}

function firstId(tokens, start, end) {
  for (let i = start; i < end; i++) {
    if (tokens[i].type === "id") return tokens[i].value;
  }
  return null;
}

function isDeclaration(tokens, start, end) {
  const id = firstId(tokens, start, end);
  return id !== null && TYPE_WORDS.has(id);
}

export function countOperators(tokens) {
  let n = 0;
  let stmtStart = 0;
  let pendingForParens = false;
  /** After `do`, the next `{` opens a do-body frame. */
  let pendingDoBody = false;
  /** @type {{ braceDepth: number, isDo: boolean }[]} */
  const frames = [];
  let braceDepth = 0;
  let expectDoWhile = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (pendingForParens && t.value === "(") {
      i = skipParens(tokens, i) - 1;
      pendingForParens = false;
      stmtStart = i + 1;
      continue;
    }

    if (t.value === "{") {
      if (pendingDoBody) {
        frames.push({ braceDepth, isDo: true });
        pendingDoBody = false;
      }
      braceDepth++;
      stmtStart = i + 1;
      continue;
    }

    if (t.value === "}") {
      braceDepth--;
      while (frames.length && frames[frames.length - 1].braceDepth === braceDepth) {
        const closed = frames.pop();
        if (closed.isDo) expectDoWhile = true;
      }
      stmtStart = i + 1;
      continue;
    }

    if (t.type === "id") {
      if (t.value === "for") {
        n++;
        pendingForParens = true;
        stmtStart = i + 1;
        continue;
      }

      if (t.value === "while") {
        if (expectDoWhile) {
          expectDoWhile = false;
          if (tokens[i + 1] && tokens[i + 1].value === "(") {
            i = skipParens(tokens, i + 1) - 1;
          }
          if (tokens[i + 1] && tokens[i + 1].value === ";") {
            i++;
            stmtStart = i + 1;
          }
          continue;
        }
        n++;
        stmtStart = i + 1;
        continue;
      }

      if (t.value === "if" || t.value === "switch") {
        n++;
        stmtStart = i + 1;
        continue;
      }

      if (t.value === "do") {
        n++;
        pendingDoBody = true;
        stmtStart = i + 1;
        continue;
      }

      // else, case, default — not separate N_op entries
      continue;
    }

    if (t.value === ";") {
      if (!isDeclaration(tokens, stmtStart, i)) n++;
      stmtStart = i + 1;
    }
  }

  return n;
}
