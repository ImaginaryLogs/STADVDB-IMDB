import pandas as pd
import re
import mysql.connector
import os
from dotenv import load_dotenv
import time

CHUNK_SIZE = 200000
IMDB_DATA = {
    "name_basics": "data/name.basics.tsv",
    "title_basics": "data/title.basics.tsv",
    "title_crew": "data/title.crew.tsv",
    "title_episode": "data/title.episode.tsv",
    "title_principals": "data/title.principals.tsv",
    "title_ratings": "data/title.ratings.tsv",
    "oscar_data": "data/full_data.csv",
}
GENRE_DATA = {
    'Documentary': 1,
	'Short': 2,
	'Animation': 3,
	'Comedy': 4,
	'Romance': 5,
	'Sport': 6,
	'News': 7,
	'Drama': 8,
	'Fantasy': 9,
	'Horror': 10,
	'Biography': 11,
	'Music': 12,
	'War': 13,
	'Crime': 14,
	'Western': 15,
	'Family': 16,
	'Adventure': 17,
	'Action': 18,
	'History': 19,
	'Mystery': 20,
	'Sci-Fi': 21,
	'Musical': 22,
	'Thriller': 23,
	'Film-Noir': 24,
	'Talk-Show': 25,
	'Game-Show': 26,
	'Reality-TV': 27,
	'Adult': 28,
	'N/A': 0
}
PROFESSION_DATA = {
    'actor': 1,
	'miscellaneous': 2,
	'producer': 3,
	'actress': 4,
	'soundtrack': 5,
	'archive_footage': 6,
	'music_department': 7,
	'writer': 8,
	'director': 9,
	'stunts': 10,
	'make_up_department': 11,
	'composer': 12,
	'assistant_director': 13,
	'camera_department': 14,
	'music_artist': 15,
	'art_department': 16,
	'editor': 17,
	'cinematographer': 18,
	'executive': 19,
	'visual_effects': 20,
	'costume_designer': 21,
	'script_department': 22,
	'art_director': 23,
	'editorial_department': 24,
	'costume_department': 25,
	'animation_department': 26,
	'talent_agent': 27,
	'archive_sound': 28,
	'production_designer': 29,
	'special_effects': 30,
	'manager': 31,
	'production_manager': 32,
	'sound_department': 33,
	'casting_department': 34,
	'location_management': 35,
	'casting_director': 36,
	'set_decorator': 37,
	'transportation_department': 38,
	'choreographer': 39,
	'legal': 40,
	'accountant': 41,
	'podcaster': 42,
	'publicist': 43,
	'assistant': 44,
	'production_department': 45,
	'electrical_department': 46
}
AWARD_DATA = {}


def get_genre(cursor, title_key):
	select_genre = "SELECT genre_key FROM BridgeTitleGenre WHERE title_key = %s"
	select_val = (title_key, )
	cursor.execute(select_genre, select_val)
	return cursor.fetchall()

def get_episode_series(cursor, episode_key):
	select_genre = "SELECT title_key FROM DimEpisode WHERE episode_key = %s"
	select_val = (episode_key, )
	cursor.execute(select_genre, select_val)
	return cursor.fetchone()

def get_crew(cursor, title_key):
	select_crew = "SELECT person_key FROM BridgeCrew WHERE title_key = %s"
	select_val = (title_key, )
	cursor.execute(select_crew, select_val)
	return cursor.fetchall()

def get_release_year(cursor, title_key):
	select_year = "SELECT release_year FROM DimTitle WHERE title_key = %s"
	select_val = (title_key, )
	cursor.execute(select_year, select_val)
	return cursor.fetchone()


def etl_misc(cursor):
	insert_genre = "INSERT INTO DimGenre (genre_key, genre_name) VALUES (%s, %s)"
	for i, val in GENRE_DATA.items():
		insert_vals = (val, i)
		cursor.execute(insert_genre, insert_vals)
	print("genres Completed")

	insert_profession = "INSERT INTO DimProfession (profession_key, profession_name) VALUES (%s, %s)"
	for i, val in PROFESSION_DATA.items():
		insert_vals = (val, i)
		cursor.execute(insert_profession, insert_vals)
	print("professions Completed")


