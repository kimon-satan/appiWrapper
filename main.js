var audio;
var files = ['sounds/footstep.mp3','sounds/lowWind_5.wav','sounds/howl.wav'];


$('document').ready(function(){

  $('#controls').hide();
    $('#splashStart').hide();

  $.getScript("aapiWrapper.js", function(data, textStatus, jqxhr){


    console.log("appiWrapper.js :: " + textStatus);

    audio = new aapiWrapper();

    if(audio.init()){

        $('#splashStart').show();
        console.log("it works");

    }else{

        alert('Web Audio API not supported in this browser.');
    }

  });


});


$('#begin').on("click", function(e){

    beginAudio();

});

var testF = function(success){

  $('#splashStart').hide();
  $('#controls').show();

}

function beginAudio(){


  if(audio.loadSounds(files, testF));
   


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
      audio.startLooping('lowWind_5', 0.25, 3);    
    }else{
      audio.stopLooping('lowWind_5', 3);
    }

  };

  var s1Event = function(){

    console.log("1s");
    audio.playOnce('footstep',0.5);

  }

  var s2Event = function(){

    console.log("2s");
    audio.playOnce('footstep',0.9,0);
    audio.playOnce('howl',0.25,3);

  }


};














