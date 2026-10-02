import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { AnalyticsBundle, AlertStatus, SecurityAlert, Severity } from "../types/soc";
import { ATTACK_TREND, TOP_ATTACK_SOURCES } from "../data/sampleData";

const SEVERITY_ORDER: Severity[] = ["Critical", "High", "Medium", "Low"];

const CHART_COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#3b82f6",
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  Open: "#38bdf8",
  Investigating: "#f97316",
  Escalated: "#ef4444",
  Resolved: "#22c55e",
};

interface SecurityChartsProps {
  alerts: SecurityAlert[];
  /** When set (from API), charts use DB-backed aggregates instead of static series */
  analytics?: AnalyticsBundle | null;
}

function buildSeverityData(alerts: SecurityAlert[]) {
  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  for (const a of alerts) counts[a.severity]++;
  return SEVERITY_ORDER.map((name) => ({
    name,
    value: counts[name],
    color: CHART_COLORS[name],
  })).filter((d) => d.value > 0);
}

function buildStatusData(alerts: SecurityAlert[]) {
  const map = new Map<AlertStatus, number>();
  for (const a of alerts) {
    map.set(a.status, (map.get(a.status) ?? 0) + 1);
  }
  return (["Open", "Investigating", "Escalated", "Resolved"] as AlertStatus[]).map(
    (name) => ({
      name,
      count: map.get(name) ?? 0,
      fill: STATUS_COLORS[name],
    }),
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(12, 17, 28, 0.95)",
  border: "1px solid rgba(30, 41, 59, 0.9)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

export function SecurityCharts({ alerts, analytics }: SecurityChartsProps) {
  const severityData = analytics
    ? analytics.severity
        .filter((s) => s.value > 0)
        .map((s) => ({
          name: s.name,
          value: s.value,
          color: CHART_COLORS[s.name as Severity] ?? "#94a3b8",
        }))
    : buildSeverityData(alerts);
  const pieData =
    severityData.length > 0
      ? severityData
      : [{ name: "None" as const, value: 1, color: "#334155" }];
  const statusData = analytics
    ? analytics.status.map((s) => ({
        name: s.name as AlertStatus,
        count: s.count,
        fill: STATUS_COLORS[s.name as AlertStatus] ?? "#64748b",
      }))
    : buildStatusData(alerts);

  const trendData = analytics?.attackTrend?.length ? analytics.attackTrend : ATTACK_TREND;
  const topSources = analytics?.topAttackSources?.length ? analytics.topAttackSources : TOP_ATTACK_SOURCES;

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="glass-panel rounded-xl border border-white/10 p-4 transition hover:border-cyan-500/20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Alerts by Severity</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Live</span>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={96}
                paddingAngle={3}
                stroke="rgba(15,23,42,0.9)"
                strokeWidth={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`c-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                formatter={(value) => (
                  <span className="text-xs text-slate-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 p-4 transition hover:border-cyan-500/20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Attack Trend Over Time</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">7d window</span>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.35)" />
              <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="events"
                name="Events"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3, fill: "#0891b2", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#67e8f9" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 p-4 transition hover:border-cyan-500/20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Top Attack Sources</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">By volume</span>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSources} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.35)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="ip"
                width={118}
                tick={{ fill: "#cbd5e1", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _n, p) => [
                  `${value.toLocaleString()} events · ${p?.payload?.region}`,
                  "Source",
                ]}
              />
              <Bar dataKey="count" name="Events" radius={[0, 6, 6, 0]} fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 p-4 transition hover:border-cyan-500/20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Incident Status Distribution</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Case queue</span>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.35)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Alerts" radius={[6, 6, 0, 0]}>
                {statusData.map((e, i) => (
                  <Cell key={`s-${i}`} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