def etl_imdb(cursor, dataset):
	chunk_no = 1
	match dataset:
		case "title_basics":
			insert_title = "INSERT INTO DimTitle (title_key, primary_title, original_title, title_type, release_year, end_year, runtime_minutes, isAdult) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
			insert_title_genre = "INSERT INTO BridgeTitleGenre (title_key, genre_key) VALUES (%s, %s)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE):
				chunk['isAdult'] = chunk['isAdult'] == '1'

				for row in chunk.itertuples(index=False):
					insert_vals = (
						row[0],
						row[2] if type(row[2]) == str else '\\N',
						row[3] if type(row[3]) == str else '\\N',
						row[1],
						int(row[5]) if row[5] != '\\N' else 0, 
						int(row[6]) if row[6] != '\\N' else None,
						int(row[7]) if row[7] != '\\N' else 0,
						row[4]
					)
					cursor.execute(insert_title, insert_vals)

					na_flag = 1
					
					if type(row[8]) == str:
						genres = row[8].split(',')
						for genre in genres:
							if genre != '\\N':
								na_flag = 0
								insert_vals = (row[0], GENRE_DATA[genre])
								cursor.execute(insert_title_genre, insert_vals)
						
					if na_flag:
						insert_vals = (row[0], 0)
						cursor.execute(insert_title_genre, insert_vals)

				print(f'title.basics Chunk #{chunk_no} Done')
				chunk_no += 1

		case "name_basics":
			insert_person = "INSERT INTO DimPerson (person_key, full_name, birth_year, death_year) VALUES (%s, %s, %s, %s)"
			insert_profession = "INSERT INTO BridgePersonProfession (person_key, profession_key) VALUES (%s, %s)"
			insert_top_titles = "INSERT INTO BridgePersonTopTitles (person_key, title_key) VALUES (%s, %s)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE):

				for row in chunk.itertuples(index=False):
					insert_vals = (
						row[0], 
						row[1] if type(row[1]) == str else 'Unknown', 
						int(row[2]) if row[2] != '\\N' else 0, 
						int(row[3]) if row[3] != '\\N' else None
					)
					cursor.execute(insert_person, insert_vals)

					professions = row[4].split(',')
					for profession in professions:
						if profession != '\\N':
							insert_vals = (row[1], PROFESSION_DATA[profession])
							cursor.execute(insert_profession, insert_vals)

					titles = row[5].split(',')
					for title in titles:
						if title != '\\N':
							insert_vals = (row[1], title)
							cursor.execute(insert_top_titles, insert_vals)

				print(f'name.basics Chunk #{chunk_no} Done')
				chunk_no += 1
		
		case "title_principals":
			insert_crew = "INSERT INTO BridgeCrew (title_key, person_key, category, job) VALUES (%s, %s, %s, %s)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE, usecols=['tconst', 'nconst', 'category', 'job']):

				for row in chunk.itertuples(index=False):
					insert_vals = (row[0], row[1], row[2], row[3])
					cursor.execute(insert_crew, insert_vals)
				
				print(f'title.principals Chunk #{chunk_no} Done')
				chunk_no += 1

		case "title_crew":
			insert_crew = "INSERT INTO BridgeCrew (title_key, person_key, category) VALUES (%s, %s, %s)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE):

				for row in chunk.itertuples(index=False):
					directors = row[1].split(',')
					for director in directors:
						try:
							insert_vals = (row[0], director, 'director')
							cursor.execute(insert_crew, insert_vals)
						except:
							pass
					
					writers = row[2].split(',')
					for writer in writers:
						try:
							insert_vals = (row[0], writer, 'writer')
							cursor.execute(insert_crew, insert_vals)
						except:
							pass
				
				print(f'title.crew Chunk #{chunk_no} Done')
				chunk_no += 1

		case "title_episode":
			insert_crew = "INSERT INTO DimEpisode (episode_key, title_key, season_number, episode_number)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE):

				for row in chunk.itertuples(index=False):
					insert_vals = (row[0], row[1], row[2], row[3])
					cursor.execute(insert_crew, insert_vals)
				
				print(f'title.episode Chunk #{chunk_no} Done')
				chunk_no += 1

		case "oscar_data":
			awards = []
			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE, usecols=['Class', 'CanonicalCategory', 'Category']):
				for row in chunk.itertuples(index=False):
					award = (row[0], row[1], row[2])
					if award not in awards:
						awards.append(award)
			
			i = 1
			insert_award = "INSERT INTO DimAwardCategory (class, canonical_category, category) VALUES (%s, %s, %s)"
			for award in awards:
				AWARD_DATA.update({award: i})
				cursor.execute(insert_award, award)
			print("awards Completed")

			insert_oscar = "INSERT INTO FactOscarAwards (title_key, person_key, is_winner, award_category_key, ceremony_year) VALUES (%s, %s, %s, %s, %s)"
			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE, usecols=['Year', 'Class', 'CanonicalCategory', 'Category', 'FilmId', 'NomineeIds', 'Winner']):
				chunk['Winner'] = chunk['Winner'].notna()
				for row in chunk.itertuples(index=False):
					year = int(re.sub(r'/.*', r'', row[0]))
					award = (row[1], row[2], row[3])
					if type(row[5]) == str:
						nominees = row[5].split(',')
						for nominee in nominees:
							if nominee != '?':
								insert_vals = (row[4], nominee, row[6], AWARD_DATA[award], year)
								cursor.execute(insert_oscar, insert_vals)
					else:
						insert_vals = (row[4], None, row[6], AWARD_DATA[award], year)
						cursor.execute(insert_oscar, insert_vals)
				
				print(f'oscar_data Chunk #{chunk_no} Done')
				chunk_no += 1

		case "title_ratings":
			insert_ratings = "INSERT INTO FactRatings (title_key, genre_key, episode_key, avg_rating, num_votes) VALUES (%s, %s, %s, %s, %s)"
			insert_performance = "INSERT INTO FactCrewPerformancePerFilmGenre (title_key, person_key, genre_key, avg_rating, num_votes, release_year) VALUES (%s, %s, %s, %s, %s, %s)"

			for chunk in pd.read_csv(IMDB_DATA[dataset], sep='\t', chunksize=CHUNK_SIZE):
				for row in chunk.itertuples(index=False):
					genres = get_genre(cursor, row[0])
					episode_series = get_episode_series(cursor, row[0])
					crew = get_crew(cursor, row[0])
					release_year = get_release_year(cursor, row[0])

					for genre in genres:
						insert_ratings_vals = (row[0], genre[0], episode_series[0] if episode_series != None else None, row[1], row[2])
						cursor.execute(insert_ratings, insert_ratings_vals)

						for person in crew:
							insert_performance_vals = (row[0], person[0], genre[0], row[1], row[2], release_year[0])
							cursor.execute(insert_performance, insert_performance_vals)
				
				print(f'title.ratings Chunk #{chunk_no} Done')
				chunk_no += 1
					

