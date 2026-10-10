/**
 * Walk C++ tokens, collect conditional constructs and nesting depths.
 *
 * Nesting: a construct's depth = number of enclosing conditionals
 * (if / else if / for / while / do / switch). Teacher example:
 * for { if } → if.depth === 1.
 *
 * CL contributors: if, else if, for, while (not do-while trailer), do, case.
 * Not CL: else, default, switch keyword.
 */

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

function isElseIf(tokens, ifIndex) {
  for (let j = ifIndex - 1; j >= 0; j--) {
    const t = tokens[j];
    if (t.type === "id" && t.value === "else") return true;
    return false;
  }
  return false;
}

export function analyzeControlFlow(tokens) {
  const constructs = [];
  let nestDepth = 0;
  let maxNesting = 0;
  /** @type {{ kind: string, braceDepth: number, single?: boolean }[]} */
  const frameStack = [];
  let braceDepth = 0;
  let expectDoWhile = false;
  /** @type {{ kind: string } | null} */
  let pendingBody = null;

  const note = (kind, countsForCL) => {
    maxNesting = Math.max(maxNesting, nestDepth);
    constructs.push({ kind, depth: nestDepth, countsForCL });
  };

  const openBody = (kind, single) => {
    nestDepth++;
    frameStack.push({ kind, braceDepth, single: !!single });
  };

  const closeFramesAtBrace = () => {
    while (frameStack.length && frameStack[frameStack.length - 1].braceDepth === braceDepth
      && !frameStack[frameStack.length - 1].single) {
      const closed = frameStack.pop();
      nestDepth--;
      if (closed.kind === "do") expectDoWhile = true;
    }
  };

  const closeSingleAtSemicolon = () => {
    while (frameStack.length && frameStack[frameStack.length - 1].single
      && frameStack[frameStack.length - 1].braceDepth === braceDepth) {
      const closed = frameStack.pop();
      nestDepth--;
      if (closed.kind === "do") expectDoWhile = true;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (pendingBody) {
      if (t.value === "(") {
        i = skipParens(tokens, i) - 1;
        continue;
      }
      if (t.value === "{") {
        openBody(pendingBody.kind, false);
        braceDepth++;
        pendingBody = null;
        continue;
      }
      // Single-statement body starts here
      openBody(pendingBody.kind, true);
      pendingBody = null;
      // fall through
    }

    if (t.value === "{") {
      braceDepth++;
      continue;
    }

    if (t.value === "}") {
      braceDepth--;
      closeFramesAtBrace();
      continue;
    }

    if (t.value === ";") {
      closeSingleAtSemicolon();
      continue;
    }

    if (t.type !== "id") continue;

    if (t.value === "if") {
      const kind = isElseIf(tokens, i) ? "else if" : "if";
      note(kind, true);
      pendingBody = { kind };
      continue;
    }

    if (t.value === "else") {
      const next = tokens[i + 1];
      if (next && next.type === "id" && next.value === "if") continue;
      note("else", false);
      pendingBody = { kind: "else" };
      continue;
    }

    if (t.value === "for") {
      note("for", true);
      pendingBody = { kind: "for" };
      continue;
    }

    if (t.value === "while") {
      if (expectDoWhile) {
        expectDoWhile = false;
        if (tokens[i + 1] && tokens[i + 1].value === "(") {
          i = skipParens(tokens, i + 1) - 1;
        }
        continue;
      }
      note("while", true);
      pendingBody = { kind: "while" };
      continue;
    }

    if (t.value === "do") {
      note("do", true);
      pendingBody = { kind: "do" };
      continue;
    }

    if (t.value === "switch") {
      note("switch", false);
      pendingBody = { kind: "switch" };
      continue;
    }

    if (t.value === "case") {
      note("case", true);
      continue;
    }

    if (t.value === "default") {
      note("default", false);
      continue;
    }
  }

  const CL = constructs.filter((c) => c.countsForCL).length;
  return { constructs, CL, CLI: maxNesting };
}
