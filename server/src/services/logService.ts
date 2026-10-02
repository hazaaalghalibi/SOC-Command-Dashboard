import { prisma } from "../db.js";

export interface LogUploadRow {
  timestamp?: string;
  sourceIp: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userAgent?: string;
  message: string;
  outcome?: string;
  userId?: string;
}

export async function ingestLogs(rows: LogUploadRow[]) {
  const created = await prisma.$transaction(
    rows.map((r) =>
      prisma.log.create({
        data: {
          timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
          sourceIp: r.sourceIp,
          method: r.method,
          path: r.path,
          statusCode: r.statusCode,
          userAgent: r.userAgent,
          message: r.message,
          outcome: r.outcome,
          userId: r.userId,
        },
      }),
    ),
  );
  return { inserted: created.length };
}

export async function recentLogs(since: Date) {
  return prisma.log.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: "desc" },
  });
}
