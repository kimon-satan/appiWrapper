/*-------------------------constructor---------------------------*/

function aapiWrapper(){

    this.context = 0;
    this.initialised = true;
    this.sampleObjs = {};

}

/*---------------------------methods-------------------------------*/

aapiWrapper.prototype.init = function(){

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio.context = new window.AudioContext();
    this.initialised = false;


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

aapiWrapper.prototype.startLooping = function(n, amp, fadeIn){ //n might ultimately be a key

  var sample = this.sampleObjs[n];
  sample.amp = amp;
  sample.crossfades = this.calcXFades(amp);

  if(!sample.isPlaying){

    sample.isPlaying = true;

    this.loopPlay(sample, fadeIn);

    sample.loopThread = window.setInterval(function(){

      //console.log(audio.context.currentTime + " :: "  + audio.sampleObjs[n].loopTime);
      if(this.context.currentTime > sample.loopTime){
        this.loopPlay(sample, -1);
      }

    }.bind(this),50);

  }

}

aapiWrapper.prototype.stopLooping = function(n, fadeOut){

	var sample = this.sampleObjs[n];

	if(sample.isPlaying){
    	sample.bufSrc.stop(0);
    	sample.isPlaying = false;
    	window.clearInterval(sample.loopThread);
  	}
}


aapiWrapper.prototype.loopPlay = function(sample, fadeIn){

    var ct = this.context.currentTime;

    //setup data
    sample.bufSrc = this.context.createBufferSource();
    sample.bufSrc.buffer = sample.buffer;
    sample.gainNode = this.context.createGain();

    //patch nodes
    sample.bufSrc .connect(sample.gainNode);
    sample.gainNode.connect(this.context.destination);

    //calc next loop point
    sample.loopTime = ct + sample.buffer.duration - 1;

    //handle fades
    if(fadeIn > 0){
      sample.gainNode.gain.linearRampToValueAtTime(0, ct);
      sample.gainNode.gain.linearRampToValueAtTime(sample.amp, ct + fadeIn);
    }else{
      sample.gainNode.gain.setValueCurveAtTime(sample.crossfades.xIn, ct, 1);
    }

    //fade out
    sample.gainNode.gain.setValueCurveAtTime(sample.crossfades.xOut, ct + sample.buffer.duration - 1, 1);

    //sched start & stops
    sample.bufSrc.start(this.context.currentTime);
    sample.bufSrc.stop(sample.loopTime + 1);

}

// /*-----------------------------HELPER FUNCTIONS------------------------------*/

aapiWrapper.prototype.calcXFades = function(amp){
  
    var valueCount = 4096;
    var crossfades = {};

    //fade in
    crossfades.xIn = new Float32Array(valueCount);
    for (var i = 0; i < valueCount; i++) { 
      crossfades.xIn[i] = (1 - Math.pow(((valueCount-i)/valueCount),2)) * amp;
    }

    //reverse for fade out
    crossfades.xOut = new Float32Array(valueCount);
    for (var i = 0; i < valueCount; i++) { 
      crossfades.xOut[i] = (1 - Math.pow(((i+1)/valueCount),2) ) * amp;
    }

    return crossfades;

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
  this.crossfades = {};
  
}