def time_elapsed(s_time):
	e_time = time.time() - s_time
	print(f"Time Elapsed: {e_time // 3600:02d}:{e_time % 3600 // 60:02d}:{e_time % 3600 % 60:02d}")


def etl_controller(cursor, val):
	match val:
		case "genre_profession":
			etl_misc(cursor)
		case _:
			etl_imdb(cursor, val)


if __name__ == '__main__':
	load_dotenv()

	DB_HOST = os.getenv('DB_HOST')
	DB_PORT = os.getenv('DB_PORT')
	DB_USER = os.getenv('DB_USER')
	DB_PASSWORD = os.getenv('DB_PASSWORD')
	DB_NAME = os.getenv('DB_NAME')

	imdb = mysql.connector.connect(
		host=DB_HOST,
		port=DB_PORT,
		user=DB_USER,
		password=DB_PASSWORD,
		db=DB_NAME,
		ssl_disabled=True
	)

	cursorObject = imdb.cursor()
	datasets = ["genre_profession", "title_basics", "name_basics", "title_principals", "title_crew", "title_episode", "oscar_data", "title_ratings"]

	print("Select dataset to parse:")
	print("(Parsing should be done in order)")
	print("1 - Miscellaneous Data (DimGenres, DimProfessions)")
	print("2 - title.basics.tsv (DimTitle, BridgeTitleGenre)")
	print("3 - name.basics.tsv (DimPerson, BridgePersonProfession, BridgePersonTopTitles)")
	print("4 - title.principals.tsv (BridgeCrew pt.1)")
	print("5 - title.crew.tsv (BridgeCrew pt.2)")
	print("6 - title.episode.tsv (DimEpisode)")
	print("7 - full_data.csv (DimAwardCategory, FactOscarAwards)")
	print("8 - title.ratings.tsv (FactRatings, FactCrewPerformancePerFilmGenre)")
	print("9 - Run all datasets")
	val = input("> ")

	s_time = time.time()

	if val >= 1 and val <= 8:
		etl_controller(cursorObject, datasets[val - 1])
		imdb.commit()
		time_elapsed(s_time)
	elif val == 9:
		for data in datasets:
			etl_controller(cursorObject, data)
			imdb.commit()
			time_elapsed(s_time)

	imdb.close()