import { HalsteadAnalyzer } from "./js/analyzer.js";
import { HalsteadApp } from "./js/app.js";
import { CppLexer } from "./js/lexer.js";
import { HalsteadView } from "./js/view.js";

const app = new HalsteadApp(
  new HalsteadAnalyzer(new CppLexer()),
  new HalsteadView(document.getElementById("table-wrap"), document.getElementById("derived")),
  document.getElementById("source"),
  document.getElementById("analyze-btn")
);

app.start();
