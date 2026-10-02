import type { ActivityItem, AlertStatus, SecurityAlert, Severity } from "../types/soc";

export type { ActivityItem, AlertStatus, SecurityAlert, Severity };

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: "ALT-28491",
    timestamp: "2026-04-18T14:22:09Z",
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
    relatedIncidentId: "INC-2026-0892",
  },
  {
    id: "ALT-28488",
    timestamp: "2026-04-18T14:18:41Z",
    eventType: "Port Scan Detected",
    sourceIp: "45.142.212.19",
    severity: "High",
    status: "Investigating",
    assignedAnalyst: "M. Okonkwo",
    description:
      "Horizontal TCP sweep across DMZ subnets; 1,024 ports probed on 18 hosts within 90 seconds.",
    destination: "172.16.40.0/24",
    mitreTactic: "Reconnaissance (TA0043)",
    relatedIncidentId: "INC-2026-0890",
  },
  {
    id: "ALT-28485",
    timestamp: "2026-04-18T14:11:02Z",
    eventType: "Suspicious Login",
    sourceIp: "203.0.113.77",
    severity: "Medium",
    status: "Open",
    assignedAnalyst: "Unassigned",
    description:
      "Successful VPN login from unusual geolocation (ASN in region not typical for user) with MFA satisfied.",
    destination: "vpn.company.internal",
    mitreTactic: "Initial Access (TA0001)",
  },
  {
    id: "ALT-28482",
    timestamp: "2026-04-18T14:05:33Z",
    eventType: "SQL Injection Attempt",
    sourceIp: "198.51.100.12",
    severity: "Critical",
    status: "Investigating",
    assignedAnalyst: "A. Chen",
    description:
      "WAF blocked union-based SQLi payload against /api/v2/orders endpoint; 6 blocked requests in 30s.",
    destination: "api-gw-prod-03",
    mitreTactic: "Initial Access (TA0001)",
    relatedIncidentId: "INC-2026-0888",
  },
  {
    id: "ALT-28479",
    timestamp: "2026-04-18T13:58:19Z",
    eventType: "Malware Signature Triggered",
    sourceIp: "10.8.3.44",
    severity: "High",
    status: "Open",
    assignedAnalyst: "S. Patel",
    description:
      "EDR quarantined suspicious PowerShell downloader; parent process winword.exe.",
    destination: "wkst-fin-044",
    mitreTactic: "Execution (TA0002)",
  },
  {
    id: "ALT-28476",
    timestamp: "2026-04-18T13:52:47Z",
    eventType: "Data Exfiltration Pattern",
    sourceIp: "10.12.90.2",
    severity: "High",
    status: "Investigating",
    assignedAnalyst: "J. Rivera",
    description:
      "Outbound HTTPS volume spike to unknown cloud storage domain; correlation with off-hours activity.",
    destination: "storage-unknown.example",
    mitreTactic: "Exfiltration (TA0010)",
  },
  {
    id: "ALT-28471",
    timestamp: "2026-04-18T13:41:08Z",
    eventType: "Failed Login Attempt",
    sourceIp: "192.0.2.55",
    severity: "Low",
    status: "Resolved",
    assignedAnalyst: "M. Okonkwo",
    description:
      "Azure AD sign-in risk: unfamiliar properties; user confirmed legitimate travel.",
    destination: "Azure AD",
    mitreTactic: "Credential Access (TA0006)",
    relatedIncidentId: "INC-2026-0870",
  },
  {
    id: "ALT-28468",
    timestamp: "2026-04-18T13:35:22Z",
    eventType: "Privilege Escalation",
    sourceIp: "10.2.18.101",
    severity: "Critical",
    status: "Escalated",
    assignedAnalyst: "A. Chen",
    description:
      "Local admin token manipulation detected on server srv-db-legacy; suspicious service creation.",
    destination: "srv-db-legacy",
    mitreTactic: "Privilege Escalation (TA0004)",
    relatedIncidentId: "INC-2026-0885",
  },
  {
    id: "ALT-28465",
    timestamp: "2026-04-18T13:28:51Z",
    eventType: "DNS Tunneling Suspected",
    sourceIp: "10.44.2.18",
    severity: "Medium",
    status: "Open",
    assignedAnalyst: "Unassigned",
    description:
      "Long-label TXT queries to newly registered domain with high entropy; volume elevated vs baseline.",
    destination: "dns.internal",
    mitreTactic: "Command and Control (TA0011)",
  },
  {
    id: "ALT-28460",
    timestamp: "2026-04-18T13:19:04Z",
    eventType: "Ransomware Precursor",
    sourceIp: "10.9.33.7",
    severity: "Critical",
    status: "Investigating",
    assignedAnalyst: "S. Patel",
    description:
      "Mass file extension rename attempts blocked by FSRM canary shares on file cluster.",
    destination: "fs-cluster-01",
    mitreTactic: "Impact (TA0040)",
    relatedIncidentId: "INC-2026-0882",
  },
];

export const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    time: "14:23:01",
    message: "New brute force attempt detected on bst-prod-01",
    tone: "crit",
  },
  {
    id: "act-2",
    time: "14:22:44",
    message: "Critical alert ALT-28491 escalated to Tier-2 queue",
    tone: "warn",
  },
  {
    id: "act-3",
    time: "14:21:18",
    message: "Incident INC-2026-0892 assigned to analyst J. Rivera",
    tone: "info",
  },
  {
    id: "act-4",
    time: "14:19:55",
    message: "Malware signature triggered on endpoint wkst-fin-044",
    tone: "warn",
  },
  {
    id: "act-5",
    time: "14:18:02",
    message: "Threat intel feed updated: 14 new IOCs ingested",
    tone: "info",
  },
  {
    id: "act-6",
    time: "14:16:33",
    message: "Playbook PB-WAF-001 executed successfully",
    tone: "success",
  },
];

export const ATTACK_TREND = [
  { hour: "06:00", events: 42 },
  { hour: "08:00", events: 78 },
  { hour: "10:00", events: 95 },
  { hour: "12:00", events: 112 },
  { hour: "14:00", events: 134 },
  { hour: "16:00", events: 98 },
  { hour: "18:00", events: 86 },
];

export const TOP_ATTACK_SOURCES = [
  { ip: "185.220.101.44", count: 1847, region: "EU" },
  { ip: "45.142.212.19", count: 1203, region: "EU" },
  { ip: "198.51.100.12", count: 942, region: "NA" },
  { ip: "203.0.113.77", count: 611, region: "APAC" },
  { ip: "192.0.2.55", count: 408, region: "NA" },
];

export const THREAT_REGIONS = [
  { code: "NA", label: "North America", x: 22, y: 38, intensity: 0.85 },
  { code: "EU", label: "Europe", x: 48, y: 32, intensity: 0.92 },
  { code: "APAC", label: "Asia Pacific", x: 78, y: 42, intensity: 0.7 },
  { code: "LATAM", label: "Latin America", x: 28, y: 68, intensity: 0.45 },
  { code: "MEA", label: "Middle East & Africa", x: 55, y: 55, intensity: 0.55 },
];

export function severityColor(sev: Severity): string {
  switch (sev) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#f97316";
    case "Medium":
      return "#eab308";
    case "Low":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}

export function statusColor(st: AlertStatus): string {
  if (st === "Resolved") return "#22c55e";
  if (st === "Escalated") return "#ef4444";
  if (st === "Investigating") return "#f97316";
  return "#38bdf8";
}
