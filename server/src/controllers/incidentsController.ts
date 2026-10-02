import type { Request, Response } from "express";
import {
  getIncident,
  listIncidents,
  patchIncident,
  updateIncidentStatus,
} from "../services/incidentService.js";

function mapIncidentListItem(i: Awaited<ReturnType<typeof listIncidents>>[number]) {
  return {
    id: i.id,
    title: i.title,
    status: i.status,
    severity: i.severity,
    description: i.description,
    notes: i.notes,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    assignedTo: i.assignedTo
      ? { id: i.assignedTo.id, name: i.assignedTo.name, email: i.assignedTo.email }
      : null,
  };
}

export async function incidentsGet(_req: Request, res: Response) {
  try {
    const rows = await listIncidents();
    res.json(rows.map(mapIncidentListItem));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function incidentByIdGet(req: Request, res: Response) {
  try {
    const row = await getIncident(req.params.id!);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: row.id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      description: row.description,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      assignedTo: row.assignedTo,
      alerts: row.alerts.map((a) => ({
        id: a.id,
        eventType: a.eventType,
        severity: a.severity,
        timestamp: a.timestamp.toISOString(),
      })),
      timeline: row.timelineEvents.map((e) => ({
        id: e.id,
        at: e.at.toISOString(),
        kind: e.kind,
        title: e.title,
        detail: e.detail,
        alertId: e.alertId,
        actor: e.actor ? { id: e.actor.id, name: e.actor.name, email: e.actor.email } : null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function incidentStatusPatch(req: Request, res: Response) {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status : null;
    if (!status) {
      res.status(400).json({ error: "Missing status" });
      return;
    }
    const updated = await updateIncidentStatus(req.params.id!, status, req.user?.id);
    res.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      severity: updated.severity,
      description: updated.description,
      notes: updated.notes,
      updatedAt: updated.updatedAt.toISOString(),
      assignedTo: updated.assignedTo,
    });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("Invalid status")) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}

export async function incidentPatch(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const status = typeof body.status === "string" ? body.status : undefined;
    const notes = body.notes === null ? null : typeof body.notes === "string" ? body.notes : undefined;
    const assignedToId =
      body.assignedToId === null
        ? null
        : typeof body.assignedToId === "string"
          ? body.assignedToId
          : undefined;

    if (status === undefined && notes === undefined && assignedToId === undefined) {
      res.status(400).json({ error: "Provide status, notes, and/or assignedToId" });
      return;
    }

    const updated = await patchIncident(req.params.id!, { status, notes, assignedToId }, req.user?.id);
    res.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      severity: updated.severity,
      description: updated.description,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      assignedTo: updated.assignedTo,
    });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("Invalid status") || msg.includes("not found") || msg.includes("No fields")) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}
