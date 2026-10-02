import type { Request, Response } from "express";
import type { SimulationScenario } from "../services/simulationService.js";
import { runSimulation } from "../services/simulationService.js";

const SCENARIOS: SimulationScenario[] = ["all", "failed_logins", "sql_injection", "brute_force", "suspicious_ip"];

export async function simulationRunPost(req: Request, res: Response) {
  try {
    const raw = typeof req.body?.scenario === "string" ? req.body.scenario : "all";
    const scenario = (SCENARIOS.includes(raw as SimulationScenario) ? raw : "all") as SimulationScenario;
    const result = await runSimulation(scenario);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
