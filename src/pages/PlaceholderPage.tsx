import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 text-center md:px-6">
      <Construction className="mx-auto h-12 w-12 text-slate-600" />
      <h1 className="mt-4 font-display text-xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}
