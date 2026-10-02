import type { Request, Response } from "express";
import { globalSearch } from "../services/searchService.js";

export async function searchGet(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(await globalSearch(q));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
