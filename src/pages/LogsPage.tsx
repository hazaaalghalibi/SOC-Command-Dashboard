import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { fetchLogs, type SecurityLog } from "../lib/api";

export function LogsPage() {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchLogs(search);
      setLogs(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs("");
  }, [loadLogs]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadLogs(query);
  }

  return (
    <div className="space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-500/80">
            Log management
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Security Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Search and review the latest logs stored in the SOC database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs(query)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search IP, path, message, method, or outcome..."
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Log events</h2>
          <span className="font-mono text-xs text-slate-500">{total} matching logs</span>
        </div>

        {error ? (
          <p className="p-4 text-sm text-red-400">Could not load logs: {error}</p>
        ) : loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Source IP</th>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-cyan-200">
                      {log.sourceIp}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {log.method ?? "—"} {log.path ?? ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {log.statusCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {log.outcome ?? "—"}
                    </td>
                    <td className="max-w-sm px-4 py-3 text-xs text-slate-400">
                      <span className="block truncate" title={log.message}>
                        {log.message}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}