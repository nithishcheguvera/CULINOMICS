declare module "javascript-lp-solver" {
  export interface SolverModel {
    optimize: string;
    opType: "max" | "min";
    constraints: Record<string, { min?: number; max?: number; equal?: number }>;
    variables: Record<string, Record<string, number>>;
    ints?: Record<string, 1>;
  }

  export interface SolverResult {
    feasible: boolean;
    result: number;
    bounded?: boolean;
    isIntegral?: boolean;
    [key: string]: any;
  }

  export function Solve(model: SolverModel): SolverResult;
  const solver: {
    Solve: (model: SolverModel) => SolverResult;
    Model: any;
    [key: string]: any;
  };

  export default solver;
}
