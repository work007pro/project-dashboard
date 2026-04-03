import { getDb, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const sql = getDb();
  await initDb();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  let projects;
  if (search) {
    const pattern = `%${search}%`;
    projects = await sql`
      SELECT * FROM projects
      WHERE name ILIKE ${pattern}
        OR description ILIKE ${pattern}
        OR folder ILIKE ${pattern}
      ORDER BY created_at ASC
    `;
  } else {
    projects = await sql`SELECT * FROM projects ORDER BY created_at ASC`;
  }

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const sql = getDb();
  await initDb();

  const body = await request.json();
  const { name, folder, description, status, category, commands, prompts } = body;

  const result = await sql`
    INSERT INTO projects (name, folder, description, status, category, commands, prompts)
    VALUES (
      ${name},
      ${folder},
      ${description || ''},
      ${status || '開発中'},
      ${category || '未分類'},
      ${JSON.stringify(commands || [`cd ~/projects/${folder} && claude`])}::jsonb,
      ${JSON.stringify(prompts || [])}::jsonb
    )
    RETURNING *
  `;

  return NextResponse.json(result[0], { status: 201 });
}
