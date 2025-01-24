DO_ESSENTIA = false;

if(DO_ESSENTIA){
    importScripts('/wasm/hello.js',"/static/JS/essentia/essentia-wasm.web.js","/static/JS/essentia/essentia.js-core.js","/wasm/aubio.js"); 
}
else
{
    importScripts('/wasm/hello.js','/wasm/aubio.js');     
}


const state = {}

USE_PITCH_FILTER = true;

HIGHTEST_POSSIBLE_PITCH = 88;
SCORE_SCALING_FACTOR = 1;


if(DO_ESSENTIA)
{
    state.essentiaWasmPromise = new EssentiaWASM();
}


audioSegments = [];


onmessage=async function(e)
{
    let  eventType = e.data.eventType;
    if(eventType=="init")
    {
        if(Module.calledRun)
        {
            this.postMessage(
                {
                    eventType:"ready",
                    data: true
                }
                );
        }
        else
        {
            this.postMessage(
                {
                    eventType:"ready",
                    data: false
                }
                );
        }
    }
    if(eventType=="myFunction") 
    {
        myFunction(e.data.data)
    }

    if(eventType=="populate")
    {
        populateData(e.data.data);
    }
    
    if(eventType=="synth")
    {
        synthesize(e.data.data)
    }

    if(eventType=="pitch")
    {
        sbuff = e.data.data;
        
        if(buff_i+sbuff.length>buffersize)
        {
            sbuff = sbuff.slice(buffersize-buff_i);
        }
            
        buff.set(sbuff,buff_i);

        buff_i = (buff_i+sbuff.length) % buffersize;
        
        if(buff_i==0)
        {
            aux_buffer.set(buff,(nbuffers-1)*buffersize);
            

            if(DO_ESSENTIA && !LOW_POWER)
            {
                calculatePitch(aux_buffer);
            }
            else{
                calculatePitchMobile(aux_buffer);
            }
            

            var i =0;
            while(i < (nbuffers-1)*buffersize)
            {
                aux_buffer[i] = aux_buffer[i+buffersize];
                i++;
            }
        }
    }

    if(eventType=="essentiaInit")
    {
        if(DO_ESSENTIA){
            state.essentiaNode = await new Essentia(await state.essentiaWasmPromise);
        }
    
        state.sampleRate = e.data.sampleRate;
        state.tonic = e.data.tonic;

        LOW_POWER = e.data.LOW_POWER;


        buffersize = 512; // The buffer size for pitch yin or aubio. speed > accuracy
        auxbuffersize = 4*1024;
        nbuffers = parseInt(auxbuffersize/buffersize)
        Aubio().then(function (aubio) {
            pitchDetector = new aubio.Pitch(
                'default', auxbuffersize, 1, state.sampleRate)});
        
        aux_buffer = new Float32Array(auxbuffersize); 
        state.dt = buffersize/state.sampleRate;
        this.postMessage({
            eventType:"essentiaReady",
            dt:state.dt, 
         });

        buff = new Float32Array(buffersize);
        buff_i = 0;

        state.targetSemitone = e.data.targetSemitone;
        state.targetTime = e.data.targetTime;

        var final = state.targetTime.slice(-1)[0];
        perStep = final/(state.targetTime.length-1);

        pd = [];
    }

    if(eventType=="score")
    {   
        state.dt_pd = currentTime/pd.length;
        state.pd = pd;


        score = calculateScoreHelper();

        this.postMessage({
            eventType: "scoreReady",
            totaltime: currentTime,
            score:score,
        });

        pd = []
        audioSegments=[];
        buff_i = 0;
        currentTime = state.dt;
    }

    if(eventType=="start_end_times"){
        state.start_time=e.data.start_time;
        state.end_time = e.data.end_time;

        currentTime = state.start_time;
    }
}


function applywindow(buffer){
    var M = buffer.length;
    var buffer2 = new Float32Array(M);
    var i = 0;
    var temp;
    while(i<M)
    {
        temp = 0.53836 - 0.46164 * Math.cos((2*Math.PI*i)/(M-1))
        buffer2[i] = buffer[i] * 1;
        i++;
    }
    return buffer2;
}


