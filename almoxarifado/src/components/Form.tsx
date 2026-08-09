import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-amber-500 focus:bg-card focus:outline-none transition-colors';

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">
        {label}
        {required && <span className="text-rust-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 3} className={cn(fieldClass, 'resize-none', props.className)} />;
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const variants = {
    primary: 'bg-graphite-900 text-white hover:bg-graphite-800',
    secondary: 'bg-amber-500 text-graphite-950 hover:bg-amber-400',
    ghost: 'bg-transparent text-ink hover:bg-graphite-900/5 border border-line',
  };
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    />
  );
}
