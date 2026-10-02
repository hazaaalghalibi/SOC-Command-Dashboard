import { FolderKanban } from "lucide-react";
import type { IncidentSummary } from "../types/soc";
import { EmptyState } from "./EmptyState";

interface RecentIncidentsTableProps {
  items: IncidentSummary[];
  onRowClick?: (id: string) => void;
}

export function RecentIncidentsTable({ items, onRowClick }: RecentIncidentsTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No incidents yet"
        description="Incidents appear when detection rules fire or analysts open cases from alerts."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-white/10 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Severity</th>
            <th className="hidden px-3 py-2 sm:table-cell">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {items.map((i) => (
            <tr
              key={i.id}
              className={onRowClick ? "cursor-pointer hover:bg-white/5" : ""}
              onClick={() => onRowClick?.(i.id)}
            >
              <td className="whitespace-nowrap px-3 py-2 font-mono text-cyan-200/90">{i.id}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-slate-200">{i.title}</td>
              <td className="px-3 py-2 text-slate-400">{i.status}</td>
              <td className="px-3 py-2">{i.severity}</td>
              <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                {i.assignedTo?.name ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
