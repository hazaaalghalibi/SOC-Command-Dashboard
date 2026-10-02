import { useMemo } from "react";
import { Filter, ChevronDown } from "lucide-react";
import type { AlertStatus, SecurityAlert, Severity } from "../types/soc";
import { severityColor, statusColor } from "../data/sampleData";
import { AnalystChip, SourceTypeBadge } from "./soc/Badges";

const EVENT_TYPES = [
  "Brute Force Attempt",
  "Port Scan Detected",
  "Suspicious Login",
  "SQL Injection Attempt",
  "DNS Tunneling Suspected",
  "Failed Login Attempt",
  "Malware Signature Triggered",
  "Data Exfiltration Pattern",
  "Privilege Escalation",
  "Ransomware Precursor",
] as const;

interface AlertsTableProps {
  alerts: SecurityAlert[];
  search: string;
  severityFilter: Severity | "All";
  onSeverityFilter: (s: Severity | "All") => void;
  statusFilter: AlertStatus | "All";
  onStatusFilter: (s: AlertStatus | "All") => void;
  eventTypeFilter: string;
  onEventTypeFilter: (s: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (s: string) => void;
  onDateToChange: (s: string) => void;
  sourceIpFilter: string;
  onSourceIpFilter: (s: string) => void;
  onRowClick: (alert: SecurityAlert) => void;
}

function sevBadgeClass(sev: Severity) {
  switch (sev) {
    case "Critical":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    case "High":
      return "bg-orange-500/15 text-orange-200 ring-orange-500/30";
    case "Medium":
      return "bg-yellow-500/15 text-yellow-200 ring-yellow-500/25";
    case "Low":
      return "bg-blue-500/15 text-blue-200 ring-blue-500/30";
    default:
      return "bg-slate-500/15 text-slate-200";
  }
}

function statusBadgeClass(st: SecurityAlert["status"]) {
  if (st === "Resolved") return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25";
  if (st === "Escalated") return "bg-red-500/15 text-red-200 ring-red-500/25";
  if (st === "Investigating") return "bg-orange-500/15 text-orange-200 ring-orange-500/25";
  return "bg-sky-500/15 text-sky-200 ring-sky-500/25";
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AlertsTable({
  alerts,
  search,
  severityFilter,
  onSeverityFilter,
  statusFilter,
  onStatusFilter,
  eventTypeFilter,
  onEventTypeFilter,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  sourceIpFilter,
  onSourceIpFilter,
  onRowClick,
}: AlertsTableProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      if (!q) return true;
      const blob = [
        a.id,
        a.eventType,
        a.sourceIp,
        a.severity,
        a.status,
        a.assignedAnalyst,
        a.description,
        a.mitreTechnique,
        a.mitreTactic,
        a.sourceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [alerts, search]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0f18]/80 shadow-card backdrop-blur-md">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Alerts</h2>
            <p className="text-xs text-slate-500">
              {filtered.length} of {alerts.length} visible · click a row for details
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <select
              value={severityFilter}
              onChange={(e) => onSeverityFilter(e.target.value as Severity | "All")}
              className="appearance-none rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-8 pr-8 text-xs font-medium text-slate-200 outline-none ring-cyan-500/0 transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value as AlertStatus | "All")}
              className="appearance-none rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-3 pr-8 text-xs font-medium text-slate-200 outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={eventTypeFilter}
              onChange={(e) => onEventTypeFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-3 pr-8 text-xs font-medium text-slate-200 outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">All event types</option>
              {EVENT_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>

          <input
            type="datetime-local"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-500/40"
            title="From (UTC/local per browser)"
          />
          <input
            type="datetime-local"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-500/40"
            title="To"
          />

          <input
            type="text"
            value={sourceIpFilter}
            onChange={(e) => onSourceIpFilter(e.target.value)}
            placeholder="Source IP contains…"
            className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="whitespace-nowrap px-4 py-3">Alert ID</th>
              <th className="whitespace-nowrap px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="whitespace-nowrap px-4 py-3 font-mono text-xs">Source IP</th>
              <th className="whitespace-nowrap px-4 py-3">Telemetry</th>
              <th className="whitespace-nowrap px-4 py-3">MITRE</th>
              <th className="whitespace-nowrap px-4 py-3">Severity</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Analyst</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                onClick={() => onRowClick(a)}
                className="cursor-pointer border-b border-white/5 transition hover:bg-cyan-500/5"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-cyan-200/90">
                  {a.id}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                  {formatTs(a.timestamp)}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-slate-200">{a.eventType}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-300">
                  {a.sourceIp}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SourceTypeBadge type={a.sourceType} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-fuchsia-200/90">
                  {a.mitreTechnique ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${sevBadgeClass(a.severity)}`}
                    style={{ boxShadow: `0 0 12px ${severityColor(a.severity)}22` }}
                  >
                    {a.severity}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(a.status)}`}
                    style={{ boxShadow: `0 0 12px ${statusColor(a.status)}22` }}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AnalystChip name={a.assignedAnalyst} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No alerts match your filters.</p>
        ) : null}
      </div>
    </section>
  );
}
