import { prisma } from "../src/lib/prisma";

async function main() {
  const departmentCount = await prisma.department.count();
  if (departmentCount === 0) {
    await prisma.department.createMany({
      data: [
        { name: "משרדים - קומה שנייה", order: 1 },
        { name: "מעבדת מו\"פ", order: 2 },
        { name: "תפעול", order: 3 },
        { name: "משרד מכירות - קומה 1", order: 4 },
        { name: "מכירות / מערכות מידע", order: 5 },
        { name: "הנדסה", order: 6 },
        { name: "איכות", order: 7 },
        { name: "אחזקה", order: 8 },
        { name: "לוגיסטיקה", order: 9 },
        { name: "שער", order: 10 },
      ],
    });
  }

  const itemCount = await prisma.item.count();
  if (itemCount === 0) {
    await prisma.item.createMany({
      data: [
        { name: "עוגיות", unit: "יח'", order: 1 },
        { name: "ביגלה", unit: "יח'", order: 2 },
        { name: "פתי בר", unit: "יח'", order: 3 },
        { name: "חלב", unit: "יח'", order: 4 },
        { name: "קפה", unit: "יח'", order: 5 },
        { name: "נס קפה", unit: "יח'", order: 6 },
        { name: "תה", unit: "יח'", order: 7 },
        { name: "סוכר", unit: "יח'", order: 8 },
        { name: "שתיה חמה", unit: "יח'", order: 9 },
        { name: "שתיה קרה", unit: "יח'", order: 10 },
        { name: "כפיות", unit: "יח'", order: 11 },
        { name: "צלחות", unit: "יח'", order: 12 },
        { name: "סכינים", unit: "יח'", order: 13 },
        { name: "מזלגות", unit: "יח'", order: 14 },
      ],
    });
  }

  const recordCount = await prisma.distributionRecord.count();
  if (recordCount === 0) {
    const departments = await prisma.department.findMany();
    const items = await prisma.item.findMany();
    const deptId = (name: string) =>
      departments.find((d) => d.name === name)?.id ?? departments[0].id;
    const itemId = (name: string) =>
      items.find((i) => i.name === name)?.id ?? items[0].id;

    await prisma.distributionRecord.createMany({
      data: [
        { departmentId: deptId("תפעול"), itemId: itemId("עוגיות"), quantity: 6 },
        { departmentId: deptId("תפעול"), itemId: itemId("קפה"), quantity: 24 },
        { departmentId: deptId("תפעול"), itemId: itemId("חלב"), quantity: 12 },
        {
          departmentId: deptId("אחזקה"),
          itemId: itemId("ביגלה"),
          quantity: 21,
        },
        {
          departmentId: deptId("אחזקה"),
          itemId: itemId("שתיה חמה"),
          quantity: 80,
        },
        {
          departmentId: deptId("הנדסה"),
          itemId: itemId("תה"),
          quantity: 1,
          note: "לפגישת צוות",
        },
        {
          departmentId: deptId("מעבדת מו\"פ"),
          itemId: itemId("סוכר"),
          quantity: 1,
        },
      ],
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
