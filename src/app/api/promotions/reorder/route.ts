import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { ids } = body as { ids: number[] };

    for (let i = 0; i < ids.length; i++) {
      await sql`UPDATE promotions SET sort_order = ${i} WHERE id = ${ids[i]}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/promotions/reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
