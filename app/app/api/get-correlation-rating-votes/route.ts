// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { RATING_VOTES_CORRELATION_QUERY } from '@/lib/db-queries';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const pool = await getPool();
    const [rows] = await pool.query(RATING_VOTES_CORRELATION_QUERY)

    return NextResponse.json([rows], { status: 200 })
}


// Optionally, add PUT, DELETE, etc.
