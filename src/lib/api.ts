import type {
  ActivityItem,
  AnalyticsBundle,
  AppNotification,
  AuditEntry,
  AuthUser,
  DashboardPayload,
  DashboardSummary,
  DetectionRunResult,
  IncidentSummary,
  SecurityAlert,
  SimulationResult,
} from "../types/soc";

const TOKEN_KEY = "soc_token";

/** Base URL for API calls. Empty string uses the Vite dev proxy (/api to SOC API). */
export function apiBase(): string {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function skipAuthClient(): boolean {
  return import.meta.env.VITE_SOC_SKIP_AUTH === "true";
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}

export async function apiHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${apiBase()}/api/health`);
    return r.ok;
  } catch {
    return false;
  }
}

/** Avoids Unexpected end of JSON input when the response body is empty. */
async function parseJsonBody<T>(r: Response, what: string): Promise<T> {
  const text = await r.text();
  if (!text.trim()) {
    throw new Error(
      `${what}: empty response (HTTP ${r.status}). Is the SOC API running on http://127.0.0.1:4000?`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${what}: not JSON (HTTP ${r.status}). Check API URL and Vite /api proxy.`);
  }
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const r = await fetch(`${apiBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonBody<{ token?: string; user?: AuthUser; error?: string }>(r, "Login");
  if (!r.ok) throw new Error(data.error ?? `Login failed (${r.status})`);
  if (!data.token || !data.user) throw new Error("Invalid login response");
  return { token: data.token, user: data.user };
}

export async function apiMe(): Promise<AuthUser> {
  const r = await apiFetch("/api/auth/me");
  const data = await parseJsonBody<{ user?: AuthUser; error?: string }>(r, "/auth/me");
  if (!r.ok) throw new Error(data.error ?? "Not authenticated");
  if (!data.user) throw new Error("Invalid /auth/me response");
  return data.user;
}

export interface AlertQuery {
  severity?: string;
  status?: string;
  eventType?: string;
  sourceIp?: string;
  from?: string;
  to?: string;
}

export function buildAlertsUrl(q: AlertQuery): string {
  const params = new URLSearchParams();
  if (q.severity) params.set("severity", q.severity);
  if (q.status) params.set("status", q.status);
  if (q.eventType) params.set("eventType", q.eventType);
  if (q.sourceIp) params.set("sourceIp", q.sourceIp);
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  const s = params.toString();
  return `${apiBase()}/api/alerts${s ? `?${s}` : ""}`;
}

export async function fetchAlerts(q: AlertQuery): Promise<SecurityAlert[]> {
  const params = new URLSearchParams();
  if (q.severity) params.set("severity", q.severity);
  if (q.status) params.set("status", q.status);
  if (q.eventType) params.set("eventType", q.eventType);
  if (q.sourceIp) params.set("sourceIp", q.sourceIp);
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  const s = params.toString();
  const res = await apiFetch(`/api/alerts${s ? `?${s}` : ""}`);
  if (!res.ok) throw new Error(`Alerts ${res.status}`);
  return (await res.json()) as SecurityAlert[];
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  const r = await apiFetch("/api/dashboard");
  if (!r.ok) throw new Error(`Dashboard ${r.status}`);
  return (await r.json()) as DashboardPayload;
}

export async function fetchMetricsBundle(): Promise<{
  summary: DashboardSummary;
  counters: Record<string, number>;
  analytics: AnalyticsBundle;
}> {
  const r = await apiFetch("/api/metrics");
  if (!r.ok) throw new Error(`Metrics ${r.status}`);
  return (await r.json()) as {
    summary: DashboardSummary;
    counters: Record<string, number>;
    analytics: AnalyticsBundle;
  };
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const r = await apiFetch("/api/activity");
  if (!r.ok) throw new Error(`Activity ${r.status}`);
  return (await r.json()) as ActivityItem[];
}

export async function fetchIncidents(): Promise<IncidentSummary[]> {
  const r = await apiFetch("/api/incidents");
  if (!r.ok) throw new Error(`Incidents ${r.status}`);
  return (await r.json()) as IncidentSummary[];
}

export async function fetchAssignableUsers(): Promise<{ id: string; email: string; name: string; role: string }[]> {
  const r = await apiFetch("/api/users");
  if (!r.ok) throw new Error(`Users ${r.status}`);
  return (await r.json()) as { id: string; email: string; name: string; role: string }[];
}

export async function postLogsJson(logs: unknown[]): Promise<{ inserted: number }> {
  const r = await apiFetch("/api/logs/upload", { method: "POST", body: JSON.stringify({ logs }) });
  const data = (await r.json()) as { inserted?: number; error?: string };
  if (!r.ok) throw new Error(data.error ?? `Upload ${r.status}`);
  return { inserted: data.inserted ?? 0 };
}

export async function postLogsCsv(csv: string): Promise<{ inserted: number }> {
  const r = await apiFetch("/api/logs/upload", { method: "POST", body: JSON.stringify({ csv }) });
  const data = (await r.json()) as { inserted?: number; error?: string };
  if (!r.ok) throw new Error(data.error ?? `Upload ${r.status}`);
  return { inserted: data.inserted ?? 0 };
}

export async function postDetectionRun(): Promise<DetectionRunResult> {
  const r = await apiFetch("/api/detection/run", { method: "POST" });
  const data = (await r.json()) as DetectionRunResult & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Detection ${r.status}`);
  return data;
}

