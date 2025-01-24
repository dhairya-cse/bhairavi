// Enumerations
const PlayerStates = Object.freeze(
    {
        stopped:0,
        playing:1,
        recording:2,
        paused:3
    }
);

USE_FLOAT_ARRAY = true;
CLEAR_DB = false;
USE_DB_CACHE = true;


USE_RECORDING_NODE = true;
USE_PINK_NODE = false;
USE_REVERB = true;
REVERB_FILE_NAMES  = ["reverb.mp3","DomesticLivingRoom.m4a","ElvedenHallLordsCloakroom.m4a","EmptyApartmentBedroom.m4a","ArbroathAbbeySacristy.m4a","ElvedenHallSmokingRoom.m4a"];
REVERB_FILE_INDEX = 0;
REVERB_URL = "static/reverb/"+REVERB_FILE_NAMES[REVERB_FILE_INDEX];

LOW_POWER = isLowPower();


site_stats.low_power = LOW_POWER;

MIN_TIME_FOR_SCORES = 30; // minimum time when we show the current socre 

if(!LOW_POWER){
    D_PLOT_TIME = 30; // in miliseconds
}
else{
    D_PLOT_TIME = 60;
}

D_PLOT_TIME = 30
D_PLOT_TIME_IN_SEC = D_PLOT_TIME/1000;

//Global properties
state.player_state=PlayerStates.paused;


// Provides screen wake lock
if ('wakeLock' in navigator) {
    
    wakeLock = null;

    // Function that attempts to request a screen wake lock.
    const requestWakeLock = async () => {
        try {
            wakeLock = await navigator.wakeLock.request();
            wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock released:', wakeLock.released);
            });
            console.log('Screen Wake Lock released:', wakeLock.released);
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
          await requestWakeLock();
        }
      };
      
    document.addEventListener('visibilitychange', handleVisibilityChange);
}




timer_text = document.getElementById("timer_text");

plotMe = document.getElementById("plotMe")

songSel = document.getElementById("Song");
artistSel = document.getElementById("Artist");
ragaSel = document.getElementById("Raga");
tonicInput = document.getElementById("Tonic");

downloadBeatsCheckBox = document.getElementById("DownloadBeats");

synthPlaySlider = document.getElementById("synthSlider");
instrumentPlaySlider = document.getElementById("instrumentSlider");  //beats and instrument: I mean the same.
pinkNoisePlaySlider = document.getElementById("pinknoiseSlider");
feedBackPlaySlider = document.getElementById("feedbackSlider");
playOriginalAudioElement = document.getElementById("play_original_audio");

playPauseButton = document.getElementById("playPause");
stopButton = document.getElementById("reset");

strip_start = document.getElementById("strip_start");
strip_end = document.getElementById("strip_end");

songPartSel = document.getElementById("songPartSel");

instrumentPlaySliderValueDisplay = document.getElementById("instrumentSliderValueDisplay");
pinkNoiseSliderValueDisplay = document.getElementById("pinknoiseSliderValueDisplay");
synthPlaySliderValueDisplay = document.getElementById("synthSliderValueDisplay");
feedBackPlaySliderValueDisplay = document.getElementById("feedbackSliderValueDisplay");
audioPlayerSeekBar = document.getElementById("audioPlayerSeekBar");
songSelectScreenStartButton = document.getElementById("songSelectScreenStartButton");
playOriginalNextButton = document.getElementById("playOriginalNextButton");

retryButton =  document.getElementById("retryButton");
// Adding Event Listeners
playPauseButton.addEventListener("click",playPauseHandler);
stopButton.addEventListener("click",stopHandler);

feedBackPlaySlider.addEventListener("input",feedBackPlaySliderHandle);
pinkNoisePlaySlider.addEventListener("input",pinkNoisePlaySliderHandle);
instrumentPlaySlider.addEventListener("input",instrumentPlaySliderHandle);
synthPlaySlider.addEventListener("input",synthPlaySliderHandle);

songSelectScreenStartButton.addEventListener("click",playgroundInit);
playOriginalNextButton.addEventListener("click",playground);

retryButton.addEventListener("click",retryInit);

function feedBackPlaySliderHandle(){
    let num = Number(this.value);
    feedBackPlaySliderValueDisplay.innerHTML = num.toFixed(2);
    if(USE_RECORDING_NODE)
    recordingFeedbackGainNode.gain.value = num;
}

