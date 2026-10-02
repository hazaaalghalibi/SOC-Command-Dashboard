import type { Request, Response } from "express";
import { getMetricsPayload } from "../services/metricsService.js";

export async function metricsGet(_req: Request, res: Response) {
  try {
    res.json(await getMetricsPayload());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
