// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { SUCCESS_MOVIE_GENRE_DECADE_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    try {
        const pool = getPool();
        const body = await request.json();
        const [rows] = await pool.query(SUCCESS_MOVIE_GENRE_DECADE_QUERY, [
            body.genre,
            body.range_before,
            body.range_after,
        ]);
        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}