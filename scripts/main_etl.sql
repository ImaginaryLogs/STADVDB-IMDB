use imdb_source;
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

INSERT INTO DimTitle(title_key,title_type,primary_title,original_title,release_year,end_year,genre,runtime_minutes)
SELECT 
tconst,titleType,primaryTitle,originalTitle,startYear,endYear,
(
    CREATE TEMPORARY TABLE genre_chars AS SELECT * FROM DimGenre;
    ALTER TABLE genre_chars ADD COLUMN has_genre VARCHAR(1) DEFAULT 'F';
	
    WHILE genre IS NOT NULL AND genre != '' 
	SET pos = LOCATE(',',genre);
	IF pos > 0 THEN
		SET curr_genre = TRIM(SUBSTRING(input, 1, pos - 1));
		SET genre = SUBSTRING(input, pos + 1);
        IF genre IN genre_chars THEN 
            SET has_genre = 'T' WHERE genre=genre_name;
        END IF;

		
	ELSE
		SET curr_genre = TRIM(genre)
		SET genre = NULL
	END IF;
    END WHILE;

    SELECT GROUP_CONCAT(has_genre ORDER BY genre_name SEPARATOR '') AS one_hot_genre
) AS genre, runtimeMinutes, SET isAdult = CASE WHEN LOWER(isAdult) = 'true' THEN 1 ELSE 0 END,
FROM name_basics;

CREATE FUNCTION one_hot_encoding_genre(IN genres TEXT,IN input TEXT)
RETURN VARCHAR(32)
BEGIN

    WHILE input IS NOT NULL AND input != '' 
    SET output = ''
	SET pos = LOCATE(',',input);
	IF pos > 0 THEN
		SET genre = TRIM(SUBSTRING(input, 1, pos - 1));
        SET genre_pos = LOCATE(',',genres);
        SET curr_genre = SUBSTRING(genres,1,genre_pos-1);
        WHILE genre_pos > 0 
            IF curr_genre = genre THEN
            CONCAT(output,'T')
            ELSE
            CONCAT(output,'F')
            END IF;
            END WHILE;

		
	ELSE
		SET input = NULL
	END IF;
    END WHILE;

END