class RecorderWorklet extends AudioWorkletProcessor {
  
  static get parameterDescriptors() {
    return [{
      name: 'isRecording',
      defaultValue: 0
    },
    {
      name: 'isPlaying',
      defaultValue: 0
    }
    ];
  }

  constructor()
  {
    super();
    this.buffersize = 512; //hyper parameter
    this.buffer = new Float32Array(this.buffersize);
    this.count = 0;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    

    // if(input.length>0)
    // {

    //   if(parameters.isPlaying[0]){
    //     var channel = 0;
    //     while (channel < output.length) {
    //       output[channel].set(input[channel]);
    //       ++channel;
    //     }
    //   }

    //   if(parameters.isRecording[0]==0)
    //   {

    //     if(this.count!=0)
    //     {
    //       this.port.postMessage({
    //         eventType: "data",
    //         audioBuffer:this.buffer.slice(0,this.count),
    //       });
    //     }
        
    //     this.count=0;
    //   }
    //   else{
    //     this.buffer.set(input[0],this.count);
    //     this.count= (this.count+input[0].length)%this.buffersize;
        
    //     // if the buffer is full, send the data and flush.
    //     if(this.count==0)
    //     { 
    //       this.port.postMessage({
    //         eventType: "data",
    //         audioBuffer: this.buffer});
    //     }
    //   }
    // }

    if(input.length>0)
    {

      if(parameters.isPlaying[0]){
        var channel = 0;
        while (channel < output.length) {
          output[channel].set(input[channel]);
          ++channel;
        }
      }

      if(parameters.isRecording[0]==0)
      {
        
      }
      else{
        
          this.port.postMessage({
            eventType: "data",
            audioBuffer: input[0]});
      }
    }

    return true;
  }
}

registerProcessor('recorder-worklet', RecorderWorklet);