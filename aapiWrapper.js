/*-------------------------constructor---------------------------*/

function aapiWrapper(){

    this.context = 0;
    this.initialised = true;
    this.sampleObjs = {};
    this.crossfades = {};

}

/*---------------------------methods-------------------------------*/

aapiWrapper.prototype.init = function(){

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio.context = new window.AudioContext();
    this.initialised = false;
    this.calcXFades();



    return true;

  } catch(e) {
    this.initialised = false;
    return false;

  }

}

aapiWrapper.prototype.loadSounds = function(files){

	var success = true;

	for (var a in files) {
		(function(parent) {

			var i = parseInt(a);
			parent.sampleObjs[i] = new appiSample();


			var req = new XMLHttpRequest();
			req.open('GET', files[i], true);
			req.responseType = 'arraybuffer';

			req.onload = function() {
				parent.context.decodeAudioData(
					req.response,

					function(buffer){
						parent.sampleObjs[i].buffer  = buffer;
						parent.sampleObjs[i].bufSrc = {};
					},

					function(){ 
						success = false;
						console.log('Error decoding audio "' + files[i] + '".') 
					}
				);
			};
			req.send();

		})(this); 
	}

	return success;

}

aapiWrapper.prototype.startLooping = function(n){ //n might ultimately be a key

  var sample = this.sampleObjs[n];

  if(!sample.isPlaying){

    sample.isPlaying = true;

    this.loopPlay(sample);

    sample.loopThread = window.setInterval(function(){

      //console.log(audio.context.currentTime + " :: "  + audio.sampleObjs[n].loopTime);
      if(this.context.currentTime > sample.loopTime){
        this.loopPlay(sample);
      }

    }.bind(this),50);

  }

}

aapiWrapper.prototype.stopLooping = function(n){

	var sample = this.sampleObjs[n];

	if(sample.isPlaying){
    	sample.bufSrc.stop(0);
    	sample.isPlaying = false;
    	window.clearInterval(sample.loopThread);
  	}
}


aapiWrapper.prototype.loopPlay = function(sample){

    var ct = this.context.currentTime;

    //setup data
    sample.bufSrc = this.context.createBufferSource();
    sample.bufSrc.buffer = sample.buffer;
    sample.gainNode = this.context.createGain();

    //patch nodes
    sample.bufSrc .connect(sample.gainNode);
    sample.gainNode.connect(this.context.destination);

    //calc next loop point
    sample.loopTime = this.context.currentTime + sample.buffer.duration - 1;

    //handle fades
    sample.gainNode.gain.setValueCurveAtTime(this.crossfades.xIn, ct, 1);
    sample.gainNode.gain.setValueCurveAtTime(this.crossfades.xOut, ct + sample.buffer.duration - 1, 1);

    //sched start & stops
    sample.bufSrc.start(this.context.currentTime);
    sample.bufSrc.stop(sample.loopTime + 1);

}

// /*-----------------------------HELPER FUNCTIONS------------------------------*/

aapiWrapper.prototype.calcXFades = function(){
  
    var valueCount = 4096;

    //fade in
    audio.crossfades.xIn = new Float32Array(valueCount);
    for (var i = 0; i < valueCount; i++) { 
      audio.crossfades.xIn[i] = 1 - Math.pow(((valueCount-i)/valueCount),2);
    }

    //reverse for fade out
    audio.crossfades.xOut = new Float32Array(valueCount);
    for (var i = 0; i < valueCount; i++) { 
      audio.crossfades.xOut[i] = 1 - Math.pow(((i+1)/valueCount),2);
    }

}


/*-------------------------------------other constructors------------------------------*/

function appiSample(fileName){

  this.buffer;
  this.bufSrc;
  this.gainNode;
  this.fileName = fileName;
  this.loopTime;
  this.loopThread;
  this.isPlaying = false;
  this.amp;
  
}

