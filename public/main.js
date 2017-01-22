/* This file controls front-end animation and page transition */

$( document ).ready(function() {
  //hide drawPad and textbarAlbums
  $('#flash').hide();
  $('#aww-wrapper').hide();
  $('#helptext').hide();
  //hide back button
  console.log("hiding!");
  $('#songDetail').hide();
});

// Spotify api call
var aRequest = function(){
  $.ajax({
    url: ''
  })
}

/******************* Embedding Aww Board *******************/

// Aww board API, board initialization
 var aww = new AwwBoard('#aww-wrapper', {
    menuOrder: ['colors', 'sizes', 'tools'],
    apiKey: '391e33ce-16fb-41e9-aced-ad424988deba'
});

// Get dataURL of current canvas
function saveBoard(){
  var img = aww.getImage();
  return img;
}

// Change field of form to dataURL to prepare form submission
function getDataURL(){
    document.getElementById('imgDataURL').value = saveBoard();
    console.log(document.getElementById('imgDataURL').value);
    return true;
}

//show canvas, draw button
function showCanvas(){

    function downsize(){
      TweenMax.to('.discAnimate', 1.5, {scale: 0.3})
    }

    //hide textbar
    TweenMax.to('#introbar', 1.5, { ease: Power2.easeInOut, x: -1000});

    //hide vinyl
    TweenMax.to('.discAnimate', 1.5, { ease: Power2.easeInOut, rotation: 60, x: -308, onComplete:downsize});

    //show textbar
    TweenMax.from(document.getElementById('helptext'), 1.5, { ease: Power2.easeInOut, x: 750});


    //fade in pad
    TweenMax.from(document.getElementById('aww-wrapper'), 1, { ease: SlowMo.ease.config(0.1, 0.1, false), opacity:0, delay: 0.7});

    //fade in returnButton
    TweenMax.to('.btnBox', 1.5, { ease: Power2.easeInOut, x: 450, delay: 1})

    /* add drawPad */
    $('#aww-wrapper').show();
    $('#helptext').show();
}

//show song details, go button
//future while loop


function showSongDetail(){
    var currentSpotifyURI = "spotify:artist:44gRHbEm4Uqa0ykW0rDTNk";
    //hide textbarAlbums
    TweenMax.to(document.getElementById('helptext'), 1.5, { ease: Power2.easeInOut, x: 2000});

    //show vinyl
    TweenMax.to('.discAnimate', 0, {scale: 1});
    TweenMax.to('.discAnimate', 2.4, { ease: Power2.easeInOut, rotation: 20, x: -170 , scale: 1, delay: 0.8});
    TweenMax.to('.discAnimate', 1.6, { ease: Power2.easeInOut, rotation: 60, x: -380, delay: 2.9 });
    TweenMax.to('.discAnimate', 2.3, { ease: Power1.easeOut, rotation: 10, x: -70, scale: 1, delay: 5.2});

  // while(currentSpotifyId === 0){
  //  TweenMax.to('.discAnimate', 1.2, { ease: Power2.easeInOut, rotation: 60, x: -340, delay: 7.4 });
  //  TweenMax.to('.discAnimate', 1.6, { ease: Power2.easeInOut, rotation: 0, x: 20, delay: 9 });
  //};

    //take the current spotify URI, extract the image link, then overlay image ontop of disc

    //hide pad
    TweenMax.to(document.getElementById('aww-wrapper'), 2, { ease: Power2.easeInOut, opacity: 0});
    TweenMax.to(document.getElementById('cover'), 3, { ease: Power2.easeInOut, x: -3300, delay: 9.3});

    //hide return
    TweenMax.to('.btnBox', 3, { ease: Power2.easeInOut, x: -800});

    //bring out player
    TweenMax.from(document.getElementById('songDetail'), 2.2, { ease: Power2.easeOut, x: -800, delay: 9.8});
}






function toggleBanner(state){
    if (state === 'hide') $('#introbar').addClass('hidden');
}

function lookForSong(){
    //$('#aww-wrapper').hide();
    //$('#cover').hide();
    //$('#helptext').hide();
    $('#songDetail').show();
    $('#disc').attr('src', 'image/art_vivalavida.jpg').addClass('clip-circle');

    // roll vinyl over
    //TweenMax.to('.discAnimate', 1.5, { ease: Power2.easeInOut, rotation: 270, x: 100});
}

function saveBoard(){
    var img = aww.getImage();
    console.log(img);
    $.ajax({
        url: 'http://127.0.0.1:3000/handle',
        type: 'POST',
        timeout: 0,
        data: JSON.stringify({ img: img }),
        contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (res) {
            console.log(res);
            $.ajax({
              url: 'https://api.spotify.com/v1/albums/' + res,
              type: 'GET',
              timeout: 0,
              success: function(res) {
                var result = JSON.parse(res);
                console.log(result.images[0].url)
              },
              failure: function(jqXHR, textStatus, error) {
                if (textStatus === 'timeout') {
                    console.log('request timed out');
                } else {
                    console.log(error);
                }
              }
            });
        },
        error: function(jqXHR, textStatus, error) {
            if (textStatus === 'timeout') {
                console.log('request timed out');
            } else {
                console.log(error);
            }
        }
    });
}

// play song streamed from Spotify
function playSong(){

}

$('#play').hover(function(){
    $('#play').attr('src', './image/buttons/play-hov.png');
}, function(){
    $('#play').attr('src', './image/buttons/play.png');
});

$('#next').hover(function(){
    $('#next').attr('src', './image/buttons/next-hov.png');
}, function(){
    $('#next').attr('src', './image/buttons/next.png');
});

$('#prev').hover(function(){
    $('#prev').attr('src', './image/buttons/prev-hov.png');
}, function(){
    $('#prev').attr('src', './image/buttons/prev.png');
});
