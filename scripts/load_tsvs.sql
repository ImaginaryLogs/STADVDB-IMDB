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