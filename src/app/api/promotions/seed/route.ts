import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";

const DEFAULTS = [
  {
    name: "Ceremonial Matcha",
    price: "250 MKD",
    category: "Recommended",
    label: "Drink",
    description: "Premium stone-ground Japanese matcha whisked to perfection. Velvety smooth with a deep umami finish.",
    imageUrl: "https://images.unsplash.com/photo-1582793988951-9aed55099991?auto=format&fit=crop&q=80&w=1000",
  },
  {
    name: "Dark Choc Cookie",
    price: "120 MKD",
    category: "Recommended",
    label: "Food",
    description: "Soft-baked with 70% cacao chunks and a touch of sea salt. The perfect companion for your drink.",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=1000",
  },
  {
    name: "Iced Latte",
    price: "180 MKD",
    category: "New",
    label: "Drink",
    description: "Double shot of specialty espresso poured over chilled milk and ice. Refreshing and bold.",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    name: "Artisan Pastry",
    price: "150 MKD",
    category: "New",
    label: "Food",
    description: "Hand-rolled layers of buttery dough, baked until golden and crisp. Selection varies daily.",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1000",
  },
];

export async function POST() {
  try {
    await ensureTable();

    // Clear existing
    await sql`DELETE FROM promotions`;

    // Insert defaults
    for (let i = 0; i < DEFAULTS.length; i++) {
      const d = DEFAULTS[i];
      await sql`
        INSERT INTO promotions (name, price, description, image_url, category, label, sort_order)
        VALUES (${d.name}, ${d.price}, ${d.description}, ${d.imageUrl}, ${d.category}, ${d.label}, ${i})
      `;
    }

    return NextResponse.json({ success: true, count: DEFAULTS.length });
  } catch (error) {
    console.error("POST /api/promotions/seed error:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
