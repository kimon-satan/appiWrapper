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

aapiWrapper.prototype.loadSounds = function(files, callBack){

	for (var a in files) {
		(function(parent) {

			var i = parseInt(a);
      
      //get the file name
      var name = files[i].split("/");
      name = name[name.length-1].split(".");
      name = name[0];

			parent.sampleObjs[name] = new appiSample(name);

			var req = new XMLHttpRequest();
			req.open('GET', files[i], true);
			req.responseType = 'arraybuffer';

      req.addEventListener('load', function(event){

          parent.sampleObjs[name].buffer = parent.context.createBuffer(req.response, false);
          parent.sampleObjs[name].bufSrc = {};
          if(i == files.length-1)callBack(true);

      }, true);

			req.send();

		})(this); 
	}

  

}

aapiWrapper.prototype.playOnce = function(n, options, callBack){

  var sample = this.sampleObjs[n];

  //defaults
  if(typeof options.amp !== 'undefined')sample.amp = options.amp;
  if(typeof options.offset === 'undefined')options.offset = 0;
  if(typeof options.fadeIn === 'undefined')options.fadeIn = 0.01;
  if(typeof options.fadeOut === 'undefined')options.fadeIn = 0.01;


  this.play(sample, options.fadeIn, options.fadeOut, options.offset);

  if(typeof callBack === 'function'){

     sample.cbTime = this.context.currentTime + options.offset + sample.buffer.duration;

     sample.cbThread = window.setInterval(function(){

     // console.log(this.context.currentTime);

      if(this.context.currentTime > sample.cbTime){

        window.clearInterval(sample.cbThread);
        callBack();

      }

    }.bind(this),50);


  }

}

aapiWrapper.prototype.playSequence = function(sampleNames){


}

aapiWrapper.prototype.startLooping = function(n, amp, fadeIn){ //n is a key with the fileName

  var sample = this.sampleObjs[n];
  sample.amp = amp;
  sample.crossfades = this.calcXFades(1);

  if(!sample.isLooping){

    sample.isLooping = true;

    this.play(sample, fadeIn, -1);
    sample.loopTime = this.context.currentTime + sample.buffer.duration - 1;

    sample.loopThread = window.setInterval(function(){

      if(this.context.currentTime > sample.loopTime){

          this.play(sample, -1, -1);
          sample.loopTime = this.context.currentTime + sample.buffer.duration - 1; //1 sec crossfades

      }

    }.bind(this),50);

  }

}

aapiWrapper.prototype.stopLooping = function(n, fadeOut, offset){

	var sample = this.sampleObjs[n];
  var ct = this.context.currentTime;

	if(sample.isLooping){

    if(typeof offset === 'undefined')offset = 0;

    sample.gainNode.gain.cancelScheduledValues(ct + offset); //clear the cross fade
    sample.gainNode.gain.linearRampToValueAtTime(sample.gainNode.gain.value, ct + offset);
    sample.gainNode.gain.linearRampToValueAtTime(0, ct + offset + fadeOut);

 
    sample.stopLoopThread = window.setInterval(function(){

      if(this.context.currentTime >= ct + offset + fadeOut + 0.5){
          window.clearInterval(sample.loopThread);
          window.clearInterval(sample.stopLoopThread);
          sample.bufSrc.stop(0);
          sample.isLooping = false;
          sample.fadeOut = false;
          sample.fadeTime = 0;
      }

    }.bind(this),50);


  }

}




aapiWrapper.prototype.play = function(sample, fadeIn, fadeOut, offset){

    var ct = this.context.currentTime;
    if(typeof offset !== 'undefined')ct += offset;

    //setup data
    sample.bufSrc = this.context.createBufferSource();
    sample.bufSrc.buffer = sample.buffer;
    sample.gainNode = this.context.createGain();
    sample.crossFadeNode = this.context.createGain();

    //patch nodes

    sample.bufSrc .connect(sample.crossFadeNode);
    sample.crossFadeNode.connect(sample.gainNode);
    sample.gainNode.connect(this.context.destination);

    //handle fades
    if(fadeIn > 0){
      sample.gainNode.gain.linearRampToValueAtTime(0, ct);
      sample.gainNode.gain.linearRampToValueAtTime(sample.amp, ct + fadeIn);
    }else{
      sample.crossFadeNode.gain.setValueCurveAtTime(sample.crossfades.xIn, ct, 1);
    }

    //fade out
    if(fadeOut > 0){
      sample.gainNode.gain.linearRampToValueAtTime(sample.amp, ct + sample.buffer.duration - fadeOut);
      sample.gainNode.gain.linearRampToValueAtTime(0, ct + sample.buffer.duration);
    }else{
      sample.crossFadeNode.gain.setValueCurveAtTime(sample.crossfades.xOut, ct + sample.buffer.duration - 1, 1);
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
  this.crossFadeNode;
  this.gainNode;
  this.fileName = fileName;
  this.loopTime;
  this.loopThread;
  this.cbTime;
  this.cbThread;
  this.stopLoopThread;
  this.fadeOut = false;
  this.fadeTime = 0;
  this.isLooping = false;
  this.amp = 1;
  this.crossfades = {};
  
}

