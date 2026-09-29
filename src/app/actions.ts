"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertNotViewer } from "@/lib/role";

function asOrNull(value: FormDataEntryValue | null): string | null {
  const str = (value ?? "").toString().trim();
  return str.length > 0 ? str : null;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/entry");
  revalidatePath("/departments");
  revalidatePath("/items");
  revalidatePath("/inventory");
}

export async function createDistributionEntries(formData: FormData) {
  await assertNotViewer();

  const departmentId = (formData.get("departmentId") ?? "").toString();
  if (!departmentId) {
    throw new Error("יש לבחור מחלקה");
  }

  const recordedBy = (formData.get("recordedBy") ?? "").toString().trim();
  if (!recordedBy) {
    throw new Error("יש להזין את שם העובד שמזין את הרישום");
  }

  const dateRaw = (formData.get("date") ?? "").toString();
  const createdAt = dateRaw ? new Date(`${dateRaw}T12:00:00`) : new Date();
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("תאריך לא תקין");
  }

  const note = asOrNull(formData.get("note"));

  const entries: { itemId: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const quantity = Number(value.toString());
    if (Number.isFinite(quantity) && quantity > 0) {
      entries.push({ itemId: key.slice("qty_".length), quantity });
    }
  }

  if (entries.length === 0) {
    throw new Error("יש לבחור כמות לפחות עבור פריט אחד");
  }

  await prisma.$transaction([
    ...entries.map((entry) =>
      prisma.distributionRecord.create({
        data: {
          departmentId,
          itemId: entry.itemId,
          quantity: entry.quantity,
          recordedBy,
          createdAt,
          note,
        },
      }),
    ),
    ...entries.map((entry) =>
      prisma.item.update({
        where: { id: entry.itemId },
        data: { stock: { decrement: entry.quantity } },
      }),
    ),
  ]);

  revalidateAll();
}

export async function deleteDistributionRecord(recordId: string) {
  await assertNotViewer();

  const record = await prisma.distributionRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) return;

  await prisma.$transaction([
    prisma.distributionRecord.delete({ where: { id: recordId } }),
    prisma.item.update({
      where: { id: record.itemId },
      data: { stock: { increment: record.quantity } },
    }),
  ]);
  revalidateAll();
}

export async function updateItemStock(itemId: string, formData: FormData) {
  await assertNotViewer();

  const stockRaw = (formData.get("stock") ?? "").toString();
  const stock = Number(stockRaw);
  if (!Number.isFinite(stock)) {
    throw new Error("כמות מלאי לא תקינה");
  }

  await prisma.item.update({ where: { id: itemId }, data: { stock } });
  revalidateAll();
}

export async function createDepartment(formData: FormData) {
  await assertNotViewer();

  const name = (formData.get("name") ?? "").toString().trim();
  if (!name) {
    throw new Error("שם המחלקה הוא שדה חובה");
  }

  const last = await prisma.department.findFirst({ orderBy: { order: "desc" } });

  await prisma.department.create({
    data: { name, order: (last?.order ?? 0) + 1 },
  });

  revalidateAll();
}

export async function toggleDepartmentActive(
  departmentId: string,
  active: boolean,
) {
  await assertNotViewer();

  await prisma.department.update({
    where: { id: departmentId },
    data: { active },
  });
  revalidateAll();
}

export async function deleteDepartment(departmentId: string) {
  await assertNotViewer();

  await prisma.department.delete({ where: { id: departmentId } });
  revalidateAll();
}

export async function createItem(formData: FormData) {
  await assertNotViewer();

  const name = (formData.get("name") ?? "").toString().trim();
  if (!name) {
    throw new Error("שם הפריט הוא שדה חובה");
  }

  const last = await prisma.item.findFirst({ orderBy: { order: "desc" } });

  await prisma.item.create({
    data: {
      name,
      unit: asOrNull(formData.get("unit")),
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidateAll();
}

export async function toggleItemActive(itemId: string, active: boolean) {
  await assertNotViewer();

  await prisma.item.update({ where: { id: itemId }, data: { active } });
  revalidateAll();
}

export async function deleteItem(itemId: string) {
  await assertNotViewer();

  await prisma.item.delete({ where: { id: itemId } });
  revalidateAll();
}