function pinkNoisePlaySliderHandle(){
    let num = Number(this.value);
    pinkNoiseSliderValueDisplay.innerHTML = num.toFixed(2);
    if(USE_PINK_NODE)
    pinkNoiseGainNode.gain.value = num;
}

function instrumentPlaySliderHandle(){
    let num = Number(this.value);
    instrumentPlaySliderValueDisplay.innerHTML = num.toFixed(2);
    if(downloadBeatsCheckBox.checked)
    instrumentGainNode.gain.value = num;
}

function synthPlaySliderHandle(){
    let num = Number(this.value);
    synthPlaySliderValueDisplay.innerHTML = num.toFixed(2);
    synthesizedAudioGainNode.gain.value = num;
}

main();

async function main(){
    wasmWorker = new Worker('/wasm/worker.js');
    wasmWorker.onmessage = wasmWorkerOnMessage;
    initWorker();
    state.wasmWorkerReadyPromise = new Promise(resolve=>addEventListener("worker_ready",resolve,{once:true}));
    if(LOW_POWER)
    {
        flasher.info("A desktop browser is recommended for best experience");
    }


    await app_screen.render_wait_screen(async ()=>{
        state.songDB = await fetchSongDB();
    });
    
    initAritsts();
}

async function fetchSongDB() {
    const response = await fetch(`/songDB`);
    
    if(!response.ok)
    {
        common_error();
        return;
    }
    
    const songs = await response.json()     ;
    return songs;
}


async function initAritsts(){
    artistSel.length = 0;

    try{
        var artists = Object.keys(state.songDB)
        for(var i in artists)
        {
            artistSel.options[artistSel.options.length] = new Option(artists[i],artists[i]);
        }        
        changeRagas();
    }catch(err){
        common_error();
    }
}

async function changeRagas()
{   
    ragaSel.length = 0;

    try{
        ragas = Object.keys(state.songDB[artistSel.value]);
        for(var i in ragas)
        {
            ragaSel.options[ragaSel.options.length] = new Option(ragas[i],ragas[i]);
        }        
        changeSongs();
    }catch(err){
        common_error();
    }
}

async function changeSongs()
{   
    songSel.length = 0;

    try{
        songs = Object.keys(state.songDB[artistSel.value][ragaSel.value]);
        for(var song in songs)
        {
            songSel.options[songSel.options.length] = new Option(songs[song],songs[song]);
        }        
        changeTonic();
    }catch(err){
        common_error();
    }
}

async function changeTonic()
{
    var val = state.songDB[artistSel.value][ragaSel.value][songSel.value]["tonic"];
    state._tonic = val;
    tonicInput.value = parseFloat(val).toFixed(5);
}

async function wait_for_files(index_of_scripts,render=false)
{
    let local_script_promises = []
    
    if(index_of_scripts == null)
    {
        for(var i of index_of_scripts) local_script_promises.push(state.script_promises[i]);
    }
    else{
        local_script_promises = state.script_promises;
    }
    


    if(render){
        await app_screen.render_wait_screen(
            async function(){
                await Promise.all(local_script_promises);
            },
            "Loading necessary scripts","Display JS files load"
        );
    }else{
        await Promise.all(local_script_promises);
    }
}


/* !!!!---------------------------------- Start: Wasm worker related functions -----------------------------------------!!!! */

async function wasmWorkerOnMessage(event){
    let e = event.data
    switch(e.eventType)
    {
        case "ready":
            handleWorkerReadyEvent(e);
            break;
        case "populateDone":
            dispatchEvent(new CustomEvent("populateDone"));
            break;
        case "synthDone":
            state.wavfile = e.wavfile;
            
            if(USE_DB_CACHE) storeIntoDB();
            
            dispatchEvent(new CustomEvent("synthDone"));
            break;

        case "essentiaReady":
            dispatchEvent(new CustomEvent("essentiaReady"));
            break;
        case "pitchCalculated":
                state.currpitch = e.pitch;
                state.currtime = e.time;
                var curr = synthesizedAudioElement.currentTime;
                var curr_delay = (curr - state.currtime);

                state.data2x.push(state.currtime);
                state.data2y.push(state.currpitch);

                if(curr_delay>0){
                    if(state.total_delay==undefined)
                    {
                        state.total_delay = curr_delay;
                        state.n_delay_samples = 1;
                    }
                    else{
                        state.total_delay += curr_delay;
                        state.n_delay_samples++;
                    }
                }

            break;
        case "stepsize":
            state.step = e.step;
            state.frameToShow = e.frameToShow;
            break;
        case "scoreReady":
            site_stats.avg_delay = state.total_delay/state.n_delay_samples;
            state.totaltime = e.totaltime; // Time till which we have to calculate the score.
            site_stats.recordedtime = state.totaltime;
            state.score = e.score;
            dispatchEvent(new CustomEvent("scoreReady"));
    } 
}

