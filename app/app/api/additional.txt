CREATE INDEX idx_ftcgp_person_title ON FactCrewPerformancePerFilmGenre (person_key, title_key);


/* 
  1. Identify the Fact Table(s)
  2. Identify Dimensions (Context)
  3. Define the Metric
  4. Define the Grain

*/
-- Successful Crew Members
-- Roll-up + Ranking
-- 1. FactCrewPerformancePerFilmGenre
-- 2. DIM success_score
-- 3. success_score
-- 4. Per person
WITH CrewRank AS (
	SELECT
		f.person_key,
		p.person_name,
		AVG(f.avg_rating) as avg_film_ratings,
		AVG(f.success_score) as avg_imdb_success,
		RANK() OVER (ORDER BY AVG(f.success_score) DESC) AS success_rank,
	FROM FactCrewPerformancePerFilmGenre f FORCE INDEX idx_ftcgp_person_title
	JOIN DimPerson p ON p.person_key
	GROUP BY f.person_key
) 
SELECT *
FROM CrewRank c
ORDER BY c.success_rank
WHERE c.success_rank <= 10,

-- 2nd Iteration
WITH CrewRank AS (
	SELECT
		f.person_key,
		AVG(f.avg_rating) as avg_film_ratings,
		AVG(f.num_votes) AS avg_votes,
		AVG(f.success_score) as avg_imdb_success,
		RANK() OVER (ORDER BY AVG(f.success_score) DESC) AS success_rank,
	FROM FactCrewPerformancePerFilmGenre f FORCE INDEX idx_ftcgp_person_title
	GROUP BY f.person_key
) 
SELECT 
	p.person_name,
	c.avg_film_ratings,
	c.avg_votes,
	c.avg_imdb_success,
	c.success_rank
FROM CrewRank c
JOIN DimPerson p ON p.person_key = c.person_key
JOIN DimProfession pr ON pr.profession_key = p.profession_key
WHERE c.success_rank <= 10	
ORDER BY c.success_rank

-- Popular Genres
-- Roll-up + Grouping
-- 1. FactCrewPerformancePerFilmGenre
-- 2. DIM genre
-- 3. success_score
-- 4. Per genre

WITH GenreRank AS (
	SELECT
		f.genre_key,
		AVG(f.avg_rating) as avg_film_ratings,
		AVG(f.success_score) as avg_imdb_success,
		RANK() OVER (ORDER BY AVG(f.success_score) DESC) AS success_rank 
	FROM FactCrewPerformancePerFilmGenre f FORCE INDEX idx_ftcgp_genre_year
	GROUP BY f.genre_key
)
SELECT
	g.genre_name,
	gr.avg_film_ratings,
	gr.avg_imdb_success,
	gr.success_rank
FROM GenreRank gr
JOIN DimGenre g ON g.genre_key = gr.genre_key
WHERE c.success_rank <= 10
ORDER BY c.success_rank;

-- Popular Actors
-- Drill-down
WITH ActorPopularity AS (
	SELECT																															-- Get popularity of each actor ranked
		f.person_key,
		COUNT(DISTINCT f.title_key) AS film_count
		SUM(f.num_votes) AS total_votes,
		AVG(f.avg_rating) AS avg_rating,
		RANK() OVER (ORDER BY SUM(f.num_votes) DESC) AS popularity_rank
	FROM FactCrewPerformancePerFilmGenre f 
	WHERE pr.profession_name = 'actor'
	GROUP BY f.person_key
	ORDER BY f.popularity_rank
)
SELECT 																																-- JOIN In with Dim Tables
	p.full_name,
	ap.film_count,
	ap.total_votes,
	ap.avg_rating,
	ap.popularity_rank
FROM ActorPopularity ap
JOIN DimPerson p ON p.person_key = ap.person_key
WHERE p.popularity_rank <= 10
ORDER BY p.popularity_rank

-- Line Chart of an Actor
WITH filter_key AS (
	SELECT 
		p.person_key
	FROM DimPerson p
	WHERE LOWER(p.full_name) = LOWER('Leonardo DiCarpio')
), success_timeline AS (	
	SELECT 
		f.title_key
		AVG(f.success_score) AS avg_success_score
		f.release_year
	FROM FactCrewPerformancePerFilmGenre f
	WHERE f.person_key = filter_key
	GROUP BY f.person_key, t.release_year
)
SELECT
	filter_key,
	t.primary_title,
	t.original_title,
	st.avg_success_score
	st.release_year
FROM success_timeline st filter_key
JOIN DimTitle t ON st.title_key = t.title_key
ORDER BY st.release_year

-- Correlation Test
SELECT 
    (AVG(x * y) - AVG(x) * AVG(y)) / (STDDEV_SAMP(x) * STDDEV_SAMP(y)) AS pearson_r
FROM (
    SELECT avg_rating AS x, num_votes AS y
    FROM FactRatings
) t;
