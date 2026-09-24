"use client";

import { useRouter } from "next/navigation";
import { formatMonthLabel } from "@/lib/period";

export function ReportsControls({
  mode,
  period,
  months,
  years,
}: {
  mode: "month" | "year";
  period: string;
  months: string[];
  years: string[];
}) {
  const router = useRouter();
  const options = mode === "month" ? months : years;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
        <button
          type="button"
          onClick={() =>
            router.push(`/reports?mode=month&period=${months[months.length - 1]}`)
          }
          className={`px-3 py-1.5 ${
            mode === "month"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          לפי חודש
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(`/reports?mode=year&period=${years[years.length - 1]}`)
          }
          className={`border-r border-slate-300 px-3 py-1.5 ${
            mode === "year"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          לפי שנה
        </button>
      </div>

      <select
        value={period}
        onChange={(e) => router.push(`/reports?mode=${mode}&period=${e.target.value}`)}
        className="input w-auto"
      >
        {options.map((p) => (
          <option key={p} value={p}>
            {mode === "month" ? formatMonthLabel(p) : p}
          </option>
        ))}
      </select>

      <a
        href={`/api/export?mode=${mode}&period=${period}`}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
      >
        <span>📊</span> ייצוא התקופה הזו לאקסל
      </a>
    </div>
  );
}