async function handleWorkerReadyEvent(e)
{
        if(e.data){
            dispatchEvent(new CustomEvent("worker_ready"));
        }
        else{
            await sleep(1000);
            initWorker();
        }
}

function initWorker(){
    wasmWorker.postMessage({
        eventType:"init",
    });
}

/* !!!!---------------------------------- End: Wasm worker related functions -----------------------------------------!!!! */


/* !!!!---------------------------------- Start: Database related function -----------------------------------------!!!! */

async function storeIntoDB()
{
    try{
        if(await init_DB()){
            var url = `${state.artistName}/${state.songName}/${state.tonic}`;
            site_stats.songurl = url;
            var value = {
                url:url,
                wavfile:state.wavfile,
                targetTime:state.targetTime,
                targetSemitone:state.targetSemitone,
            };
    
            var noOfRowsInserted = await state.connection.insert({
                into: "precomputed",
                values: [value],
            });
    
            if (noOfRowsInserted > 0) {
                console.log(`Successfully Added To Database: ${url}`);
            }   
        }
    }
    catch(err){
        console.warn("Couldn't Insert into the database",err)
    }
}

async function init_DB()
{
    try{
        if(!state.connection){
            await wait_for_files([5])
            state.connection = new JsStore.Connection(new Worker("/static/JS/jsstore/jsstore.worker.min.js"));
            state.dbName = "Hemavathi";
            state.dbTable =  {
                name: "precomputed",
                columns:{
                    url: { primaryKey: true, notNull:true, dataType: JsStore.DATA_TYPE.String },
                    wavfile: {notNull:true, dataType: JsStore.DATA_TYPE.Object, enableSearch:false},
                    targetTime: {notNull:true, dataType: JsStore.DATA_TYPE.Array, enableSearch:false},
                    targetSemitone: {notNull:true, dataType: JsStore.DATA_TYPE.Array, enableSearch:false}
                }
            };

            state.database = {
                name:state.dbName,
                tables: [state.dbTable],
            }

            let isDBcreated = await state.connection.initDb(state.database);

            if(isDBcreated) console.log("Created Indexed Db");
            else{
                console.log("Opened Indexed Db");
                if(CLEAR_DB)
                {
                    await state.connection.clear(state.dbTable.name);
                    console.log('data cleared successfully');
                }
            } 
        }
        return true;
    }
    catch(err){
        console.warn("Couldn't initialize indexedDb",err)
        return false;
    }
}



async function getDataFromDB(){
    if(USE_DB_CACHE)
    {
        if(await init_DB())
        {
            var url = `${state.artistName}/${state.songName}/${state.tonic}`;
            site_stats.songurl = url;
            var results = await state.connection.select({
                from: state.dbTable.name,
                where: {
                    url: url
                }
            });
            if(results.length>0){
                state.wavfile = results[0].wavfile;
                state.targetSemitone = results[0].targetSemitone;
                state.targetTime = results[0].targetTime;
                return true;
            }
        }
    }
    return false;
}


/* !!!!---------------------------------- End: Database related function -----------------------------------------!!!! */


/* !!!!---------------------------------- Start: Plotting related function -----------------------------------------!!!! */ 