export async function postSimulation(scenario: string): Promise<SimulationResult> {
  const r = await apiFetch("/api/simulation/run", {
    method: "POST",
    body: JSON.stringify({ scenario }),
  });
  const data = (await r.json()) as SimulationResult & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Simulation ${r.status}`);
  return data;
}

export async function patchIncident(
  id: string,
  body: { status?: string; notes?: string | null; assignedToId?: string | null },
): Promise<void> {
  const r = await apiFetch(`/api/incidents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Incident update ${r.status}`);
}

export async function fetchSearch(q: string): Promise<{ alerts: SecurityAlert[]; incidents: IncidentSummary[] }> {
  const r = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(`Search ${r.status}`);
  return (await r.json()) as { alerts: SecurityAlert[]; incidents: IncidentSummary[] };
}

export async function fetchNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const r = await apiFetch("/api/notifications");
  if (!r.ok) throw new Error(`Notifications ${r.status}`);
  return (await r.json()) as { items: AppNotification[]; unread: number };
}

export async function markNotificationRead(id: string): Promise<void> {
  const r = await apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
  if (!r.ok) throw new Error("Failed to mark read");
}

export async function markAllNotificationsRead(): Promise<void> {
  const r = await apiFetch("/api/notifications/read-all", { method: "POST" });
  if (!r.ok) throw new Error("Failed to mark all read");
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const r = await apiFetch("/api/audit");
  if (!r.ok) throw new Error(`Audit ${r.status}`);
  return (await r.json()) as AuditEntry[];
}

export async function postConvertAlert(
  alertId: string,
  title?: string,
): Promise<{ incidentId: string; alert: SecurityAlert }> {
  const r = await apiFetch(`/api/alerts/${encodeURIComponent(alertId)}/convert`, {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
  const data = (await r.json()) as { incidentId?: string; alert?: SecurityAlert; error?: string };
  if (!r.ok) throw new Error(data.error ?? `Convert failed (${r.status})`);
  if (!data.incidentId || !data.alert) throw new Error("Invalid convert response");
  return { incidentId: data.incidentId, alert: data.alert };
}

export async function patchAlertApi(
  alertId: string,
  body: { status?: string; assignedAnalyst?: string },
): Promise<SecurityAlert> {
  const r = await apiFetch(`/api/alerts/${encodeURIComponent(alertId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as SecurityAlert & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Alert update ${r.status}`);
  return data as SecurityAlert;
}

/** Authenticated CSV download (blob). */
export async function downloadExport(path: "/api/export/alerts" | "/api/export/incidents", filename: string) {
  const r = await apiFetch(path);
  if (!r.ok) throw new Error(`Export failed (${r.status})`);
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  sourceIp: string;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  userAgent: string | null;
  message: string;
  outcome: string | null;
  userId: string | null;
}

export async function fetchLogs(
  q = "",
  limit = 100,
): Promise<{ items: SecurityLog[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit) });

  if (q.trim()) {
    params.set("q", q.trim());
  }

  const response = await apiFetch(`/api/logs?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Logs ${response.status}`);
  }

  return (await response.json()) as { items: SecurityLog[]; total: number };
}