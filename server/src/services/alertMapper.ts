import type { Alert } from "@prisma/client";

/** JSON shape expected by the React dashboard */
export function alertToJson(a: Alert) {
  return {
    id: a.id,
    timestamp: a.timestamp.toISOString(),
    eventType: a.eventType,
    sourceIp: a.sourceIp,
    severity: a.severity,
    status: a.status,
    assignedAnalyst: a.assignedAnalyst,
    description: a.description,
    destination: a.destination ?? undefined,
    mitreTactic: a.mitreTactic ?? undefined,
    mitreTechnique: a.mitreTechnique ?? undefined,
    sourceType: a.sourceType ?? "web",
    relatedIncidentId: a.incidentId ?? undefined,
  };
}
