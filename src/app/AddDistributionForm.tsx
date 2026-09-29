"use client";

import { useRef } from "react";
import { createDistributionEntries } from "@/app/actions";
import { formatQty } from "@/lib/labels";

type Department = { id: string; name: string };
type Item = { id: string; name: string; unit: string | null; stock: number };

export function AddDistributionForm({
  departments,
  items,
  recordedByOptions,
}: {
  departments: Department[];
  items: Item[];
  recordedByOptions: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await createDistributionEntries(formData);
        formRef.current?.reset();
      }}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[10rem]">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            מחלקה *
          </span>
          <select
            name="departmentId"
            required
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              בחר מחלקה
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </label>
        <label className="w-40">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            תאריך *
          </span>
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input"
          />
        </label>
        <label className="flex-1 min-w-[10rem]">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            שם העובד שמזין *
          </span>
          <input
            name="recordedBy"
            required
            list="recorded-by-options"
            className="input"
            placeholder="שם מלא"
          />
          <datalist id="recorded-by-options">
            {recordedByOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="flex-1 min-w-[10rem]">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            הערה
          </span>
          <input name="note" className="input" />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          פריטים וכמויות * (ניתן לבחור כמה פריטים יחד)
        </span>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-2 text-right font-medium text-slate-600">
                  פריט
                </th>
                <th className="p-2 text-center font-medium text-slate-600">
                  מלאי נוכחי
                </th>
                <th className="p-2 text-center font-medium text-slate-600">
                  כמות לחלוקה
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-2">
                    {item.name}
                    {item.unit ? ` (${item.unit})` : ""}
                  </td>
                  <td className="p-2 text-center text-slate-500">
                    {formatQty(item.stock)}
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      name={`qty_${item.id}`}
                      min="0"
                      step="any"
                      className="input mx-auto w-24 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
      >
        הוספה
      </button>
    </form>
  );
}
