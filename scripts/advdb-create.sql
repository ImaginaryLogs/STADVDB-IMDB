
CREATE TABLE DimGenre (
 genre_key TINYINT NOT NULL PRIMARY KEY,
 genre_name VARCHAR(11) NOT NULL
);  
  
CREATE TABLE DimPerson (
 person_key VARCHAR(10) NOT NULL PRIMARY KEY,
 full_name VARCHAR(128) NOT NULL,
 birth_year INT NOT NULL,
 death_year INT
);
  
CREATE TABLE DimProfession (
 profession_key TINYINT NOT NULL PRIMARY KEY,
 profession_name VARCHAR(64)
);  
  
CREATE TABLE BridgePersonProfession (  
	person_key VARCHAR(10) NOT NULL,  
	profession_key TINYINT NOT NULL,  
	PRIMARY KEY (person_key, profession_key),  
	FOREIGN KEY (person_key) REFERENCES DimPerson(person_key),  
	FOREIGN KEY (profession_key) REFERENCES DimProfession(profession_key)
);  
  


CREATE TABLE DimAwardCategory (
    award_category_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    class VARCHAR(64),
    canonical_category VARCHAR(255),
    category VARCHAR(255)
);




CREATE TABLE DimTitle (
 title_key VARCHAR(10) NOT NULL PRIMARY KEY,
 primary_title VARCHAR(255) NOT NULL,
 original_title VARCHAR(255),
 title_type VARCHAR(25) NOT NULL,
 release_year INT NOT NULL,
 end_year INT NOT NULL,  
 runtime_minutes INT NOT NULL, 
 release_decade INT GENERATED ALWAYS AS (FLOOR(release_year / 10) * 10) STORED,
 isAdult BOOL NOT NULL,
);  

CREATE TABLE FactOscarAwards (
	fact_id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	title_key VARCHAR(10) NOT NULL,
	person_key VARCHAR(10) NOT NULL,
	is_winner BOOL NOT NULL,
	award_category_key BIGINT NOT NULL,
	ceremony_year INT,
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	FOREIGN KEY (person_key) REFERENCES DimPerson(person_key),
	FOREIGN KEY (award_category_key) REFERENCES DimAwardCategory(award_category_key)
);

CREATE TABLE FactCrewPerformancePerFilmGenre (
    fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    title_key VARCHAR(10) NOT NULL,
    person_key VARCHAR(10) NOT NULL,
    genre_key TINYINT NOT NULL,
    avg_rating FLOAT,
    num_votes INT,
    success_score FLOAT GENERATED ALWAYS AS (avg_rating * LOG(1 + num_votes)) STORED,
    release_year INT,
    FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
    FOREIGN KEY (person_key) REFERENCES DimPerson(person_key),
    FOREIGN KEY (genre_key) REFERENCES DimGenre(genre_key)
);

  CREATE TABLE BridgeTitleGenre (
 title_key VARCHAR(10) NOT NULL,
 genre_key TINYINT NOT NULL,
 PRIMARY KEY (title_key, genre_key),
 FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
 FOREIGN KEY (genre_key) REFERENCES DimGenre(genre_key)
);  
  
CREATE TABLE BridgePersonTopTitles (
 person_key VARCHAR(10) NOT NULL,
 title_key VARCHAR(10) NOT NULL,
PRIMARY KEY (person_key, title_key),
 FOREIGN KEY (person_key) REFERENCES DimPerson(person_key),
 FOREIGN KEY (title_key) REFERENCES DimTitle(title_key)
);  

CREATE TABLE DimEpisode (
 episode_key VARCHAR(10) PRIMARY KEY,
 title_key VARCHAR(10) NOT NULL,
 season_number INT,
 episode_number INT,  
 FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
 UNIQUE(title_key, season_number, episode_number)
);

CREATE TABLE FactRatings (
	fact_id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
	title_key VARCHAR(10) NOT NULL,
	genre_key TINYINT NOT NULL,
	episode_key VARCHAR(10),
	avg_rating FLOAT,
	num_votes INT,
	FOREIGN KEY (title_key) REFERENCES DimTitle(title_key),
	FOREIGN KEY (episode_key) REFERENCES DimEpisode(episode_key),
	FOREIGN KEY (genre_key) REFERENCES DimGenre(genre_key)
);

CREATE TABLE BridgeCrew (
 title_key VARCHAR(10) NOT NULL,
 person_key VARCHAR(10) NOT NULL,
 category VARCHAR(64) NOT NULL,
 job VARCHAR(64),
PRIMARY KEY  (title_key,person_key),
 FOREIGN KEY (person_key) REFERENCES DimPerson(person_key)
);

CREATE INDEX idx_factratings_title ON FactRatings(title_key);
CREATE INDEX idx_factratings_genre ON FactRatings(genre_key);
CREATE INDEX idx_factoscar_person ON FactOscarAwards(person_key);
CREATE INDEX idx_bridgetitlegenre_title ON BridgeTitleGenre(title_key);
CREATE INDEX idx_ftcgp_genre_year ON FactCrewPerformancePerFilmGenre (genre_key, release_year);



-- DimTime is not recommended for my implementation. Year is enough.
