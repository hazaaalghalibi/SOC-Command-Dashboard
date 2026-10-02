import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "socdemo2026";

async function main() {
  await prisma.incidentTimelineEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.log.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@soc.local",
      name: "SOC Admin",
      role: "admin",
      passwordHash,
    },
  });
  const analyst = await prisma.user.create({
    data: {
      email: "analyst@soc.local",
      name: "Case Analyst",
      role: "analyst",
      passwordHash,
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: "viewer@soc.local",
      name: "Read-only Viewer",
      role: "viewer",
      passwordHash,
    },
  });

  const u1 = await prisma.user.create({
    data: {
      email: "j.rivera@soc.local",
      name: "J. Rivera",
      role: "analyst",
      passwordHash,
    },
  });
  const u2 = await prisma.user.create({
    data: {
      email: "m.okonkwo@soc.local",
      name: "M. Okonkwo",
      role: "analyst",
      passwordHash,
    },
  });
  await prisma.user.create({
    data: {
      email: "a.chen@soc.local",
      name: "A. Chen",
      role: "analyst",
      passwordHash,
    },
  });
  await prisma.user.create({
    data: {
      email: "s.patel@soc.local",
      name: "S. Patel",
      role: "analyst",
      passwordHash,
    },
  });

  const inc1 = await prisma.incident.create({
    data: {
      id: "INC-2026-0892",
      title: "SSH brute force — bastion bst-prod-01",
      status: "Investigating",
      severity: "Critical",
      description: "Coordinated authentication attempts from external IP space.",
      notes: "Pivoting auth logs; correlating with WAF.",
      assignedToId: u1.id,
    },
  });

  const inc2 = await prisma.incident.create({
    data: {
      id: "INC-2026-0890",
      title: "DMZ reconnaissance — horizontal port scan",
      status: "Open",
      severity: "High",
      description: "Multi-host TCP sweep detected by IDS.",
      assignedToId: u2.id,
    },
  });

  await prisma.incident.create({
    data: {
      id: "INC-2026-0870",
      title: "Azure AD anomalous sign-in (resolved)",
      status: "Resolved",
      severity: "Low",
      description: "Travel-related false positive; user confirmed.",
      assignedToId: u2.id,
    },
  });

  const seedAlerts = [
    {
      id: "ALT-28491",
      timestamp: new Date("2026-04-18T14:22:09Z"),
      eventType: "Brute Force Attempt",
      sourceIp: "185.220.101.44",
      severity: "Critical",
      status: "Escalated",
      assignedAnalyst: "J. Rivera",
      description:
        "Repeated failed SSH authentications (847 attempts in 12m) targeting bastion host bst-prod-01 from single source.",
      destination: "10.42.1.12:22",
      mitreTactic: "Credential Access (TA0006)",
      mitreTechnique: "T1110",
      sourceType: "auth",
      incidentId: inc1.id,
    },
    {
      id: "ALT-28488",
      timestamp: new Date("2026-04-18T14:18:41Z"),
      eventType: "Port Scan Detected",
      sourceIp: "45.142.212.19",
      severity: "High",
      status: "Investigating",
      assignedAnalyst: "M. Okonkwo",
      description:
        "Horizontal TCP sweep across DMZ subnets; 1,024 ports probed on 18 hosts within 90 seconds.",
      destination: "172.16.40.0/24",
      mitreTactic: "Reconnaissance (TA0043)",
      mitreTechnique: "T1046",
      sourceType: "firewall",
      incidentId: inc2.id,
    },
    {
      id: "ALT-28485",
      timestamp: new Date("2026-04-18T14:11:02Z"),
      eventType: "Suspicious Login",
      sourceIp: "203.0.113.77",
      severity: "Medium",
      status: "Open",
      assignedAnalyst: "Unassigned",
      description:
        "Successful VPN login from unusual geolocation (ASN in region not typical for user) with MFA satisfied.",
      destination: "vpn.company.internal",
      mitreTactic: "Initial Access (TA0001)",
      mitreTechnique: "T1078",
      sourceType: "auth",
      incidentId: null,
    },
    {
      id: "ALT-28482",
      timestamp: new Date("2026-04-18T14:05:33Z"),
      eventType: "SQL Injection Attempt",
      sourceIp: "198.51.100.12",
      severity: "Critical",
      status: "Investigating",
      assignedAnalyst: "A. Chen",
      description:
        "WAF blocked union-based SQLi payload against /api/v2/orders endpoint; 6 blocked requests in 30s.",
      destination: "api-gw-prod-03",
      mitreTactic: "Initial Access (TA0001)",
      mitreTechnique: "T1190",
      sourceType: "web",
      incidentId: null,
    },
    {
      id: "ALT-28479",
      timestamp: new Date("2026-04-18T13:58:19Z"),
      eventType: "Malware Signature Triggered",
      sourceIp: "10.8.3.44",
      severity: "High",
      status: "Open",
      assignedAnalyst: "S. Patel",
      description:
        "EDR quarantined suspicious PowerShell downloader; parent process winword.exe.",
      destination: "wkst-fin-044",
      mitreTactic: "Execution (TA0002)",
      mitreTechnique: "T1204",
      sourceType: "endpoint",
      incidentId: null,
    },
    {
      id: "ALT-28471",
      timestamp: new Date("2026-04-18T13:41:08Z"),
      eventType: "Failed Login Attempt",
      sourceIp: "192.0.2.55",
      severity: "Low",
      status: "Resolved",
      assignedAnalyst: "M. Okonkwo",
      description:
        "Azure AD sign-in risk: unfamiliar properties; user confirmed legitimate travel.",
      destination: "Azure AD",
      mitreTactic: "Credential Access (TA0006)",
      mitreTechnique: "T1110",
      sourceType: "auth",
      incidentId: "INC-2026-0870",
    },
  ];

  await prisma.alert.createMany({ data: seedAlerts });

  await prisma.incidentTimelineEvent.createMany({
    data: [
      {
        incidentId: inc1.id,
        kind: "case_opened",
        title: "Incident opened",
        detail: "Created from SOC triage queue.",
        actorUserId: u1.id,
      },
      {
        incidentId: inc1.id,
        kind: "alert_linked",
        title: "Linked alert ALT-28491",
        detail: "Brute Force Attempt correlated to bastion telemetry.",
        actorUserId: u1.id,
        alertId: "ALT-28491",
      },
      {
        incidentId: inc1.id,
        kind: "status_change",
        title: "Status → Investigating",
        detail: "Previous: Open",
        actorUserId: u1.id,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { message: "New brute force attempt detected on bst-prod-01", tone: "crit" },
      { message: "Critical alert ALT-28491 escalated to Tier-2 queue", tone: "warn" },
      { message: "Incident INC-2026-0892 assigned to analyst J. Rivera", tone: "info" },
      { message: "Malware signature triggered on endpoint wkst-fin-044", tone: "warn" },
      { message: "Threat intel feed updated: 14 new IOCs ingested", tone: "info" },
      { message: "Playbook PB-WAF-001 executed successfully", tone: "success" },
    ],
  });

  await prisma.metric.createMany({
    data: [
      { key: "failed_logins", value: 18_420 },
      { key: "suspicious_boost", value: 0 },
    ],
  });

  const t0 = new Date("2026-04-18T13:00:00Z");
  await prisma.log.createMany({
    data: [
      {
        timestamp: t0,
        sourceIp: "10.0.0.5",
        method: "POST",
        path: "/api/login",
        statusCode: 401,
        message: "invalid password",
        outcome: "failed_login",
      },
      {
        timestamp: new Date(t0.getTime() + 5000),
        sourceIp: "10.0.0.5",
        method: "POST",
        path: "/api/login",
        statusCode: 401,
        message: "invalid password",
        outcome: "failed_login",
      },
      {
        timestamp: new Date(t0.getTime() + 10000),
        sourceIp: "10.0.0.5",
        method: "POST",
        path: "/api/login",
        statusCode: 401,
        message: "invalid password",
        outcome: "failed_login",
      },
      {
        timestamp: new Date(t0.getTime() + 15000),
        sourceIp: "10.0.0.5",
        method: "POST",
        path: "/api/login",
        statusCode: 401,
        message: "invalid password",
        outcome: "failed_login",
      },
      {
        timestamp: new Date(t0.getTime() + 20000),
        sourceIp: "10.0.0.5",
        method: "POST",
        path: "/api/login",
        statusCode: 401,
        message: "invalid password",
        outcome: "failed_login",
      },
      {
        timestamp: new Date("2026-04-18T22:00:00Z"),
        sourceIp: "198.51.100.50",
        method: "POST",
        path: "/oauth/login",
        statusCode: 200,
        message: "login success after hours",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:00Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:05Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:10Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:15Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:20Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:25Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:30Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:35Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:40Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:45Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T14:00:50Z"),
        sourceIp: "203.0.113.10",
        method: "GET",
        path: "/admin/users",
        statusCode: 200,
        message: "ok",
        outcome: "success",
      },
      {
        timestamp: new Date("2026-04-18T15:00:00Z"),
        sourceIp: "192.0.2.1",
        method: "GET",
        path: "/search",
        statusCode: 400,
        message: "q=1' OR '1'='1",
        outcome: "blocked",
      },
    ],
  });

  console.log(
    `Seeded demo users (password "${DEMO_PASSWORD}"): admin@soc.local, analyst@soc.local, viewer@soc.local; plus analyst personas.`,
  );
  console.log(`Admin id (for reference): ${admin.id}, analyst: ${analyst.id}, viewer: ${viewer.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
