from dotenv import load_dotenv
import os
import mysql.connector
import time
import queue
from multiprocessing import Pool

USER_PROMPT = [
   "Select dataset to parse, given parsing should be in order:"
  ,"  1 - Miscellaneous Data (DimGenres, DimProfessions)"
  ,"  2 - title.basics.tsv (DimTitle, BridgeTitleGenre)"
  ,"  3 - name.basics.tsv (DimPerson, BridgePersonProfession, BridgePersonTopTitles)"
  ,"  4 - title.principals.tsv (BridgeCrew pt.1)"
  ,"  5 - title.crew.tsv (BridgeCrew pt.2)"
  ,"  6 - title.episode.tsv (DimEpisode)"
  ,"  7 - full_data.csv (DimAwardCategory, FactOscarAwards)"
  ,"  8 - title.ratings.tsv (FactRatings, FactCrewPerformancePerFilmGenre)"
  ,"  9 - Run all datasets"
]

WORKER_THREADS = 8

def get_imdb():
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
  
  return imdb

def get_initial_datasets():
  datasets = ["genre_profession", "title_basics", "name_basics", "title_principals", "title_crew", "title_episode", "oscar_data", "title_ratings"]
  return datasets

def pd_writer(cursor, dataset, imdb):
  print("Chiii~ yo chiyo chiyo chiyo no o, doooki doki doki doki dooo~? ki???\nChiii~ yo chiyo chiyo chiyo no o, suuuki suki suki shugi chiyo no o" + "\n" + dataset)


def dispatcher(datasets: list[str], imdb, cursor):
  work_queue = queue.Queue()
  pd_writer_wraper = lambda dataset : pd_writer(cursor, dataset, imdb)
  
  for dataset in datasets:
    work_queue.put(dataset)
    
  with Pool(WORKER_THREADS) as worker:
    worker.map(pd_writer_wraper, work_queue.get())
  
  

def commandhandler(val: int, datasets: list[str], imdb, imdb_cursor):
  match val:
    case 9:
      dispatcher(datasets, imdb, imdb)
  

def queen_assigner():
  imdb = get_imdb()
  
  datasets = get_initial_datasets()
  
  print(USER_PROMPT, sep = "\n")
  val = int(input("> "))
  commandhandler(val, datasets, imdb, imdb.cursor())
  s_time = time.time()

  
  imdb.close()
  
  
queen_assigner()