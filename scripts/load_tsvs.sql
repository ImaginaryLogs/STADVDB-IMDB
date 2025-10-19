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

