from os import path
from collections import defaultdict
import json

def abspath(currpath):
    from os import path
    HOME = path.abspath(path.dirname(f"{__file__}"))
    return path.abspath(path.join(HOME,currpath))


dirname = abspath("../res/")

ragaid_to_name = {}

artist_song_raga = defaultdict(defaultdict)

with open(path.join(dirname,"ragaId_to_ragaName_mapping.txt")) as f:
    for line in f.readlines():
        id, raga_name = line.split('\t')
        ragaid_to_name[id] = raga_name

with open(path.join(dirname,"filelist.txt")) as f:
    for line in f.readlines():
        splitted_path = line.split("/")
        ragaid = splitted_path[3]
        artist_name = splitted_path[4]
        song_name = splitted_path[6]
        artist_song_raga[artist_name][song_name] = ragaid_to_name[ragaid]

with open(path.join(dirname,"artist_song_raga.json"),'w') as f:
    json.dump(artist_song_raga,f,ensure_ascii=False)