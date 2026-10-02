import type { Prisma } from "@prisma/client";

export interface AlertListQuery {
  severity?: string;
  status?: string;
  eventType?: string;
  sourceIp?: string;
  from?: string;
  to?: string;
}

export function buildAlertWhere(q: AlertListQuery): Prisma.AlertWhereInput {
  const where: Prisma.AlertWhereInput = {};

  if (q.severity) where.severity = q.severity;
  if (q.status) where.status = q.status;
  if (q.eventType) where.eventType = q.eventType;
  if (q.sourceIp) where.sourceIp = { contains: q.sourceIp };

  if (q.from || q.to) {
    where.timestamp = {};
    if (q.from) where.timestamp.gte = new Date(q.from);
    if (q.to) where.timestamp.lte = new Date(q.to);
  }

  return where;
}
