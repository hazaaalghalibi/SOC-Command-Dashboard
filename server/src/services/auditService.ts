import { prisma } from "../db.js";

export async function appendAudit(
  userId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
) {
  return prisma.auditLog.create({
    data: {
      userId: userId ?? undefined,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

export async function listAudit(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
