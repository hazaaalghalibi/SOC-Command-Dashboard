import { prisma } from "../db.js";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatActivityTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export async function appendActivity(message: string, tone: string) {
  await prisma.activity.create({ data: { message, tone } });
}

export async function listActivity(limit: number) {
  const rows = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: String(r.id),
    time: formatActivityTime(r.createdAt),
    message: r.message,
    tone: r.tone as "info" | "warn" | "crit" | "success",
  }));
}
