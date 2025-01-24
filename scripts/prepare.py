from os.path import dirname, join, abspath
import essentia
from essentia.standard import *
import sys
import numpy as np
import gzip
from datetime import datetime
import argparse

argparser = argparse.ArgumentParser(description="Prepares the data (semitone, tonic, energy and instrument file) for the web application")
argparser.add_argument(
    '-c','--clean',action="store_true",help="recompute the data files",dest="CLEANUP"
)


args = argparser.parse_args()
CLEANUP = args.CLEANUP #clean the previously computed files, set to false.
WRITE_PITCH_FILES = False
USE_GZIP = True

#tweaks

PITCH_FROM_FILE = ["vocals.mp3","song.mp3"][0]

MAX_FREQUENCY = 8000
PITCH_ALGORITHM = [PitchMelodia,PredominantPitchMelodia][1]

SAMPLING_RATE = [44100,32000][0]

HOP_SIZE = [128,256,512][0]
MIN_DURATION = [25,30,50,75,100][3]

HARMONIC_WEIGHT = [0.8,0.85,0.75][0]
USE_PITCH_FILTER = [0,1][1]
numberHarmonics = [1,5,10,15,20,30][4]
peakDistributionThreshold = [0.9,0.5,1.5,0.4][1]
magnitudeThreshold = [10,20,40,50][3]

FRAME_SIZE = [1024,2048,4096][1]
CONFIDENCE_THRESHOLD = [30,36,38][1]
MIN_CHUNK_SIZE = [30,10,1][0]
OP_SAMPLING_RATE = [9600,16000][0]
CUTOFF = [0.01,0.02][0]
FILTER_ITERATIONS = [3,4,5,7][2]

SILENCE_SEMITONE = -220
ENERGY_CALC_WINDOW = 0.046
ENERGY_CALC_SHIFT = 0.4
ACCEPTED_FORMATS = "mp3,wav,ogg,flac,mp4,mpeg,m4a,wma,aac".split(',')


def pitchAlgo1(audio):
    #TODO: Current assumption is that pitch files are all correct. (Perform experiment on pitch analysis)
    pitch_extractor = PITCH_ALGORITHM(magnitudeThreshold=magnitudeThreshold,peakDistributionThreshold=peakDistributionThreshold,numberHarmonics=numberHarmonics,frameSize=FRAME_SIZE,hopSize=HOP_SIZE,maxFrequency=MAX_FREQUENCY,minDuration=MIN_DURATION,harmonicWeight=HARMONIC_WEIGHT,sampleRate=SAMPLING_RATE)
    pitch_values, pitch_confidence = pitch_extractor(audio)
    
    if USE_PITCH_FILTER:
        pitch_filter = PitchFilter(confidenceThreshold=CONFIDENCE_THRESHOLD,minChunkSize=MIN_CHUNK_SIZE)
        pitch_values = pitch_filter(pitch_values,pitch_confidence)
    
    return pitch_values


def pitchAlgo2(audio):
    #TODO: Current assumption is that pitch files are all correct. (Perform experiment on pitch analysis)
    pitch_extractor = PITCH_ALGORITHM(filterIterations=FILTER_ITERATIONS,magnitudeThreshold=magnitudeThreshold,peakDistributionThreshold=peakDistributionThreshold,numberHarmonics=numberHarmonics,frameSize=FRAME_SIZE,hopSize=HOP_SIZE,maxFrequency=MAX_FREQUENCY,minDuration=MIN_DURATION,harmonicWeight=HARMONIC_WEIGHT,sampleRate=SAMPLING_RATE)
    pitch_values, pitch_confidence = pitch_extractor(audio)
    
    return pitch_values

def pitchAlgo3(audio):
    #TODO: Current assumption is that pitch files are all correct. (Perform experiment on pitch analysis)
    pitch_extractor = PITCH_ALGORITHM(filterIterations=FILTER_ITERATIONS,guessUnvoiced=True,magnitudeThreshold=magnitudeThreshold,peakDistributionThreshold=peakDistributionThreshold,numberHarmonics=numberHarmonics,frameSize=FRAME_SIZE,hopSize=HOP_SIZE,maxFrequency=MAX_FREQUENCY,minDuration=MIN_DURATION,harmonicWeight=HARMONIC_WEIGHT,sampleRate=SAMPLING_RATE)
    pitch_values, pitch_confidence = pitch_extractor(audio)
    
    if USE_PITCH_FILTER:
        pitch_filter = PitchFilter(confidenceThreshold=CONFIDENCE_THRESHOLD,minChunkSize=MIN_CHUNK_SIZE,useAbsolutePitchConfidence=True)
        pitch_values = pitch_filter(pitch_values,pitch_confidence)
        pitch_values = pitch_filter(pitch_values,pitch_confidence)

    return pitch_values



PITCH_CALCULATOR = pitchAlgo1

