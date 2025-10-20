use imdb_source;

SET SESSION cte_max_recursion_depth = 10000;
SET GLOBAL innodb_buffer_pool_size = 8589934592;

INSERT INTO imdb.DimGenre (genre_name, genre_key) VALUES 
('Documentary', 1),
('Short', 2),
('Animation', 3),
('Comedy', 4),
('Romance', 5),
('Sport', 6),
('News', 7),
('Drama', 8),
('Fantasy', 9),
('Horror', 10),
('Biography', 11),
('Music', 12),
('War', 13),
('Crime', 14),
('Western', 15),
('Family', 16),
('Adventure', 17),
('Action', 18),
('History', 19),
('Mystery', 20),
('Sci-Fi', 21),
('Musical', 22),
('Thriller', 23),
('Film-Noir', 24),
('Talk-Show', 25),
('Game-Show', 26),
('Reality-TV', 27),
('Adult', 28);

INSERT INTO imdb.DimProfession (profession_name, profession_key) VALUES
('actor', 1),
('miscellaneous', 2),
('producer', 3),
('actress', 4),
('soundtrack',5),
('archive_footage', 6),
('music_department', 7),
('writer', 8),
('director', 9),
('stunts', 10),
('make_up_department', 11),
('composer', 12),
('assistant_director', 13),
('camera_department', 14),
('music_artist', 15),
('art_department', 16),
('editor', 17),
('cinematographer', 18),
('executive', 19),
('visual_effects', 20),
('costume_designer', 21),
('script_department', 22),
('art_director', 23),
('editorial_department', 24),
('costume_department', 25),
('animation_department', 26),
('talent_agent', 27),
('archive_sound', 28),
('production_designer', 29),
('special_effects', 30),
('manager', 31),
('production_manager', 32),
('sound_department', 33),
('casting_department', 34),
('location_management', 35),
('casting_director', 36),
('set_decorator', 37),
('transportation_department', 38),
('choreographer', 39),
('legal', 40),
('accountant', 41),
('podcaster', 42),
('publicist', 43),
('assistant', 44),
('production_department', 45),
('electrical_department', 46)
;

-- title.basics (DimTitle)
DROP FUNCTION IF EXISTS one_hot_encode_genres;

DELIMITER //
CREATE FUNCTION one_hot_encode_genres(input_genre VARCHAR(255))
RETURNS VARCHAR(32)
DETERMINISTIC
BEGIN
	DECLARE genres VARCHAR(256) DEFAULT 'Documentary,Short,Animation,Comedy,Romance,Sport,News,Drama,Fantasy,Horror,Biography,Music,War,Crime,Western,Family,Adventure,Action,History,Mystery,Sci-Fi,Musical,Thriller,Film-Noir,Talk-Show,Game-Show,Reality-TV,Adult';
	DECLARE genre VARCHAR(32);
    DECLARE i INT DEFAULT 1;
    DECLARE genres_size INT DEFAULT 28;
    DECLARE ohe VARCHAR(32) DEFAULT '';
        
    WHILE i <= genres_size DO
        SET genre = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(genres, ',', i), ',', -1));
        
        IF FIND_IN_SET(genre, input_genre) > 0 THEN
            SET ohe = CONCAT(ohe, 'T');
        ELSE
            SET ohe = CONCAT(ohe, 'F');
        END IF;

        SET i = i + 1;
    END WHILE;
    
    RETURN ohe;
END //
DELIMITER ;

INSERT INTO imdb.DimTitle(title_key,title_type,primary_title,original_title,release_year,end_year,genre,runtime_minutes,isAdult)
SELECT tb.tconst,tb.titleType,tb.primaryTitle,
tb.originalTitle,
(CASE WHEN tb.startYear IS NULL THEN 0 ELSE tb.startYear END),
tb.endYear,
(SELECT one_hot_encode_genres(tb.genres)),
(CASE WHEN tb.runtimeMinutes IS NULL THEN 0 ELSE tb.runtimeMinutes END),
tb.isAdult
FROM imdb_source.title_basics tb;


