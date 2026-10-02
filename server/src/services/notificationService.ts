import { prisma } from "../db.js";

export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
  linkKind?: string | null,
  linkId?: string | null,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return 0;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      title,
      body,
      linkKind: linkKind ?? undefined,
      linkId: linkId ?? undefined,
    })),
  });
  return unique.length;
}

export async function notifyAllAnalysts(title: string, body: string, linkKind?: string, linkId?: string) {
  const users = await prisma.user.findMany({
    where: { role: { in: ["admin", "analyst"] } },
    select: { id: true },
  });
  return notifyUsers(
    users.map((u) => u.id),
    title,
    body,
    linkKind,
    linkId,
  );
}

export async function listNotificationsForUser(userId: string, limit = 40) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(id: string, userId: string) {
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (!n) return null;
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
