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
        let genreohc = []

        let genresList: Genre[] = genres;
        for (let i = 0; i < genresList.length; i++) {
            genreohc.push('F')
        }
        for (let currGenres of genresList) {
            console.log(currGenres)
            if (currGenres.genre_name == body.genre) {
                genreohc[currGenres.genre_key] = 'T'
            };
        }
        let movies = genreohc.join("");
        console.log("OHC:" + movies)
        const [rows] = await pool.query(SUCCESS_MOVIE_GENRE_DECADE_QUERY, [
            movies,
            parseInt(body.range_before),
            parseInt(body.range_after),
        ]);
        console.log(rows)
        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}