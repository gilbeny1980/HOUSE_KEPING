import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatQty } from "@/lib/labels";
import { monthKey, formatMonthLabel } from "@/lib/period";
import { BarChart } from "./BarChart";

export const dynamic = "force-dynamic";

const COLOR_ITEMS = "#2a78d6";
const COLOR_DEPARTMENTS = "#eb6834";

export default async function DashboardPage() {
  const [departments, items, allRecords] = await Promise.all([
    prisma.department.findMany(),
    prisma.item.findMany(),
    prisma.distributionRecord.findMany(),
  ]);

  const currentMonth = monthKey(new Date());
  const records = allRecords.filter(
    (r) => monthKey(r.createdAt) === currentMonth,
  );

  const totalByItem = new Map<string, number>();
  const totalByDept = new Map<string, number>();
  let grandTotal = 0;

  for (const record of records) {
    totalByItem.set(
      record.itemId,
      (totalByItem.get(record.itemId) ?? 0) + record.quantity,
    );
    totalByDept.set(
      record.departmentId,
      (totalByDept.get(record.departmentId) ?? 0) + record.quantity,
    );
    grandTotal += record.quantity;
  }

  const itemById = new Map(items.map((i) => [i.id, i]));
  const deptById = new Map(departments.map((d) => [d.id, d]));

  const topItems = [...totalByItem.entries()]
    .map(([id, value]) => ({ label: itemById.get(id)?.name ?? "?", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const topDepartments = [...totalByDept.entries()]
    .map(([id, value]) => ({ label: deptById.get(id)?.name ?? "?", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const activeDepartments = departments.filter((d) => d.active).length;
  const activeItems = items.filter((i) => i.active).length;

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">
            דשבורד - סקירה כללית ({formatMonthLabel(currentMonth)})
          </h1>
          <p className="text-sm text-slate-500">
            תמונת מצב של חלוקת הציוד החודש: מי לוקח הכי הרבה ומה מבוקש ביותר.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reports"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            דוחות תקופתיים
          </Link>
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            חזרה לחלוקה והיסטוריה
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          סה&quot;כ יחידות החודש: <b>{formatQty(grandTotal)}</b>
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          מחלקות פעילות: <b>{activeDepartments}</b>
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          פריטים פעילים: <b>{activeItems}</b>
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          רשומות חלוקה: <b>{records.length}</b>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-800">
            הפריטים המבוקשים ביותר
          </h2>
          <BarChart
            data={topItems}
            color={COLOR_ITEMS}
            ariaLabel="הפריטים המבוקשים ביותר לפי כמות שחולקה"
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-800">
            המחלקות המובילות בצריכה
          </h2>
          <BarChart
            data={topDepartments}
            color={COLOR_DEPARTMENTS}
            ariaLabel="המחלקות המובילות לפי כמות שהתקבלה"
          />
        </section>
      </div>
    </div>
  );
}
