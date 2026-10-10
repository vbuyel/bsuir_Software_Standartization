/**
 * Gilb metrics from control-flow analysis + operator count.
 * CL  — absolute logical complexity (count of condition checks)
 * cl  — relative complexity CL / N_op
 * CLI — maximum nesting level of conditionals
 */
export class GilbMetrics {
  constructor(CL, Nop, CLI, constructs = []) {
    this.CL = CL;
    this.Nop = Nop;
    this.CLI = CLI;
    this.constructs = constructs;
    this.cl = Nop > 0 ? CL / Nop : 0;
  }

  toJSON() {
    return {
      CL: this.CL,
      cl: this.cl,
      CLI: this.CLI,
      Nop: this.Nop,
      constructs: this.constructs,
    };
  }
}

export function computeGilb(flow, Nop) {
  return new GilbMetrics(flow.CL, Nop, flow.CLI, flow.constructs);
}
