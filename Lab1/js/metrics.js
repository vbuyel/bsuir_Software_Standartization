export class FrequencyTable {
  constructor() {
    this.map = new Map();
  }

  add(name) {
    if (name === "" || name == null) return;
    this.map.set(name, (this.map.get(name) || 0) + 1);
  }

  toList() {
    return [...this.map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  get total() {
    return [...this.map.values()].reduce((s, n) => s + n, 0);
  }
}

export class HalsteadMetrics {
  constructor(operators, operands) {
    this.operators = operators.toList();
    this.operands = operands.toList();
    this.eta1 = this.operators.length;
    this.eta2 = this.operands.length;
    this.N1 = operators.total;
    this.N2 = operands.total;
    this.eta = this.eta1 + this.eta2;
    this.N = this.N1 + this.N2;
    this.V = this.eta && this.N ? Math.round(this.N * Math.log2(this.eta)) : 0;
  }
}
