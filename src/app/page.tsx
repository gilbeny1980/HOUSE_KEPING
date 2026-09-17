import { prisma } from "@/lib/prisma";
import { deleteDistributionRecord } from "@/app/actions";
import { isViewer } from "@/lib/role";
import { formatQty, formatDateTime } from "@/lib/labels";
import { AddDistributionForm } from "./AddDistributionForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [departments, items, records, viewer] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.item.findMany({ orderBy: { order: "asc" } }),
    prisma.distributionRecord.findMany({
      include: { department: true, item: true },
      orderBy: { createdAt: "desc" },
    }),
    isViewer(),
  ]);

  const activeDepartments = departments.filter((d) => d.active);
  const activeItems = items.filter((i) => i.active);

  const totalsByDeptItem = new Map<string, Map<string, number>>();
  const totalByItem = new Map<string, number>();
  const totalByDept = new Map<string, number>();
  let grandTotal = 0;

  for (const record of records) {
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
    grandTotal += record.quantity;
  }

  const rowDepartments = departments.filter((d) => totalByDept.has(d.id));
  const columnItems = items.filter((i) => totalByItem.has(i.id));
  const recentRecords = records.slice(0, 30);

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">חלוקת ציוד - מעקב והזנה</h1>
        <p className="text-sm text-slate-500">
          הזנה ידנית של מסירות ציוד למחלקות, עם היסטוריה מלאה של מה נלקח ועל
          ידי מי.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          סה&quot;כ יחידות שחולקו: <b>{formatQty(grandTotal)}</b>
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          מחלקות פעילות: <b>{activeDepartments.length}</b>
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          פריטים פעילים: <b>{activeItems.length}</b>
        </span>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold text-slate-800">
          היסטוריה - מה לקחו ומי לקח
        </h2>
        {rowDepartments.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
            עדיין לא נרשמו מסירות
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-2 text-right font-medium text-slate-600">
                    מחלקה
                  </th>
                  {columnItems.map((item) => (
                    <th
                      key={item.id}
                      className="p-2 text-center font-medium text-slate-600"
                    >
                      {item.name}
                      {item.unit ? ` (${item.unit})` : ""}
                    </th>
                  ))}
                  <th className="p-2 text-center font-bold text-slate-700">
                    סה&quot;כ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rowDepartments.map((dept) => (
                  <tr key={dept.id}>
                    <td className="p-2 font-medium">{dept.name}</td>
                    {columnItems.map((item) => {
                      const qty =
                        totalsByDeptItem.get(dept.id)?.get(item.id) ?? 0;
                      return (
                        <td
                          key={item.id}
                          className="p-2 text-center text-slate-600"
                        >
                          {qty > 0 ? formatQty(qty) : "—"}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-bold">
                      {formatQty(totalByDept.get(dept.id) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-bold">
                  <td className="p-2">סה&quot;כ</td>
                  {columnItems.map((item) => (
                    <td key={item.id} className="p-2 text-center">
                      {formatQty(totalByItem.get(item.id) ?? 0)}
                    </td>
                  ))}
                  <td className="p-2 text-center">{formatQty(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {!viewer && (
        <section className="space-y-2">
          <h2 className="font-bold text-slate-800">הזנת חלוקה חדשה</h2>
          {activeDepartments.length === 0 || activeItems.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
              יש להוסיף תחילה מחלקות ופריטים בעמודים המתאימים.
            </p>
          ) : (
            <AddDistributionForm
              departments={activeDepartments}
              items={activeItems}
            />
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-bold text-slate-800">יומן מסירות אחרון</h2>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {recentRecords.length === 0 ? (
            <p className="p-6 text-center text-slate-500">אין רשומות עדיין</p>
          ) : (
            recentRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div>
                  <div className="font-medium">
                    {record.department.name} לקח/ה {formatQty(record.quantity)}{" "}
                    {record.item.name}
                    {record.item.unit ? ` (${record.item.unit})` : ""}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDateTime(record.createdAt)}
                    {record.note ? ` · ${record.note}` : ""}
                  </div>
                </div>
                {!viewer && (
                  <form action={deleteDistributionRecord.bind(null, record.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      מחיקה
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
