// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { TOP_OSCAR_BY_CATEGORY_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server'

// Handle GET requests
export async function GET(request: Request) {
    const data = { message: 'Hello from Next.js API Route!' }
    const pool = await getPool();
    const [rows] = await pool.query(TOP_OSCAR_BY_CATEGORY_QUERY)

    return NextResponse.json(rows, { status: 200 })
}
// Optionally, add PUT, DELETE, etc.
