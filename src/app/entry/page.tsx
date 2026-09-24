import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isViewer } from "@/lib/role";
import { AddDistributionForm } from "../AddDistributionForm";

export const dynamic = "force-dynamic";

export default async function EntryPage() {
  const [departments, items, records, viewer] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.item.findMany({ orderBy: { order: "asc" } }),
    prisma.distributionRecord.findMany({
      select: { recordedBy: true },
    }),
    isViewer(),
  ]);

  const activeDepartments = departments.filter((d) => d.active);
  const activeItems = items.filter((i) => i.active);
  const recordedByOptions = [
    ...new Set(
      records
        .map((r) => r.recordedBy)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b, "he"));

  if (viewer) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-6">
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          מסך זה זמין רק במצב עריכה.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">הזנה ידנית</h1>
          <p className="text-sm text-slate-500">
            שם העובד שמזין, המחלקה, הפריט, הכמות והתאריך של המסירה.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          חזרה לחלוקה והיסטוריה
        </Link>
      </div>

      {activeDepartments.length === 0 || activeItems.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          יש להוסיף תחילה מחלקות ופריטים בעמודים המתאימים.
        </p>
      ) : (
        <AddDistributionForm
          departments={activeDepartments}
          items={activeItems}
          recordedByOptions={recordedByOptions}
        />
      )}
    </div>
  );
}