function Plotter(plotElement){
        
        recordedPitch = []

        state.currpitch = 0;
        state.currtime = 0;
        

        var windowLength = 3;


        var min = Infinity
        var max = -Infinity

        for(val of state.targetSemitone)
        {
            if(val!=-220){
                if(val>=max)
                {
                    max = val;
                }
                if(val<=min)
                {
                    min = val;
                }
            }
        }

        MIN_SEMI = min-10;
        MAX_SEMI = max+10;

        var options={
            yaxis:{
                fixedrange: true,
                zeroline: false,
                range: [MIN_SEMI,MAX_SEMI],
                gridcolor: '#009688',
            },
            xaxis:{
                showgrid:  false,
                zeroline: false,
                showticklabels:false,
                range: [0,windowLength]
            },
            margin: {
                l: 30,
                r: 10,
                b: 20,
                t: 20,
                pad: 4
            },

            dragmode: 'pan',
            showlegend: false,
            plot_bgcolor:"rgb(252, 245, 229)",
            paper_bgcolor:"rgb(252, 245, 229)"
        }

        var customization={
            displayModeBar: false
        }        
        
        var data = {
            x: [],
            y: [],
            mode: 'markers',
            marker: {
                color: 'rgba(255, 50, 10, 0.50)',
                symbol: 'circle',
                size: 14
            }
        };
        

        var data2 = {
            x: [],
            y: [],
            mode: 'lines',
            line:{
                color: 'rgba(255, 50, 10, 0.20)'
            }
        };
            
        var target={
            y:state.targetSemitone,
            x:state.targetTime,
            mode: 'lines',
            line: {color: 'BEBEBE'}
        }
        
        var currentMarker = {
            x: [0],
            y: [MAX_SEMI-1],
            mode: 'markers',
            marker: {
                color: 'rgba(255, 50, 10, 0.60)',
                symbol: 'triangle-down',
                size: 14
            }
        };
        
        Plotly.newPlot(plotElement,[data,target,currentMarker,data2],options,customization)
        

        state.data2x = []
        state.data2y = [] 

        processRecordedChunk=function(clear=false){
            if(clear)
            {


                state.data2x = []
                state.data2y = [] 

                start = 0;
                state.currpitch = 0;
                state.currtime = 0;

                options.xaxis.range = [start,start+windowLength];
                var update={
                    y:[new Float32Array(),[MAX_SEMI-1]],
                    x:[new Float32Array(),[0]],
                }

                Plotly.update(plotElement,update,options,[0,2]);

                return;
            }


            var curr = synthesizedAudioElement.currentTime;
            if(curr>=1)
            {
                start = curr-1;
                end = curr+1;
            }
            else{
                start = 0;
                end = 3;
            }

            options.xaxis.range = [start,end];
            
            // Hides the live pitch detector because delay is too much. Change it if it's still plotting
            if(LOW_POWER==2)
            {
                var update={
                    x: [[-1],[curr]],  
                    y: [[-100],[MAX_SEMI-1]]
                }
            }
            else{
                var update={
                    x: [[curr],[curr]],  
                    y: [[state.currpitch],[MAX_SEMI-1]]
                }

            }
            

            // Here we can evaluate the mean time delay of the realtime plot.

            Plotly.update(plotElement,update,options,[0,2]);

            var extend = {
                x: [state.data2x],
                y: [state.data2y]
            }
            Plotly.extendTraces(plotElement,extend,[3],1000);
            
            state.data2x = []
            state.data2y = []
            
            updateSeekBarTimerText();
        }            

        
        return processRecordedChunk;
}

function updateSeekBarTimerText()
{
    timer_text.innerHTML = render_time(synthesizedAudioElement.currentTime*1000);
    audioPlayerSeekBar.value = (synthesizedAudioElement.currentTime/synthesizedAudioElement.duration)*100;
    if(synthesizedAudioElement.currentTime>state.end_time)
    {
        stopButton.click();
    }
}


function rangelike(arr,start=0,step=1){
    if(USE_FLOAT_ARRAY){
        var result = new Float32Array(arr.length);  
    }
    else{
    var result = new Array(arr.length);  
    }
    i = 0;

    while(i<arr.length)
    {
        result[i]=start+step*i;
        i++;
    }
    return result;
}


/* !!!!---------------------------------- End: Plotting related function -----------------------------------------!!!! */ 
async function parseResponse(filename)
{
    let response  = await state.downloadDataPromises[filename];
    if(!response.ok)
    {
        throw "Parse error";
    }
    else{
        return await response.blob();
    }
}

