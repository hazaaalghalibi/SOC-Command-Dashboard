import { useState, type FormEvent } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("analyst@soc.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-soc-bg px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-soc-panel/95 p-8 shadow-glow">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-500/30">
            <Shield className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">SOC Command</h1>
            <p className="text-xs text-slate-500">Sign in with your assigned role</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 py-2.5 text-sm font-semibold text-slate-950 shadow-glow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Demo seed: <span className="font-mono text-slate-400">analyst@soc.local</span> /{" "}
          <span className="font-mono text-slate-400">socdemo2026</span>
        </p>
      </div>
    </div>
  );
}
