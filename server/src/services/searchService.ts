import { prisma } from "../db.js";
import { alertToJson } from "./alertMapper.js";

export async function globalSearch(q: string, limit = 25) {
  const term = q.trim();
  if (!term) {
    return { alerts: [], incidents: [] };
  }

  const [alerts, incidents] = await Promise.all([
    prisma.alert.findMany({
      where: {
        OR: [
          { id: { contains: term } },
          { eventType: { contains: term } },
          { sourceIp: { contains: term } },
          { description: { contains: term } },
          { mitreTechnique: { contains: term } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    }),
    prisma.incident.findMany({
      where: {
        OR: [
          { id: { contains: term } },
          { title: { contains: term } },
          { description: { contains: term } },
          { notes: { contains: term } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    alerts: alerts.map(alertToJson),
    incidents: incidents.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
      updatedAt: i.updatedAt.toISOString(),
      assignedTo: i.assignedTo
        ? { id: i.assignedTo.id, name: i.assignedTo.name, email: i.assignedTo.email }
        : null,
    })),
  };
}
