import { prisma } from "../db.js";
import { nextAlertId } from "../utils/ids.js";
import { appendActivity } from "./activityService.js";

const FAILED = /failed|fail|invalid|denied/i;
const SQLI = /(\bunion\b\s+\bselect\b)|(\bdrop\s+table\b)|(\bor\s+1\s*=\s*1\b)|(%27)|(;--)|(\/\*)/i;

function isFailedLogin(log: {
  outcome?: string | null;
  statusCode?: number | null;
  message: string;
  path?: string | null;
}) {
  const context = `${log.path ?? ""} ${log.message}`;

  // Count failures only when the event appears related to authentication.
  if (!/login|signin|sign-in|auth|oauth|session|password|credential/i.test(context)) {
    return false;
  }

  if (log.statusCode === 401 || log.statusCode === 403) return true;
  if (log.outcome && FAILED.test(log.outcome)) return true;

  return FAILED.test(log.message);
}

function isSuccessfulLogin(log: {
  path?: string | null;
  statusCode?: number | null;
  message: string;
  outcome?: string | null;
}) {
  const p = (log.path ?? "").toLowerCase();
  if (log.statusCode && log.statusCode >= 200 && log.statusCode < 300 && /login|signin|oauth/.test(p)) return true;
  if (log.outcome === "success" && /login|signin/.test(log.message.toLowerCase())) return true;
  return false;
}

function isOutsideBusinessHoursUtc(d: Date) {
  const day = d.getUTCDay();
  const h = d.getUTCHours();
  if (day === 0 || day === 6) return true;
  return h < 9 || h >= 17;
}

function isAdminPath(path?: string | null) {
  return /\/admin(\/|$)/i.test(path ?? "");
}

async function alertExists(fingerprint: string) {
  const existing = await prisma.alert.findFirst({
    where: { description: { contains: fingerprint } },
  });
  return !!existing;
}

export interface DetectionResult {
  alertsCreated: number;
  incidentsCreated: number;
  rules: string[];
}

/**
 * Rule-based detection over recent logs (last 24h window trimmed in caller).
 */
