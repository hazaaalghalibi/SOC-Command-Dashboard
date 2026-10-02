import type { Request, Response } from "express";

export function healthGet(_req: Request, res: Response) {
  res.json({ ok: true, service: "soc-api", version: "2.0.0" });
}
