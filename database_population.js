'use strict';

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const csv = require('csvtojson');
const request = require('request');
const fs = require('fs');
const gm = require('gm');
const classifier = require('./classification.js');

// Connection URL
var url = 'mongodb://localhost:27017/drawdio';

var firstRun = false;

if (process.argv.indexOf('--initial-run') !== -1) {
  console.log('First start detected. Creating database.');
  firstRun = true;
}

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log('Connected successfully to server');

  if (firstRun) {

    var albums = db.collection('albums');
    albums.remove({});
    console.log('Cleared existing album data.');

    // populate the database with an initial set of items

    // get the top tracks
    var trackIds = [];

    request('https://spotifycharts.com/regional/global/daily/latest/download', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        csv({noheader: true})
          .fromString(body)
          .on('csv', (csvRow) => {
            var urlData = csvRow[4];
            if (urlData === 'URL') {
              return;
            }
            var id = urlData.replace('https://open.spotify.com/track/', '');
            trackIds.push(id);
          })
          .on('done', () => {
            console.log('Successfully downloaded ids of top songs.');
            populateWithTrackAlbums(trackIds, db);
          });
      }
    });
  } else {
    startAdding(db);
  }
});

function populateWithTrackAlbums(trackIds, db) {
  var albums = db.collection('albums');
  var addAlbumsByTrackIds = function (trackIds) {
    request('https://api.spotify.com/v1/tracks/' + trackIds[0], function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        
        var albumId = result.album.id;
        var artistId = result.artists[0].id;

        var artLink = null;
        if (result.album.images.length > 0) {
          artLink = result.album.images[0].url;
        }
        
        albums.insert({
          processed: false,
          album_id: albumId,
          artist_id: artistId,
          data_vector: null,
          hue_mode: null,
          album_art: artLink
        }, function (err, result) {
          assert.equal(err, null);
          console.log('added album: ' + albumId);
          trackIds.shift();
          if (trackIds.length === 0) {
            startAdding(db);
          } else {
            addAlbumsByTrackIds(trackIds);
          }
        });
      } else if (error) {
        console.log(error);
      } else if (response.statusCode == 429) {
        var delay = response.headers['retry-after'];
        setTimeout(function() {
          addAlbumsByTrackIds(trackIds)
        }, (delay + 1) * 1000);
      }
    });
  }
  addAlbumsByTrackIds(trackIds);
}

function startAdding(db) {
  buildDataBaseForDepth(db);
}

function buildDataBaseForDepth(db) {
  var albums = db.collection('albums');
  albums.find({
    processed: false
  }).toArray((err, docs) => {
    assert.equal(err, null);
    processDocuments(db, docs, buildDataBaseForDepth);
  });
}

function processDocuments(db, docs, callback) {
  var albums = db.collection('albums');
  var imgURL = docs[0].album_art;
  request(imgURL, {encoding: 'binary'}, function(error, response, body) {
    fs.writeFileSync('temp/tmp.jpg', body, 'binary');
    classifier.processImage('temp/tmp.jpg', (vector) => {
      var uniqueId = docs[0]._id;
      albums.update({_id: uniqueId}, {$set: {
        hue_mode: vector[0],
        data_vector: vector,
        processed: true
      }});
      addRelatedAlbums(db, docs.shift());
      if (docs.length <= 0) {
        callback(db);
      } else {
        processDocuments(db, docs, callback);
      }
    }, true);
  });
}

function addRelatedAlbums(db, doc) {
  var artistId = doc['artist_id'];
  request('https://api.spotify.com/v1/artists/' + artistId + '/related-artists', function (error, response, body) {
    if(!error && response.statusCode == 200) {
      var result = JSON.parse(body);
      var otherArtistIds = result.artists.map((artist) => artist.id);
      otherArtistIds.forEach((artistId) => addArtist(db, artistId));
    } else if (error) {
      console.log('Error while adding related albums: ' + error);
    } else if (response.statusCode == 429) {
      var delay = response.headers['retry-after'];
      setTimeout(function() {
        addRelatedAlbums(trackIds)
      }, (delay + 1) * 1000);
    }
  });
}

function addArtist(db, artistId) {
  var albums = db.collection('albums');
  request('https://api.spotify.com/v1/artists/' + artistId + '/albums',
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        var albumId = result.items[0].id;

        var artLink = null;
        if (result.items[0].images.length > 0) {
          artLink = result.items[0].images[0].url;
        }

        albums.insert({
          processed: false,
          album_id: albumId,
          artist_id: artistId,
          data_vector: null,
          hue_mode:null,
          album_art: artLink
        }, function (err, result) {
          assert.equal(err, null);
          console.log('added album: ' + albumId);
        });
      } else if (error) {
        console.log(error);
      } else if (response.statusCode == 429) {
        var delay = response.headers['retry-after'];
        setTimeout(function() {
          addArtist(db, artistId)
        }, (delay + 1) * 1000);
      }
  });
}

function cleanUp(db) {
  db.close();
  console.log('closed DB connection');
}



