import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { fetchAudit } from "../lib/api";
import type { AuditEntry } from "../types/soc";

export function AuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchAudit();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400">
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">Compliance</p>
          <h1 className="font-display text-2xl font-bold text-white">Audit log</h1>
          <p className="mt-1 text-sm text-slate-400">
            Immutable record of analyst actions (status changes, assignments, alert conversions, logins).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : err ? (
        <p className="text-red-400">{err}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="hidden px-4 py-3 md:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">{r.actor?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 font-medium text-cyan-200/90">{r.action}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                    {r.entityType}:{r.entityId}
                  </td>
                  <td className="hidden max-w-md truncate px-4 py-2.5 text-slate-500 md:table-cell">
                    {r.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
