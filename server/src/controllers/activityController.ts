import type { Request, Response } from "express";
import { listActivity } from "../services/activityService.js";

export async function activityGet(req: Request, res: Response) {
  try {
    const limit = Math.min(80, Math.max(1, Number(req.query.limit) || 40));
    res.json(await listActivity(limit));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
