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
