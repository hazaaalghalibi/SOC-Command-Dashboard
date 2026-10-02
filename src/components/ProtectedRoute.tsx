import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-soc-bg px-6">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-white">Authenticating…</p>
          <p className="mt-2 text-sm text-slate-500">Verifying session with SOC API</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