#A very important piece of code for relative imports
HOME = dirname(__file__)
sys.path.append(join(HOME,".."))

DATA_DIR = abspath(join(HOME,join("..","Data/SongDB")))

from scripts.utility import *
from scripts.cpnsta import *


def spleeter(song_path:str):
    from os import path,remove
    from shutil import move
    outdir = path.dirname(song_path)
    output_format = "{instrument}.{codec}"


    if not path.exists(join(outdir,"acmp.mp3")):
        run_process(f"spleeter separate -c mp3 -o '{outdir}' -f {output_format} -b 44100 -d 10000 '{song_path}'")
        
        if not song_path.endswith('.mp3'):
            run_process(f'ffmpeg -vn -y -i "{song_path}" song.mp3')
            remove(song_path)
        else:
            move(song_path, f'{join(outdir,"song.mp3")}')

        move(f'{join(outdir,"accompaniment.mp3")}', f'{join(outdir,"acmp.mp3")}')


def ComputeEnergy(signal,ws=256,shift=0.4):
    '''
    computes engergy of a input signal.
    ws: window size to compute the energy
    shift: shift the window in fractions
    '''
    from math import floor
    import essentia
    from essentia.standard import Energy
    ws = floor(ws)
    step = floor(ws*shift)
    energy_calc = Energy()
    res = [energy_calc(signal[start:min(start+ws,len(signal))]) for start in range(0,len(signal-ws),step)]
    return res


def write_csv(file,*args):
    args = list(map(list,args))
    lengths = list(map(len,args))
    if max(lengths) != min(lengths):
        raise Exception("The lengths of arrays should be same for the zip operation")
    
    with gzip.open(file+".gz",'wb') as f:
        for t in zip(*args):
            f.write(bytes(" ".join(map(str,t)),'utf-8'))
            f.write(b"\n")



def pitch_tonic_energy(song_path:str):
    from os import path
    
    outdir = path.dirname(song_path)

    if CLEANUP==True or not path.exists(join(outdir,"semitone.gz")):
        print("[%s] Generating Pitch files for %s"%(datetime.now().ctime(),outdir))

        vocal_path = path.join(outdir,PITCH_FROM_FILE)

        loader = EqloudLoader(filename=vocal_path, sampleRate=SAMPLING_RATE)
        audio = loader()

        pitch_values = PITCH_CALCULATOR(audio)    
        pitch_times = np.linspace(0.0,len(audio)/SAMPLING_RATE,len(pitch_values))
        
        if(WRITE_PITCH_FILES):
            pitch_path = path.join(outdir,"pitch")
            write_csv(pitch_path, pitch_times, pitch_values)

        #tonic computation
        tonic_analyzer = TonicIndianArtMusic(sampleRate=SAMPLING_RATE,harmonicWeight=HARMONIC_WEIGHT)
        tonic = tonic_analyzer(audio)
        tonic_path = path.join(outdir,"tonic")

        with open(tonic_path,'w') as f:
            f.write(str(tonic))

        #semitone computation
        semitone_values = np.piecewise(pitch_values,[pitch_values==0,pitch_values>0],[SILENCE_SEMITONE,lambda x:12*np.log2(x/tonic)])
        
        #TODO: the smoothing part    

        semitone_values = smoother(semitone_values,pitch_times)

        semitone_path = path.join(outdir,"semitone")

        write_csv(semitone_path, pitch_times, semitone_values)

        #energy computation
        energy_values = ComputeEnergy(audio,SAMPLING_RATE*ENERGY_CALC_WINDOW,ENERGY_CALC_SHIFT)
        energy_times = np.linspace(0.0,len(audio)/SAMPLING_RATE,len(energy_values))
        energy_path = path.join(outdir,"energy")

        write_csv(energy_path, energy_times, energy_values)

def process_song(song_path:str):
    '''
    processes the song and generates the required files. (Refere readme.md doc)
    runs spleeter and generates the required pitch and the energy files.
    '''

    from os import path

    filesize = path.getsize(song_path)/(1024*1024)
    print(filesize)
    if song_path.endswith("acmp.mp3") or song_path.endswith("vocals.mp3") or filesize>15 or filesize<0.1:
        #don't process the files furthur.
        return
    spleeter(song_path)

    pitch_tonic_energy(song_path)
    
    

def process_all_songs(data_dir):
    from glob import glob
    for ext in ACCEPTED_FORMATS:
        target = f"{data_dir}/*/*/*.{ext}"
        print(target)
        for song_path in glob(target):
            process_song(song_path)


def main():
    process_all_songs(DATA_DIR)
    import os
    def abspath(currpath):
        from os import path
        HOME = path.abspath(path.dirname(f"{__file__}"))
        return path.abspath(path.join(HOME,currpath))
    command = abspath("./prepare_parts.py")
    os.system(f"python3 {command}")
    command = abspath("./updateIndex.py")
    os.system(f"python3 {command}")

if __name__ == "__main__":
    main()