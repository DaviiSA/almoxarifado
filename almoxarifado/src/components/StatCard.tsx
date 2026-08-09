import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'amber',
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'amber' | 'steel' | 'rust' | 'moss';
  hint?: string;
}) {
  const toneClasses = {
    amber: 'bg-amber-50 text-amber-600',
    steel: 'bg-steel-50 text-steel-600',
    rust: 'bg-rust-50 text-rust-500',
    moss: 'bg-moss-50 text-moss-500',
  }[tone];

  return (
    <div className="card-surface animate-enter p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="font-display text-4xl font-bold text-ink mt-1 truncate">{value}</p>
        {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      </div>
      <div className={cn('shrink-0 rounded-lg p-2.5', toneClasses)}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
    </div>
  );
}
