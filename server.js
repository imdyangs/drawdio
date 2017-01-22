'use strict';

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var http = require('http');
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
var cors = require('cors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var classifier = require('./classification.js');

const PORT = 3000;

var app = express();

app.use(cors());
app.options('*', cors());


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.raw());
app.use(bodyParser.json({extended: true}))

app.set('port', PORT);

var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('starting server on port ' + port);
});

app.post('/handle', function(req, res) {
  var dataURI = req.body.img;
  var base64Data = dataURI.replace(/^data:image\/png;base64,/, "");
  var timeStamp = +new Date();
  fs.writeFileSync('temp/user-' + timeStamp + '.png', base64Data, 'base64');
  var vectorize = classifier.processImage('temp/user-' + timeStamp + '.png',
    function (vector) {
      findSimilar(vector, function (match) {
        res.send(match.album_id);
      });
    }, false);
});


// Connection URL
var url = 'mongodb://localhost:27017/drawdio';

// this is supposed to be the euclidian distance minus the first component
function euclidianDistance(v1, v2) {
  var powerSum = 0;
  for (var i = 1; i < v1.length; ++i) {
    powerSum += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(powerSum);
}

function findSimilar(vector, callback) {
  var hueMode = vector[0];
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log('connected to database');

    // find things with similar hue to the image
    var albums = db.collection('albums');

    albums.find({
      hue_mode: { $gt: hueMode - 15, $lt: hueMode + 15 },
      processed: true
    }).toArray(function(err, docs) {
      if (docs.length === 0) {
        db.close();
        callback(null);
      }
      var shortestDist = euclidianDistance(docs[0].data_vector, vector);
      var shortestDoc = docs[0];
      for (var i = 1; i < docs.length; ++i) {
        var dist = euclidianDistance(docs[i].data_vector, vector);
        if (dist < shortestDist) {
          shortestDist = dist;
          shortestDoc = docs[i];
        }
      }
      db.close();
      callback(shortestDoc);
    });
  });
}