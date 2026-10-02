import type { Request, Response } from "express";
import { runDetection } from "../services/detectionService.js";

export async function detectionRunPost(_req: Request, res: Response) {
  try {
    const result = await runDetection();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