-- name.basics (DimPerson)
DROP FUNCTION IF EXISTS one_hot_encode_professions;

DELIMITER //
CREATE FUNCTION one_hot_encode_professions(input_profession VARCHAR(255))
RETURNS VARCHAR(64)
DETERMINISTIC
BEGIN
	DECLARE professions VARCHAR(1024) DEFAULT 'actor,miscellaneous,producer,actress,soundtrack,archive_footage,music_department,writer,director,stunts,make_up_department,composer,assistant_director,camera_department,music_artist,art_department,editor,cinematographer,executive,visual_effects,costume_designer,script_department,art_director,editorial_department,costume_department,animation_department,talent_agent,archive_sound,production_designer,special_effects,manager,production_manager,sound_department,casting_department,location_management,casting_director,set_decorator,transportation_department,choreographer,legal,accountant,podcaster,publicist,assistant,production_department,electrical_department';
	DECLARE profession VARCHAR(32);
    DECLARE i INT DEFAULT 1;
    DECLARE profession_size INT DEFAULT 46;
    DECLARE ohe VARCHAR(64) DEFAULT '';
        
    WHILE i <= profession_size DO
        SET profession = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(professions, ',', i), ',', -1));
        
        IF FIND_IN_SET(profession, input_profession) > 0 THEN
            SET ohe = CONCAT(ohe, 'T');
        ELSE
            SET ohe = CONCAT(ohe, 'F');
        END IF;

        SET i = i + 1;
    END WHILE;
    
    RETURN ohe;
END //
DELIMITER ;

INSERT INTO imdb.DimPerson(person_key,full_name,birth_year,death_year,profession)
SELECT nb.nconst,(CASE WHEN nb.primaryName IS NULL THEN 'unknown' ELSE nb.primaryName END ),(CASE WHEN nb.birthYear IS NULL THEN 0 ELSE nb.birthYear END ),nb.deathYear,(
	SELECT one_hot_encode_professions(nb.primaryProfession)
) FROM imdb_source.name_basics nb;


-- title.episode (DimEpisode)
INSERT INTO imdb.DimEpisode(episode_key, title_key, season_number, episode_number)
SELECT tconst, parenttconst, seasonNumber, episodeNumber FROM imdb_source.title_episode;


-- full_data (FactOscarAwards)
INSERT IGNORE INTO imdb.FactOscarAwards(title_key,person_key,is_winner,class,canonical_category,category,ceremony_year)
WITH RECURSIVE split_nominees AS (
	SELECT
		oa.filmId AS title_key,
		TRIM(SUBSTRING_INDEX(oa.nomineeIds, ',', 1)) AS person_key,
		IF(oa.winner = 'True',1,0) AS is_winner,
		oa.class AS class,
		oa.canonicalCategory AS canonical_category,
		oa.category AS category,
		TRIM(SUBSTRING_INDEX(oa.year, '/', 1)) AS ceremony_year,
		SUBSTRING(oa.nomineeIds, LENGTH(SUBSTRING_INDEX(oa.nomineeIds, ',', 1)) + 2) AS remaining
	FROM imdb_source.oscar_awards oa
	UNION ALL
	SELECT
		title_key, TRIM(SUBSTRING_INDEX(remaining, ',', 1)), is_winner, class, canonical_category, category, ceremony_year,
    	SUBSTRING(remaining, LENGTH(SUBSTRING_INDEX(remaining, ',', 1)) + 2)
    FROM split_nominees
    WHERE remaining <> ''
)
SELECT title_key, person_key, is_winner, class, canonical_category, category, ceremony_year 
FROM split_nominees
WHERE person_key <> '' AND person_key <> '?';

-- funny title.crew P1 (BridgeCrew)

