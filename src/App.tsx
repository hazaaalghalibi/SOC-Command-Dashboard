import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LogIngestPage } from "./pages/LogIngestPage";
import { DetectionPage } from "./pages/DetectionPage";
import { SimulationPage } from "./pages/SimulationPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { SearchPage } from "./pages/SearchPage";
import { AuditPage } from "./pages/AuditPage";
import { LogsPage } from "./pages/LogsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ThreatIntelPage } from "./pages/ThreatIntelPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuth } from "./context/AuthContext";

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-soc-bg px-6">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="ingest" element={<LogIngestPage />} />
        <Route path="detection" element={<DetectionPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ti" element={<ThreatIntelPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}