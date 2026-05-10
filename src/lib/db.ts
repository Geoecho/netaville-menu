import { sql } from "@vercel/postgres";

export async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(50) NOT NULL,
        description TEXT,
        image_url TEXT,
        category VARCHAR(20) NOT NULL DEFAULT 'New',
        label VARCHAR(10),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error("Failed to ensure table exists:", error);
    throw error;
  }
}

export { sql };
