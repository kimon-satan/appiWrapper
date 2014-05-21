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
      audio.startLooping(0, 0.5, 3);    
    }else{
      audio.stopLooping(0);
    }
    isPressed = !isPressed;

  };


};














