import { prisma } from "../db.js";
import { INCIDENT_STATUSES } from "../constants/roles.js";
import { appendAudit } from "./auditService.js";
import { appendTimelineEvent } from "./timelineService.js";

export async function listIncidents() {
  return prisma.incident.findMany({
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
}

export async function getIncident(id: string) {
  return prisma.incident.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      alerts: { take: 20, orderBy: { timestamp: "desc" } },
      timelineEvents: {
        orderBy: { at: "desc" },
        take: 50,
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export function isValidIncidentStatus(status: string) {
  return (INCIDENT_STATUSES as readonly string[]).includes(status);
}

export async function updateIncidentStatus(id: string, status: string, actorUserId?: string | null) {
  if (!isValidIncidentStatus(status)) {
    throw new Error(`Invalid status. Allowed: ${INCIDENT_STATUSES.join(", ")}`);
  }
  const before = await prisma.incident.findUnique({ where: { id } });
  const updated = await prisma.incident.update({
    where: { id },
    data: { status },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  if (actorUserId && before && before.status !== status) {
    await appendTimelineEvent({
      incidentId: id,
      kind: "status_change",
      title: `Status → ${status}`,
      detail: `Previous status: ${before.status}`,
      actorUserId,
    });
    await appendAudit(actorUserId, "incident.status", "incident", id, JSON.stringify({ from: before.status, to: status }));
  }
  return updated;
}

export async function patchIncident(
  id: string,
  data: {
    status?: string;
    notes?: string | null;
    assignedToId?: string | null;
  },
  actorUserId?: string | null,
) {
  const before = await prisma.incident.findUnique({ where: { id } });
  if (!before) throw new Error("Incident not found");

  const update: {
    status?: string;
    notes?: string | null;
    assignedToId?: string | null;
  } = {};

  if (data.status !== undefined) {
    if (!isValidIncidentStatus(data.status)) {
      throw new Error(`Invalid status. Allowed: ${INCIDENT_STATUSES.join(", ")}`);
    }
    update.status = data.status;
  }
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.assignedToId !== undefined) {
    if (data.assignedToId) {
      const u = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (!u) throw new Error("assignedToId user not found");
    }
    update.assignedToId = data.assignedToId;
  }

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: update,
    include: { assignedTo: { select: { id: true, name: true, email: true, role: true } } },
  });

  if (actorUserId) {
    if (update.status !== undefined && update.status !== before.status) {
      await appendTimelineEvent({
        incidentId: id,
        kind: "status_change",
        title: `Status → ${update.status}`,
        detail: `Previous: ${before.status}`,
        actorUserId,
      });
      await appendAudit(actorUserId, "incident.status", "incident", id, JSON.stringify({ from: before.status, to: update.status }));
    }
    if (update.notes !== undefined && update.notes !== before.notes) {
      await appendTimelineEvent({
        incidentId: id,
        kind: "note",
        title: "Investigation notes updated",
        actorUserId,
      });
      await appendAudit(actorUserId, "incident.notes", "incident", id, undefined);
    }
    if (update.assignedToId !== undefined && update.assignedToId !== before.assignedToId) {
      await appendTimelineEvent({
        incidentId: id,
        kind: "assignment",
        title: "Case assignment updated",
        detail: update.assignedToId ? `Assigned user id: ${update.assignedToId}` : "Unassigned",
        actorUserId,
      });
      await appendAudit(
        actorUserId,
        "incident.assign",
        "incident",
        id,
        JSON.stringify({ from: before.assignedToId, to: update.assignedToId }),
      );
    }
  }

  return updated;
}
