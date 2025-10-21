//// filepath: /Users/norsonc.adiong/Desktop/STADVDB/STADVDB-IMDB/app/app/api/post-popular-movies-of-actor/route.ts
import { getPool } from '@/lib/db';
import { POPULAR_MOVIES_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server';

const PERSON_LOOKUP_QUERY = `
  SELECT full_name
  FROM DimPerson
  WHERE full_name LIKE ?
  ORDER BY
    CASE WHEN full_name = ? THEN 0 ELSE 1 END,
    CHAR_LENGTH(full_name)
  LIMIT 1;
`;

export async function POST(request: Request) {
  try {
    const pool = getPool();
    const { actorName } = await request.json();

    const trimmed = actorName?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'actorName is required' }, { status: 400 });
    }

    const [personRows]: any[] = await pool.query(PERSON_LOOKUP_QUERY, [
      `%${trimmed}%`,
      trimmed,
    ]);

    if (!personRows.length) {
      return NextResponse.json(
        { error: `No actor found matching "${trimmed}"` },
        { status: 404 },
      );
    }

    const officialName = personRows[0].full_name;
    const [rows]: any[] = await pool.query(POPULAR_MOVIES_QUERY, [officialName]);

    const titleKeys = rows.map((row) => row.title_key).filter(Boolean);
    let titlesMap = new Map<string, string>();

    if (titleKeys.length) {
      const placeholders = titleKeys.map(() => '?').join(',');
      const [titleRows]: any[] = await pool.query(
        `SELECT title_key, primary_title FROM DimTitle WHERE title_key IN (${placeholders})`,
        titleKeys,
      );
      titlesMap = new Map(
        titleRows.map((row) => [row.title_key, row.primary_title]),
      );
    }

    const enriched = rows.map((row) => ({
      ...row,
      title: titlesMap.get(row.title_key) ?? row.title_key,
    }));

    return NextResponse.json(
      { actor: officialName, movies: enriched },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error fetching actor movies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}