import { formatQty } from "@/lib/labels";

type Datum = { label: string; value: number };

export function BarChart({
  data,
  color,
  ariaLabel,
}: {
  data: Datum[];
  color: string;
  ariaLabel: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">אין עדיין נתונים להצגה</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div dir="ltr" role="img" aria-label={ariaLabel} className="space-y-2.5">
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, 3);
        return (
          <div
            key={d.label}
            className="group grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2"
            title={`${d.label}: ${formatQty(d.value)}`}
          >
            <span className="truncate text-xs text-slate-600" dir="rtl">
              {d.label}
            </span>
            <span className="h-6 overflow-hidden rounded bg-slate-100">
              <span
                className="block h-full rounded transition-opacity group-hover:opacity-80"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {formatQty(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
