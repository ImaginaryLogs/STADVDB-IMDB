DROP SCHEMA IF EXISTS imdb_source;
CREATE SCHEMA imdb_source;
use imdb_source;

-- Table: title_basics
CREATE TABLE title_basics (
    tconst VARCHAR(100) PRIMARY KEY,
    titleType TEXT,
    primaryTitle TEXT,
    originalTitle TEXT,
    isAdult TEXT,
    startYear TEXT,       -- YYYY format
    endYear TEXT,         -- YYYY format or '\N'
    runtimeMinutes TEXT,
    genres TEXT            -- Array of up to three genres
);

-- Table: title_crew
CREATE TABLE title_crew (
    tconst VARCHAR(100) PRIMARY KEY,
    directors TEXT,        -- Array of nconsts
    writers TEXT           -- Array of nconsts
);

-- Table: title_episode
CREATE TABLE title_episode (
    tconst VARCHAR(100) PRIMARY KEY,
    parenttconst TEXT,
    seasonNumber TEXT,
    episodeNumber TEXT
);

-- Table: title_principals
CREATE TABLE title_principals (
    tconst VARCHAR(100) NOT NULL,
    ordering VARCHAR(64) NOT NULL,
    nconst TEXT NOT NULL,
    category TEXT,
    job TEXT,
    characters TEXT,
    PRIMARY KEY(tconst,ordering)
);

-- Table: title_ratings
CREATE TABLE title_ratings (
    tconst VARCHAR(100) PRIMARY KEY,
    averageRating TEXT,  
    numVotes TEXT
);

-- Table: name_basics
CREATE TABLE name_basics (
    nconst VARCHAR(100) PRIMARY KEY,
    primaryName TEXT,
    birthYear TEXT,              -- YYYY format
    deathYear TEXT,              -- YYYY format or '\N'
    primaryProfession TEXT,       -- Array of strings
    knownForTitles TEXT          -- Array of tconsts
);

CREATE TABLE oscar_awards (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    ceremony TEXT,
    year TEXT,
    class TEXT,
    canonicalCategory TEXT,
    category TEXT,
    nomId TEXT,
    film TEXT,
    filmId TEXT,
    name TEXT,
    nominees TEXT,
    nomineeIds TEXT,
    winner TEXT,
    detail TEXT,
    note TEXT,
    citation TEXT,
    multifilmNomination TEXT

);

use imdb_source;
LOAD DATA INFILE '/var/lib/mysql-files/title.basics.tsv'
INTO TABLE title_basics
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, runtimeMinutes, genres);

LOAD DATA INFILE '/var/lib/mysql-files/title.crew.tsv'
INTO TABLE title_crew
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tconst, directors, writers);

LOAD DATA INFILE '/var/lib/mysql-files/title.episode.tsv'
INTO TABLE title_episode
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tconst, parenttconst, seasonNumber, episodeNumber);

LOAD DATA INFILE '/var/lib/mysql-files/title.principals.tsv'
INTO TABLE title_principals
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tconst, ordering, nconst, category, job, characters);

LOAD DATA INFILE '/var/lib/mysql-files/title.ratings.tsv'
INTO TABLE title_ratings
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tconst, averageRating, numVotes);

LOAD DATA INFILE '/var/lib/mysql-files/name.basics.tsv'
INTO TABLE name_basics
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(nconst, primaryName, birthYear, deathYear, primaryProfession, knownForTitles);


LOAD DATA INFILE '/var/lib/mysql-files/full_data.tsv'
INTO TABLE oscar_awards
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5, @col6, @col7, @col8, @col9, @col10, @col11, @col12, @col13, @col14, @col15, @col16)
SET 
  ceremony = NULLIF(@col1, ''),
  year = NULLIF(@col2, ''),
  class = NULLIF(@col3, ''),
  canonicalCategory = NULLIF(@col4, ''),
  category = NULLIF(@col5, ''),
  nomId = NULLIF(@col6, ''),
  film = NULLIF(@col7, ''),
  filmId = NULLIF(@col8, ''),
  name = NULLIF(@col9, ''),
  nominees = NULLIF(@col10, ''),
  nomineeIds = NULLIF(@col11, ''),
  winner = NULLIF(@col12, ''),
  detail = NULLIF(@col13, ''),
  note = NULLIF(@col14, ''),
  citation = NULLIF(@col15, ''),
  multifilmNomination = NULLIF(@col16, '');

-- small notes:
-- genre is 28 characters one hot encoded (true/false)
-- profession is 46 characters on hot encoded (true/false) 

DROP SCHEMA IF EXISTS imdb;
CREATE SCHEMA imdb;


use imdb;
CREATE TABLE DimGenre (
	genre_key TINYINT NOT NULL PRIMARY KEY,
	genre_name VARCHAR(11) NOT NULL
)ENGINE=InnoDB;  
  
