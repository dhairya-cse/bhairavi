class PinkWorklet extends AudioWorkletProcessor {
  
    static get parameterDescriptors() {
      return [{
        name: 'isPlaying',
        defaultValue: 0
      }
      ];
    }

    constructor()
    {
      super();
      this.b0 = this.b1 = this.b2 = this.b3 = this.b4 = this.b5 = this.b6 = 0.0;
    }
    
    process(inputs, outputs,parameters) {
      const output = outputs[0];
      
      var buffersize = output[0].length;
      var i = 0;
      var channel = output.length;

      if(output.length>0)
      {
      while(i<buffersize){
              var white = Math.random() * 2 - 1;
              this.b0 = 0.99886 * this.b0 + white * 0.0555179;
              this.b1 = 0.99332 * this.b1 + white * 0.0750759;
              this.b2 = 0.96900 * this.b2 + white * 0.1538520;
              this.b3 = 0.86650 * this.b3 + white * 0.3104856;
              this.b4 = 0.55000 * this.b4 + white * 0.5329522;
              this.b5 = -0.7616 * this.b5 - white * 0.0168980;
      
              if(parameters.isPlaying[0]){
                output[0][i] = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
                output[0][i] *= 0.01;  //This can be changed
                for(var j=1;j<channel;j++) output[j][i] = output[0][i];
              }

              this.b6 = white * 0.115926;
              i++;
          }
      }
    return true;
    }
  }
  
  registerProcessor('pink-worklet', PinkWorklet);