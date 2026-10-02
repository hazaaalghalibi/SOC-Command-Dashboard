import type { AlertSourceType, Severity } from "../../types/soc";

const SEV: Record<Severity, string> = {
  Critical: "border-sev-critical/40 bg-sev-critical/12 text-red-100 ring-1 ring-sev-critical/25 shadow-[0_0_12px_rgba(239,68,68,0.12)]",
  High: "border-sev-high/40 bg-sev-high/12 text-orange-100 ring-1 ring-sev-high/25",
  Medium: "border-sev-medium/40 bg-sev-medium/12 text-amber-100 ring-1 ring-sev-medium/20",
  Low: "border-sev-low/40 bg-sev-low/12 text-sky-100 ring-1 ring-sev-low/25",
};

const SRC: Record<string, string> = {
  auth: "border-violet-500/35 bg-violet-500/10 text-violet-200",
  web: "border-cyan-500/35 bg-cyan-500/10 text-cyan-100",
  firewall: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  endpoint: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
};

const SRC_LABEL: Record<string, string> = {
  auth: "Identity",
  web: "Web / App",
  firewall: "Network",
  endpoint: "Endpoint",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEV[severity] ?? SEV.Low}`}
    >
      {severity}
    </span>
  );
}

export function SourceTypeBadge({ type }: { type?: AlertSourceType | string }) {
  const t = (type ?? "web").toLowerCase();
  const cls = SRC[t] ?? "border-slate-500/30 bg-slate-500/10 text-slate-300";
  const label = SRC_LABEL[t] ?? t;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
      title="Telemetry source"
    >
      {label}
    </span>
  );
}

export function MitreTag({ technique, tactic }: { technique?: string; tactic?: string }) {
  if (!technique && !tactic) return null;
  const tacticShort = tactic?.replace(/\s*\([^)]+\)\s*$/, "").trim() ?? "";
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded border border-fuchsia-500/25 bg-fuchsia-950/40 px-2 py-0.5 font-mono text-[10px] text-fuchsia-200/95 ring-1 ring-fuchsia-500/10"
      title={tactic ? `MITRE: ${tactic}` : technique ?? ""}
    >
      {technique ? <span className="font-semibold text-fuchsia-100">{technique}</span> : null}
      {technique && tacticShort ? <span className="text-fuchsia-500/80">·</span> : null}
      {technique && tacticShort ? (
        <span className="truncate text-fuchsia-300/80">{tacticShort}</span>
      ) : !technique && tactic ? (
        <span className="truncate text-fuchsia-300/80">{tactic}</span>
      ) : null}
    </span>
  );
}

export function AnalystChip({ name }: { name: string }) {
  const short = name === "Unassigned" ? "?" : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 py-0.5 pl-1 pr-2.5 text-[11px] font-medium text-slate-200 ring-1 ring-white/5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600/80 to-slate-700 text-[9px] font-bold text-white">
        {short}
      </span>
      {name}
    </span>
  );
}