async function calculatePitchMobile(buffer2)
{
    buffer2 = applywindow(buffer2);
    var x = pitchDetector.do(buffer2);
    pitch = 12*Math.log2(x/state.tonic);


    pitch = pitch_correction(pitch);

    this.postMessage(
        {
            eventType: "pitchCalculated",
            pitch: pitch,
            time: currentTime,
        }
    );
    
    pd.push(pitch);
    currentTime += state.dt;
}

function pitch_correction(pitch)
{
    // return pitch;
    var target_pitch = get_target_pitch(currentTime);

    if(target_pitch==-220 || pitch == -220 || Math.abs(pitch)==Infinity || isNaN(pitch))
    {
        pre_target = target_pitch;
        return -220;
    }

    if (pd.length==1){
        pre_target = target_pitch;
        return pitch;
    } 

    var res = pitch;
    var pre = pd.slice(-1)[0];
    var diff = pitch - pre;
    var diff2 = pitch-target_pitch;


    if(Math.abs(pre_target-pre)<-1)
    {
        if(Math.abs(pitch)!=Infinity && Math.abs(pre)!=220)
        {
            if(diff2>=11.5)
            {
                if(diff2>=12)
                {
                    res = res - Math.round(diff2/12)*12
                }
                else{
                    res = res-12;
                }
                
            }
            else if(diff2<=-11.5)
            {
                if(diff2<=-12)
                {
                    res = res - Math.round(diff2/12)*12
                }
                else{
                    res = res + 12;
                }
                
            }
        }
    }

    pre_target = target_pitch;
    return res;
}

async function calculatePitch2(buffer)
{
    var pitch = [];
    for(i=0;i+4*1024<buffer.length;i+=1024)
    {
        res = pitchDetector.do(buffer.slice(i,i+4*1024));
        pitch.push(res);
    }

    pitch = pitch.map(x=>12*Math.log2(x/state.tonic));
    return pitch;
}

async function calculatePitch(buffer)
{
    var vector =  state.essentiaNode.arrayToVector(buffer);
    var res = state.essentiaNode.PitchMelodia(vector,
        10,
        1,
        4096,
        false,
        0.8,
        512,
        1,
        40,
        8000, //Maximum freq,
        30, //minimum duration
        40,
        20,
        0.9,
        0.9,
        27.5625, // Pitch continuity peak
        55,
        state.sampleRate,
        100,
        true, // voice vibrato
        0.2
        );

    
    if(USE_PITCH_FILTER){
        res2 = state.essentiaNode.PitchFilter(res.pitch,res.pitchConfidence); 
        var pitch = state.essentiaNode.vectorToArray(res2.pitchFiltered);
    }
    else{
        var pitch = state.essentiaNode.vectorToArray(res.pitch);
    }



    pitch = pitch.map(x=>12*Math.log2(x/state.tonic));


    for(var p of pitch)
    {
        this.postMessage(
            {
                eventType: "pitchCalculated",
                pitch: p,
                time: currentTime,
            }
        );
        
        pd.push(p);
        currentTime += state.dt;
    }
    
    state.essentiaNode.EssentiaWASM._free(vector.$$.ptr);
    if(USE_PITCH_FILTER){   
        state.essentiaNode.EssentiaWASM._free(res2.pitchFiltered.$$.ptr);
        delete res2;
    }

    state.essentiaNode.EssentiaWASM._free(res.pitch.$$.ptr)
    state.essentiaNode.EssentiaWASM._free(res.pitchConfidence.$$.ptr)

    delete res;
    delete pitch;
    delete vector;

    return pitch;
}

async function synthesize(tonic){
    let cmd = `cmd semitone semitone synth ${tonic}`.split(' ');
    _semitoneToSynth(cmd.length,stringsArrayToPointer(cmd));
    cmd = `cmd synth output.wav 5.0`.split(' ');
    _synth(cmd.length,stringsArrayToPointer(cmd));
    
    let wavfile = FS.readFile(`output.wav`);

    postMessage(
        {
            eventType:"synthDone",
            wavfile: wavfile,
        }
    );

    FS.unlink("output.wav");
    FS.unlink("synth");
}


