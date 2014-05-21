var audio;
var files = ['sounds/lowWind_5.wav','sounds/footstep.mp3','sounds/howl.wav'];


$('document').ready(function(){

  $('#controls').hide();

  $.getScript("aapiWrapper.js", function(data, textStatus, jqxhr){

    console.log("appiWrapper.js :: " + textStatus);

    audio = new aapiWrapper();

    if(audio.init()){

        beginAudio();

    }else{

        alert('Web Audio API not supported in this browser.');
    }

  });


});



function beginAudio(){


  if(audio.loadSounds(files)){ 
    $('#controls').show();
  };


  $('#loopingSound').on("click", function(e){

    loopEvent();

  });

  $('#oneSound').on("click", function(e){

    s1Event();

  });


  $('#twoSounds').on("click", function(e){

    console.log("click");
    s2Event();

  });




  var loopEvent = function(){

    var checked = $('#loopingSound').prop('checked');

    if(checked){
      audio.startLooping(0, 0.25, 3);    
    }else{
      audio.stopLooping(0, 3);
    }

  };

  var s1Event = function(){

    console.log("1s");
    audio.play(audio.sampleObjs[1],0.01,0.01);

  }

  var s2Event = function(){

    console.log("2s");
    audio.play(audio.sampleObjs[1],0.01,0.01);
    audio.play(audio.sampleObjs[2],0.01,0.01,3);

  }


};














