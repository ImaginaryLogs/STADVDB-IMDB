import pandas as pd
def combine_title_crews_principals():
	combined = pd.DataFrame(columns=["tconst","category","job","characters"])
	crews = pd.read_csv("data/title.crew.tsv",sep='\t')
	principals = pd.read_csv(filepath_or_buffer="data/title.principals.tsv",sep='\t')
	for tconst,group in principals.groupby(by="tconst"):
		rows = []
		for _,row in group.iterrows():
			category = row['category']
			job = row['job']
			characters = row['characters']
			nconst = row['nconst']
			rows.append({'tconst':tconst,'nconst':nconst,'category':category,"job":job,"characters":characters})
		pd.concat([combined,pd.DataFrame(rows)],ignore_index=True)

	for idx,row in crews.iterrows():
		tconst = row['tconst']
		directors = row['directors']
		writers = row['writers']

		directors_array = directors.split(",")
		writers_array = writers.split(",")
		if(len(director) > 0):
			directors = []
			for director in directors_array:
				directors.append({'tconst':tconst,'nconst':director,'category':'director','job':"\\N",'characters':"\\N"})
				
			combined = pd.concat([combined,pd.DataFrame(directors)],ignore_index=True)
	    
		if len(writer) > 0:
			writers = []
			for writer in writers_array:
				writers.append({'tconst':tconst,'nconst':director,'category':'writer','job':"\\N",'characters':"\\N"})
		
			combined = pd.concat([combined,pd.DataFrame(writers)],ignore_index=True)
	
	combined.to_csv(path_or_buf="data/title.crew_members.csv")



combine_title_crews_principals()
print("Success")