import type { Request, Response } from "express";
import { listAssignableUsers } from "../services/usersService.js";

export async function usersGet(_req: Request, res: Response) {
  try {
    const rows = await listAssignableUsers();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
