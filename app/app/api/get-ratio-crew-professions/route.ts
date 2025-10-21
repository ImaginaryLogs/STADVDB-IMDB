// app/api/hello/route.ts
import { getPool } from '@/lib/db'
import { NextResponse } from 'next/server'

// Handle GET requests
export async function GET(request: Request) {
    try {
        const pool = getPool()
        
        // Single query with index hint
        const [rows]: any = await pool.query(`
            SELECT 
                category as profession,
                COUNT(*) as count
            FROM BridgeCrew
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
            LIMIT 8
        `);
        
        console.log('Crew professions raw data:', rows); // Debug log
        
        // Calculate percentage in JavaScript (faster than SQL)
        const totalCount = rows.reduce((sum: number, row: any) => sum + row.count, 0);
        
        const result = rows.map((row: any) => ({
            profession: row.profession,
            count: row.count,
            percentage: parseFloat(((row.count * 100.0) / totalCount).toFixed(2))
        }));
        
        console.log('Crew professions with percentages:', result); // Debug log
        
        return NextResponse.json(result, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching crew professions:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 })
    }
}
