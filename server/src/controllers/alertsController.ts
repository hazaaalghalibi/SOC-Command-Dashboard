import type { Request, Response } from "express";
import { listAlerts, patchAlert } from "../services/alertService.js";
import type { AlertListQuery } from "../utils/query.js";

export async function alertsGet(req: Request, res: Response) {
  try {
    const q: AlertListQuery = {
      severity: req.query.severity as string | undefined,
      status: req.query.status as string | undefined,
      eventType: req.query.eventType as string | undefined,
      sourceIp: req.query.sourceIp as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };
    res.json(await listAlerts(q));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function alertsPatch(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const status = typeof body.status === "string" ? body.status : undefined;
    const assignedAnalyst = typeof body.assignedAnalyst === "string" ? body.assignedAnalyst : undefined;
    if (status === undefined && assignedAnalyst === undefined) {
      res.status(400).json({ error: "Provide status and/or assignedAnalyst" });
      return;
    }
    res.json(await patchAlert(req.params.id!, { status, assignedAnalyst }, req.user?.id));
  } catch (e) {
    const msg = String(e);
    if (msg.includes("not found") || msg.includes("Provide")) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}
