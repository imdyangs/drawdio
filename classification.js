'use strict';

var fs = require('fs');
var PNG = require('png-js');
var jsfeat = require('jsfeat');


/*
  Creates a vector representing important features of the image given an image.
*/
const processImage = function(path, callback) {
  const blurRadius = 2;
  const lowThreshhold = 20;
  const highThreshold = 50;

  console.log('attempting to load image at path: ' + path);
  const image = new PNG.load(path);
  const width = image.width;
  const height = image.height;


  // roughEdgeFrequency: percentage of pixels that contain a rough edge (0-1)
  var imageData = {};

  image.decode(function(pixels) {
    nextProcess(pixels);
  });

  // sets imageData['roughEdgeFrequency']
  const canny = function (pixels) {
    var img_u8 = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
    var pixelArray = new Int32Array(pixels.buffer);
    jsfeat.imgproc.grayscale(pixelArray, width, height, img_u8);
    jsfeat.imgproc.gaussian_blur(img_u8, img_u8, (blurRadius+1) << 1, 0);
    jsfeat.imgproc.canny(img_u8, img_u8, lowThreshhold|0, highThreshold|0);

    // determine rough edge frequency
    var edgePixels = 0;
    var size = img_u8.cols * img_u8.rows;
    for (var i = 0; i < size; ++i) {
      var pixelData = img_u8.data[i];
      if (pixelData === 255) {
        ++edgePixels;
      }
    }
    var roughEdgeFrequency = edgePixels / size;
    imageData['roughEdgeFrequency'] = roughEdgeFrequency;
  };

  const processes = [canny];
  var currentProcess = 0;
  const nextProcess = function(pixels) {
    if (currentProcess >= processes.length) {
      const outVector = [
        imageData['roughEdgeFrequency']
      ];
      callback(outVector);
    }
    processes[currentProcess](pixels);
    ++currentProcess;
  }

};

module.exports = {
  processImage: processImage
};