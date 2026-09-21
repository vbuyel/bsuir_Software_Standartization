import { FrequencyTable } from "./metrics.js";
import { matchPair } from "./stream.js";
import {
  CLOSING_BRACKETS,
  KEYWORDS,
  LITERAL_CONSTS,
  PAIRS,
  STD_ENTITIES,
  TYPES,
} from "./vocabulary.js";

function findStmtEnd(tokens, startIdx, limit = tokens.length) {
  if (startIdx >= limit) return limit;
  const t = tokens[startIdx];
  if (t.value === "{") {
    const end = matchPair(tokens, startIdx, limit);
    return end !== -1 ? end + 1 : limit;
  }
  let depth = 0;
  for (let i = startIdx; i < limit; i++) {
    const val = tokens[i].value;
    if (val === "(" || val === "{" || val === "[") {
      depth++;
    } else if (val === ")" || val === "}" || val === "]") {
      if (depth > 0) depth--;
    } else if (val === ";" && depth === 0) {
      return i + 1;
    }
  }
  return limit;
}

export class HalsteadClassifier {
  constructor(functionNames = new Set()) {
    this.functionNames = functionNames;
    this.ops = new FrequencyTable();
    this.ods = new FrequencyTable();
  }

  classify(input) {
    let list;
    if (Array.isArray(input)) {
      list = input;
    } else if (input && input.tokens) {
      const start = input.i !== undefined ? input.i : 0;
      const end = input.end !== undefined ? input.end : input.tokens.length;
      list = input.tokens.slice(start, end);
    } else {
      list = [];
    }

    const len = list.length;
    const skipTokens = new Set();
    const compositeOps = new Map();

    // Предварительный поиск составных операторов (if...else, do...while, try...catch)
    for (let i = 0; i < len; i++) {
      const t = list[i];
      if (t.value === "if") {
        let condClose = -1;
        if (list[i + 1]?.value === "(") {
          condClose = matchPair(list, i + 1, len);
        }
        if (condClose !== -1) {
          const thenEnd = findStmtEnd(list, condClose + 1, len);
          if (list[thenEnd]?.value === "else") {
            skipTokens.add(thenEnd);
            compositeOps.set(i, "if...else");
          }
        }
      } else if (t.value === "do") {
        const bodyEnd = findStmtEnd(list, i + 1, len);
        if (list[bodyEnd]?.value === "while") {
          skipTokens.add(bodyEnd);
          compositeOps.set(i, "do...while");
        }
      } else if (t.value === "try") {
        const bodyEnd = findStmtEnd(list, i + 1, len);
        if (list[bodyEnd]?.value === "catch") {
          skipTokens.add(bodyEnd);
          compositeOps.set(i, "try...catch");
        }
      }
    }

    for (let i = 0; i < len; i++) {
      if (skipTokens.has(i)) continue;

      const t = list[i];
      const prev = i > 0 ? list[i - 1] : null;
      const next = i < len - 1 ? list[i + 1] : null;

      if (t.type === "number") {
        this.ods.add(t.value);
      } else if (t.type === "string") {
        this.ods.add(`"${t.value}"`);
      } else if (t.type === "char") {
        this.ods.add(`'${t.value}'`);
      } else if (t.value === "(") {
        // Если круглые скобки стоят после имени функции, пропускаем их (не считаем за оператор)
        const isAfterFunc =
          prev &&
          prev.type === "id" &&
          (this.functionNames.has(prev.value) ||
            (!KEYWORDS.has(prev.value) &&
              !TYPES.has(prev.value) &&
              !LITERAL_CONSTS.has(prev.value)));
        if (!isAfterFunc) {
          this.ops.add("( )");
        }
      } else if (PAIRS[t.value]) {
        this.ops.add(PAIRS[t.value]);
      } else if (CLOSING_BRACKETS.has(t.value)) {
        // Закрывающая скобка не дублирует учёт пары
        continue;
      } else if (LITERAL_CONSTS.has(t.value)) {
        this.ods.add(t.value);
      } else if (TYPES.has(t.value)) {
        // Типы данных относятся к операндам
        this.ods.add(t.value);
      } else if (compositeOps.has(i)) {
        this.ops.add(compositeOps.get(i));
      } else if (KEYWORDS.has(t.value) || STD_ENTITIES.has(t.value)) {
        this.ops.add(t.value);
      } else if (t.type === "id") {
        if (prev && ["namespace", "class", "struct", "enum", "using"].includes(prev.value)) {
          this.ops.add(t.value);
        } else if (this.functionNames.has(t.value) || next?.value === "(") {
          this.ops.add(t.value);
        } else {
          this.ods.add(t.value);
        }
      } else {
        this.ops.add(t.value);
      }
    }
  }
}
