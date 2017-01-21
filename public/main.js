/* This file controls front-end animation and page transition */


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


$( document ).ready(function() {
  //hide drawPad and textbarAlbums
  $('#aww-wrapper').hide();
  $('#helptext').hide();

  //hide back button

});

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

    /* add drawPad */
    $('#aww-wrapper').show();
    $('#helptext').show();
}

//show song details, go button
function showSongDetail(){
    //hide textbarAlbums
    TweenMax.to(document.getElementById('helptext'), 1.5, { ease: Power2.easeInOut, x: 2000});

    //show vinyl
    TweenMax.to('.discAnimate', 0, {scale: 1});
    TweenMax.to('.discAnimate', 2.1, { ease: Power2.easeInOut, rotation: 20, x: -120 , scale: 1, delay: 0.4});
    TweenMax.to('.discAnimate', 1.6, { ease: Power2.easeInOut, rotation: 60, x: -400, delay: 2.2 });
    TweenMax.to('.discAnimate', 2.1, { ease: Power2.easeInOut, rotation: 40, x: -50, scale: 1, delay: 3.3});
    TweenMax.to('.discAnimate', 1.6, { ease: Power2.easeInOut, rotation: 60, x: -308, delay: 5 });

    //hide pad
    TweenMax.to(document.getElementById('aww-wrapper'), 2.2, { ease: Power2.easeInOut, x: -400, delay: 7});
    TweenMax.to(document.getElementById('cover'), 2.2, { ease: Power2.easeInOut, x: -3300, delay: 7});
}


function toggleBanner(state){
    if (state === 'hide') $('#introbar').addClass('hidden');
}

function lookForSong(){

}


function playSong(){

}
