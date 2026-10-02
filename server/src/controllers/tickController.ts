import type { Request, Response } from "express";
import { tickIngest, tickLive } from "../services/tickService.js";

export async function tickLivePost(_req: Request, res: Response) {
  try {
    res.json(await tickLive());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function tickIngestPost(_req: Request, res: Response) {
  try {
    res.json(await tickIngest());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
