import { prisma } from "../db.js";

export async function appendTimelineEvent(data: {
  incidentId: string;
  kind: string;
  title: string;
  detail?: string | null;
  actorUserId?: string | null;
  alertId?: string | null;
}) {
  return prisma.incidentTimelineEvent.create({
    data: {
      incidentId: data.incidentId,
      kind: data.kind,
      title: data.title,
      detail: data.detail ?? undefined,
      actorUserId: data.actorUserId ?? undefined,
      alertId: data.alertId ?? undefined,
    },
  });
}

export async function listTimeline(incidentId: string) {
  return prisma.incidentTimelineEvent.findMany({
    where: { incidentId },
    orderBy: { at: "desc" },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}
