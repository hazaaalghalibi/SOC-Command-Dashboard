import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Download, RefreshCw } from "lucide-react";
import { DashboardCards } from "../components/DashboardCards";
import { SecurityCharts } from "../components/SecurityCharts";
import { AlertsTable } from "../components/AlertsTable";
import { ActivityFeed } from "../components/ActivityFeed";
import { ThreatMap } from "../components/ThreatMap";
import { IncidentModal } from "../components/IncidentModal";
import { RecentIncidentsTable } from "../components/RecentIncidentsTable";
import { RecentAlertsTable } from "../components/RecentAlertsTable";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import type { DashboardOutletContext } from "../layouts/AppLayout";
import type {
  ActivityItem,
  AnalyticsBundle,
  DashboardPayload,
  DashboardSummary,
  SecurityAlert,
  Severity,
  AlertStatus,
} from "../types/soc";
import { INITIAL_ACTIVITY, INITIAL_ALERTS } from "../data/sampleData";
import { apiFetch, apiHealth, downloadExport, fetchAlerts, fetchDashboard } from "../lib/api";
import { canMutate } from "../lib/roles";
import { useAuth } from "../context/AuthContext";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function clockTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function buildSummary(
  alerts: SecurityAlert[],
  failedLoginBoost: number,
  suspiciousBoost: number,
): DashboardSummary {
  const criticalAlerts = alerts.filter((a) => a.severity === "Critical").length;
  const openIds = new Set(
    alerts.filter((a) => a.relatedIncidentId && a.status !== "Resolved").map((a) => a.relatedIncidentId as string),
  );
  const resolvedIds = new Set(
    alerts.filter((a) => a.relatedIncidentId && a.status === "Resolved").map((a) => a.relatedIncidentId as string),
  );
  const suspiciousIps =
    new Set(
      alerts.filter((a) => a.severity === "High" || a.severity === "Critical").map((a) => a.sourceIp),
    ).size +
    118 +
    suspiciousBoost;

  return {
    totalAlerts: alerts.length,
    criticalAlerts,
    openIncidents: openIds.size,
    resolvedIncidents: resolvedIds.size,
    suspiciousIps,
    failedLogins: 18_420 + failedLoginBoost,
  };
}

