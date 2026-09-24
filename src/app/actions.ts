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
  revalidatePath("/departments");
  revalidatePath("/items");
}

export async function createDistributionRecord(formData: FormData) {
  await assertNotViewer();

  const departmentId = (formData.get("departmentId") ?? "").toString();
  if (!departmentId) {
    throw new Error("יש לבחור מחלקה");
  }

  const itemId = (formData.get("itemId") ?? "").toString();
  if (!itemId) {
    throw new Error("יש לבחור פריט");
  }

  const quantityRaw = (formData.get("quantity") ?? "").toString();
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("כמות לא תקינה");
  }

  const recordedBy = (formData.get("recordedBy") ?? "").toString().trim();
  if (!recordedBy) {
    throw new Error("יש להזין את שם העובד שמזין את הרישום");
  }

  await prisma.distributionRecord.create({
    data: {
      departmentId,
      itemId,
      quantity,
      recordedBy,
      note: asOrNull(formData.get("note")),
    },
  });

  revalidateAll();
}

export async function deleteDistributionRecord(recordId: string) {
  await assertNotViewer();

  await prisma.distributionRecord.delete({ where: { id: recordId } });
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
