import { prisma } from "@/lib/prisma";
import { formatQty } from "@/lib/labels";
import {
  monthKey,
  yearKey,
  formatMonthLabel,
  previousMonthKey,
  previousYearKey,
} from "@/lib/period";
import { ReportsControls } from "./ReportsControls";
import { BarChart } from "../dashboard/BarChart";

export const dynamic = "force-dynamic";

const COLOR_TREND = "#2a78d6";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; period?: string }>;
}) {
  const params = await searchParams;

  const records = await prisma.distributionRecord.findMany({
    include: { department: true, item: true },
  });

  const monthsSet = new Set<string>();
  const yearsSet = new Set<string>();
  for (const record of records) {
    monthsSet.add(monthKey(record.createdAt));
    yearsSet.add(yearKey(record.createdAt));
  }
  const months = [...monthsSet].sort();
  const years = [...yearsSet].sort();

  const mode: "month" | "year" = params.mode === "year" ? "year" : "month";
  const availablePeriods = mode === "month" ? months : years;
  const period =
    params.period && availablePeriods.includes(params.period)
      ? params.period
      : availablePeriods[availablePeriods.length - 1];

  const previousPeriod =
    mode === "month"
      ? period
        ? previousMonthKey(period)
        : undefined
      : period
        ? previousYearKey(period)
        : undefined;

  const inPeriod = (date: Date, key: string) =>
    mode === "month" ? monthKey(date) === key : yearKey(date) === key;

  const currentRecords = period
    ? records.filter((r) => inPeriod(r.createdAt, period))
    : [];
  const previousRecords = previousPeriod
    ? records.filter((r) => inPeriod(r.createdAt, previousPeriod))
    : [];

  const currentTotal = currentRecords.reduce((sum, r) => sum + r.quantity, 0);
  const previousTotal = previousRecords.reduce(
    (sum, r) => sum + r.quantity,
    0,
  );
  const delta = currentTotal - previousTotal;
  const deltaPct =
    previousTotal > 0 ? (delta / previousTotal) * 100 : currentTotal > 0 ? 100 : 0;

  const totalsByDeptItem = new Map<string, Map<string, number>>();
  const totalByItem = new Map<string, number>();
  const totalByDept = new Map<string, number>();
  const departmentsById = new Map<string, string>();
  const itemsById = new Map<string, { name: string; unit: string | null }>();

  for (const record of currentRecords) {
    departmentsById.set(record.departmentId, record.department.name);
    itemsById.set(record.itemId, {
      name: record.item.name,
      unit: record.item.unit,
    });
    const deptTotals = totalsByDeptItem.get(record.departmentId) ?? new Map();
    deptTotals.set(
      record.itemId,
      (deptTotals.get(record.itemId) ?? 0) + record.quantity,
    );
    totalsByDeptItem.set(record.departmentId, deptTotals);
    totalByItem.set(
      record.itemId,
      (totalByItem.get(record.itemId) ?? 0) + record.quantity,
    );
    totalByDept.set(
      record.departmentId,
      (totalByDept.get(record.departmentId) ?? 0) + record.quantity,
    );
  }

  const rowDeptIds = [...totalByDept.keys()].sort((a, b) =>
    (departmentsById.get(a) ?? "").localeCompare(
      departmentsById.get(b) ?? "",
      "he",
    ),
  );
  const columnItemIds = [...totalByItem.keys()];

  const trendKeys =
    mode === "month" ? months.slice(-12) : years;
  const trendTotals = new Map<string, number>();
  for (const record of records) {
    const key = mode === "month" ? monthKey(record.createdAt) : yearKey(record.createdAt);
    if (!trendKeys.includes(key)) continue;
    trendTotals.set(key, (trendTotals.get(key) ?? 0) + record.quantity);
  }
  const trendData = trendKeys.map((key) => ({
    label: mode === "month" ? formatMonthLabel(key) : key,
    value: trendTotals.get(key) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">דוחות תקופתיים</h1>
        <p className="text-sm text-slate-500">
          צריכה לפי חודש או שנה, עם השוואה לתקופה הקודמת וייצוא לאקסל.
        </p>
      </div>

      {availablePeriods.length === 0 || !period ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          עדיין אין מספיק נתונים ליצירת דוח
        </p>
      ) : (
        <>
          <ReportsControls
            mode={mode}
            period={period}
            months={months}
            years={years}
          />

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              {mode === "month" ? formatMonthLabel(period) : period} - סה&quot;כ:{" "}
              <b>{formatQty(currentTotal)}</b>
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              תקופה קודמת: <b>{formatQty(previousTotal)}</b>
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 font-medium ${
                delta > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : delta < 0
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"} שינוי:{" "}
              {delta > 0 ? "+" : ""}
              {formatQty(delta)} ({deltaPct > 0 ? "+" : ""}
              {deltaPct.toFixed(0)}%)
            </span>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-800">
              מגמה - {mode === "month" ? "12 החודשים האחרונים" : "לפי שנה"}
            </h2>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <BarChart
                data={trendData}
                color={COLOR_TREND}
                ariaLabel="מגמת צריכה"
              />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-800">
              פירוט לתקופה: {mode === "month" ? formatMonthLabel(period) : period}
            </h2>
            {rowDeptIds.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
                אין רשומות בתקופה זו
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-2 text-right font-medium text-slate-600">
                        מחלקה
                      </th>
                      {columnItemIds.map((itemId) => {
                        const item = itemsById.get(itemId);
                        return (
                          <th
                            key={itemId}
                            className="p-2 text-center font-medium text-slate-600"
                          >
                            {item?.name}
                            {item?.unit ? ` (${item.unit})` : ""}
                          </th>
                        );
                      })}
                      <th className="p-2 text-center font-bold text-slate-700">
                        סה&quot;כ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rowDeptIds.map((deptId) => (
                      <tr key={deptId}>
                        <td className="p-2 font-medium">
                          {departmentsById.get(deptId)}
                        </td>
                        {columnItemIds.map((itemId) => {
                          const qty =
                            totalsByDeptItem.get(deptId)?.get(itemId) ?? 0;
                          return (
                            <td
                              key={itemId}
                              className="p-2 text-center text-slate-600"
                            >
                              {qty > 0 ? formatQty(qty) : "—"}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-bold">
                          {formatQty(totalByDept.get(deptId) ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 font-bold">
                      <td className="p-2">סה&quot;כ</td>
                      {columnItemIds.map((itemId) => (
                        <td key={itemId} className="p-2 text-center">
                          {formatQty(totalByItem.get(itemId) ?? 0)}
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        {formatQty(currentTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
