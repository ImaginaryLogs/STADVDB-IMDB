import { getPool } from '@/lib/db';
import { SUCCESS_GENRE_DECADE_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server';

const GENRE_LOOKUP = [
  'Action','Adult','Adventure','Animation','Biography','Comedy','Crime','Documentary',
  'Drama','Family','Fantasy','Film-Noir','Game-Show','History','Horror','Music',
  'Musical','Mystery','News','Reality-TV','Romance','Sci-Fi','Short','Sport',
  'Talk-Show','Thriller','War','Western',
];

const decodeGenre = (encoded: string | null) => {
  if (!encoded) return 'Unknown';
  return encoded
    .split('')
    .reduce<string[]>((acc, flag, idx) => {
      if (flag.toUpperCase() === 'T') acc.push(GENRE_LOOKUP[idx] ?? `Genre ${idx + 1}`);
      return acc;
    }, [])
    .join(', ') || 'Unknown';
};

export async function POST(request: Request) {
  try {
    const pool = getPool();
    const { decade } = await request.json();
    const decadeNum = parseInt(decade, 10);

    if (Number.isNaN(decadeNum)) {
      return NextResponse.json(
        { error: 'Invalid decade payload', received: decade },
        { status: 400 },
      );
    }

    const [rows] = await pool.query(SUCCESS_GENRE_DECADE_QUERY, [decadeNum]);

    const withLabels = Array.isArray(rows)
      ? rows.map((row: any) => ({
          ...row,
          genre_label: decodeGenre(row.genre),
        }))
      : [];

    return NextResponse.json(withLabels, { status: 200 });
  } catch (error: any) {
    console.error('post-genre-decade-success', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}