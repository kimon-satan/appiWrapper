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

aapiWrapper.prototype.playOnce = function(n, amp, offset, fadeIn, fadeOut){

  var sample = this.sampleObjs[n];

  //defaults
  if(typeof amp !== 'undefined')sample.amp = amp;
  if(typeof offset === 'undefined')offset = 0;
  if(typeof fadeIn === 'undefined')fadeIn = 0.01;
  if(typeof fadeOut === 'undefined')fadeIn = 0.01;

  this.play(sample, fadeIn, fadeOut, offset);

}

aapiWrapper.prototype.startLooping = function(n, amp, fadeIn){ //n might ultimately be a key

  var sample = this.sampleObjs[n];
  sample.amp = amp;
  sample.crossfades = this.calcXFades(amp);

  if(!sample.isLooping){

    sample.isLooping = true;

    this.play(sample, fadeIn, -1);
    sample.loopTime = this.context.currentTime + sample.buffer.duration - 1;

    sample.loopThread = window.setInterval(function(){

      //console.log(this.context.currentTime + " :: "  + sample.loopTime);

      if(this.context.currentTime > sample.loopTime){

        if(sample.fadeOut){
          this.play(sample, -1, -1);
          sample.gainNode.gain.value = sample.amp; //because loopStop takes the current gain.value
          this.loopStop(sample, sample.fadeTime, 1);
        }else{

          //calc next loop point
          this.play(sample, -1, -1);
          sample.loopTime = this.context.currentTime + sample.buffer.duration - 1; //1 sec crossfades
        }
      }

    }.bind(this),50);

  }

}

aapiWrapper.prototype.stopLooping = function(n, fadeOut){

	var sample = this.sampleObjs[n];
  var ct = this.context.currentTime;

	if(sample.isLooping){
      var t_remain = sample.loopTime - ct;

      if(t_remain/(fadeOut-1) > 0.5){
        
        //do the fade out now
        this.loopStop(sample, t_remain, 0);
      
      }else{

        //this will schedule the fadeout on the next interval
        sample.fadeOut = true;
        sample.fadeTime = fadeOut - t_remain - 1;

      }
  }

}

aapiWrapper.prototype.loopStop = function(sample, fadeOut, offset){

  var ct = this.context.currentTime;

  //console.log(sample.gainNode.gain.value);

  sample.gainNode.gain.cancelScheduledValues(ct + offset); //clear the cross fade
  sample.gainNode.gain.linearRampToValueAtTime(sample.gainNode.gain.value, ct + offset);
  sample.gainNode.gain.linearRampToValueAtTime(0, ct + offset + fadeOut);

  sample.bufSrc.stop(ct + fadeOut + offset);
  sample.isLooping = false;
  sample.fadeOut = false;
  sample.fadeTime = 0;

  window.clearInterval(sample.loopThread);

}


aapiWrapper.prototype.play = function(sample, fadeIn, fadeOut, offset){

    var ct = this.context.currentTime;
    if(typeof offset !== 'undefined')ct += offset;

    //setup data
    sample.bufSrc = this.context.createBufferSource();
    sample.bufSrc.buffer = sample.buffer;
    sample.gainNode = this.context.createGain();

    //patch nodes
    sample.bufSrc .connect(sample.gainNode);
    sample.gainNode.connect(this.context.destination);

    //handle fades
    if(fadeIn > 0){
      sample.gainNode.gain.linearRampToValueAtTime(0, ct);
      sample.gainNode.gain.linearRampToValueAtTime(sample.amp, ct + fadeIn);
    }else{
      sample.gainNode.gain.setValueCurveAtTime(sample.crossfades.xIn, ct, 1);
    }

    //fade out
    if(fadeOut > 0){
      sample.gainNode.gain.linearRampToValueAtTime(sample.amp, ct + sample.buffer.duration - fadeOut);
      sample.gainNode.gain.linearRampToValueAtTime(0, ct + sample.buffer.duration);
    }else{
      sample.gainNode.gain.setValueCurveAtTime(sample.crossfades.xOut, ct + sample.buffer.duration - 1, 1);
    }

    //sched start & stops
    sample.bufSrc.start(ct);
    sample.bufSrc.stop(ct + sample.buffer.duration);

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
  this.fadeOut = false;
  this.fadeTime = 0;
  this.isLooping = false;
  this.amp = 1;
  this.crossfades = {};
  
}

