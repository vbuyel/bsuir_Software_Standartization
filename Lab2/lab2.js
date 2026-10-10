import { GilbAnalyzer } from "./js/analyzer.js";
import { GilbApp } from "./js/app.js";
import { GilbView } from "./js/view.js";

const app = new GilbApp(
  new GilbAnalyzer(),
  new GilbView(document.getElementById("metrics"), document.getElementById("table-wrap")),
  document.getElementById("source"),
  document.getElementById("analyze-btn")
);

app.start();
