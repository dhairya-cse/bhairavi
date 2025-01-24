from os.path import join, dirname, abspath
import sys

MIN_PART_LENGTH = 30
MIN_SIL_LENGTH = 1

def get_parts(song_path:str):
    from os import path
    import gzip
    outdir = path.dirname(song_path)

    parts = []
    nsilences = []

    with gzip.open(join(outdir,"semitone.gz"),"rb") as f:
        pre_pitch = -220
        pre_time = 0
        dt = None
        for line in f.readlines():
            time , curr_pitch = list(map(float,line.split()))
            if not dt:
                dt = time
            if curr_pitch != -220 and pre_pitch == -220:
                #silence start
                nsil_start = time
                pass
            elif curr_pitch == -220 and pre_pitch != -220:
                #silence ends
                nsil_end = pre_time
                nsilences.append((nsil_start,nsil_end))
                pass
            pre_pitch = curr_pitch
            pre_time = time
        
        if pre_pitch!=-220:
            nsilences.append((nsil_start,pre_time))


        i = 0
        while i < len(nsilences):
            part_start = max(nsilences[i][0]-1,0)
            if i>0:
                part_start = max(part_start,nsilences[i-1][1]+dt)
            

            while i<len(nsilences):
                part_end = min(nsilences[i][1]+1,pre_time)
                if i+1 < len(nsilences):
                    part_end = min(part_end,nsilences[i+1][0]-dt)
                    if(nsilences[i+1][0] - nsilences[i][1] < MIN_SIL_LENGTH):
                        i+=1
                        continue

                if (part_end-part_start) - MIN_PART_LENGTH >= -2*dt:
                    parts.append([part_start,part_end])
                    break
                elif i+1==len(nsilences):
                    if(len(parts)>0):
                        parts[-1][-1] = part_end
                    else:
                        parts.append([part_start, part_end])
                i+=1
            i+=1
    return parts

def save_parts(song_path:str):
    from os import path
    import json
    outdir = path.dirname(song_path)

    parts = get_parts(song_path)
    with open(join(outdir,"parts.json",),"w") as f:
        json.dump(parts,f)

def process_song(song_path:str):
    '''
    processes the song and generates the required files. (Refere readme.md doc)
    runs spleeter and generates the required pitch and the energy files.
    '''

    from os import path
    save_parts(song_path)    

def process_all_songs(data_dir):
    from glob import glob
    target = f"{data_dir}/*/*/semitone.gz"
    print(target)
    for song_path in glob(target):
        process_song(song_path)

HOME = dirname(__file__)
sys.path.append(join(HOME,".."))

DATA_DIR = abspath(join(HOME,join("..","Data/SongDB")))

process_all_songs(DATA_DIR)