async function downloadData()
{

    state.downloadDataPromises = {};

    if(!state.gotFromDB){
        var filestoDownload = ["semitone.gz","tonic","energy.gz"];
    }else{
        var filestoDownload = [];
    }
    
    if(downloadBeatsCheckBox.checked)
    {
        filestoDownload.push('acmp.mp3');
    }

    for(var file_name of filestoDownload)
    {
        let file_url = `download/${state.artistName}/${state.songName}/${file_name}`;
        state.downloadDataPromises[file_name] = fetch(file_url);
    }

    try{
        if(!state.gotFromDB){
            state.semitone = await parseResponse("semitone.gz");
            state.energy = await parseResponse("energy.gz");
            parseSemitone(state.semitone);

        }        
    }catch(err){
        console.error(err);
        common_error();
        throw "There is some issue while downloading the files";
    }
}


async function parseSemitone(semitone_blob){
    let reader = new FileReader();
    state.targetSemitone = []
    state.targetTime = []
    reader.onload = function(e){
        let text = e.target.result
        let lines = text.split(/\r\n|\n/);
        var time,semi;
        for(var i=0;i<lines.length-1;i++){
            let line = lines[i];
            let values = line.split(" ");
            time = parseFloat(values[0]);
            semi = parseFloat(values[1]);
            state.targetTime.push(time);
            state.targetSemitone.push(semi);
        }
    }
    reader.readAsText(state.semitone);   
}

function initPartiationUIElements(){
    // Change here to use multiple parts
    function changeTimestamps(values){
        var l = values[0]; 
        var r = values[1];
        if(l>r) {
            [l,r] = [r,l];
        }

        playOriginalAudioElement.currentTime = l;
        strip_start.innerHTML = render_time(l*1000);
        strip_end.innerHTML = render_time(r*1000);
    }

    $(document).ready(function() {
            $("#slider").slider({
                range: true,
                min: 0,
                max: state.song_duration,
                step: 0.1,
                values: [0, state.song_duration],
                slide: function(event, ui) {
                    songPartSel.value  = -1;
                    changeTimestamps(ui.values);
                },
                change: function(event,ui){
                    changeTimestamps(ui.values);
                }
     });
    });

    fillSongPartSelectionBox();
}


function fillSongPartSelectionBox(){
    songPartSel.length = 0;


    songPartSel.options[songPartSel.options.length] = new Option(` [Select a part] `,-1);

    try{
        var parts  = state.parts;
        for(var part in parts)
        {
            var start = render_time(parts[part][0]*1000);
            var end = render_time(parts[part][1]*1000);

            songPartSel.options[songPartSel.options.length] = new Option(`${parseInt(part)+1}: ${start} - ${end} `,part);
        }        
    }catch(err){
        console.error(err);
        common_error();
    }
}

function changeSongPart(obj){
    var part = songPartSel.value;

    if(part==-1)
    {
        return;
    }    
    
    else{
        [start,end] = state.parts[part]
    }
        
    //TODO: set start and end

    $("#slider").slider('values',0,start);
    $("#slider").slider('values',1,end);
}


async function playgroundInit(){
    state.artistName = artistSel.value;
    state.songName = songSel.value;
    state.ragaName = ragaSel.value;
    state.tonic = tonicInput.value;
    
    playOriginalAudioElement.src = `download/${state.artistName}/${state.songName}/song.mp3`;

    state.song_duration = state.songDB[state.artistName][state.ragaName][state.songName]['duration'];
    state.parts = state.songDB[state.artistName][state.ragaName][state.songName]['parts'];
    strip_end.innerHTML = render_time(state.song_duration*1000);


    initPartiationUIElements();

    state.getting_things_readyPromise = getting_things_ready();
    app_screen.change_screen("play_original");

    await state.getting_things_readyPromise;
    if(app_screen.active=="play_original")
    flasher.info("Click next whenever you are ready");
}

async function computation()
{
    let files = {
        semitone:state.semitone,
        energy:state.energy,
    }

    await timeit(async()=>{
        wasmWorker.postMessage({eventType:"populate",data:files});
        await new Promise(resolve=>addEventListener("populateDone",resolve,{once:true}));
    },"Populating MEMFS");
     

    await timeit(async()=>{
        wasmWorker.postMessage({eventType:"synth",data:state.tonic});
        await new Promise(resolve=>addEventListener("synthDone",resolve,{once:true}));
    },"Synthesis");
}


