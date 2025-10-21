// app/api/hello/route.ts
import { getPool } from '@/lib/db';
import { Genre, GENRE_LIST_QUERY, SUCCESS_MOVIE_GENRE_DECADE_QUERY } from '@/lib/queries';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    try {
        const pool = getPool();
        const body = await request.json();
        const [genres] = await pool.query<Genre[]>(GENRE_LIST_QUERY);
        console.log(genres)
        let genreohc = ""
        let genresList: Genre[] = genres;
        for (let i = 0; i > genresList.length; i++) {
            if (genresList[i] == body.genre) {
                genreohc += 'T'
            } else {
                genreohc += 'F'
            }
        }
        console.log("OHC:" + genreohc)
        const [rows] = await pool.query(SUCCESS_MOVIE_GENRE_DECADE_QUERY, [
            genreohc,
            body.range_before,
            body.range_after,
        ]);
        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}