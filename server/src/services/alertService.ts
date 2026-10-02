import { prisma } from "../db.js";
import type { AlertListQuery } from "../utils/query.js";
import { buildAlertWhere } from "../utils/query.js";
import { alertToJson } from "./alertMapper.js";
import { appendAudit } from "./auditService.js";

export async function listAlerts(q: AlertListQuery) {
  const where = buildAlertWhere(q);
  const rows = await prisma.alert.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });
  return rows.map(alertToJson);
}

export async function updateAlertStatus(id: string, status: string) {
  const updated = await prisma.alert.update({
    where: { id },
    data: { status },
  });
  return alertToJson(updated);
}

export async function patchAlert(
  id: string,
  data: { status?: string; assignedAnalyst?: string },
  actorUserId?: string | null,
) {
  if (data.status === undefined && data.assignedAnalyst === undefined) {
    throw new Error("Provide status and/or assignedAnalyst");
  }
  const before = await prisma.alert.findUnique({ where: { id } });
  if (!before) throw new Error("Alert not found");

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.assignedAnalyst !== undefined ? { assignedAnalyst: data.assignedAnalyst } : {}),
    },
  });

  if (actorUserId) {
    const parts: string[] = [];
    if (data.status !== undefined && data.status !== before.status) {
      parts.push(`status:${before.status}→${data.status}`);
    }
    if (data.assignedAnalyst !== undefined && data.assignedAnalyst !== before.assignedAnalyst) {
      parts.push(`assign:${data.assignedAnalyst}`);
    }
    if (parts.length) {
      await appendAudit(actorUserId, "alert.update", "alert", id, parts.join(";"));
    }
  }

  return alertToJson(updated);
}
