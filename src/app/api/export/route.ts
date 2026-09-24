import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/labels";
import { monthKey, yearKey, formatMonthLabel } from "@/lib/period";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "year" ? "year" : "month";
  const period = searchParams.get("period");

  const [departments, items, allRecords] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.item.findMany({ orderBy: { order: "asc" } }),
    prisma.distributionRecord.findMany({
      include: { department: true, item: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const records = period
    ? allRecords.filter((r) =>
        mode === "month"
          ? monthKey(r.createdAt) === period
          : yearKey(r.createdAt) === period,
      )
    : allRecords;

  const periodLabel = period
    ? mode === "month"
      ? formatMonthLabel(period)
      : period
    : null;

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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "מחלקת משק - חלוקת ציוד";
  workbook.created = new Date();

  const historySheet = workbook.addWorksheet("היסטוריה", {
    views: [{ rightToLeft: true }],
  });
  historySheet.columns = [
    { header: "מחלקה", key: "department", width: 24 },
    ...columnItems.map((item) => ({
      header: item.unit ? `${item.name} (${item.unit})` : item.name,
      key: item.id,
      width: 16,
    })),
    { header: 'סה"כ', key: "total", width: 12 },
  ];
  historySheet.getRow(1).font = { bold: true };

  for (const dept of rowDepartments) {
    const row: Record<string, string | number> = { department: dept.name };
    for (const item of columnItems) {
      row[item.id] = totalsByDeptItem.get(dept.id)?.get(item.id) ?? 0;
    }
    row.total = totalByDept.get(dept.id) ?? 0;
    historySheet.addRow(row);
  }

  const totalsRow: Record<string, string | number> = { department: 'סה"כ' };
  for (const item of columnItems) {
    totalsRow[item.id] = totalByItem.get(item.id) ?? 0;
  }
  totalsRow.total = grandTotal;
  const addedTotalsRow = historySheet.addRow(totalsRow);
  addedTotalsRow.font = { bold: true };

  const logSheet = workbook.addWorksheet("יומן מסירות", {
    views: [{ rightToLeft: true }],
  });
  logSheet.columns = [
    { header: "תאריך", key: "date", width: 18 },
    { header: "מחלקה", key: "department", width: 24 },
    { header: "פריט", key: "item", width: 20 },
    { header: "כמות", key: "quantity", width: 10 },
    { header: "הערה", key: "note", width: 30 },
  ];
  logSheet.getRow(1).font = { bold: true };

  for (const record of records) {
    logSheet.addRow({
      date: formatDateTime(record.createdAt),
      department: record.department.name,
      item: record.item.unit
        ? `${record.item.name} (${record.item.unit})`
        : record.item.name,
      quantity: record.quantity,
      note: record.note ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filenamePeriod = periodLabel
    ? periodLabel.replace(/\s+/g, "-")
    : new Date().toISOString().slice(0, 10);
  const filename = `חלוקת-ציוד-${filenamePeriod}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