async function populateData(data){
    let _promises  = [];
        for(key in data)
        {
            let reader = data[key].stream().getReader();
            let stream = FS.open(key,"w+");

            _promises.push(new Promise((resolve)=>{
                reader.read().then(function processtext({done,value}){
                if(!done){
                    FS.write(stream,value,0,value.length);
                    reader.read().then(processtext);
                }else{
                    FS.close(stream);
                    resolve();
                }
            })}));
        }
        
        await Promise.all(_promises);           
        this.postMessage({eventType:"populateDone"});
}


async function myFunction(data)
{
    _myFunction(data.length,stringsArrayToPointer(data));
}


function stringToPointer(string){
    let array = intArrayFromString(string)
    let ptr = _malloc(array.length);
    HEAP8.set(array,ptr);
    return ptr;
}

function stringsArrayToPointer(arrayofString){
    let pointers = []
    for(string of arrayofString)
    {
        pointers.push(stringToPointer(string));
    }

    ptr = _malloc(pointers.length*4);
    HEAP32.set(pointers,ptr/4);
    return ptr;
}


function mergeArrays(arrOfArr,arrayType=Float32Array)
{
    var lenOfArr = 0;
    for(var arr of arrOfArr) lenOfArr+=arr.length;
    var res = new arrayType(lenOfArr);
    let offset = 0;
    for(var arr of arrOfArr)
    {
        res.set(arr,offset);
        offset += arr.length;  
    }
    return res;
}

function calculateScoreHelper(){
    var distance = 0;
    var maxDistance = 0;

    var target;
    var calcPitch;
    var time= 0;
    var correct_samples = 0;
    var pi = 0;
    var pdi = 0;

    var start = state.start_time;
    var end = state.end_time;

    while(time<=state.end_time && pdi<state.pd.length)
    {
        calcPitch = state.pd[pdi];
        while(pi<state.targetSemitone.length && state.targetTime[pi]<time) pi++;
    
        if(pi>=state.targetSemitone.length || isNaN(state.targetSemitone[pi])) break;

        target = state.targetSemitone[pi];


        if(time>=start)
        {
            if(time<=end)
            {
                if(target==-220)
                {
                    //ignore silence regions
                }
                else if(calcPitch==-220)
                {
                    // maxDistance += Math.pow(target - HIGHTEST_POSSIBLE_PITCH, 2);
                    // distance += Math.pow(target - HIGHTEST_POSSIBLE_PITCH, 2);
                    // correct_samples++;
                }
                else
                {
                    distance += Math.pow(target - calcPitch, 2);
                    maxDistance += Math.pow(target - HIGHTEST_POSSIBLE_PITCH, 2);
                    correct_samples++;
                }
            }
            else
            {
                break;
            }
        }
    
        time+=state.dt_pd;
        pdi++;
    }

    maxDistance = Math.sqrt(maxDistance);
    distance = Math.sqrt(distance);
    var score = (1 - (distance)/maxDistance);
    score = Math.pow(score,SCORE_SCALING_FACTOR); // this can be changed or commented if required
    score = Math.floor(score*100+0.5);


    if(isNaN(score)) score = 0;

    var grade = findGradeFromScore(score);

    return {"score":score,"grade":grade};
}


function findGradeFromScore(score){
    var anchors = [98,95,90,88,85,80,78,75,70,60,40];
    var grades = ["A++","A+","A","B++","B+","B","C++","C+","C","D","E","F"];

    let n = anchors.length;
    let i = 0;
    let j = n-1;

    var resIndex = n;

    while(i<=j)
    {
        let m = parseInt((i+j)/2);
        
        if(score < anchors[m])
        {
            i = m+1;
        }
        else{
            if(score>=anchors[m] && (m==0 || score < anchors[m-1])){
                resIndex = m;
                break;
            }
            else{
                j = m-1;
            }
        }
    }

    return grades[resIndex];
}


function get_target_pitch(target){
    var index = target/perStep;
    var t_d =  Math.floor(index);
    return state.targetSemitone[t_d];
}