import { useEffect, useState } from "react";
import {
  X,
  ShieldAlert,
  Network,
  Hash,
  Layers,
  Loader2,
  FolderPlus,
} from "lucide-react";
import type { IncidentStatus, SecurityAlert, Severity, TimelineEvent } from "../types/soc";
import { statusColor } from "../data/sampleData";
import {
  apiFetch,
  fetchAssignableUsers,
  patchAlertApi,
  patchIncident,
  postConvertAlert,
} from "../lib/api";
import { canMutate } from "../lib/roles";
import { useAuth } from "../context/AuthContext";
import { AnalystChip, MitreTag, SeverityBadge, SourceTypeBadge } from "./soc/Badges";
import { CaseTimeline } from "./soc/CaseTimeline";

export interface IncidentDetail {
  id: string;
  title: string;
  status: string;
  severity: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role?: string } | null;
  alerts: { id: string; eventType: string; severity: string; timestamp: string }[];
  timeline?: TimelineEvent[];
}

const INCIDENT_STATUSES: IncidentStatus[] = [
  "Open",
  "Investigating",
  "Escalated",
  "Contained",
  "Resolved",
  "Closed",
];

interface IncidentModalProps {
  alert: SecurityAlert | null;
  onClose: () => void;
  useApi: boolean;
  onIncidentUpdated?: () => void;
  onAlertRefreshed?: (a: SecurityAlert) => void;
}

