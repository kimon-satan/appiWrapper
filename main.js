
//NEXT

//intial fade in and end fade out for loops
//bg sample settings
//bg panning ???

//reintegrate into game example

var audio;
var files = ['sounds/lowWind_5.wav'];
var isPressed= false;


$('document').ready(function(){

  $('#playSounds').hide();

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
    $('#playSounds').show();
  };


  $('#playSounds').on("click", function(e){

    buttonEvent();
    e.preventDefault();

  });

  $('#playSounds').on("touchstart", function(e){

    buttonEvent();
    e.preventDefault();

  });

  var buttonEvent = function(){

    if(!isPressed){
      audio.startLooping(0);    
    }else{
      audio.stopLooping(0);
    }
    isPressed = !isPressed;

  };


};













