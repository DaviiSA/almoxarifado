export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <p className="code-tag text-amber-600 font-semibold uppercase tracking-wide">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold text-ink mt-0.5">{title}</h1>
        {description && <p className="text-sm text-ink-soft mt-1 max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
