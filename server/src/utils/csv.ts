import type { LogUploadRow } from "../services/logService.js";

/** Parse simple CSV with header row. Supports quoted fields minimally. */
export function parseLogsCsv(text: string): LogUploadRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iSource = idx("sourceip");
  const iMsg = idx("message");
  if (iSource < 0 || iMsg < 0) {
    throw new Error('CSV header must include "sourceIp" and "message" columns');
  }

  const rows: LogUploadRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]!);
    const get = (i: number) => (i >= 0 && cols[i] !== undefined ? cols[i]!.trim() : undefined);

    const sourceIp = get(iSource);
    const message = get(iMsg);
    if (!sourceIp || !message) continue;

    const rawStatus = get(idx("statuscode"));
    const statusCode =
      rawStatus !== undefined && rawStatus !== "" ? Number.parseInt(rawStatus, 10) : undefined;

    rows.push({
      timestamp: get(idx("timestamp")),
      sourceIp,
      method: get(idx("method")),
      path: get(idx("path")),
      statusCode: Number.isFinite(statusCode) ? statusCode : undefined,
      userAgent: get(idx("useragent")),
      message,
      outcome: get(idx("outcome")),
      userId: get(idx("userid")),
    });
  }

  if (rows.length === 0) {
    throw new Error("No valid data rows after parsing CSV");
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}