export function IncidentModal({
  alert,
  onClose,
  useApi,
  onIncidentUpdated,
  onAlertRefreshed,
}: IncidentModalProps) {
  const { user } = useAuth();
  const editable = canMutate(user?.role);

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!alert?.relatedIncidentId || !useApi) {
      setIncident(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [r, ur] = await Promise.all([
          apiFetch(`/api/incidents/${encodeURIComponent(alert.relatedIncidentId!)}`).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<IncidentDetail>;
          }),
          fetchAssignableUsers().catch(() => []),
        ]);
        if (!cancelled) {
          setIncident(r);
          setNotesDraft(r.notes ?? "");
          setUsers(ur);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alert, useApi]);

  if (!alert) return null;

  const incidentId = alert.relatedIncidentId;

  async function applyPatch(body: { status?: string; notes?: string | null; assignedToId?: string | null }) {
    if (!incidentId || !useApi || !editable) return;
    setSaving(true);
    setError(null);
    try {
      await patchIncident(incidentId, body);
      onIncidentUpdated?.();
      const r = await apiFetch(`/api/incidents/${encodeURIComponent(incidentId)}`);
      if (r.ok) {
        const data = (await r.json()) as IncidentDetail;
        setIncident(data);
        setNotesDraft(data.notes ?? "");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function convertToCase() {
    if (!useApi || !editable || alert.relatedIncidentId) return;
    setConverting(true);
    setError(null);
    try {
      const { alert: next } = await postConvertAlert(alert.id);
      onAlertRefreshed?.(next);
      onIncidentUpdated?.();
      const r = await apiFetch(`/api/incidents/${encodeURIComponent(next.relatedIncidentId!)}`);
      if (r.ok) {
        const data = (await r.json()) as IncidentDetail;
        setIncident(data);
        setNotesDraft(data.notes ?? "");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setConverting(false);
    }
  }

  async function updateAlertAssignee(name: string) {
    if (!editable) return;
    try {
      const next = await patchAlertApi(alert.id, { assignedAnalyst: name });
      onAlertRefreshed?.(next);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#0a101a] shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent)]" />
        <div className="relative flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Alert detail</p>
            <h2 id="incident-title" className="mt-1 font-display text-xl font-semibold tracking-tight text-white">
              {alert.id}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{alert.eventType}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity as Severity} />
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/10"
                style={{
                  color: statusColor(alert.status),
                  backgroundColor: `${statusColor(alert.status)}15`,
                }}
              >
                {alert.status}
              </span>
              <SourceTypeBadge type={alert.sourceType} />
              <MitreTag technique={alert.mitreTechnique} tactic={alert.mitreTactic} />
              <AnalystChip name={alert.assignedAnalyst} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative max-h-[min(70vh,560px)] space-y-4 overflow-y-auto px-6 py-5 scrollbar-thin">
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <p className="text-sm leading-relaxed text-slate-300">{alert.description}</p>

          {!alert.relatedIncidentId && useApi && editable ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
              <FolderPlus className="h-4 w-4 text-cyan-400" />
              <div className="flex-1 text-xs text-slate-400">
                <p className="font-medium text-slate-200">Promote to incident case</p>
                <p className="mt-0.5 text-slate-500">Creates a new case, links this alert, and notifies the team.</p>
              </div>
              <button
                type="button"
                disabled={converting}
                onClick={() => void convertToCase()}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-slate-950 shadow-glow-sm disabled:opacity-50"
              >
                {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convert"}
              </button>
            </div>
          ) : null}

          {useApi && editable ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Alert queue</p>
              <label className="mt-2 block text-[10px] font-semibold text-slate-500">Reassign analyst</label>
              <select
                className="mt-1 w-full max-w-xs rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200"
                value={users.find((u) => u.name === alert.assignedAnalyst)?.id ?? ""}
                onChange={(e) => {
                  const u = users.find((x) => x.id === e.target.value);
                  if (u) void updateAlertAssignee(u.name);
                }}
              >
                <option value="">— keep name —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-600">Maps to legacy analyst field on the alert record.</p>
            </div>
          ) : null}

          {alert.relatedIncidentId && useApi ? (
            <div className="rounded-xl border border-cyan-500/20 bg-black/35 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-500/90">Linked incident</p>
              {loading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading incident…
                </div>
              ) : error && !incident ? (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              ) : incident ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="font-medium text-white">{incident.title}</p>
                    <p className="text-xs text-slate-500">Updated {new Date(incident.updatedAt).toLocaleString()}</p>
                    {incident.description ? (
                      <p className="mt-1 text-xs text-slate-400">{incident.description}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-500">Case status</label>
                      <select
                        value={incident.status}
                        disabled={saving || !editable}
                        onChange={(e) => void applyPatch({ status: e.target.value })}
                        className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200"
                      >
                        {INCIDENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-500">Case owner</label>
                      <select
                        value={incident.assignedTo?.id ?? ""}
                        disabled={saving || !editable}
                        onChange={(e) => {
                          const v = e.target.value;
                          void applyPatch({ assignedToId: v === "" ? null : v });
                        }}
                        className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200"
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Investigation notes</label>
                    <textarea
                      value={notesDraft}
                      disabled={saving || !editable}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-200"
                    />
                    {editable ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void applyPatch({ notes: notesDraft })}
                        className="mt-2 rounded-md bg-cyan-600/90 px-3 py-1.5 text-[11px] font-semibold text-slate-950"
                      >
                        Save notes
                      </button>
                    ) : (
                      <p className="mt-1 text-[10px] text-slate-500">Viewer: read-only.</p>
                    )}
                  </div>

                  {incident.timeline?.length ? (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Case timeline
                      </p>
                      <CaseTimeline events={incident.timeline} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Network className="h-3.5 w-3.5" />
                Source IP
              </dt>
              <dd className="mt-1 font-mono text-slate-100">{alert.sourceIp}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                Destination
              </dt>
              <dd className="mt-1 font-mono text-xs text-slate-200">{alert.destination ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Hash className="h-3.5 w-3.5" />
                Incident
              </dt>
              <dd className="mt-1 font-mono text-xs text-cyan-200/90">{alert.relatedIncidentId ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Layers className="h-3.5 w-3.5" />
                MITRE
              </dt>
              <dd className="mt-1 text-xs text-slate-200">
                <MitreTag technique={alert.mitreTechnique} tactic={alert.mitreTactic} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative flex justify-end gap-2 border-t border-white/10 bg-black/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
