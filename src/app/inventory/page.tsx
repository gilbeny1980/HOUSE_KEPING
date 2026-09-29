import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateItemStock } from "@/app/actions";
import { isViewer } from "@/lib/role";
import { formatQty } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [items, viewer] = await Promise.all([
    prisma.item.findMany({
      orderBy: [{ active: "desc" }, { order: "asc" }],
    }),
    isViewer(),
  ]);

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">מלאי</h1>
          <p className="text-sm text-slate-500">
            כמות המלאי הנוכחית לכל פריט. המלאי יורד אוטומטית עם כל חלוקה
            (ב&quot;הזנה ידנית&quot;), ואפשר לעדכן כאן ידנית לאחר קבלת סחורה
            חדשה או לתיקון.
          </p>
        </div>
        <Link
          href="/items"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          ניהול קטלוג פריטים
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-6 text-center text-slate-500">אין פריטים רשומים</p>
        ) : (
          items.map((item) => {
            const low = item.stock <= 0;
            return (
              <form
                key={item.id}
                action={updateItemStock.bind(null, item.id)}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <div className="min-w-[10rem] flex-1">
                  <div className="font-medium">
                    {item.name}
                    {item.unit ? ` (${item.unit})` : ""}{" "}
                    {!item.active && (
                      <span className="text-xs text-slate-400">
                        (לא פעיל)
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm ${low ? "font-medium text-red-600" : "text-slate-500"}`}
                  >
                    מלאי נוכחי: {formatQty(item.stock)}
                    {low && " - אין מלאי"}
                  </div>
                </div>
                {!viewer && (
                  <>
                    <input
                      type="number"
                      name="stock"
                      step="any"
                      defaultValue={item.stock}
                      className="input w-28"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      עדכון
                    </button>
                  </>
                )}
              </form>
            );
          })
        )}
      </div>
    </div>
  );
}
