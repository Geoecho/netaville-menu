import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await sql`
      SELECT id, name, price, description, image_url, category, label, sort_order
      FROM promotions
      ORDER BY sort_order ASC, id ASC
    `;
    const promotions = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      description: r.description,
      imageUrl: r.image_url,
      category: r.category,
      label: r.label || undefined,
      sortOrder: r.sort_order,
    }));
    return NextResponse.json(promotions);
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { name, price, description, imageUrl, category, label } = body;

    const { rows: maxRows } = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM promotions`;
    const nextOrder = maxRows[0].next_order;

    const { rows } = await sql`
      INSERT INTO promotions (name, price, description, image_url, category, label, sort_order)
      VALUES (${name}, ${price}, ${description}, ${imageUrl}, ${category}, ${label || null}, ${nextOrder})
      RETURNING id, name, price, description, image_url, category, label, sort_order
    `;
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
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
