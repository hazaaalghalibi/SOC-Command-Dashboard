import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchIncidents } from "../lib/api";
import type { IncidentSummary } from "../types/soc";
import { RecentIncidentsTable } from "../components/RecentIncidentsTable";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { Download, Loader2 } from "lucide-react";
import { downloadExport } from "../lib/api";

export function IncidentsPage() {
  const [params] = useSearchParams();
  const focusFromUrl = params.get("focus");

  const [rows, setRows] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    if (focusFromUrl) setFocus(focusFromUrl);
  }, [focusFromUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchIncidents();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">Cases</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Incidents</h1>
          <p className="mt-1 text-sm text-slate-400">
            Case queue from the database. Select a row to assign an analyst, add notes, or transition status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void downloadExport("/api/export/incidents", "soc-incidents.csv").catch(() => undefined)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/30 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading incidents…
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <RecentIncidentsTable items={rows} onRowClick={(id) => setFocus(id)} />
      )}

      <IncidentDetailModal
        incidentId={focus}
        onClose={() => setFocus(null)}
        onUpdated={() => {
          void (async () => {
            try {
              setRows(await fetchIncidents());
            } catch {
              /* ignore */
            }
          })();
        }}
      />
    </div>
  );
}
