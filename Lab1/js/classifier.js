import { FrequencyTable } from "./metrics.js";
import {
  CLOSING_BRACKETS,
  KEYWORDS,
  LITERAL_CONSTS,
  PAIRS,
  STD_ENTITIES,
  TYPES,
} from "./vocabulary.js";

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
    for (let i = 0; i < len; i++) {
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
      } else if (KEYWORDS.has(t.value) || TYPES.has(t.value) || STD_ENTITIES.has(t.value)) {
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
