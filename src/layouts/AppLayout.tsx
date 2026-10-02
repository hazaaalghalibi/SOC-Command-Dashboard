import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export interface DashboardOutletContext {
  search: string;
  setSearch: (v: string) => void;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [systemHealth, setSystemHealth] = useState(98.2);

  function submitSearch() {
    const q = search.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setSystemHealth((h) => {
        const delta = (Math.random() - 0.5) * 0.4;
        const n = Math.min(99.4, Math.max(92, h + delta));
        return Math.round(n * 10) / 10;
      });
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-soc-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={submitSearch}
          onMenuClick={() => setSidebarOpen(true)}
          systemHealth={systemHealth}
          userName={user?.name}
          userRole={user?.role}
          onLogout={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="bg-grid-pattern bg-grid min-h-full">
            <Outlet context={{ search, setSearch } satisfies DashboardOutletContext} />
          </div>
        </main>
      </div>
    </div>
  );
}
