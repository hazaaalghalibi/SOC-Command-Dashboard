import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { buildAnalyticsPayload } from "../services/metricsService.js";

export async function analyticsGet(_req: Request, res: Response) {
  try {
    const alerts = await prisma.alert.findMany();
    res.json(buildAnalyticsPayload(alerts));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
