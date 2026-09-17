const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const triple = (item, i) =>
  item
    ? `<td>${i + 1}.</td><td class="token">${esc(item.name)}</td><td class="num">${item.count}</td>`
    : "<td></td><td></td><td></td>";

export class HalsteadView {
  constructor(tableEl, derivedEl) {
    this.tableEl = tableEl;
    this.derivedEl = derivedEl;
  }

  render(m) {
    const rows = Math.max(m.operators.length, m.operands.length);
    let body = "";
    for (let i = 0; i < rows; i++) {
      body += `<tr>${triple(m.operators[i], i)}${triple(m.operands[i], i)}</tr>`;
    }
    this.tableEl.innerHTML = `<table class="halstead">
      <thead><tr><th>j</th><th>Оператор</th><th>f<sub>1j</sub></th>
      <th>i</th><th>Операнд</th><th>f<sub>2i</sub></th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr>
        <td colspan="2">η<sub>1</sub> = ${m.eta1}</td><td class="num">N<sub>1</sub> = ${m.N1}</td>
        <td colspan="2">η<sub>2</sub> = ${m.eta2}</td><td class="num">N<sub>2</sub> = ${m.N2}</td>
      </tr></tfoot></table>`;
    this.derivedEl.innerHTML = [
      ["Словарь программы", `η = η<sub>1</sub> + η<sub>2</sub> = ${m.eta1} + ${m.eta2} = ${m.eta}`],
      ["Длина программы", `N = N<sub>1</sub> + N<sub>2</sub> = ${m.N1} + ${m.N2} = ${m.N}`],
      ["Объём программы", `V = N · log<sub>2</sub>(η) = ${m.N} · log<sub>2</sub>(${m.eta}) = ${m.V}`],
    ].map(([label, value]) => `<div class="metric"><span class="label">${label}</span><span class="value">${value}</span></div>`).join("");
  }
}
