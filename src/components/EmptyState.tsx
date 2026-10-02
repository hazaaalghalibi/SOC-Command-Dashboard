import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
    </div>
  );
}
