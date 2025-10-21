import { RowDataPacket } from "mysql2"

export const POPULAR_ACTORS_QUERY = `
WITH ActorStats AS (
  SELECT 
    bc.person_key,
    COUNT(DISTINCT bc.title_key) AS total_titles,
    AVG(fr.avg_rating) AS avg_rating
  FROM FactRatings fr
  JOIN BridgeCrew bc ON fr.title_key = bc.title_key
  WHERE bc.category IN ('actor', 'actress')
  GROUP BY bc.person_key
)
SELECT 
  dp.full_name,
  a.total_titles,
  a.avg_rating,
  RANK() OVER (ORDER BY a.avg_rating DESC, a.total_titles DESC) AS actor_rank
FROM ActorStats a
JOIN DimPerson dp ON dp.person_key = a.person_key
LIMIT 10;`

export type PopularActors = {
    full_name: string,
    total_titles: string,
    avg_rating: number,
    actor_rank: number
}

export const POPULAR_GENRES_QUERY = `SELECT 
  dt.genre,
  AVG(fr.avg_rating) AS avg_rating,
  AVG(fr.avg_rating * LOG(1 + fr.num_votes)) AS success_score,
  COUNT(DISTINCT dt.title_key) AS total_titles
FROM FactRatings fr
JOIN DimTitle dt ON fr.title_key = dt.title_key
WHERE dt.release_year BETWEEN YEAR(CURDATE()) - 10 AND YEAR(CURDATE())
GROUP BY dt.genre
ORDER BY success_score DESC
LIMIT 10;
`

export type PopularGenres = {
    genre: string,
    avg_rating: number,
    success_score: number,
    total_titles: number
}
// in
export const POPULAR_MOVIES_QUERY = `
WITH PersonInfo AS (
    SELECT person_key
    FROM DimPerson
    WHERE full_name = ?
)
SELECT
    fcp.title_key AS title_key,
    fcp.avg_rating AS avg_rating,
    fcp.num_votes AS num_votes,
    fcp.success_score AS success_score
FROM FactCrewPerformancePerFilmGenre fcp
JOIN PersonInfo pi ON pi.person_key = fcp.person_key;
`

export type PopularMovies = {
    movie_title: string,
    avg_rating: number,
    num_votes: number,
    success_score: number
}

export type PopularMoviesQueryInput = {
    full_name: string
}

export const TOP_OSCAR_BY_CATEGORY_QUERY = `
WITH TopCanonicalCategories AS (
    SELECT
        foa.canonical_category AS canonical_category
    FROM FactOscarAwards foa
    WHERE foa.is_winner = 1
)
SELECT
    canonical_category,
    COUNT(*) AS total_wins
FROM TopCanonicalCategories
GROUP BY canonical_category
ORDER BY total_wins DESC
LIMIT 10;
`

export type TopOscarByCategory = {
    award_class: string,
    canonical_category: string,
    total_wins: number,
}

export const RATIO_PROFESSIONS_CREW_MEMBER_QUERY = `
SELECT 
  bc.category AS profession,
  COUNT(*) AS count
FROM BridgeCrew bc
WHERE bc.category IS NOT NULL
GROUP BY bc.category
ORDER BY count DESC
LIMIT 10;

`

export type RatioProfessionsCrewMember = {
    profession: string,
    count: number
}

//in
export const SUCCESS_GENRE_DECADE_QUERY = `
WITH GenreSuccess AS (
    SELECT
        dt.release_decade AS decade,
        dt.genre AS genre,
        fr.success_score AS success_score
    FROM FactRatings fr
    JOIN DimTitle dt ON fr.title_key = dt.title_key
)
SELECT
    decade, genre, success_score
FROM GenreSuccess
WHERE decade = ?
ORDER BY success_score DESC
LIMIT 10;
`


export type SuccessGenreDecade = {
    decade: number,
    genre: string,
    success_score: number
}
export type SuccessGenreDecadeQueryInput = {
    decade: number,
}

export const GENRE_LIST_QUERY = `
SELECT * FROM DimGenre ORDER BY genre_key;
`
export interface Genre extends RowDataPacket {
    genre_key: number,
    genre_name: string
}
export const SUCCESS_MOVIE_GENRE_DECADE_QUERY = `
SELECT
    title_key,
    release_year,
    success_score
FROM FactCrewPerformancePerFilmGenre
WHERE genre = ?
    AND release_year BETWEEN ? AND ?
ORDER BY release_year;
`

export type SuccessMovieGenreDecade = {
    release_year: number,
    avg_success: number,
}

export type SuccessMovieGenreDecadeQueryInput = {
    genre: string,
    range_before: number,
    range_after: number
}
export const RATING_VOTES_CORRELATION_QUERY = `WITH OverallRatings AS (
    SELECT 
        AVG(avg_rating) AS overall_avg_rating,
        AVG(num_votes) AS overall_votes
    FROM FactRatings
),
RatingsDifference AS (
    SELECT 
        (avg_rating - (SELECT overall_avg_rating FROM OverallRatings)) AS ratings_difference,
        (num_votes - (SELECT overall_votes FROM OverallRatings)) AS votes_difference
    FROM FactRatings
)
SELECT 
  (SUM(ratings_difference * votes_difference) /
  (SQRT(SUM(POW(ratings_difference, 2))) *
   SQRT(SUM(POW(votes_difference, 2))))) AS pearson_r
FROM RatingsDifference;

`

export const RATING_VOTES_SCATTER_QUERY = `
SELECT 
  avg_rating AS rating,
  num_votes AS votes
FROM FactRatings
WHERE avg_rating IS NOT NULL
  AND num_votes IS NOT NULL
ORDER BY num_votes DESC
LIMIT 200;
`;