async function getting_things_ready()
{

    state.gotFromDB = await getDataFromDB();

    site_stats.gotFromDB = state.gotFromDB;

    state.downloadPromise = timeit(downloadData,"Downloading song data");
    await state.downloadPromise;
    await timeit(async function(){await state.wasmWorkerReadyPromise},"Loading wasm worker module");

    if(!state.gotFromDB)
    {
        state.computationPromise =  timeit(computation,"Copy to MEMES and synthesis");
    }

    state.EssentiaInWorkerReadyPromise = new Promise(resolve=>addEventListener("essentiaReady",resolve,{once:true}));

    if(!state.gotFromDB){
        await state.downloadPromise;
        await state.computationPromise;
    }
    
    if(downloadBeatsCheckBox.checked){
        try{   
            state.acmp3 = blobber(await parseResponse("acmp.mp3"));
            instrumentPlaySlider.disabled = false;
            
        }catch{
            flasher.error("Couldn't download the instrument file for the current song");
            flasher.info("Please continue without it");
            instrumentPlaySlider.disabled = true;
        }
    }   

    
        
    await wait_for_files([1,4]);
    await init_audio();
    

    wasmWorker.postMessage({
        eventType:"essentiaInit",
        sampleRate: context.sampleRate,
        tonic:state.tonic,
        targetSemitone:state.targetSemitone,
        targetTime: state.targetTime,
        LOW_POWER:LOW_POWER,
    });
    
    await state.EssentiaInWorkerReadyPromise;
}

async function init_audio()
{
    try{
        context = new AudioContext();
        
    
        site_stats.sampleRate = context.sampleRate;
        site_stats.baseLatency = context.baseLatency;
        
        if(USE_PINK_NODE){
            context2 = new AudioContext();
            await context2.audioWorklet.addModule("/static/JS/recorder/pinkWorklet.js");
        }
            
        
            
    
        
        if(USE_PINK_NODE){
            
            pinkNoiseNode = new AudioWorkletNode(context2,'pink-worklet');
            pinkNoiseGainNode = context2.createGain();
            pinkNoiseGainNode.gain.value = pinkNoisePlaySlider.valueAsNumber;  
            pinkNoiseNode.connect(pinkNoiseGainNode);
            pinkNoiseGainNode.connect(context2.destination);
        }
        
        if( downloadBeatsCheckBox.checked)
        {
            context4 = new AudioContext();
            instrumentAudioElement = new Audio(state.acmp3.url);
            instrumentAudioNode= context4.createMediaElementSource(instrumentAudioElement);
            instrumentGainNode = context4.createGain();
            instrumentGainNode.gain.value = instrumentPlaySlider.valueAsNumber;
            instrumentAudioNode.connect(instrumentGainNode);
            instrumentGainNode.connect(context4.destination);

        }
        
        state.wavfileBlobbed = blobber(state.wavfile,filename= `${state.artistName}_${state.songName}_synth.mp3`);
        synthesizedAudioElement = new Audio(state.wavfileBlobbed.url);
        synthesizedAudioNode = context.createMediaElementSource(synthesizedAudioElement);
        synthesizedAudioGainNode = context.createGain();
        synthesizedAudioGainNode.gain.value = synthPlaySlider.valueAsNumber;

        if(USE_REVERB){
            reverbNode = await createReverb(context);
            synthesizedAudioNode.connect(reverbNode);
            reverbNode.connect(synthesizedAudioGainNode);
        }
        else{
            synthesizedAudioNode.connect(synthesizedAudioGainNode);
        }

        synthesizedAudioGainNode.connect(context.destination);
        
    
        try{
            stream = await navigator.mediaDevices.getUserMedia({ audio: true,video:false });
            stream.getTracks().forEach(track => track.stop());
        }catch(err){
            app_screen.disable();
            flasher.error("Mic permission are required to proceed further");
            flasher.info("Check if you have blocked mic permissions");
            flasher.info("Reloading the page");
            console.error("couldn't load mic");
            await sleep(3000);
            window.location.reload();
        }
    

        // synthesizedAudioElement.addEventListener("timeupdate",timeupdateHandle);
        synthesizedAudioElement.addEventListener("ended",stopHandler);

        
    }catch(err){
        console.error("Couldn't initialize audio context",err);
    }
}


