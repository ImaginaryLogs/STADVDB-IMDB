// app/api/hello/route.ts
import { getPool } from '@/lib/db'
import { POPULAR_GENRES_QUERY, SUCCESS_GENRE_DECADE_QUERY, SuccessGenreDecade, SuccessGenreDecadeQueryInput } from '@/lib/db-queries';
import { QueryResult } from 'mysql2';
import { NextResponse } from 'next/server'

// Handle GET requests
export async function POST(request: Request) {
    const pool = await getPool();
    const body: SuccessGenreDecadeQueryInput = await request.json();
    const [rows] = await pool.query<QueryResult>(SUCCESS_GENRE_DECADE_QUERY, [body.decade])
    return NextResponse.json(rows, { status: 200 })
}


// Optionally, add PUT, DELETE, etc.
