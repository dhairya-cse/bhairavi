numChannels = 1;
sampleRate = 44100;


recordingStoppedEvent = new CustomEvent("recording-stopped");

const recordAudio1 = (callback=(data)=>{}) =>
                    new Promise(async resolve => {
                        const context = new AudioContext();
                        await context.audioWorklet.addModule("/static/JS/recorder/recorderWorklet.js");
                        sampleRate  = context.sampleRate;
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const recorderNode = new AudioWorkletNode(context,'recorder-worklet');
                        const source = context.createMediaStreamSource(stream);
                        const audioChunks = [];

                        recorderNode.port.onmessage = function (e){
                            if(e.data.eventType=='data')
                            {
                                let arr = e.data.audioBuffer;
                                audioChunks.push(arr);
                                callback(arr);
                            }
                            else if(e.data.eventType=='stop')
                            {
                                recorderNode.port.onmessage = null;
                                recorderNode.disconnect(context.destination);
                                source.disconnect(recorderNode);
                                context.close();
                                stream.getTracks().forEach(track => track.stop());
                                dispatchEvent(recordingStoppedEvent);
                            }
                            
                        }

                        const start = () => {
                            recorderNode.parameters.get('isRecording').setValueAtTime(1,context.currentTime);
                            source.connect(recorderNode);
                            recorderNode.connect(context.destination);
                        }; 

                        const stop =  () =>
                        new Promise(async (resolve) => {
                            recorderNode.parameters.get('isRecording').setValueAtTime(0,context.currentTime);

                            addEventListener("recording-stopped",()=>{
                                let audioArray = mergeArrays(audioChunks);
                                let audioWav = encodeWAV(audioArray);
                                let audioBlob = new Blob([audioWav],{type:"audio/wav"});
                                const audioUrl = URL.createObjectURL(audioBlob);
                                const audio = new Audio(audioUrl);
                                resolve([audio,audioArray]);
                            }
                            );

                        });
 
                        resolve({ start, stop });
});


const recordAudio2 = (callback=(data)=>{}) =>
                    new Promise(async resolve => {
                        const context = new AudioContext();
                        sampleRate  = context.sampleRate;
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const recorderNode = context.createScriptProcessor(2048,1,1);
                        const source = context.createMediaStreamSource(stream);
                        const audioChunks = [];
                        let  recording=false;
                        recorderNode.addEventListener("audioprocess", function (e){
                            if(recording)
                            {
                                let arr= new Float32Array(2048);
                                arr.set(e.inputBuffer.getChannelData(0));
                                audioChunks.push(arr);
                                callback(arr);
                            }
                            else
                            {
                                recorderNode.disconnect(context.destination);
                                source.disconnect(recorderNode);
                                context.close();
                                stream.getTracks().forEach(track => track.stop());
                                dispatchEvent(recordingStoppedEvent);
                            }
                            
                        });

                        const start = () => {
                            recording = true;
                            source.connect(recorderNode);
                            recorderNode.connect(context.destination);
                        }; 

                        const stop =  () =>
                        new Promise(async (resolve) => {
                            recording = false;
                            
                            addEventListener("recording-stopped",()=>{
                                let audioArray = mergeArrays(audioChunks);
                                let audioWav = encodeWAV(audioArray);
                                let audioBlob = new Blob([audioWav],{type:"audio/wav"});
                                const audioUrl = URL.createObjectURL(audioBlob);
                                const audio = new Audio(audioUrl);
                                resolve([audio,audioArray]);
                            }
                            );
                        });
 
                        resolve({ start, stop });
});

function playAudio(chunks)
{
    let cntx = new AudioContext();
    let bfr = cntx.createBuffer(1,chunks.length,cntx.sampleRate);
    let arr = bfr.getChannelData(0);
    for(var i=0;i<bfr.length;i++)
    {
        arr[i] = chunks[i]
    }
    let src = cntx.createBufferSource();
    src.buffer = bfr;
    src.connect(cntx.destination);
    src.start();
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


function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function encodeWAV(samples) {
    let buffer = new ArrayBuffer(44 + samples.length * 2);
    let view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
}


