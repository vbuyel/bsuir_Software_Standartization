export class HalsteadApp {
  constructor(analyzer, view, sourceEl, buttonEl) {
    this.analyzer = analyzer;
    this.view = view;
    this.sourceEl = sourceEl;
    this.buttonEl = buttonEl;
  }

  async start() {
    this.buttonEl.addEventListener("click", () => this.run());
    try {
      const res = await fetch("sample.cpp");
      if (res.ok) {
        const text = await res.text();
        if (text.trim()) this.sourceEl.value = text;
      }
    } catch (_) { /* file:// or missing sample — keep textarea as is */ }
    this.run();
  }

  run() {
    this.view.render(this.analyzer.analyze(this.sourceEl.value));
  }
}