export async function runDetection(): Promise<DetectionResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await prisma.log.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
  });

  let alertsCreated = 0;
  let incidentsCreated = 0;
  const rules: string[] = [];

  const oneMinute = 60 * 1000;
  const fiveMinutes = 5 * 60 * 1000;

  // --- Brute force: 5+ failed logins from same IP within any sliding 1-minute window ---
  const failedLogs = logs.filter(isFailedLogin);
  const byIp = new Map<string, typeof failedLogs>();
  for (const log of failedLogs) {
    const arr = byIp.get(log.sourceIp) ?? [];
    arr.push(log);
    byIp.set(log.sourceIp, arr);
  }
  for (const [ip, arr] of byIp) {
    arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let i = 0;
    for (let j = 0; j < arr.length; j++) {
      while (arr[j]!.timestamp.getTime() - arr[i]!.timestamp.getTime() > oneMinute) {
        i += 1;
      }
      if (j - i + 1 < 5) continue;
      const fp = `det:brute:${ip}:${arr[i]!.timestamp.toISOString()}`;
      if (await alertExists(fp)) break;
      const { id: incId, created: incNew } = await ensureIncident(
        `Brute force — ${ip}`,
        "Critical",
        `Automated: 5+ failed authentication attempts from ${ip} within 60 seconds.`,
      );
      if (incNew) incidentsCreated += 1;
      await prisma.alert.create({
        data: {
          id: nextAlertId(),
          timestamp: new Date(),
          eventType: "Brute Force Attempt",
          sourceIp: ip,
          severity: "Critical",
          status: "Open",
          assignedAnalyst: "Unassigned",
          description: `${fp}\nSliding-window correlation of failed login events (≥5 in 60s).`,
          mitreTactic: "Credential Access (TA0006)",
          mitreTechnique: "T1110",
          sourceType: "auth",
          incidentId: incId,
        },
      });
      alertsCreated += 1;
      rules.push("brute_force_1m");
      await appendActivity(`Detection: brute-force pattern for ${ip}`, "crit");
      break;
    }
  }

  // --- Suspicious login outside business hours (UTC) ---
  for (const log of logs) {
    if (!isSuccessfulLogin(log)) continue;
    if (!isOutsideBusinessHoursUtc(log.timestamp)) continue;
    const fp = `det:afterhours:${log.sourceIp}:${log.timestamp.toISOString()}`;
    if (await alertExists(fp)) continue;
    const { id: incId, created: incNew } = await ensureIncident(
      `After-hours login — ${log.sourceIp}`,
      "Medium",
      "Successful authentication outside UTC business hours (09:00–17:00, Mon–Fri).",
    );
    if (incNew) incidentsCreated += 1;
    await prisma.alert.create({
      data: {
        id: nextAlertId(),
        timestamp: new Date(),
        eventType: "Suspicious Login",
        sourceIp: log.sourceIp,
        severity: "Medium",
        status: "Open",
        assignedAnalyst: "Unassigned",
        description: `${fp}\nLogin success observed outside policy window.`,
        destination: log.path ?? undefined,
        mitreTactic: "Initial Access (TA0001)",
        mitreTechnique: "T1078",
        sourceType: "auth",
        incidentId: incId,
        logId: log.id,
      },
    });
    alertsCreated += 1;
    rules.push("after_hours_login");
    await appendActivity(`Detection: after-hours login from ${log.sourceIp}`, "warn");
  }

  // --- Repeated admin access: 10+ requests to /admin from same IP in 5 minutes ---
  const adminByIp: Record<string, typeof logs> = {};
  for (const log of logs) {
    if (!isAdminPath(log.path)) continue;
    const ip = log.sourceIp;
    if (!adminByIp[ip]) adminByIp[ip] = [];
    adminByIp[ip]!.push(log);
  }
  for (const [ip, list] of Object.entries(adminByIp)) {
    list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < list.length; i++) {
      const start = list[i]!.timestamp.getTime();
      const slice = list.filter((l) => l.timestamp.getTime() - start <= fiveMinutes && l.timestamp.getTime() >= start);
      if (slice.length < 10) continue;
      const fp = `det:admin:${ip}:${start}`;
      if (await alertExists(fp)) break;
      const { id: incId, created: incNew } = await ensureIncident(
        `Admin endpoint abuse — ${ip}`,
        "High",
        "Repeated access to administrative routes from a single source within 5 minutes.",
      );
      if (incNew) incidentsCreated += 1;
      await prisma.alert.create({
        data: {
          id: nextAlertId(),
          timestamp: new Date(),
          eventType: "Policy Violation",
          sourceIp: ip,
          severity: "High",
          status: "Open",
          assignedAnalyst: "Unassigned",
          description: `${fp}\n${slice.length} requests under /admin within 5 minutes.`,
          mitreTactic: "Discovery (TA0007)",
          mitreTechnique: "T1087",
          sourceType: "web",
          incidentId: incId,
        },
      });
      alertsCreated += 1;
      rules.push("admin_flood_5m");
      await appendActivity(`Detection: elevated /admin traffic from ${ip}`, "warn");
      break;
    }
  }

  // --- SQL injection keywords in path or message ---
  for (const log of logs) {
    const blob = `${log.path ?? ""} ${log.message}`;
    if (!SQLI.test(blob)) continue;
    const fp = `det:sqli:${log.id}`;
    if (await alertExists(fp)) continue;
    const { id: incId, created: incNew } = await ensureIncident(
      `Possible SQLi — ${log.sourceIp}`,
      "Critical",
      "Request matched SQL injection heuristics.",
    );
    if (incNew) incidentsCreated += 1;
    await prisma.alert.create({
      data: {
        id: nextAlertId(),
        timestamp: new Date(),
        eventType: "SQL Injection Attempt",
        sourceIp: log.sourceIp,
        severity: "Critical",
        status: "Open",
        assignedAnalyst: "Unassigned",
        description: `${fp}\nMatched keywords in log line or path.`,
        destination: log.path ?? undefined,
        mitreTactic: "Initial Access (TA0001)",
        mitreTechnique: "T1190",
        sourceType: "web",
        incidentId: incId,
        logId: log.id,
      },
    });
    alertsCreated += 1;
    rules.push("sqli_keywords");
    await appendActivity(`Detection: SQLi signature for ${log.sourceIp}`, "crit");
  }

  return { alertsCreated, incidentsCreated, rules: [...new Set(rules)] };
}

async function ensureIncident(
  title: string,
  severity: string,
  description: string,
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.incident.findFirst({ where: { title } });
  if (existing) return { id: existing.id, created: false };
  const id = `INC-DET-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  await prisma.incident.create({
    data: {
      id,
      title,
      status: "Open",
      severity,
      description,
    },
  });
  return { id, created: true };
}