import { prisma } from "../db.js";

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportAlertsCsv(): Promise<string> {
  const rows = await prisma.alert.findMany({ orderBy: { timestamp: "desc" } });
  const header = [
    "id",
    "timestamp",
    "eventType",
    "sourceIp",
    "severity",
    "status",
    "assignedAnalyst",
    "sourceType",
    "mitreTechnique",
    "mitreTactic",
    "incidentId",
    "description",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.timestamp.toISOString(),
        r.eventType,
        r.sourceIp,
        r.severity,
        r.status,
        r.assignedAnalyst,
        r.sourceType,
        r.mitreTechnique ?? "",
        r.mitreTactic ?? "",
        r.incidentId ?? "",
        r.description,
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    );
  }
  return lines.join("\n");
}

export async function exportIncidentsCsv(): Promise<string> {
  const rows = await prisma.incident.findMany({
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: { select: { name: true, email: true } } },
  });
  const header = ["id", "title", "status", "severity", "assignedTo", "createdAt", "updatedAt", "description"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.title,
        r.status,
        r.severity,
        r.assignedTo ? `${r.assignedTo.name} <${r.assignedTo.email}>` : "",
        r.createdAt.toISOString(),
        r.updatedAt.toISOString(),
        r.description ?? "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    );
  }
  return lines.join("\n");
}
