-- Table: title_akas
CREATE TABLE title_akas (
    titleId TEXT NOT NULL,
    ordering INT NOT NULL,
    title TEXT,
    region TEXT,
    language TEXT,
    types TEXT[],           -- Array of enumerated attributes
    attributes TEXT[],      -- Array of additional terms
    isOriginalTitle BOOLEAN,
    PRIMARY KEY (titleId, ordering)
);

-- Table: title_basics
CREATE TABLE title_basics (
    tconst TEXT PRIMARY KEY,
    titleType TEXT,
    primaryTitle TEXT,
    originalTitle TEXT,
    isAdult BOOLEAN,
    startYear TEXT,       -- YYYY format
    endYear TEXT,         -- YYYY format or '\N'
    runtimeMinutes INT,
    genres TEXT[]            -- Array of up to three genres
);

-- Table: title_crew
CREATE TABLE title_crew (
    tconst TEXT PRIMARY KEY,
    directors TEXT[],        -- Array of nconsts
    writers TEXT[]           -- Array of nconsts
);

-- Table: title_episode
CREATE TABLE title_episode (
    tconst TEXT PRIMARY KEY,
    parentTconst TEXT,
    seasonNumber INT,
    episodeNumber INT
);

-- Table: title_principals
CREATE TABLE title_principals (
    tconst TEXT NOT NULL,
    ordering INT NOT NULL,
    nconst TEXT NOT NULL,
    category TEXT,
    job TEXT,
    characters TEXT,
    PRIMARY KEY (tconst, ordering)
);

-- Table: title_ratings
CREATE TABLE title_ratings (
    tconst TEXT PRIMARY KEY,
    averageRating FLOAT,  
    numVotes INT,
);

-- Table: name_basics
CREATE TABLE name_basics (
    nconst TEXT PRIMARY KEY,
    primaryName TEXT,
    birthYear TEXT,              -- YYYY format
    deathYear TEXT,              -- YYYY format or '\N'
    primaryProfession TEXT[],       -- Array of strings
    knownForTitles TEXT[]           -- Array of tconsts
);
