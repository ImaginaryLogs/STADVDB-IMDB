// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { POPULAR_ACTORS_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const pool = await getPool();
    const [rows] = await pool.query(POPULAR_ACTORS_QUERY)

    return NextResponse.json([rows], { status: 200 })
}


// Optionally, add PUT, DELETE, etc.
