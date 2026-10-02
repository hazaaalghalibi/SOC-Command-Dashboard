import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { postLogsCsv, postLogsJson } from "../lib/api";
import { canMutate } from "../lib/roles";
import { useAuth } from "../context/AuthContext";

const SAMPLE_JSON = `[
  {
    "sourceIp": "198.51.100.77",
    "message": "POST /api/login failed",
    "path": "/api/login",
    "method": "POST",
    "statusCode": 401,
    "outcome": "failed_login"
  }
]`;

const SAMPLE_CSV = `timestamp,sourceIp,method,path,statusCode,message,outcome
2026-04-18T15:00:00Z,10.2.3.4,POST,/auth/signin,401,invalid credentials,failed_login`;

export function LogIngestPage() {
  const { user } = useAuth();
  const editable = canMutate(user?.role);

  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [tab, setTab] = useState<"json" | "csv">("json");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ingestJson() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array of log objects");
      const result = await postLogsJson(parsed);
      setMessage(`Inserted ${result.inserted} log rows.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function ingestCsv() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await postLogsCsv(csvText);
      setMessage(`Inserted ${result.inserted} log rows.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">
          Pipeline
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Log ingestion</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload structured logs as JSON arrays or CSV. Data is validated server-side and stored in SQLite.
        </p>
      </div>

      {!editable ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Viewer role: ingestion is disabled. Sign in as analyst or admin.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("json")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            tab === "json" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5 text-slate-400"
          }`}
        >
          JSON
        </button>
        <button
          type="button"
          onClick={() => setTab("csv")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            tab === "csv" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5 text-slate-400"
          }`}
        >
          CSV
        </button>
      </div>

      {tab === "json" ? (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            disabled={!editable || loading}
            rows={14}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500/40"
          />
          <button
            type="button"
            disabled={!editable || loading}
            onClick={() => void ingestJson()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Validate & ingest JSON
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={!editable || loading}
            rows={14}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500/40"
          />
          <button
            type="button"
            disabled={!editable || loading}
            onClick={() => void ingestCsv()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Validate & ingest CSV
          </button>
        </div>
      )}

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
