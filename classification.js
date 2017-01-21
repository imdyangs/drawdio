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
  // cornerDensity: the number of corners detected in the image
  // numClusters: the average distance in pixels between corners O(n^3)?
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

  // sets numCorners and cornerSpread
  const corners = function(pixels) {
    // set up the paramters for fast corners
    const threshold = 20;
    jsfeat.fast_corners.set_threshold(threshold);
    var corners = [];
    var border = 3;

    // set up the keypoint array
    for(var i = 0; i < width * height; ++i) {
      corners[i] = new jsfeat.keypoint_t(0, 0, 0, 0);
    }

    var img_u8 = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
    var pixelArray = new Int32Array(pixels.buffer);
    jsfeat.imgproc.grayscale(pixelArray, width, height, img_u8);
    var numCorners = jsfeat.fast_corners.detect(img_u8, corners, border);

    var cornerDensity = numCorners / (width * height);
    
    imageData['cornerDensity'] = cornerDensity;

    var scoredCorners = [];
    var i = 0;
    while (corners[i].score > 0 && i < corners.length) {
      scoredCorners.push({x: corners[i].x, y: corners[i].y,});
      ++i;
    }

    const clusteringFactor = 1.05;

    var clusters = [];

    while (scoredCorners.length > 0) {
      var point = scoredCorners.shift();
      
      var minDist = Math.min.apply(null, scoredCorners.map((p) => {
        return Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2);
      }));

      var thresholdDistance = minDist * clusteringFactor;

      var buildCluster = [point];
      while (true) {
        var addToCluster = [];
        buildCluster.forEach((p1) => {
          scoredCorners.forEach((p2) => {
            var dist = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
            if (dist <= thresholdDistance) {
              addToCluster.push(p2);
            }
          });
        });

        if (addToCluster.length <= 0) {
          clusters.push(buildCluster);
          break;
        }

        addToCluster.forEach((p) => {
          buildCluster.push(p);
          scoredCorners.splice(scoredCorners.indexOf(p), 1);
        });
      }
    }

    imageData['numClusters'] = clusters.length;

    nextProcess(pixels);
  }

  // sets averageRed, averageGreen, averageBlue, and hueDist
  const colorProfile = function (pixels) {
    imageData['averageRed'] = 0;
    imageData['averageGreen'] = 0;
    imageData['averageBlue'] = 0;
    imageData['hueDist'] = [0,0,0,0,0,0];
    nextProcess(pixels);
  }

  const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const processes = [canny, colorProfile, corners];
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
        imageData['cornerDensity'],
        imageData['numClusters']
      ];
      var weighted = [];
      for (var i = 0; i < outVector.length; ++i) {
        weighted.push(outVector[i] * weights[i]);
      }
      callback(weighted);
      return;
    }
    processes[currentProcess++](pixels);
  }
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  processImage: processImage
};