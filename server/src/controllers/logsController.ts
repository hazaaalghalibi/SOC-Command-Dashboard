import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { ingestLogs, type LogUploadRow } from "../services/logService.js";
import { parseLogsCsv } from "../utils/csv.js";

function validateRows(rows: LogUploadRow[]) {
  for (const r of rows) {
    if (!r.sourceIp || !r.message) {
      throw new Error("Each log requires sourceIp and message");
    }
  }
}

export async function logsGet(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limitValue = Number(req.query.limit ?? 100);
  const take = Number.isInteger(limitValue)
    ? Math.min(Math.max(limitValue, 1), 500)
    : 100;

  const where = q
    ? {
        OR: [
          { sourceIp: { contains: q } },
          { method: { contains: q } },
          { path: { contains: q } },
          { message: { contains: q } },
          { outcome: { contains: q } },
          { userAgent: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take,
    }),
    prisma.log.count({ where }),
  ]);

  res.json({ items, total });
}

export async function logsUploadPost(req: Request, res: Response) {
  try {
    const csv = typeof req.body?.csv === "string" ? req.body.csv : null;
    const raw = req.body?.logs;

    let rows: LogUploadRow[];

    if (csv !== null && csv.trim()) {
      rows = parseLogsCsv(csv);
    } else if (Array.isArray(raw) && raw.length > 0) {
      rows = raw as LogUploadRow[];
    } else {
      res.status(400).json({
        error: 'Expected JSON body: { logs: [...] } or { csv: "header,row,..." }',
      });
      return;
    }

    validateRows(rows);
    const result = await ingestLogs(rows);
    res.json(result);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("requires") || msg.includes("CSV") || msg.includes("header")) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}