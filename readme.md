# Bhairavi

A carnatic music learning application which provides user accompanying music in his own tonic. It uses concepts from state based transciption for carnatic music which can be useful in carnatic music as it precisely represents gamakas. [ Read reports/phase2.pdf for more]

### Setup
The development is done on x86-x64 architecture based machine running Linux mint 20.1 (Kernel: Linux 5.4.0-66-generic). It is advised to use a linux based os, though most components are os independent. Please make sure to install the following dependencies as per your system configuration.

- [miniconda](https://docs.conda.io/en/latest/miniconda.html)

After installing the above dependencies, perform the following steps: 
- Run scripts/setup.py, change the variable `ENV_NAME='tempenv'`, if the  environment name is already in use.

### Dataset
Every song in the database has a directory descibed as following path: 
*`/Data/SongDB/<artistName>/<songName>`*

`Data/download.py` is an extension to download the files from [RagaDataset](https://drive.google.com/drive/u/0/folders/0Bz-I9QJ1cL6aTG93WDgycXhsN1U?resourcekey=0-kbh_wyoZhiUjwRBtHi_oVg) provided by [compmusic](https://compmusic.upf.edu/). I have used [drive](https://github.com/odeke-em/drive) package to download the songs in `gdrive` folder and then arrange them according to *`/Data/SongDB/<artistName>/<songName>`* directory.

### Preparation
`scripts/prepare.py` prepares the `semitone.gz`, `energy.gz` , `tonic`, `acmp.mp3` (instruments), `vocals.mp3` files. The music files are renamed to `song.mp3` in the corresponding folder and then spleeter is run on `song.mp3` to seperate the vocals and instruments in  `vocals.mp3` and `acmp.mp3` files respectively in the corresponding song folder. It automatically run `scripts/updateIndex.py` which creates a json list of artists and songs available in the `Data/SongDB` folder.