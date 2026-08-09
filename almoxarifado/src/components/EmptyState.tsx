import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="rounded-full bg-graphite-900/5 p-4 mb-3">
        <Icon size={26} className="text-ink-soft" strokeWidth={1.75} />
      </div>
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      <p className="text-sm text-ink-soft mt-1 max-w-sm">{description}</p>
    </div>
  );
}
