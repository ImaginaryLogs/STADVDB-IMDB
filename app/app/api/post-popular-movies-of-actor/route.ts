// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { POPULAR_MOVIES_QUERY, PopularMoviesQueryInput } from '@/lib/db-queries';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const pool = await getPool();
    const body: PopularMoviesQueryInput = await request.json()

    const [rows] = await pool.query(POPULAR_MOVIES_QUERY, [body.full_name])

    return NextResponse.json(rows, { status: 200 })
}
// Optionally, add PUT, DELETE, etc.
