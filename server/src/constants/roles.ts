export const SOC_ROLES = ["admin", "analyst", "viewer"] as const;
export type SocRole = (typeof SOC_ROLES)[number];

export function isSocRole(s: string): s is SocRole {
  return (SOC_ROLES as readonly string[]).includes(s);
}

export const INCIDENT_STATUSES = [
  "Open",
  "Investigating",
  "Escalated",
  "Contained",
  "Resolved",
  "Closed",
] as const;
