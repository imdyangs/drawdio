'use strict';

var fs = require('fs');
var PNG = require('png-js');
var jsfeat = require('jsfeat');
var jpeg = require('jpeg-js');

/*
  Creates a vector representing important features of the image given an image.
*/
const processImage = function(path, callback, isJpeg) {
  const blurRadius = 2;
  const lowThreshhold = 20;
  const highThreshold = 50;

  var width;
  var height;

  

  // roughEdgeFrequency: percentage of pixels that contain a rough edge (0-1)
  // averageRed: average pixel red value from (0-1)
  // averageGreen: average pixel green value from (0-1)
  // averageBlue: average pixel blue value from (0-1)
  // hueDist: array containing hue distributions at intervals of 1/6 spectrums
  // cornerDensity: the number of corners detected in the image
  // numClusters: the average distance in pixels between corners O(n^3)?
  var imageData = {};

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

  const getHue = function (r, g, b) {
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
    return result;
  }

  const getHueIndex = function (r, g, b) {
    return Math.round(getHue(r, g, b));
  }

  const getFullHue = function (r, g, b) {
    return Math.floor(getHue(r, g, b) * 60);
  }

  // sets averageRed, averageGreen, averageBlue, and hueDist
  const colorProfile = function (pixels) {
    var sumRed = 0, sumGreen = 0, sumBlue = 0;
    var numPixels = pixels.length / 4;
    var hueDist = [0, 0, 0, 0, 0, 0];

    var fullHueDist = [];
    for (var i = 0; i < 360; ++i) {
      fullHueDist.push(0);
    }

    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i] / 255.0, g = pixels[i + 1] / 255.0, b = pixels[i + 2] / 255.0;
      sumRed += r;
      sumGreen += g;
      sumBlue += b;
      hueDist[getHueIndex(r, g, b)] += 1.0;
      ++fullHueDist[getFullHue(r, g, b)];
    }

    hueDist = hueDist.map(function (x) { return x / numPixels; });

    imageData['averageRed'] = sumRed / numPixels;
    imageData['averageGreen'] = sumGreen / numPixels;
    imageData['averageBlue'] = sumBlue / numPixels;
    imageData['hueDist'] = hueDist;
    imageData['hueMode'] = fullHueDist.indexOf(Math.max.apply(null, fullHueDist));
    nextProcess(pixels);
  }

  const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const processes = [canny, colorProfile, corners];
  var currentProcess = 0;

  const nextProcess = function(pixels) {
    if (currentProcess >= processes.length) {
      const outVector = [
        // the two important dimensions
        imageData['hueMode'],
        imageData['numClusters'],
        // the rest
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
        imageData['cornerDensity']
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

  if (isJpeg) {
    var jpegData = fs.readFileSync(path);
    var rawImageData = jpeg.decode(jpegData);
    width = rawImageData.width;
    height = rawImageData.height;
    nextProcess(rawImageData.data);
  } else {
    const image = new PNG.load(path);
    width = image.width;
    height = image.height;
    image.decode(function(pixels) {
      nextProcess(pixels);
    });
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