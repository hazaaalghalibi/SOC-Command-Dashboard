import { prisma } from "../db.js";
import { getMetricValue, incMetricValue, getDashboardSummary, buildAnalyticsPayload } from "./metricsService.js";
import { alertToJson } from "./alertMapper.js";
import { listActivity } from "./activityService.js";

const LIVE_TEMPLATES: { message: string; tone: string }[] = [
  { message: "New brute force attempt detected on perimeter VPN", tone: "crit" },
  { message: "Critical alert escalated to Tier-2 war room", tone: "warn" },
  { message: "Incident reassigned to analyst M. Okonkwo", tone: "info" },
  { message: "Malware signature triggered on isolated sandbox host", tone: "warn" },
  { message: "Threat intel enrichment completed for 6 observables", tone: "info" },
  { message: "SOAR playbook completed: firewall block applied", tone: "success" },
  { message: "EDR policy sync finished across finance OU", tone: "success" },
  { message: "Anomalous RDP session terminated by automated response", tone: "crit" },
];

const SYNTH_TYPES = [
  "Brute Force Attempt",
  "Port Scan Detected",
  "Suspicious Login",
  "SQL Injection Attempt",
  "DNS Tunneling Suspected",
] as const;

const SYNTH_IPS = [
  "185.220.101.44",
  "45.142.212.19",
  "203.0.113.88",
  "198.51.100.12",
  "192.0.2.199",
];

const ANALYSTS = ["J. Rivera", "M. Okonkwo", "A. Chen", "S. Patel", "Unassigned"] as const;

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomSeverity(): string {
  const r = Math.random();
  if (r < 0.14) return "Critical";
  if (r < 0.32) return "High";
  if (r < 0.68) return "Medium";
  return "Low";
}

let synthCounter = 28520;

const SOURCE_TYPES = ["auth", "web", "firewall", "endpoint"] as const;
const TECHS = ["T1190", "T1110", "T1078", "T1059", "T1046"] as const;

function nextSynthAlert() {
  synthCounter += 1;
  const status = randomPick(["Open", "Investigating", "Escalated"] as const);
  return {
    id: `ALT-${synthCounter}`,
    timestamp: new Date(),
    eventType: randomPick(SYNTH_TYPES),
    sourceIp: randomPick(SYNTH_IPS),
    severity: randomSeverity(),
    status,
    assignedAnalyst: randomPick(ANALYSTS),
    description:
      "Automated correlation detected anomalous behavior matching enterprise detection logic. Analyst review recommended.",
    destination: "multi-asset",
    mitreTactic: "Discovery (TA0007)",
    mitreTechnique: randomPick(TECHS),
    sourceType: randomPick(SOURCE_TYPES),
    incidentId: null,
  };
}

export async function snapshotJson() {
  const alerts = await prisma.alert.findMany();
  const ordered = [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const activity = await listActivity(40);
  const summary = await getDashboardSummary();
  const analytics = buildAnalyticsPayload(alerts);
  return {
    alerts: ordered.map(alertToJson),
    activity,
    summary,
    analytics,
  };
}

export async function tickLive() {
  const tpl = randomPick(LIVE_TEMPLATES);
  await prisma.activity.create({
    data: { message: tpl.message, tone: tpl.tone },
  });

  await incMetricValue("failed_logins", Math.floor(Math.random() * 4) + 1, 18_420);
  if (Math.random() > 0.65) {
    await incMetricValue("suspicious_boost", 1, 0);
  }

  void getMetricValue("failed_logins", 18_420);
  return snapshotJson();
}

export async function tickIngest() {
  if (Math.random() > 0.35) {
    const row = nextSynthAlert();
    await prisma.alert.create({ data: row });
    await prisma.activity.create({
      data: {
        message: "New correlated alert ingested from data lake stream",
        tone: "info",
      },
    });
  }
  return snapshotJson();
}