async function initrecording(){
    if(USE_RECORDING_NODE){

        try{
            stream = await navigator.mediaDevices.getUserMedia({ audio: true,video:false });
        }catch(err){
            app_screen.disable();
            flasher.error("Mic permission are required to proceed further");
            flasher.info("Check if you have blocked mic permissions");
            flasher.info("Reloading the page");
            console.error("couldn't load mic");
            await sleep(3000);
            window.location.reload();
        }

        context3 = new AudioContext();
        await context3.audioWorklet.addModule("/static/JS/recorder/recorderWorklet.js");
        recorderSource = context3.createMediaStreamSource(stream);
        recordingNode = new AudioWorkletNode(context3,'recorder-worklet');
        recordingNode.parameters.get('isRecording').setValueAtTime(0,context3.currentTime);
        recordingFeedbackGainNode = context3.createGain();
        recordingFeedbackGainNode.gain.value = feedBackPlaySlider.valueAsNumber;

        recordingNode.port.onmessage = function(e) { 
            if(e.data.eventType=="data")
            recordingBufferHandler(e.data.audioBuffer);
        }



        recorderSource.connect(recordingNode);
        recordingNode.connect(recordingFeedbackGainNode);
        recordingFeedbackGainNode.connect(context3.destination);

    }
}


async function recordingBufferHandler(buffer){
    if(state.player_state==PlayerStates.playing){
        wasmWorker.postMessage({
            eventType: "pitch",
            data: buffer,
        });
    }
}

async function createReverb(audioCtx) {
    let convolver = audioCtx.createConvolver();

    try{
        let response     = await fetch(REVERB_URL);
    let arraybuffer  = await response.arrayBuffer();
    convolver.buffer = await audioCtx.decodeAudioData(arraybuffer);

    return convolver;
    }catch{
        console.log("Couldn't create reverb node");
        common_error();
    }
}

async function calculate_scores(){

    wasmWorker.postMessage({
        eventType: "score",
    });   

    if(state.currtime >= MIN_TIME_FOR_SCORES)
    {
        state.scoreReadyPromise = new Promise(resolve=>addEventListener("scoreReady",resolve,{once:true}));
        await app_screen.render_wait_screen(async()=>await state.scoreReadyPromise,"Calculating score","Display: calculating score");
        document.getElementById("scoreDisplay").innerHTML = state.score.score;
        document.getElementById("gradeDisplay").innerHTML = state.score.grade;
        app_screen.change_screen("score_screen");
    }
    else{
        document.getElementById("scoreDisplay").innerHTML = "N/a";
        document.getElementById("gradeDisplay").innerHTML = "N/a";
    }

    // sendSiteStatistics();
}

async function sendSiteStatistics()
{
    site_stats["ram"]  = navigator.deviceMemory;
    site_stats["cores"] = navigator.hardwareConcurrency;
    site_stats["platform"] = navigator.platform;

    site_stats["wakelock"] = typeof(wakeLock)!=='undefined';

    var memory = window.performance.memory;

    for(key in memory)
    {
        site_stats[key] = memory[key];
    }

    site_stats.timestamp = (new Date()).getTime();
    res = await fetch("/upload/stats",{method:"POST",headers: {
        'Content-Type': 'application/json'
      },body: JSON.stringify(site_stats)});
}

async function playground()
{
    playOriginalAudioElement.pause();
    
    state.start_time = $("#slider").slider("values")[0];
    state.end_time = $("#slider").slider("values")[1];

    wasmWorker.postMessage({eventType:"start_end_times",start_time:state.start_time,end_time:state.end_time});

    if(state.end_time - state.start_time < MIN_TIME_FOR_SCORES )
    {
        flasher.error(`Segment length should be atleast ${MIN_TIME_FOR_SCORES} seconds`);
        return;
    }
    
    await app_screen.render_wait_screen(async()=>{await state.getting_things_readyPromise;await initrecording()},"Getting things ready","Display: getting things ready")

    synthesizedAudioElement.currentTime = state.start_time;

    if(downloadBeatsCheckBox.checked){
        instrumentAudioElement.currentTime = state.start_time;
        if(Math.abs(state._tonic-state.tonic)>0.001)
        {
            instrumentPlaySlider.slide
            instrumentPlaySlider.value = 0;
            instrumentPlaySlider.dispatchEvent(new Event("input"));
            // or disable it if ma'am says!!!
        }
    }

    site_stats.playback_time = synthesizedAudioElement.duration;

    flasher.info("Please use headphones for better experience")
    plotcb = Plotter("plotMe");
    plotcb();
    app_screen.change_screen("playground");
}

