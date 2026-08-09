import { cn } from '@/lib/utils';

type Tone = 'amber' | 'steel' | 'rust' | 'moss' | 'graphite';

const TONE_CLASSES: Record<Tone, string> = {
  amber: 'text-amber-600',
  steel: 'text-steel-600',
  rust: 'text-rust-500',
  moss: 'text-moss-500',
  graphite: 'text-graphite-600',
};

export function StampBadge({ children, tone = 'graphite', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn('stamp', TONE_CLASSES[tone], className)}>{children}</span>;
}

export function statusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    'Em andamento': 'steel',
    'Concluída': 'moss',
    Particular: 'amber',
    Energisa: 'steel',
    Misto: 'rust',
  };
  return map[status] ?? 'graphite';
}
