import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getDb();
  const body = await request.json();
  const { name, folder, description, status, category, commands, prompts } = body;

  const result = await sql`
    UPDATE projects SET
      name = COALESCE(${name}, name),
      folder = COALESCE(${folder}, folder),
      description = COALESCE(${description}, description),
      status = COALESCE(${status}, status),
      category = COALESCE(${category}, category),
      commands = COALESCE(${commands ? JSON.stringify(commands) : null}::jsonb, commands),
      prompts = COALESCE(${prompts ? JSON.stringify(prompts) : null}::jsonb, prompts),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getDb();

  await sql`DELETE FROM projects WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
