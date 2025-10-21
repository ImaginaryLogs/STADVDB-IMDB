//// filepath: /Users/norsonc.adiong/Desktop/STADVDB-STADVDB-IMDB/app/app/api/get-correlation-rating-votes/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RATING_VOTES_CORRELATION_QUERY, RATING_VOTES_SCATTER_QUERY } from '@/lib/queries';

export async function GET() {
  try {
    const pool = getPool();
    const [corrRows]: any[] = await pool.query(RATING_VOTES_CORRELATION_QUERY);
    const pearson = corrRows?.[0]?.pearson_r ?? 0;

    const [scatterRows]: any[] = await pool.query(RATING_VOTES_SCATTER_QUERY);
    const points = Array.isArray(scatterRows)
      ? scatterRows.map((row) => ({
        rating: Number(row.rating ?? 0),
        votes: Number(row.votes ?? 0),
      }))
      : [];

    return NextResponse.json(
      [
        {
          pearson_r: typeof pearson === 'string' ? parseFloat(pearson) : Number(pearson),
          points,
        },
      ],
      { status: 200 }
    );
  } catch (error: any) {
    console.error('get-correlation-rating-votes', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Optionally, add PUT, DELETE, etc.
