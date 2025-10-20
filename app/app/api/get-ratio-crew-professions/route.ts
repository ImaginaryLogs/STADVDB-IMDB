// app/api/hello/route.ts
import { getPool } from '@/lib/db'
import { RATIO_PROFESSIONS_CREW_MEMBER_QUERY } from '@/lib/queries'
import { NextResponse } from 'next/server'

// Handle GET requests
export async function GET(request: Request) {
    const pool = await getPool()
    const [rows] = await pool.query(RATIO_PROFESSIONS_CREW_MEMBER_QUERY)
    return NextResponse.json(rows, { status: 200 })

}
