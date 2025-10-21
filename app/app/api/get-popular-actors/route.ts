// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { POPULAR_ACTORS_QUERY } from '@/lib/db-queries';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const pool = getPool();
        const [rows] = await pool.query(POPULAR_ACTORS_QUERY);
        
        console.log('Popular actors data:', rows); // Debug log
        
        return NextResponse.json(rows, { status: 200 }); // Don't wrap in array
    } catch (error: any) {
        console.error('Error fetching popular actors:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
}


// Optionally, add PUT, DELETE, etc.