const LIVE_TEMPLATES: { message: string; tone: ActivityItem["tone"] }[] = [
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

const SYNTH_MITRE = ["T1110", "T1190", "T1078", "T1046", "T1059"] as const;
const SYNTH_SRC = ["auth", "web", "firewall", "endpoint"] as const;

let synthCounter = 28520;

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomSeverity(): Severity {
  const r = Math.random();
  if (r < 0.14) return "Critical";
  if (r < 0.32) return "High";
  if (r < 0.68) return "Medium";
  return "Low";
}

function synthAlert(): SecurityAlert {
  synthCounter += 1;
  const severity = randomSeverity();
  const statuses: SecurityAlert["status"][] = ["Open", "Investigating", "Escalated"];
  const status = randomPick(statuses);
  return {
    id: `ALT-${synthCounter}`,
    timestamp: new Date().toISOString(),
    eventType: randomPick(SYNTH_TYPES),
    sourceIp: randomPick(SYNTH_IPS),
    severity,
    status,
    assignedAnalyst: randomPick(ANALYSTS),
    description:
      "Automated correlation detected anomalous behavior matching enterprise detection logic. Analyst review recommended.",
    destination: "multi-asset",
    mitreTactic: "Discovery (TA0007)",
    mitreTechnique: randomPick(SYNTH_MITRE),
    sourceType: randomPick(SYNTH_SRC),
    relatedIncidentId: Math.random() > 0.55 ? `INC-2026-${9000 + Math.floor(Math.random() * 800)}` : undefined,
  };
}

interface Snapshot {
  alerts: SecurityAlert[];
  activity: ActivityItem[];
  summary: DashboardSummary;
  analytics: AnalyticsBundle;
}

function filterDemoAlerts(
  rows: SecurityAlert[],
  severityFilter: Severity | "All",
  statusFilter: AlertStatus | "All",
  eventTypeFilter: string,
  sourceIpFilter: string,
  dateFrom: string,
  dateTo: string,
): SecurityAlert[] {
  return rows.filter((a) => {
    if (severityFilter !== "All" && a.severity !== severityFilter) return false;
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    if (eventTypeFilter && a.eventType !== eventTypeFilter) return false;
    if (sourceIpFilter && !a.sourceIp.includes(sourceIpFilter)) return false;
    if (dateFrom && new Date(a.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.timestamp) > new Date(dateTo)) return false;
    return true;
  });
}

export function DashboardPage() {
  const { search } = useOutletContext<DashboardOutletContext>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [useApi, setUseApi] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "All">("All");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sourceIpFilter, setSourceIpFilter] = useState("");

  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => [...INITIAL_ALERTS]);
  const [activity, setActivity] = useState<ActivityItem[]>(() => [...INITIAL_ACTIVITY]);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [serverSummary, setServerSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsBundle | null>(null);
  const [selected, setSelected] = useState<SecurityAlert | null>(null);
  const [incidentFocus, setIncidentFocus] = useState<string | null>(null);
  const [failedLoginBoost, setFailedLoginBoost] = useState(0);
  const [suspiciousBoost, setSuspiciousBoost] = useState(0);

  const alertQuery = useMemo(() => {
    const q: Parameters<typeof fetchAlerts>[0] = {};
    if (severityFilter !== "All") q.severity = severityFilter;
    if (statusFilter !== "All") q.status = statusFilter;
    if (eventTypeFilter) q.eventType = eventTypeFilter;
    if (sourceIpFilter) q.sourceIp = sourceIpFilter;
    if (dateFrom) q.from = new Date(dateFrom).toISOString();
    if (dateTo) q.to = new Date(dateTo).toISOString();
    return q;
  }, [severityFilter, statusFilter, eventTypeFilter, sourceIpFilter, dateFrom, dateTo]);

  const hasActiveApiFilters = useMemo(
    () =>
      severityFilter !== "All" ||
      statusFilter !== "All" ||
      !!eventTypeFilter ||
      !!dateFrom ||
      !!dateTo ||
      !!sourceIpFilter,
    [severityFilter, statusFilter, eventTypeFilter, dateFrom, dateTo, sourceIpFilter],
  );

  const refetchAlerts = useCallback(async () => {
    const al = await fetchAlerts(alertQuery);
    setAlerts(al);
  }, [alertQuery]);

  const localSummary = useMemo(
    () => buildSummary(alerts, failedLoginBoost, suspiciousBoost),
    [alerts, failedLoginBoost, suspiciousBoost],
  );

  const demoTableAlerts = useMemo(
    () => filterDemoAlerts(alerts, severityFilter, statusFilter, eventTypeFilter, sourceIpFilter, dateFrom, dateTo),
    [alerts, severityFilter, statusFilter, eventTypeFilter, sourceIpFilter, dateFrom, dateTo],
  );

  const tableAlerts = useApi ? alerts : demoTableAlerts;

  const summary = useApi && serverSummary ? serverSummary : localSummary;

  const pushActivity = useCallback((message: string, tone: ActivityItem["tone"]) => {
    const id = `act-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setActivity((prev) => [{ id, time: clockTime(new Date()), message, tone }, ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await apiHealth();
      if (cancelled) return;
      if (ok) {
        try {
          const dash = await fetchDashboard();
          const all = await fetchAlerts({});
          if (cancelled) return;
          setUseApi(true);
          setDashboard(dash);
          setServerSummary(dash.summary);
          setAnalytics(dash.analytics);
          setActivity(dash.activity);
          setAlerts(all);
          setLoadError(null);
          setLastSync(new Date());
        } catch (e) {
          setUseApi(false);
          setLoadError(String(e));
          setAlerts([...INITIAL_ALERTS]);
          setActivity([...INITIAL_ACTIVITY]);
          setDashboard(null);
          setServerSummary(null);
          setAnalytics(null);
        }
      } else {
        setUseApi(false);
        setAlerts([...INITIAL_ALERTS]);
        setActivity([...INITIAL_ACTIVITY]);
        setDashboard(null);
        setServerSummary(null);
        setAnalytics(null);
      }
      setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!useApi || !bootstrapped) return;
    void refetchAlerts();
  }, [useApi, bootstrapped, alertQuery, refetchAlerts]);

  useEffect(() => {
    if (!useApi || !bootstrapped || !canMutate(user?.role)) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const data = (await apiFetch(`/api/tick/live`, {
            method: "POST",
          }).then((r) => r.json())) as Snapshot;
          setActivity(data.activity);
          setServerSummary(data.summary);
          setAnalytics(data.analytics);
          setDashboard((d) =>
            d
              ? {
                  ...d,
                  summary: data.summary,
                  activity: data.activity,
                  analytics: data.analytics,
                }
              : d,
          );
          if (hasActiveApiFilters) {
            await refetchAlerts();
          } else {
            setAlerts(data.alerts);
          }
        } catch {
          /* ignore */
        }
      })();
    }, 11_000);
    return () => window.clearInterval(id);
  }, [useApi, bootstrapped, hasActiveApiFilters, refetchAlerts, user?.role]);

  useEffect(() => {
    if (!useApi || !bootstrapped || !canMutate(user?.role)) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const data = (await apiFetch(`/api/tick/ingest`, {
            method: "POST",
          }).then((r) => r.json())) as Snapshot;
          setActivity(data.activity);
          setServerSummary(data.summary);
          setAnalytics(data.analytics);
          setDashboard((d) =>
            d
              ? {
                  ...d,
                  summary: data.summary,
                  activity: data.activity,
                  analytics: data.analytics,
                }
              : d,
          );
          if (hasActiveApiFilters) {
            await refetchAlerts();
          } else {
            setAlerts(data.alerts);
          }
        } catch {
          /* ignore */
        }
      })();
    }, 38_000);
    return () => window.clearInterval(id);
  }, [useApi, bootstrapped, hasActiveApiFilters, refetchAlerts, user?.role]);

  useEffect(() => {
    if (useApi || !bootstrapped) return;
    const tick = window.setInterval(() => {
      const tpl = randomPick(LIVE_TEMPLATES);
      pushActivity(tpl.message, tpl.tone);
      setFailedLoginBoost((b) => b + Math.floor(Math.random() * 4) + 1);
      if (Math.random() > 0.65) setSuspiciousBoost((b) => b + 1);
    }, 11_000);
    return () => window.clearInterval(tick);
  }, [useApi, bootstrapped, pushActivity]);

  useEffect(() => {
    if (useApi || !bootstrapped) return;
    const heavy = window.setInterval(() => {
      if (Math.random() > 0.35) {
        setAlerts((prev) => [synthAlert(), ...prev].slice(0, 24));
        pushActivity("New correlated alert ingested from data lake stream", "info");
      }
    }, 38_000);
    return () => window.clearInterval(heavy);
  }, [useApi, bootstrapped, pushActivity]);

  useEffect(() => {
    const st = location.state as { openAlertId?: string } | null;
    const openId = st?.openAlertId;
    if (!openId) return;
    const found = alerts.find((a) => a.id === openId);
    if (found) {
      setSelected(found);
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, alerts, navigate]);

  useEffect(() => {
    if (!useApi || !bootstrapped) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const dash = await fetchDashboard();
          setDashboard(dash);
          setServerSummary(dash.summary);
          setAnalytics(dash.analytics);
          setActivity(dash.activity);
          setLastSync(new Date());
          if (hasActiveApiFilters) {
            await refetchAlerts();
          } else {
            setAlerts(await fetchAlerts({}));
          }
        } catch {
          /* ignore */
        }
      })();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [useApi, bootstrapped, hasActiveApiFilters, refetchAlerts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setIncidentFocus(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!bootstrapped) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-white">Loading SOC dashboard…</p>
          <p className="mt-2 text-sm text-slate-500">Checking API and telemetry backend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">
            Security Operations Center
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            Mission Control
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {useApi
              ? "Live metrics, incidents, alerts, and activity from the SOC API. Charts aggregate SQLite-backed data."
              : "Demo mode: sample data in the browser. Start the API for database-backed monitoring."}
          </p>
          {loadError ? <p className="mt-2 text-xs text-amber-400">API note: {loadError}</p> : null}
        </div>
        <div className="mt-3 flex flex-col items-stretch gap-2 md:mt-0 md:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
              {useApi ? "API + DB" : "Browser demo"}
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Role: {user?.role ?? "—"}
            </span>
          </div>
          {useApi ? (
            <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-cyan-500/70" aria-hidden />
                Auto-refresh 30s
                {lastSync ? ` · synced ${lastSync.toLocaleTimeString()}` : null}
              </span>
              <button
                type="button"
                onClick={() =>
                  void downloadExport("/api/export/alerts", "soc-alerts.csv").catch(() => undefined)
                }
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
              >
                <Download className="h-3 w-3" />
                Alerts CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  void downloadExport("/api/export/incidents", "soc-incidents.csv").catch(() => undefined)
                }
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
              >
                <Download className="h-3 w-3" />
                Incidents CSV
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <DashboardCards summary={summary} />
      <SecurityCharts alerts={alerts} analytics={useApi ? analytics : null} />

      {useApi && dashboard ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-white/[0.07] bg-[#0a0f18]/85 p-4 shadow-card backdrop-blur-md">
            <h2 className="mb-3 text-sm font-semibold text-white">Recent incidents</h2>
            <RecentIncidentsTable
              items={dashboard.recentIncidents}
              onRowClick={(id) => setIncidentFocus(id)}
            />
          </section>
          <section className="rounded-xl border border-white/[0.07] bg-[#0a0f18]/85 p-4 shadow-card backdrop-blur-md">
            <h2 className="mb-3 text-sm font-semibold text-white">Recent alerts</h2>
            <RecentAlertsTable items={dashboard.recentAlerts} onRowClick={setSelected} />
          </section>
        </div>
      ) : null}

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex min-h-[480px] flex-col xl:col-span-2">
          <AlertsTable
            alerts={tableAlerts}
            search={search}
            severityFilter={severityFilter}
            onSeverityFilter={setSeverityFilter}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            eventTypeFilter={eventTypeFilter}
            onEventTypeFilter={setEventTypeFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            sourceIpFilter={sourceIpFilter}
            onSourceIpFilter={setSourceIpFilter}
            onRowClick={setSelected}
          />
        </div>
        <div className="flex flex-col gap-4">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Activity timeline
            </h2>
            <ActivityFeed items={activity} />
          </section>
          <ThreatMap />
        </div>
      </div>

      <IncidentModal
        alert={selected}
        onClose={() => setSelected(null)}
        useApi={useApi}
        onAlertRefreshed={setSelected}
        onIncidentUpdated={() => {
          void refetchAlerts();
          void (async () => {
            try {
              const dash = await fetchDashboard();
              setDashboard(dash);
              setServerSummary(dash.summary);
            } catch {
              /* ignore */
            }
          })();
        }}
      />
      <IncidentDetailModal
        incidentId={incidentFocus}
        onClose={() => setIncidentFocus(null)}
        onUpdated={() => {
          void (async () => {
            try {
              const dash = await fetchDashboard();
              setDashboard(dash);
            } catch {
              /* ignore */
            }
          })();
        }}
      />
    </div>
  );
}
