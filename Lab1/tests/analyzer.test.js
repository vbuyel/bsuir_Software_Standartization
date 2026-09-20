import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { HalsteadAnalyzer } from "../js/analyzer.js";

const analyzer = new HalsteadAnalyzer();
const names = (list) => list.map((item) => item.name);
const countOf = (list, name) => list.find((item) => item.name === name)?.count ?? 0;

describe("HalsteadAnalyzer classification", () => {
  it("puts function names and parentheses in operators separately", () => {
    const m = analyzer.analyze(`
      double nextTerm(double vs) { return vs; }
      int main() {
        double vs;
        vs = nextTerm(vs);
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("nextTerm"));
    assert.ok(names(m.operators).includes("( )"));
    assert.ok(!names(m.operators).includes("nextTerm ( )"));
    assert.ok(!names(m.operands).some((n) => /nextTerm|main/.test(n)));
  });

  it("treats std::cout as std + :: + cout operators", () => {
    const m = analyzer.analyze(`
      int main() {
        std::cout << "hi" << std::endl;
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("std"));
    assert.ok(names(m.operators).includes("::"));
    assert.ok(names(m.operators).includes("cout"));
    assert.ok(names(m.operators).includes("endl"));
    assert.ok(!names(m.operands).includes("cout"));
    assert.ok(!names(m.operands).includes("std"));
  });

  it("records quoted text as operand and does not create synthetic quotes operator", () => {
    const m = analyzer.analyze(`
      int main() {
        string msg;
        msg = "ready";
        return 0;
      }
    `);
    assert.equal(countOf(m.operators, '""'), 0);
    assert.ok(names(m.operands).includes('"ready"'));
  });

  it("counts types as operators and declared variables as operands", () => {
    const m = analyzer.analyze(`
      int main() {
        int n;
        double eps;
        n = 1;
        return 0;
      }
    `);
    assert.ok(names(m.operators).includes("int"));
    assert.ok(names(m.operators).includes("double"));
    assert.ok(names(m.operands).includes("eps"));
    assert.ok(names(m.operands).includes("n"));
    assert.equal(countOf(m.operators, ";"), 4);
  });

  it("counts if and else as separate operators", () => {
    const m = analyzer.analyze(`
      int absValue(int v) {
        if (v < 0) { v = -v; } else { v = v; }
        return v;
      }
    `);
    assert.equal(countOf(m.operators, "if"), 1);
    assert.equal(countOf(m.operators, "else"), 1);
    assert.equal(countOf(m.operators, "if...else"), 0);
  });

  it("keeps N1 and N2 equal to the sums of frequencies", () => {
    const m = analyzer.analyze(`
      int main() {
        int x;
        x = 1 + 2;
        return x;
      }
    `);
    const sumOps = m.operators.reduce((s, i) => s + i.count, 0);
    const sumOds = m.operands.reduce((s, i) => s + i.count, 0);
    assert.equal(m.N1, sumOps);
    assert.equal(m.N2, sumOds);
  });
});

describe("HalsteadAnalyzer on reference C# example", () => {
  it("matches the teacher reference example exactly", () => {
    const csCode = `using System;

namespace SinCalculator
{
    class Program
    {
        static double CalculateSin(double x, double eps)
        {
            double y = x;
            double vs = x;
            int n = 2;

            while (Math.Abs(vs) >= eps)
            {
                vs = -vs * x * x / ((2 * n - 1) * (2 * n 
 				- 2));
                y = y + vs;
                n = n + 1;
            }

            return y;
        }

        static double CalculateCos(double x, double eps)
        {
            double y = 1.0;
            double vs = 1.0;
            int n = 1;

            while (Math.Abs(vs) >= eps)
            {
                vs = -vs * x * x / ((2 * n) * (2 * n - 
			1));
                y = y + vs;
                n = n + 1;
            }

            return y;
        }

        static void PrintResult(double x, double y, 
		double eps)
        {
            Console.WriteLine("x = " + x);
            Console.WriteLine("y = " + y);
            Console.WriteLine("eps = " + eps);
        }

        static void Main(string[] args)
        {
            Console.Write("Введите x: ");
            double x = double.Parse(Console.ReadLine());

            Console.Write("Введите eps: ");
            double eps = 
					double.Parse(Console.ReadLine());

            Console.Write("Выберите функцию (1 - sin, 2 - 
			cos): ");
            int choice = int.Parse(Console.ReadLine());

            double result;

            if (choice == 1)
            {
                result = CalculateSin(x, eps);
            }
            else
            {
                result = CalculateCos(x, eps);
            }

            PrintResult(x, result, eps);
            Console.ReadKey();
        }
    }
}`;
    const m = analyzer.analyze(csCode);
    assert.equal(m.eta1, 40);
    assert.equal(m.N1, 213);
    assert.equal(m.eta2, 17);
    assert.equal(m.N2, 81);
    assert.equal(m.eta, 57);
    assert.equal(m.N, 294);
    assert.equal(m.V, 1714.9);
  });
});

describe("HalsteadAnalyzer on sample.cpp", () => {
  it("returns the exact metrics for sample.cpp under reference methodology", () => {
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample.cpp"), "utf8");
    const m = analyzer.analyze(src);
    assert.equal(m.eta1, 46);
    assert.equal(m.N1, 342);
    assert.equal(m.eta2, 35);
    assert.equal(m.N2, 157);
    assert.equal(m.eta, 81);
    assert.equal(m.N, 499);
    assert.equal(m.V, 3163.6);
    assert.ok(!m.operands.some((o) => /cin|cout|endl|nextTerm|absValue|printResult|readMode|main/.test(o.name)));
  });
});
