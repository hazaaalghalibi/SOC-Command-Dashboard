import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { apiFetch, fetchAssignableUsers, patchIncident } from "../lib/api";
import type { IncidentStatus, TimelineEvent } from "../types/soc";
import { CaseTimeline } from "./soc/CaseTimeline";
import { canMutate } from "../lib/roles";
import { useAuth } from "../context/AuthContext";

const STATUSES: IncidentStatus[] = [
  "Open",
  "Investigating",
  "Escalated",
  "Contained",
  "Resolved",
  "Closed",
];

interface IncidentRow {
  id: string;
  title: string;
  status: string;
  severity: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role?: string } | null;
  timeline?: TimelineEvent[];
}

interface IncidentDetailModalProps {
  incidentId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function IncidentDetailModal({ incidentId, onClose, onUpdated }: IncidentDetailModalProps) {
  const { user } = useAuth();
  const editable = canMutate(user?.role);

  const [row, setRow] = useState<IncidentRow | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!incidentId) {
      setRow(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [ir, ur] = await Promise.all([
          apiFetch(`/api/incidents/${encodeURIComponent(incidentId)}`).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json() as Promise<IncidentRow>;
          }),
          fetchAssignableUsers().catch(() => []),
        ]);
        if (cancelled) return;
        setRow(ir);
        setNotesDraft(ir.notes ?? "");
        setUsers(ur);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  if (!incidentId) return null;

  async function applyPatch(body: { status?: string; notes?: string | null; assignedToId?: string | null }) {
    if (!editable) return;
    setSaving(true);
    setError(null);
    try {
      await patchIncident(incidentId, body);
      onUpdated?.();
      const r = await apiFetch(`/api/incidents/${encodeURIComponent(incidentId)}`);
      if (r.ok) {
        const next = (await r.json()) as IncidentRow;
        setRow(next);
        setNotesDraft(next.notes ?? "");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0a101a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Incident</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-white">
              {row?.id ?? incidentId}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{row?.title ?? "…"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative max-h-[65vh] space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading incident…
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : row ? (
            <>
              <p className="text-xs text-slate-500">
                Updated {new Date(row.updatedAt).toLocaleString()} · Severity {row.severity}
              </p>
              {row.description ? <p className="text-sm text-slate-300">{row.description}</p> : null}

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
                <select
                  value={row.status}
                  disabled={!editable || saving}
                  onChange={(e) => void applyPatch({ status: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Assigned analyst
                </label>
                <select
                  value={row.assignedTo?.id ?? ""}
                  disabled={!editable || saving}
                  onChange={(e) => {
                    const v = e.target.value;
                    void applyPatch({ assignedToId: v === "" ? null : v });
                  }}
                  className="w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Investigation notes
                </label>
                <textarea
                  value={notesDraft}
                  disabled={!editable || saving}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
                  placeholder="Timeline, containment actions, evidence…"
                />
                {editable ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void applyPatch({ notes: notesDraft })}
                    className="rounded-md bg-cyan-600/90 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500"
                  >
                    {saving ? "Saving…" : "Save notes"}
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-500">Viewer role: read-only.</p>
                )}
              </div>

              {row.timeline?.length ? (
                <div className="border-t border-white/10 pt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Case timeline
                  </p>
                  <CaseTimeline events={row.timeline} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