-- possible error due to tconst being fake
INSERT IGNORE INTO imdb.BridgeCrew(title_key,person_key,category)
WITH RECURSIVE split_directors AS (
	SELECT 
	tconst,
	'director' AS category,
	
	TRIM(SUBSTRING_INDEX(directors,',',1)) AS nconst,
	SUBSTRING(directors, LENGTH(TRIM(SUBSTRING_INDEX(directors,',',1))) + 2) AS extra
	FROM title_crew
	
	UNION ALL
	
	SELECT
	tconst,
	'director' AS category,
	TRIM(SUBSTRING_INDEX(extra,',',1)) AS nconst,
	SUBSTRING(extra,LENGTH(TRIM(SUBSTRING_INDEX(extra,',',1))) + 2) AS extra
	FROM split_directors
	WHERE extra <> ''
), 
split_writers AS (
	SELECT 
	tconst,
	'writer' AS category,
	TRIM(SUBSTRING_INDEX(writers,',',1)) AS nconst,
	SUBSTRING(writers, LENGTH(TRIM(SUBSTRING_INDEX(writers,',',1))) + 2) AS extra
	FROM title_crew
	
	UNION ALL
	
	SELECT
	tconst,
	'writer' AS category,
	TRIM(SUBSTRING_INDEX(extra,',',1)) AS nconst,
	SUBSTRING(extra,LENGTH(TRIM(SUBSTRING_INDEX(extra,',',1))) + 2) AS extra
	FROM split_writers
	WHERE extra <> ''
)
SELECT tconst, nconst, category
FROM (
SELECT tconst, nconst, category 
FROM split_directors
UNION ALL
SELECT tconst, nconst, category 
FROM split_writers
) AS combined
WHERE nconst IS NOT NULL AND category IS NOT NULL AND category <> '';

-- title.principals (BridgeCrew)
-- possible err due to duplicates from previous insert
-- batch uploading because it was being annoying before

INSERT IGNORE INTO imdb.BridgeCrew(title_key, person_key, category, job, characters)
SELECT tconst, nconst, category, job, characters
FROM imdb_source.title_principals;


-- title.episodes/title.ratings/DimTitle (FactRatings)

INSERT IGNORE INTO imdb.FactRatings(title_key,genre,episode_key,avg_rating,num_votes)
SELECT te.parenttconst,dt.genre,(CASE WHEN te.parenttconst = tr.tconst THEN NULL ELSE tr.tconst END),tr.averageRating, tr.numVotes 
FROM imdb_source.title_ratings tr
LEFT JOIN imdb_source.title_episode te ON te.parenttconst = tr.tconst
JOIN imdb.DimTitle dt ON dt.title_key = te.parenttconst;

-- DimTitle/DimPerson/FactRatings (FactCrewPerformancePerFilmGenre)
INSERT INTO imdb.FactCrewPerformancePerFilmGenre(title_key,person_key,genre,avg_rating,num_votes,release_year)
SELECT bc.title_key,bc.person_key,dt.genre,fr.avg_rating,fr.num_votes,dt.release_year
FROM imdb.DimTitle dt
JOIN imdb.BridgeCrew bc ON bc.title_key = dt.title_key
JOIN imdb.FactRatings fr ON fr.title_key = dt.title_key

DELIMITER $$

CREATE PROCEDURE auto_generate_genre_columns()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE gname VARCHAR(64);
    DECLARE cur CURSOR FOR 
        SELECT genre_name FROM DimGenre;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO gname;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @colname = CONCAT('is_genre_', REPLACE(REPLACE(gname, '-', ''), ' ', ''));
        SET @sql = CONCAT('ALTER TABLE DimTitle ADD COLUMN IF NOT EXISTS ', @colname, ' BOOLEAN DEFAULT 0;');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Optional: index each genre
        SET @sql = CONCAT('CREATE INDEX IF NOT EXISTS idx_title_', @colname, ' ON DimTitle(', @colname, ');');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END $$

DELIMITER ;

-- Run it
CALL auto_generate_genre_columns();
