import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { THREAT_REGIONS, TOP_ATTACK_SOURCES } from "../data/sampleData";

export function ThreatMap() {
  const topIps = useMemo(() => TOP_ATTACK_SOURCES.slice(0, 5), []);

  return (
    <section className="glass-panel rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Global Threat Surface</h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Simulated</span>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
        <div
          className="absolute inset-0 bg-grid-pattern bg-grid opacity-40"
          style={{ backgroundSize: "24px 24px" }}
        />
        <svg viewBox="0 0 100 60" className="relative h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx="50"
              cy="32"
              rx={28 + i * 6}
              ry={16 + i * 4}
              fill="none"
              stroke="rgba(34,211,238,0.08)"
              strokeWidth="0.4"
              className="animate-pulse-slow"
              style={{ animationDelay: `${i * 400}ms` }}
            />
          ))}

          {THREAT_REGIONS.map((r) => (
            <g key={r.code}>
              <circle
                cx={r.x}
                cy={r.y}
                r={4 + r.intensity * 5}
                fill="url(#glow)"
                className="animate-pulse-slow"
              />
              <circle
                cx={r.x}
                cy={r.y}
                r={1.6}
                fill="#e2e8f0"
                opacity={0.9}
              />
              <text
                x={r.x}
                y={r.y + 8}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="3.2"
                className="font-sans"
              >
                {r.code}
              </text>
            </g>
          ))}

          <path
            d="M 22 38 Q 48 28 78 42"
            stroke="url(#arc)"
            strokeWidth="0.6"
            fill="none"
            strokeDasharray="2 2"
            className="animate-pulse-slow"
          />
          <path
            d="M 48 32 Q 55 48 28 68"
            stroke="rgba(99,102,241,0.35)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 2"
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Correlation engine · multi-region ingress
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
          Top Attacking IPs
        </div>
        <ul className="space-y-1.5">
          {topIps.map((row, i) => (
            <li
              key={row.ip}
              className="flex items-center justify-between rounded-md border border-white/5 bg-black/25 px-2.5 py-1.5 text-xs transition hover:border-cyan-500/25"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 font-mono text-[10px] text-cyan-300">
                  {i + 1}
                </span>
                <span className="font-mono text-slate-200">{row.ip}</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {row.count.toLocaleString()} hits · {row.region}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
