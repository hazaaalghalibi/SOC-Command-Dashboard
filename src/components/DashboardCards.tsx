import {
  AlertTriangle,
  Flame,
  FolderOpen,
  CheckCircle2,
  Globe2,
  KeyRound,
} from "lucide-react";
import type { DashboardSummary } from "../types/soc";

interface DashboardCardsProps {
  summary: DashboardSummary;
}

const cards: {
  key: keyof DashboardSummary;
  label: string;
  sub: string;
  icon: typeof AlertTriangle;
  accent: string;
}[] = [
  {
    key: "totalAlerts",
    label: "Total Security Alerts",
    sub: "Last 24h pipeline",
    icon: AlertTriangle,
    accent: "from-cyan-500/20 to-blue-600/5",
  },
  {
    key: "criticalAlerts",
    label: "Critical Alerts",
    sub: "Immediate response",
    icon: Flame,
    accent: "from-red-500/25 to-red-950/10",
  },
  {
    key: "openIncidents",
    label: "Open Incidents",
    sub: "Active case load",
    icon: FolderOpen,
    accent: "from-amber-500/20 to-orange-950/10",
  },
  {
    key: "resolvedIncidents",
    label: "Resolved Incidents",
    sub: "Closed last 7 days",
    icon: CheckCircle2,
    accent: "from-emerald-500/20 to-emerald-950/10",
  },
  {
    key: "suspiciousIps",
    label: "Suspicious IPs",
    sub: "Correlated threat actors",
    icon: Globe2,
    accent: "from-violet-500/20 to-fuchsia-950/10",
  },
  {
    key: "failedLogins",
    label: "Failed Login Attempts",
    sub: "Identity perimeter",
    icon: KeyRound,
    accent: "from-sky-500/20 to-slate-900/20",
  },
];

function formatValue(key: keyof DashboardSummary, v: number) {
  if (key === "failedLogins") return v.toLocaleString();
  return v.toLocaleString();
}

export function DashboardCards({ summary }: DashboardCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = summary[c.key];
        return (
          <article
            key={c.key}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-soc-panel/60 p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500/25 hover:shadow-glow"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-80 transition group-hover:opacity-100`}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-white text-glow">
                  {formatValue(c.key, value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 ring-1 ring-white/5 transition group-hover:ring-cyan-500/30">
                <Icon className="h-5 w-5 text-cyan-400/90" aria-hidden />
              </div>
            </div>
            <div className="relative mt-4 h-0.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent bg-[length:200%_100%]" />
            </div>
          </article>
        );
      })}
    </section>
  );
}
