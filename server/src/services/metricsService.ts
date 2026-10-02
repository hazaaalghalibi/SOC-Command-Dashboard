import type { Alert } from "@prisma/client";
import { prisma } from "../db.js";

export interface DashboardSummaryDto {
  totalAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  resolvedIncidents: number;
  suspiciousIps: number;
  failedLogins: number;
}

const SUSPICIOUS_BASE = 118;

export async function getMetricValue(key: string, fallback: number) {
  const row = await prisma.metric.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function setMetricValue(key: string, value: number) {
  await prisma.metric.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function incMetricValue(key: string, delta: number, initial: number) {
  const cur = await getMetricValue(key, initial);
  await setMetricValue(key, cur + delta);
}

export function computeSummaryFromAlerts(
  alerts: Alert[],
  failedLogins: number,
  suspiciousBoost: number,
): DashboardSummaryDto {
  const criticalAlerts = alerts.filter((a) => a.severity === "Critical").length;
  const openIds = new Set(
    alerts
      .filter((a) => a.incidentId && a.status !== "Resolved")
      .map((a) => a.incidentId as string),
  );
  const resolvedIds = new Set(
    alerts
      .filter((a) => a.incidentId && a.status === "Resolved")
      .map((a) => a.incidentId as string),
  );
  const suspiciousIps =
    new Set(
      alerts.filter((a) => a.severity === "High" || a.severity === "Critical").map((a) => a.sourceIp),
    ).size +
    SUSPICIOUS_BASE +
    suspiciousBoost;

  return {
    totalAlerts: alerts.length,
    criticalAlerts,
    openIncidents: openIds.size,
    resolvedIncidents: resolvedIds.size,
    suspiciousIps,
    failedLogins,
  };
}

/** Prefer Incident table counts when available */
export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const [alerts, openInc, resolvedInc, failed, suspiciousBoost] = await Promise.all([
    prisma.alert.findMany(),
    prisma.incident.count({
      where: { status: { notIn: ["Resolved", "Closed"] } },
    }),
    prisma.incident.count({
      where: { status: { in: ["Resolved", "Closed"] } },
    }),
    getMetricValue("failed_logins", 18_420),
    getMetricValue("suspicious_boost", 0),
  ]);

  const base = computeSummaryFromAlerts(alerts, failed, suspiciousBoost);
  return {
    ...base,
    openIncidents: openInc,
    resolvedIncidents: resolvedInc,
  };
}

export async function getMetricsPayload() {
  const alerts = await prisma.alert.findMany();
  const summary = await getDashboardSummary();
  const metrics = await prisma.metric.findMany();
  const counters = Object.fromEntries(metrics.map((m) => [m.key, m.value]));
  return {
    summary,
    counters,
    analytics: buildAnalyticsPayload(alerts),
  };
}

export function buildAnalyticsPayload(alerts: Alert[]) {
  const severityOrder = ["Critical", "High", "Medium", "Low"] as const;
  const sevCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const statusCounts: Record<string, number> = {
    Open: 0,
    Investigating: 0,
    Escalated: 0,
    Resolved: 0,
  };
  const ipCounts = new Map<string, number>();

  for (const a of alerts) {
    if (sevCounts[a.severity] !== undefined) sevCounts[a.severity] += 1;
    if (statusCounts[a.status] !== undefined) statusCounts[a.status] += 1;
    ipCounts.set(a.sourceIp, (ipCounts.get(a.sourceIp) ?? 0) + 1);
  }

  const topSources = [...ipCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count, region: "—" }));

  return {
    severity: severityOrder.map((name) => ({ name, value: sevCounts[name] ?? 0 })),
    status: Object.entries(statusCounts).map(([name, count]) => ({ name, count })),
    topAttackSources: topSources,
    attackTrend: buildAttackTrend(alerts),
  };
}

function buildAttackTrend(alerts: Alert[]) {
  const buckets = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const counts = new Map<string, number>();
  for (const h of buckets) counts.set(h, 0);

  for (const a of alerts) {
    const hr = a.timestamp.getHours();
    const label =
      hr < 7 ? "06:00" : hr < 9 ? "08:00" : hr < 11 ? "10:00" : hr < 13 ? "12:00" : hr < 15 ? "14:00" : hr < 17 ? "16:00" : "18:00";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const base = [42, 78, 95, 112, 134, 98, 86];
  return buckets.map((hour, i) => ({
    hour,
    events: (counts.get(hour) ?? 0) * 12 + base[i]!,
  }));
}
