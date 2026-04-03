import { neon } from '@neondatabase/serverless';

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      folder TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT '開発中' CHECK (status IN ('稼働中', '開発中', '停止中')),
      commands JSONB DEFAULT '[]'::jsonb,
      prompts JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}
