import {
  LayoutDashboard,
  Upload,
  Cpu,
  Sparkles,
  FolderKanban,
  ScrollText,
  ClipboardList,
  Shield,
  FileBarChart,
  Settings,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ingest", label: "Log ingestion", icon: Upload },
  { to: "/detection", label: "Detection engine", icon: Cpu },
  { to: "/simulation", label: "SOC simulator", icon: Sparkles },
  { to: "/incidents", label: "Incidents", icon: FolderKanban },
  { to: "/audit", label: "Audit log", icon: ClipboardList },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/ti", label: "Threat Intelligence", icon: Shield },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-soc-border/80 bg-soc-panel/95 shadow-glow backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-soc-border/60 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/10 ring-1 ring-cyan-500/30">
            <Shield className="h-5 w-5 text-cyan-400" aria-hidden />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-white">SOC Command</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Enterprise SIEM
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-300 shadow-glow-sm ring-1 ring-cyan-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      aria-hidden
                    />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-all group-hover:translate-x-0.5 ${
                        isActive ? "text-cyan-500/80" : "text-slate-600 group-hover:text-slate-400"
                      }`}
                      aria-hidden
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-soc-border/60 p-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              Operations
            </p>
            <p className="mt-0.5 text-xs text-slate-400">RBAC + SQLite backend</p>
          </div>
        </div>
      </aside>
    </>
  );
}
