import { GitBranch, User } from "lucide-react";
import type { TimelineEvent } from "../../types/soc";

const KIND_LABEL: Record<string, string> = {
  case_opened: "Case",
  alert_linked: "Alert",
  status_change: "Status",
  note: "Notes",
  assignment: "Assign",
  conversion: "Promote",
};

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">
        No timeline events yet. Actions on this case will appear here.
      </p>
    );
  }

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-0 left-[7px] top-2 w-px bg-gradient-to-b from-cyan-500/40 via-white/10 to-transparent" />
      <ul className="space-y-4">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-4 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-cyan-500/50 bg-soc-bg text-[8px] text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.35)]">
              ·
            </span>
            <div className="rounded-lg border border-white/5 bg-black/25 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  <GitBranch className="h-3 w-3" />
                  {KIND_LABEL[e.kind] ?? e.kind}
                </span>
                <time className="text-[10px] text-slate-500">{new Date(e.at).toLocaleString()}</time>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-100">{e.title}</p>
              {e.detail ? <p className="mt-0.5 text-xs text-slate-500">{e.detail}</p> : null}
              {e.actor ? (
                <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                  <User className="h-3 w-3" />
                  {e.actor.name}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
