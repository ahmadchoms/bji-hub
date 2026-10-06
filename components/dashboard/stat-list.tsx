interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

export function StatList({ items }: { items: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-2/5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col justify-between p-4 shadow-2xs"
        >
          <dt className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            {item.label}
          </dt>
          <dd className="mt-2 font-mono text-2xl font-bold tabular-nums text-neutral-900">
            {item.value}
          </dd>
          {item.hint && (
            <p className="mt-1 text-xs text-neutral-500">{item.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
