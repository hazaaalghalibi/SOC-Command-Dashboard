import type { Request, Response } from "express";
import { getDashboardSummary } from "../services/metricsService.js";

/** @deprecated Prefer GET /api/metrics */
export async function summaryGet(_req: Request, res: Response) {
  try {
    res.json(await getDashboardSummary());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
