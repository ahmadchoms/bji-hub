interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

export function StatList({ items }: { items: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5 w-full">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col rounded-lg border bg-secondary/50 p-4 shadow-xs transition-shadow hover:shadow-sm"
        >
          {/* Header Label: Diberikan min-height agar jika label membungkus 2 baris tetap sejajar */}
          <dt className="line-clamp-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            {item.label}
          </dt>

          {/* Value Utama: Bagian inti tampilan */}
          <dd className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-neutral-900">
            {item.value}
          </dd>

          {/* Hint Area: Diberi margin-top otomatis dan min-height tetap */}
          <div className="mt-auto pt-2 min-h-6 flex items-center">
            {item.hint ? (
              <p className="line-clamp-1 text-xs text-neutral-500">
                {item.hint}
              </p>
            ) : (
              <span className="text-xs text-transparent select-none">
                &nbsp;
              </span>
            )}
          </div>
        </div>
      ))}
    </dl>
  );
}
