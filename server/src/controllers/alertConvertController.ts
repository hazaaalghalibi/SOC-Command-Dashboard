import type { Request, Response } from "express";
import { convertAlertToIncident } from "../services/alertConvertService.js";

export async function alertConvertPost(req: Request, res: Response) {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title : undefined;
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const result = await convertAlertToIncident(req.params.id!, req.user.id, title);
    res.json(result);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("not found") || msg.includes("already linked")) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}
