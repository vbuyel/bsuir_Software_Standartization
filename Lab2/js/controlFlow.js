/**
 * Walk C++ tokens, collect conditional constructs and nesting depths.
 *
 * Nesting: a construct's depth = number of enclosing conditionals
 * (if / else if / for / while / do). Teacher example: for { if } → if.depth === 1.
 *
 * switch does not bump nestDepth. Each case is IF-equivalent:
 * depth = switchBase + caseIndex (0-based), so n arms with default → CLI = n-2.
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
  /** @type {{ kind: string, braceDepth: number, single?: boolean, isSwitch?: boolean, switchBase?: number, caseIndex?: number }[]} */
  const frameStack = [];
  let braceDepth = 0;
  let expectDoWhile = false;
  /** @type {{ kind: string } | null} */
  let pendingBody = null;

  const noteAt = (kind, depth, countsForCL) => {
    if (countsForCL) maxNesting = Math.max(maxNesting, depth);
    constructs.push({ kind, depth, countsForCL });
  };

  const note = (kind, countsForCL) => {
    noteAt(kind, nestDepth, countsForCL);
  };

  const currentSwitch = () => {
    for (let i = frameStack.length - 1; i >= 0; i--) {
      if (frameStack[i].isSwitch) return frameStack[i];
    }
    return null;
  };

  const openBody = (kind, single) => {
    if (kind === "switch") {
      frameStack.push({
        kind,
        braceDepth,
        single: !!single,
        isSwitch: true,
        switchBase: nestDepth,
        caseIndex: 0,
      });
      return;
    }
    nestDepth++;
    frameStack.push({ kind, braceDepth, single: !!single });
  };

  const closeFrame = (closed) => {
    if (closed.isSwitch) nestDepth = closed.switchBase;
    else nestDepth--;
    if (closed.kind === "do") expectDoWhile = true;
  };

  const closeFramesAtBrace = () => {
    while (
      frameStack.length &&
      frameStack[frameStack.length - 1].braceDepth === braceDepth &&
      !frameStack[frameStack.length - 1].single
    ) {
      closeFrame(frameStack.pop());
    }
  };

  const closeSingleAtSemicolon = () => {
    while (
      frameStack.length &&
      frameStack[frameStack.length - 1].single &&
      frameStack[frameStack.length - 1].braceDepth === braceDepth
    ) {
      closeFrame(frameStack.pop());
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
      openBody(pendingBody.kind, true);
      pendingBody = null;
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
      const sw = currentSwitch();
      if (sw) {
        const depth = sw.switchBase + sw.caseIndex;
        noteAt("case", depth, true);
        sw.caseIndex++;
        nestDepth = depth + 1;
      } else {
        note("case", true);
      }
      continue;
    }

    if (t.value === "default") {
      const sw = currentSwitch();
      const depth = sw
        ? sw.switchBase + Math.max(0, sw.caseIndex - 1)
        : nestDepth;
      // default has no predicate — record but do not raise CLI
      constructs.push({ kind: "default", depth, countsForCL: false });
      if (sw) nestDepth = depth + 1;
      continue;
    }
  }

  const CL = constructs.filter((c) => c.countsForCL).length;
  return { constructs, CL, CLI: maxNesting };
}
