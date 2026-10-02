import { useEffect, useState, type FormEvent } from "react";
import { Menu, Search, Activity, LogOut } from "lucide-react";
import type { SocRole } from "../types/soc";
import { NotificationCenter } from "./soc/NotificationCenter";

interface NavbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  /** Run when user submits global search (Enter). */
  onSearchSubmit?: () => void;
  onMenuClick: () => void;
  systemHealth: number;
  userName?: string;
  userRole?: SocRole | string;
  onLogout?: () => void;
}

function formatClock(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Navbar({
  search,
  onSearchChange,
  onSearchSubmit,
  onMenuClick,
  systemHealth,
  userName,
  userRole,
  onLogout,
}: NavbarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onSearchSubmit?.();
  }

  const healthLabel =
    systemHealth >= 95 ? "Healthy" : systemHealth >= 85 ? "Degraded" : "Attention";

  const healthClass =
    systemHealth >= 95
      ? "text-emerald-400"
      : systemHealth >= 85
        ? "text-amber-400"
        : "text-red-400";

  const displayName = userName ?? "SOC Operator";

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#070b12]/90 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl md:gap-4 md:px-6">
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={onSubmit} className="relative hidden min-w-0 flex-1 md:block md:max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search alerts, incidents, IPs, MITRE IDs…"
          className="w-full rounded-lg border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none ring-cyan-500/0 transition placeholder:text-slate-600 focus:border-cyan-500/35 focus:ring-2 focus:ring-cyan-500/15"
        />
      </form>

      <form onSubmit={onSubmit} className="relative flex-1 md:hidden">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-8 pr-2 text-xs outline-none focus:border-cyan-500/35"
        />
      </form>

      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none md:gap-3">
        <NotificationCenter />

        <div
          className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 sm:flex"
          title="Platform health"
        >
          <Activity className={`h-4 w-4 ${healthClass}`} aria-hidden />
          <div className="leading-tight">
            <p className={`text-xs font-semibold ${healthClass}`}>{healthLabel}</p>
            <p className="font-display text-[10px] text-slate-500">{systemHealth.toFixed(1)}%</p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-white/10 md:block" />

        <div className="hidden text-right md:block">
          <p className="font-display text-[11px] text-slate-500">UTC</p>
          <p className="font-display text-xs font-medium text-cyan-100/90">{formatClock(now)}</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.08] to-transparent px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-cyan-300 ring-2 ring-cyan-500/25">
            {initials(displayName)}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{userRole ? `${userRole}` : "Session"}</p>
          </div>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="ml-1 rounded-md border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