async function retryInit()
{
    playgroundInit();
}

async function pauseEverything(){
    await synthesizedAudioElement.pause();
    
    if(downloadBeatsCheckBox.checked)
    {
        await instrumentAudioElement.pause();
    }
    
    clearInterval(state.plotIntervalId);
    
    if(USE_RECORDING_NODE){
        recordingNode.parameters.get('isRecording').setValueAtTime(0,context3.currentTime);
        recordingNode.parameters.get('isPlaying').setValueAtTime(0,context3.currentTime);
    }
    if(USE_PINK_NODE){
        pinkNoiseNode.parameters.get('isPlaying').setValueAtTime(0,context2.currentTime);
    }
    
}

async function playEverything(){
    
    await synthesizedAudioElement.play();

    if(downloadBeatsCheckBox.checked)
    {
        await instrumentAudioElement.play();
    }
    
    state.plotIntervalId = setInterval(plotcb,D_PLOT_TIME);

    if(USE_RECORDING_NODE){
        recordingNode.parameters.get('isRecording').setValueAtTime(1,context3.currentTime);
        recordingNode.parameters.get('isPlaying').setValueAtTime(1,context3.currentTime);
    }
    
    if(USE_PINK_NODE){
        pinkNoiseNode.parameters.get('isPlaying').setValueAtTime(1,context2.currentTime);
    }
}

function disableButtons(){
    playPauseButton.disabled = true;
    stopButton.disabled = true;
}

function enableButtons(){
    playPauseButton.disabled = false;
    stopButton.disabled = false;
}

async function playPauseHandler()
{
    switch(state.player_state)
    {
        case PlayerStates.playing:
            //pause it
            state.player_state  = PlayerStates.paused;
            playPauseButton.innerHTML = "Record";
            playPauseButton.className = "w3-button w3-red w3-hover-red w3-center w3-ripple"
            disableButtons();
            pauseEverything();
            enableButtons();
            break;
        case PlayerStates.paused:
            //play it
            state.player_state  = PlayerStates.playing;
            playPauseButton.innerHTML = "Pause";
            playPauseButton.className = "w3-button w3-pink w3-hover-pink w3-center w3-ripple"
            disableButtons();
            playEverything();
            enableButtons();
            break;
    }
}


function resetPlayground(){
    disableButtons();
    state.player_state  = PlayerStates.paused;
    playPauseButton.innerHTML = "Record";
    playPauseButton.className = "w3-button w3-red w3-hover-red w3-center w3-ripple"
    enableButtons();
    synthesizedAudioElement.currentTime=state.start_time;
    updateSeekBarTimerText();
    if(downloadBeatsCheckBox.checked)
    {
        instrumentAudioElement.currentTime=state.start_time;
    }
    pauseEverything();
}

async function stopHandler()
{   
    resetPlayground();
    calculate_scores();
    plotcb(clear=true);
}

/* !!!!---------------------------------- Start: Other Helper Functions -----------------------------------------!!!! */

function downloadBlob(blob,name)
{
    blobber(blob,name).download().destroy();
}

function downloadURL(url,name)
{
    let a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
}

function common_error(error=null)
{
    app_screen.change_screen("");
    flasher.error("Something went wrong...");   
    if(error){
        flasher.error(error);
    }
    flasher.info("We are sorry for the inconvenience, Please come back later");
    throw "Can't proceed furthur";
}

function blobber(buffer,filename="temp",type="")
{
    return new function (){if(buffer.constructor.name=='Blob') this.blob=buffer;
    else this.blob = new Blob([buffer],{type:type});
    this.url = URL.createObjectURL(this.blob);
    this.destroy = function(){
        URL.revokeObjectURL(this.url);
    }
    this.download = function(){
        downloadURL(this.url,filename);
        return this;
    }
    }
}

function isLowPower(){
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
/* !!!!---------------------------------- End: Other Helper Functions -----------------------------------------!!!! */

