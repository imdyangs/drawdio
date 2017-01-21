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
  // averageRed: average pixel red value from (0-1)
  // averageGreen: average pixel green value from (0-1)
  // averageBlue: average pixel blue value from (0-1)
  // hueDist: array containing hue distributions at intervals of 1/6 spectrums
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
    nextProcess(pixels);
  };

  const getHueIndex = function (r, g, b) {
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var result = 0;
    if ((r > g) && (r > b)) {
      result = (g - b) / (max - min);
    }
    else if ((g > r) && (g > b)) {
      result = 2.0 + (b - r) / (max - min);
    }
    else if ((b > r) && (b > g)) {
      result = 4.0 + (r - g) / (max - min);
    }
    if (result < 0) {
      result += 6.0;
    }
    return Math.round(result);
  }

  // sets averageRed, averageGreen, averageBlue, and hueDist
  const colorProfile = function (pixels) {
    var sumRed = 0, sumGreen = 0, sumBlue = 0;
    var numPixels = pixels.length / 4;
    var hueDist = [0, 0, 0, 0, 0, 0];

    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i] / 255.0, g = pixels[i + 1] / 255.0, b = pixels[i + 2] / 255.0;
      sumRed += r;
      sumGreen += g;
      sumBlue += b;
      hueDist[getHueIndex(r, g, b)] += 1.0;
    }

    hueDist = hueDist.map(function (x) { return x / numPixels; });

    imageData['averageRed'] = sumRed / numPixels;
    imageData['averageGreen'] = sumGreen / numPixels;
    imageData['averageBlue'] = sumBlue / numPixels;
    imageData['hueDist'] = hueDist;
    nextProcess(pixels);
  }

  const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const processes = [canny, colorProfile];
  var currentProcess = 0;

  const nextProcess = function(pixels) {
    if (currentProcess >= processes.length) {
      const outVector = [
        imageData['roughEdgeFrequency'],
        imageData['averageRed'],
        imageData['averageGreen'],
        imageData['averageBlue'],
        imageData['hueDist'][0],
        imageData['hueDist'][1],
        imageData['hueDist'][2],
        imageData['hueDist'][3],
        imageData['hueDist'][4],
        imageData['hueDist'][5],
      ];
      var weighted = [];
      for (var i = 0; i < outVector.length; ++i) {
        weighted.push(outVector[i] * weights[i]);
      }
      callback(weighted);
      return;
    }
    console.log('running process ' + currentProcess)
    processes[currentProcess++](pixels);
    
  }

  

};

module.exports = {
  processImage: processImage
};