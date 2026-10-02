import type { Request, Response } from "express";
import { exportAlertsCsv, exportIncidentsCsv } from "../services/exportService.js";

export async function exportAlertsCsvGet(_req: Request, res: Response) {
  try {
    const csv = await exportAlertsCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="soc-alerts.csv"');
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function exportIncidentsCsvGet(_req: Request, res: Response) {
  try {
    const csv = await exportIncidentsCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="soc-incidents.csv"');
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
