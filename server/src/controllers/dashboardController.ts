import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { listActivity } from "../services/activityService.js";
import { getDashboardSummary, buildAnalyticsPayload } from "../services/metricsService.js";
import { alertToJson } from "../services/alertMapper.js";

export async function dashboardGet(_req: Request, res: Response) {
  try {
    const [summary, incidents, alerts, activity, allAlerts] = await Promise.all([
      getDashboardSummary(),
      prisma.incident.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      }),
      prisma.alert.findMany({ orderBy: { timestamp: "desc" }, take: 12 }),
      listActivity(30),
      prisma.alert.findMany(),
    ]);

    res.json({
      summary,
      recentIncidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        notes: i.notes,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        assignedTo: i.assignedTo
          ? { id: i.assignedTo.id, name: i.assignedTo.name, email: i.assignedTo.email }
          : null,
      })),
      recentAlerts: alerts.map(alertToJson),
      activity,
      analytics: buildAnalyticsPayload(allAlerts),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
