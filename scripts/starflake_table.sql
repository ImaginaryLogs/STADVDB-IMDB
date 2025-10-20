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

