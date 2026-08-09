import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-graphite-950/50" onClick={onClose} />
      <div className="relative card-surface w-full max-w-lg my-8 shadow-2xl animate-enter">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink rounded p-1">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
