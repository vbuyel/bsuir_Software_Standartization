import { CLOSES } from "./vocabulary.js";

export function matchPair(tokens, openIndex, limit = tokens.length) {
  const close = CLOSES[tokens[openIndex]?.value];
  if (!close) return -1;
  const open = tokens[openIndex].value;
  let depth = 0;
  for (let i = openIndex; i < limit; i++) {
    if (tokens[i].value === open) depth++;
    else if (tokens[i].value === close && --depth === 0) return i;
  }
  return -1;
}

export class TokenStream {
  constructor(tokens, start = 0, end = tokens.length) {
    this.tokens = tokens;
    this.i = start;
    this.end = end;
  }

  get peek() {
    return this.i < this.end ? this.tokens[this.i] : null;
  }

  at(d = 1) {
    const j = this.i + d;
    return j < this.end ? this.tokens[j] : null;
  }

  take() {
    return this.peek ? this.tokens[this.i++] : null;
  }

  child(from, to) {
    return new TokenStream(this.tokens, from, to);
  }

  pairEnd() {
    return matchPair(this.tokens, this.i, this.end);
  }

  takePair(visit) {
    const m = this.pairEnd();
    if (m < 0) {
      this.take();
      return;
    }
    visit(this.child(this.i + 1, m));
    this.i = m + 1;
  }
}
