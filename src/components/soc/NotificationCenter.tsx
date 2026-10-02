import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api";
import type { AppNotification } from "../../types/soc";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchNotifications();
      setItems(d.items);
      setUnread(d.unread);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function onRead(n: AppNotification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.linkKind === "incident" && n.linkId) navigate(`/incidents?focus=${encodeURIComponent(n.linkId)}`);
  }

  async function onReadAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          void load();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-500/30 hover:text-cyan-200"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-lg">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-[60]" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[70] mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-xl border border-white/10 bg-[#0a0f18] shadow-2xl ring-1 ring-cyan-500/10">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => void onReadAll()}
                  className="rounded p-1 text-[10px] text-cyan-400 hover:bg-white/5"
                  title="Mark all read"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 text-slate-500 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[min(70vh,420px)] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-500/60" />
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void onRead(n)}
                    className={`w-full border-b border-white/5 px-3 py-2.5 text-left transition hover:bg-white/5 ${
                      !n.read ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-100">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{n.body}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