CREATE TABLE DimPerson (
	person_key VARCHAR(16) NOT NULL PRIMARY KEY,
	full_name VARCHAR(128) NOT NULL,
	birth_year INT NOT NULL,
	death_year INT,
	profession VARCHAR(48) 
)ENGINE=InnoDB;
  
CREATE TABLE DimProfession (
	profession_key TINYINT NOT NULL PRIMARY KEY,
	profession_name VARCHAR(64)
)ENGINE=InnoDB;  

CREATE TABLE DimTitle (
	title_key VARCHAR(16) NOT NULL PRIMARY KEY,
	primary_title VARCHAR(512) NOT NULL,
	original_title VARCHAR(512),
	title_type VARCHAR(25) NOT NULL,
	release_year INT NOT NULL,
	end_year INT,  
	genre VARCHAR(32) NOT NULL,
	runtime_minutes INT NOT NULL, 
	release_decade INT GENERATED ALWAYS AS (FLOOR(release_year / 10) * 10) STORED,
	isAdult BOOL NOT NULL
)ENGINE=InnoDB;  

CREATE TABLE FactOscarAwards (
	fact_id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	title_key VARCHAR(16),
	person_key VARCHAR(16),
	is_winner BOOL NOT NULL,
	class VARCHAR(64),
	canonical_category VARCHAR(255),
	category VARCHAR(255),
	ceremony_year INT,
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	FOREIGN KEY (person_key) REFERENCES DimPerson(person_key)
)ENGINE=InnoDB;

CREATE TABLE FactCrewPerformancePerFilmGenre (
	fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
	title_key VARCHAR(16) NOT NULL,
	person_key VARCHAR(16) NOT NULL,
	genre VARCHAR(32) NOT NULL,
	avg_rating FLOAT,
	num_votes INT,
	success_score FLOAT GENERATED ALWAYS AS (avg_rating * LOG(1 + num_votes)) STORED,
	release_year INT,
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	FOREIGN KEY (person_key) REFERENCES DimPerson(person_key)
)ENGINE=InnoDB;

CREATE TABLE DimEpisode (
	episode_key VARCHAR(16) PRIMARY KEY,
	title_key VARCHAR(16) NOT NULL,
	season_number INT,
	episode_number INT,  
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	UNIQUE(title_key, season_number, episode_number)
)ENGINE=InnoDB;

CREATE TABLE FactRatings (
	fact_id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	title_key VARCHAR(16) NOT NULL,
	genre VARCHAR(32),
	episode_key VARCHAR(16),
	avg_rating FLOAT,
	num_votes INT,
	success_score FLOAT GENERATED ALWAYS AS (avg_rating * LOG(1 + num_votes)) STORED,
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	FOREIGN KEY (episode_key) REFERENCES DimEpisode(episode_key)
)ENGINE=InnoDB;

CREATE TABLE BridgeCrew (
	title_key VARCHAR(16) NOT NULL,
	person_key VARCHAR(16) NOT NULL,
	category VARCHAR(64) NOT NULL,
	job VARCHAR(64),
	characters VARCHAR(1024),
	PRIMARY KEY  (title_key,person_key),
	FOREIGN KEY (person_key) REFERENCES DimPerson(person_key)
)ENGINE=InnoDB;

CREATE INDEX idx_factratings_title ON FactRatings(title_key);
CREATE INDEX idx_factoscar_person ON FactOscarAwards(person_key);
CREATE INDEX idx_ftcgp_genre_year ON FactCrewPerformancePerFilmGenre (release_year);
CREATE INDEX idx_bridgecrew_title_category ON BridgeCrew(title_key, category);
CREATE INDEX idx_bridgecrew_person ON BridgeCrew(person_key);
CREATE INDEX idx_factratings_title_avg ON FactRatings(title_key, avg_rating, num_votes);
CREATE INDEX idx_bridgecrew_person_category ON BridgeCrew(person_key, category);
CREATE INDEX idx_dimtitle_titlekey ON DimTitle(title_key);
CREATE INDEX idx_factoscar_category_winner ON FactOscarAwards (class, canonical_category, is_winner);
CREATE INDEX idx_factoscar_year ON FactOscarAwards (ceremony_year);
CREATE INDEX idx_dimtitle_releaseyear ON DimTitle(release_year);
CREATE INDEX idx_factratings_titlekey ON FactRatings(title_key);
CREATE INDEX idx_dimtitle_genre_year ON DimTitle(genre, release_year);
CREATE INDEX idx_factratings_avgvotes ON FactRatings(avg_rating, num_votes);
CREATE INDEX idx_dimperson_fullname ON DimPerson(full_name);

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
JOIN imdb.FactRatings fr ON fr.title_key = dt.title_key;