/* This file controls front-end animation and page transition */


// Aww board API, board initialization
 var aww = new AwwBoard('#aww-wrapper', {
    apiKey: '391e33ce-16fb-41e9-aced-ad424988deba'
});

// Get dataURL of current canvas
function saveBoard(){
  var img = aww.getImage();

  // testing purpose: show current state of the canvas
  //document.getElementById('preview').innerHTML = '<img src="'+img+'"/>';
  return img;
}

// Change field of form to dataURL to prepare form submission
function getDataURL(){
    document.getElementById('imgDataURL').value = saveBoard();
    console.log(document.getElementById('imgDataURL').value);
    return true;
}

function showCanvas(){
    
    /* hide overhead banner */
    toggleBanner('hide');
    $('#disc').addClass('hidden');
    
    /* add drawPad */
    $('#aww-wrapper').removeClass('hidden');
    $('#helptext').removeClass('hidden');
}

function toggleBanner(state){
    if (state === 'hide') $('#introbar').addClass('hidden');
}


