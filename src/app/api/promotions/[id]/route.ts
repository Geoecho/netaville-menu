import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTable();
    const { id } = await params;
    const body = await request.json();
    const { name, price, description, imageUrl, category, label } = body;

    const { rows } = await sql`
      UPDATE promotions
      SET name = ${name}, price = ${price}, description = ${description},
          image_url = ${imageUrl}, category = ${category}, label = ${label || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, name, price, description, image_url, category, label, sort_order
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const r = rows[0];
    return NextResponse.json({
      id: r.id,
      name: r.name,
      price: r.price,
      description: r.description,
      imageUrl: r.image_url,
      category: r.category,
      label: r.label || undefined,
      sortOrder: r.sort_order,
    });
  } catch (error) {
    console.error("PUT /api/promotions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTable();
    const { id } = await params;
    await sql`DELETE FROM promotions WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/promotions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
