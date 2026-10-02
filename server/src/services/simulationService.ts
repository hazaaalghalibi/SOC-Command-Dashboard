import { prisma } from "../db.js";
import { appendActivity } from "./activityService.js";
import { incMetricValue } from "./metricsService.js";

export type SimulationScenario = "all" | "failed_logins" | "sql_injection" | "brute_force" | "suspicious_ip";

export interface SimulationResult {
  logsInserted: number;
  scenario: SimulationScenario;
  summary: string[];
}

const rnd = (n: number) => Math.floor(Math.random() * n);

function baseTime() {
  return Date.now() - rnd(120_000);
}

export async function runSimulation(scenario: SimulationScenario = "all"): Promise<SimulationResult> {
  const summary: string[] = [];
  let logsInserted = 0;

  const run = async (name: SimulationScenario, fn: () => Promise<number>) => {
    if (scenario !== "all" && scenario !== name) return;
    const n = await fn();
    logsInserted += n;
    summary.push(`${name}: ${n} log lines`);
  };

  await run("failed_logins", async () => {
    const ip = `192.0.2.${50 + rnd(200)}`;
    const rows = Array.from({ length: 8 }, (_, i) => ({
      timestamp: new Date(baseTime() + i * 3000),
      sourceIp: ip,
      method: "POST",
      path: "/api/login",
      statusCode: 401,
      message: "invalid password",
      outcome: "failed_login",
      userAgent: "Mozilla/5.0 (sim)",
    }));
    await prisma.log.createMany({ data: rows });
    await incMetricValue("failed_logins", rows.length, 18_420);
    await appendActivity(`Simulation: burst of failed logins from ${ip}`, "warn");
    return rows.length;
  });

  await run("sql_injection", async () => {
    const ip = `198.51.100.${10 + rnd(240)}`;
    const rows = [
      {
        timestamp: new Date(baseTime()),
        sourceIp: ip,
        method: "GET",
        path: "/search",
        statusCode: 400,
        message: "blocked: q=1' OR '1'='1",
        outcome: "blocked",
      },
      {
        timestamp: new Date(baseTime() + 2000),
        sourceIp: ip,
        method: "POST",
        path: "/api/orders",
        statusCode: 403,
        message: "union select payload detected",
        outcome: "blocked",
      },
    ];
    await prisma.log.createMany({ data: rows });
    await appendActivity(`Simulation: SQLi-style probes from ${ip}`, "crit");
    return rows.length;
  });

  await run("brute_force", async () => {
    const ip = `185.220.${rnd(255)}.${rnd(255)}`;
    const rows = Array.from({ length: 6 }, (_, i) => ({
      timestamp: new Date(baseTime() + i * 8000),
      sourceIp: ip,
      method: "POST",
      path: "/auth/signin",
      statusCode: 401,
      message: "login failed",
      outcome: "failed_login",
    }));
    await prisma.log.createMany({ data: rows });
    await appendActivity(`Simulation: sustained auth failures from ${ip}`, "crit");
    return rows.length;
  });

  await run("suspicious_ip", async () => {
    const ip = `203.0.113.${20 + rnd(230)}`;
    const rows = [
      {
        timestamp: new Date(baseTime()),
        sourceIp: ip,
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date(baseTime() + 4000),
        sourceIp: ip,
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date(baseTime() + 8000),
        sourceIp: ip,
        method: "POST",
        path: "/oauth/login",
        statusCode: 200,
        message: "login success after hours",
        outcome: "success",
      },
    ];
    await prisma.log.createMany({ data: rows });
    await incMetricValue("suspicious_boost", 1, 0);
    await appendActivity(`Simulation: suspicious admin + after-hours activity from ${ip}`, "warn");
    return rows.length;
  });

  return { logsInserted, scenario, summary };
}
