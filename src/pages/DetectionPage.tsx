import { useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { postDetectionRun } from "../lib/api";
import { canMutate } from "../lib/roles";
import { useAuth } from "../context/AuthContext";

export function DetectionPage() {
  const { user } = useAuth();
  const editable = canMutate(user?.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ alertsCreated: number; incidentsCreated: number; rules: string[] } | null>(
    null,
  );

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await postDetectionRun();
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">Engine</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Detection engine</h1>
        <p className="mt-1 text-sm text-slate-400">
          Run correlation rules over the last 24h of ingested logs. New alerts and incidents are written to the
          database.
        </p>
      </div>

      {!editable ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Viewer role: manual detection runs are disabled.
        </p>
      ) : null}

      <button
        type="button"
        disabled={!editable || loading}
        onClick={() => void run()}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
        Run detection now
      </button>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {result ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Alerts created:</span>{" "}
            <span className="font-mono text-white">{result.alertsCreated}</span>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Incidents created:</span>{" "}
            <span className="font-mono text-white">{result.incidentsCreated}</span>
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Matched rules</p>
          <ul className="mt-1 list-inside list-disc font-mono text-xs text-cyan-200/90">
            {result.rules.length ? result.rules.map((r) => <li key={r}>{r}</li>) : <li>none</li>}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
