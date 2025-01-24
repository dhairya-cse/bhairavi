from flask import Blueprint,render_template,request, flash,abort,send_file,send_from_directory, make_response
from . import abspath
import json
import os

main = Blueprint('main',__name__)

dirname = abspath("..")

@main.route('/')
def index():
    return render_template('index.html',artist=getArtistList())

@main.route("/<artist>/songs")
def songListDispatcher(artist):
    return send_file(os.path.join(dirname,"Data/SongDB/%s/songList.json"%artist))

@main.route("/songDB")
def getSongDB():
    return send_file(os.path.join(dirname,"Data/config.json"))

@main.route("/error")
def errorFromUser():
    message = request.args.get('message')
    if message:
        flash(message,"error")
    abort(500)

def getArtistList():
    with open(os.path.join(dirname,"Data/artistList.json")) as fp:
        return json.load(fp)

def getSongList(artist):
    with open(os.path.join(dirname,"Data/SongDB/%s/songList.json"%artist)) as fp:
        return json.load(fp)

@main.route("/download/<artistName>/<songName>/<fileName>")
def downloadSongData(artistName,songName,fileName):
    response = make_response(send_from_directory(dirname,f"Data/SongDB/{artistName}/{songName}/{fileName}",conditional=True))
    if str.endswith(fileName,"gz"):
        response.headers['Content-Encoding']='gzip'
    return response

@main.route("/wasm/<path:filename>")
def serveWASM(filename):
    return send_from_directory(dirname,f"wasm/{filename}")

@main.route('/service_worker.js')
def serviceWorker():
    return send_file(abspath('app/static/service_worker.js')), 200, {'Content-Type': 'text/javascript'}

@main.route('/manifest')
def mainfest():
    return send_file(abspath('app/static/site.webmanifest'))

@main.route('/offline')
def offline():
    return render_template("offline.html")

@main.route('/upload/stats',methods=['POST'])            
def uploadStats():
    res = request.json
    res["addr"]=request.remote_addr
    with open(abspath("../site_stats"),"a") as f:
        f.write(json.dumps(res))
        f.write("\n")
    return ""

@main.route('/help')
def help():
    return render_template("help.html")

@main.context_processor
def utility_processor():    
    return dict(getSongList=getSongList)