import { prisma } from "@/lib/prisma";
import { deleteDepartment, toggleDepartmentActive } from "@/app/actions";
import { isViewer } from "@/lib/role";
import { AddDepartmentForm } from "./AddDepartmentForm";

export default async function DepartmentsPage() {
  const [departments, viewer] = await Promise.all([
    prisma.department.findMany({
      orderBy: [{ active: "desc" }, { order: "asc" }],
      include: { _count: { select: { records: true } } },
    }),
    isViewer(),
  ]);

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">ניהול מחלקות</h1>

      {!viewer && <AddDepartmentForm />}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {departments.length === 0 ? (
          <p className="p-6 text-center text-slate-500">אין מחלקות רשומות</p>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">
                  {dept.name}{" "}
                  {!dept.active && (
                    <span className="text-xs text-slate-400">(לא פעיל)</span>
                  )}
                </div>
                <div className="text-sm text-slate-500">
                  {dept._count.records} מסירות עד כה
                </div>
              </div>
              {!viewer && (
                <div className="flex gap-2">
                  <form
                    action={toggleDepartmentActive.bind(
                      null,
                      dept.id,
                      !dept.active,
                    )}
                  >
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                    >
                      {dept.active ? "השבתה" : "הפעלה"}
                    </button>
                  </form>
                  <form action={deleteDepartment.bind(null, dept.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      מחיקה
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
