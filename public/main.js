/* This file controls front-end animation and page transition */

$( document ).ready(function() {
  //hide drawPad and textbarAlbums
  $('#flash').hide();
  $('#aww-wrapper').hide();
  $('#helptext').hide();
  //hide back button
  console.log("hiding!");
  $('#songDetail').hide();
  $('#back-icon').fadeOut();
    
});

// Spotify api call
var aRequest = function(){
  $.ajax({
    url: ''
  })
}

var curPage = 'home';
var ready = false;      /* ready for streaming */

var canReveal = false;

/******************* Embedding Aww Board *******************/


var imageURL;

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
    
    /* show backButton */
    $('#back-icon').fadeIn();
    
    /* keep track of current page */
    curPage = 'canvas';
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
    canReveal = true;
    
    
    curPage = 'song';
}



function reveal(res) {
  document.getElementById('disc').src = res.images[0].url;
  document.getElementById('song-artist').innerHTML = res.artists[0].name;
  document.getElementById('song-title').innerHTML = res.tracks.items[0].name;

  TweenMax.to('.discAnimate', 2.3, { ease: Power1.easeOut, rotation: 10, x: -70, scale: 1, delay: 5.2});


    //take the current spotify URI, extract the image link, then overlay image ontop of disc

    //hide pad
    TweenMax.to(document.getElementById('aww-wrapper'), 2, { ease: Power2.easeInOut, opacity: 0});
    TweenMax.to(document.getElementById('cover'), 3, { ease: Power2.easeInOut, x: -3300, delay: 9.3});

    //hide return
    TweenMax.to('.btnBox', 3, { ease: Power2.easeInOut, x: -800});
    console.log(imageURL);

    //bring out player
    TweenMax.from(document.getElementById('songDetail'), 2.2, { ease: Power2.easeOut, x: -800, delay: 9.8});
}

/*
function toggleBanner(state){
    if (state === 'hide') $('#introbar').addClass('hidden');
}
*/

function lookForSong(){
    //$('#aww-wrapper').hide();
    //$('#cover').hide();
    //$('#helptext').hide();
    $('#songDetail').show();
    $('#disc').addClass('clip-circle');

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
                tryReveal();
                function tryReveal() {
                  if (canReveal) {
                    reveal(res);
                  } else {
                    setTimeout(tryReveal, 50);
                  }
                }
                songReady(res);
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

var playing = false;
var currentSong = 0;

var cachedResults;

// handle API result
function songReady(result){
  cachedResults = result;
  var sampleLink = result.tracks.items[0].preview_url;
  document.getElementById('audio_player').src = sampleLink;
}

// Action button controlling music streaming
function playPauseSong(){
  var audio = document.getElementById('audio_player');
  if (!playing) {
    audio.play();
    playing = true;
  } else {
    audio.pause();
    playing = false;
  }
}

function nextSong(){
  var audio = document.getElementById('audio_player');
  audio.pause();
  currentSong++;
  if (currentSong > cashedResults.tracks.items.length) {
    currentSong = currentSong - 1;
    return;
  }
  document.getElementById('audio_player').src = cachedResults.tracks.items[currentSong].preview_url;
  audio.play();
}

function prevSong(){
  var audio = document.getElementById('audio_player');
  audio.pause();
  currentSong--;
  if (currentSong < 0) {
    currentSong = 0;
    return;
  }
  document.getElementById('audio_player').src = cachedResults.tracks.items[currentSong].preview_url;
  audio.play();
}

/****************** Transition Page ************************/

/* Handle hide/show element of page transition */
function backToCanvas(){
    
    console.log('you invoked backToCanvas!');
    
    /* hide song detail element */
    $('#songDetail').hide();
    $('#disc').attr('src', 'image/disc.png').removeClass('clip-circle');
    
    /* show canvas */
    $('#helptext').show();
    $('#cover').show();
    $('#aww-wrapper').show();
    
    /* update current page location */
    curPage = 'canvas';
}

function backToHome(){
    
    console.log('you invoked backToHome!');
    
    /* hide canvas elements */
    $('#helptext').hide();
    $('#aww-wrapper').hide();
    
    /* show homepage elements */
    $('#introbar').show();
    
    /* missing line: vinyl row over */
    $('#disc').show();
    
    /* hide back icon */
    $('#back-icon').fadeOut();
    
    /* update current page location */
    curPage = 'home';
}

/* Handle page transition, whenever back button is clicked */
function goBack(){
    if (curPage === 'song') backToCanvas();
    else if (curPage === 'canvas') backToHome();
}

/* Change button attr */
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

$('#back-icon').hover(function(){
    $('#back-icon').attr('src', './image/buttons/back-hov.png');
}, function(){
    $('#back-icon').attr('src', './image/buttons/back.png');
});


