const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtCl = (cl) => {
  if (!Number.isFinite(cl)) return "—";
  const s = cl.toFixed(6).replace(/\.?0+$/, "");
  return s;
};

export class GilbView {
  constructor(metricsEl, tableEl) {
    this.metricsEl = metricsEl;
    this.tableEl = tableEl;
  }

  render(m) {
    this.metricsEl.innerHTML = [
      ["Абсолютная сложность", `CL = ${m.CL}`],
      ["Относительная сложность", `cl = CL / N<sub>op</sub> = ${m.CL} / ${m.Nop} ≈ ${fmtCl(m.cl)}`],
      ["Максимальный уровень вложенности", `CLI = ${m.CLI}`],
    ].map(([label, value]) =>
      `<div class="metric"><span class="label">${label}</span><span class="value">${value}</span></div>`
    ).join("");

    const rows = m.constructs.map((c, i) => {
      const mark = c.countsForCL ? "да" : "нет";
      return `<tr>
        <td>${i + 1}</td>
        <td class="token">${esc(c.kind)}</td>
        <td class="num">${c.depth}</td>
        <td>${mark}</td>
      </tr>`;
    }).join("");

    this.tableEl.innerHTML = `<table class="gilb">
      <thead><tr>
        <th>#</th><th>Конструкция</th><th>Глубина</th><th>Учитывается в CL</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4">Нет условных конструкций</td></tr>`}</tbody>
    </table>`;
  }
}
