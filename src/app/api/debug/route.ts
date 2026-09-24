import { prisma } from "@/lib/prisma";

export async function GET() {
  const info = {
    hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    tursoUrlPreview: process.env.TURSO_DATABASE_URL?.slice(0, 40) ?? null,
  };

  try {
    const count = await prisma.department.count();
    return Response.json({ ok: true, departmentCount: count, ...info });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : null,
        ...info,
      },
      { status: 500 },
    );
  }
}
