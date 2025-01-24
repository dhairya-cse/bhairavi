from glob import glob
import os
from pathlib import Path
import pathlib
import json
import sys
from collections import defaultdict


def abspath(currpath):
    from os import path
    HOME = path.abspath(path.dirname(f"{__file__}"))
    return path.abspath(path.join(HOME,currpath))

dirname = abspath("../Data")

artistSongDir = os.path.join(dirname,"SongDB")
artistList = []

config = defaultdict(lambda: defaultdict(defaultdict))

with open(abspath("../res/artist_song_raga.json")) as f:
    artist_song_raga = json.load(f)

files_to_check = {"song.mp3","acmp.mp3","semitone.gz","tonic","energy.gz"}

def verify_all_files(path_to_song):
    files = set(os.listdir(path_to_song))
    print(files)
    print(files_to_check)
    return files_to_check.issubset(files)

def getduration(song_path):
    cmd = f"ffprobe {song_path} -show_streams -print_format json -v fatal"
    res = json.loads(call_process(cmd))
    res = res['streams'][0]['duration']
    print(res)
    return res

def call_process(executable):
    from subprocess import run, PIPE
    
    try:
        process = run(executable.split(), stdout=PIPE, stderr=PIPE)
    except:
        print("Something went wrong",executable)
        return
    if(process.returncode!=0):
        print("Something went wrong while creating index",executable)
    return process.stdout


for artistFolder in os.listdir(artistSongDir):
    if artistFolder == "." or artistFolder=="..":
        continue


    songlist = {}
    artistFolderdir = os.path.join(artistSongDir,artistFolder)
    for audio in os.listdir(artistFolderdir):
        if audio == "." or audio ==".." or  audio=="songList.json":
            continue

        path_to_song = os.path.join(artistFolderdir,audio)
        if verify_all_files(path_to_song):
            tonic_path = os.path.join(path_to_song,"tonic")
            songlist[audio] = {}
            with open(tonic_path) as f:
                songlist[audio]["tonic"] = f.read()
            
            song_path = os.path.join(path_to_song,"song.mp3")
            songlist[audio]["duration"] = duration = getduration(song_path)

            '''
            TODO: Change this according to Sridhar's code
            This can be used to divide the song in multiple parts... based on CPN, also we can do zero cross processing :)
            '''

            duration = float(duration)
            
            #parts = [[0,duration/3],[duration/3,(2*duration)/3],[(2*duration)/3,duration]]
            
            with open(os.path.join(path_to_song,"parts.json")) as f:
                parts = json.load(f)
                        
            songlist[audio]["parts"] = parts

            
            try:
                raga = artist_song_raga[artistFolder][audio]
                raga = raga.strip()
            except:
                raga = "uncategorized"
            config[artistFolder][raga][audio] = songlist[audio]



    with open(os.path.join(artistFolderdir,"songList.json"),"w") as fp:
        json.dump(songlist,fp)

    if len(songlist):
        artistList.append(artistFolder)

with open(os.path.join(dirname,"artistList.json"),'w') as fp:
    json.dump(artistList,fp)


with open(os.path.join(dirname,"config.json"),'w') as fp:
    json.dump(config,fp,ensure_ascii=False)