// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { SUCCESS_MOVIE_GENRE_DECADE_QUERY, SuccessMovieGenreDecadeQueryInput } from '@/lib/db-queries';
import { NextResponse } from 'next/server'


export async function POST(request: Request) {
    const data = { message: 'Hello from Next.js API Route!' }
    const body: SuccessMovieGenreDecadeQueryInput = await request.json()
    const pool = await getPool();
    const [rows, _] = await pool.query(SUCCESS_MOVIE_GENRE_DECADE_QUERY, [body.genre, body.range_before, body.range_after])

    return NextResponse.json(rows, { status: 200 })
}