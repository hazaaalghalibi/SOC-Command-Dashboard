import { Radio } from "lucide-react";
import type { ActivityItem } from "../types/soc";

interface ActivityFeedProps {
  items: ActivityItem[];
}

function toneClass(tone: ActivityItem["tone"]) {
  switch (tone) {
    case "crit":
      return "border-l-red-500/80 bg-red-500/5";
    case "warn":
      return "border-l-amber-500/80 bg-amber-500/5";
    case "success":
      return "border-l-emerald-500/80 bg-emerald-500/5";
    default:
      return "border-l-cyan-500/70 bg-cyan-500/5";
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section className="glass-panel flex max-h-[420px] min-h-0 flex-col rounded-xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </span>
          <h2 className="text-sm font-semibold text-white">Live Security Activity</h2>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <Radio className="h-3 w-3 text-emerald-400" aria-hidden />
          Stream
        </div>
      </div>
      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-8 text-center text-xs text-slate-500">
            No activity yet. Ingest logs or run the simulator to populate the stream.
          </p>
        ) : null}
        {items.map((item, idx) => (
          <div
            key={item.id ?? `act-${idx}`}
            className={`rounded-lg border border-white/5 border-l-2 px-3 py-2.5 text-xs transition duration-300 hover:border-white/15 ${toneClass(item.tone)}`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-slate-500">{item.time ?? "—"}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                SOC
              </span>
            </div>
            <p className="leading-snug text-slate-200">{item.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
