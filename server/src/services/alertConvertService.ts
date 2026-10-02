import { prisma } from "../db.js";
import { appendAudit } from "./auditService.js";
import { notifyAllAnalysts } from "./notificationService.js";
import { appendTimelineEvent } from "./timelineService.js";
import { alertToJson } from "./alertMapper.js";

export async function convertAlertToIncident(alertId: string, actorUserId: string, title?: string) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error("Alert not found");
  if (alert.incidentId) throw new Error("Alert is already linked to an incident");

  const incId = `INC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const incTitle = title?.trim() || `Case: ${alert.eventType} — ${alert.sourceIp}`;

  await prisma.$transaction(async (tx) => {
    await tx.incident.create({
      data: {
        id: incId,
        title: incTitle,
        status: "Open",
        severity: alert.severity,
        description: `Opened from alert ${alertId}.\n\n${alert.description}`,
      },
    });
    await tx.alert.update({
      where: { id: alertId },
      data: { incidentId: incId },
    });
    await tx.incidentTimelineEvent.create({
      data: {
        incidentId: incId,
        kind: "case_opened",
        title: "Case opened from alert",
        detail: `Alert ${alertId} was promoted to this incident.`,
        actorUserId,
        alertId,
      },
    });
    await tx.incidentTimelineEvent.create({
      data: {
        incidentId: incId,
        kind: "alert_linked",
        title: `Linked alert ${alertId}`,
        detail: alert.eventType,
        actorUserId,
        alertId,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: "alert.convert_incident",
        entityType: "alert",
        entityId: alertId,
        details: JSON.stringify({ incidentId: incId }),
      },
    });
  });

  await notifyAllAnalysts(
    "New case from alert",
    `${incTitle} (${incId})`,
    "incident",
    incId,
  );

  const updated = await prisma.alert.findUniqueOrThrow({ where: { id: alertId } });
  return { incidentId: incId, alert: alertToJson(updated) };
}
