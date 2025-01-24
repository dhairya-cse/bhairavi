# Bhairavi

A web-based music learning app (desiged for carantic music) that allows users to pratice singing by singing along to a re-synthesised audio in their preferred pitch instead of trying to match the singer's pitch.

Read more about the project in my [Mtech thesis](https://drive.google.com/file/d/1zc9ZyDymMdAi6Esb2H8Bexk-ylQYUV5H/view?usp=drive_link)

### Dataset
All the song files should be put in the following structure in a ${DATA_DIR} directory.
*`${DATA_DIR}/SongDB/<artistName>/<songName>`*

---
`scripts/download.py` is an extension to download the files from [RagaDataset](https://drive.google.com/drive/u/0/folders/0Bz-I9QJ1cL6aTG93WDgycXhsN1U?resourcekey=0-kbh_wyoZhiUjwRBtHi_oVg) provided by [compmusic](https://compmusic.upf.edu/) for Carantic music. I have used [drive](https://github.com/odeke-em/drive) package to download the songs in `gdrive` folder and then arrange them according to directory strucutre given above.
---

### Preparation

All the songs needs to be processed in order to use the application. I have used Spleeter for extraction of vocal tracks from a song, Essentia for pitch analysis.

For simplicity, we can run the following command to process the dataset:

```sh
docker build -f Dockerfile-DataPrep -t bhairavi-data-prep .
docker run  -v ${DATA_DIR}:/app/Data:z -v pretrained_models:/app/pretrained_models:z bhairavi-data-prep:latest
```

Note: Mounting the volume `pretrained_models` allows to download the `spleeter` models only once.

Running this generates the following files for every song required for the web application:

1. `acmp.mp3`: Instrument tracks to play along
2. `vocals.mp3`: The singers vocals, on which pitch analysis is performed.
3. `tonic`: The original tonic of the song.
4. `semitone.gz`: The semtione curve of the song.
5. `energy.gz`: Energy curve of the vocals
6. `parts.json`: Timestamps for different minimum 30 second parts of the songs such that the silences between parts is atleast 1 second.

Other than that, a catalogue file is generated to show the songs lists and parts information on the application.

### Hosting the application

Use the following commands to run the application with the data prepared in the previous step.

```sh
docker build -t bhairavi .
docker run -d --name bhairavi -v ${DATA_DIR}:/app/Data:z  -p 8000:8000 bhairavi
```