'use strict';

// Connection URL
var url = 'mongodb://localhost:27017/drawdio';

function euclidianDistance(v1, v2) {
  var powerSum = 0;
  for (var i = 0; i < v1.length; ++i) {
    powerSum += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(powerSum);
}

function findSimilar(vector) {
  var hueMode = vector[0];
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

    // find things with similar hue to the image
    var albums = db.collection('albums');

    albums.find({
      hue_mode: {$gt: hueMode - 15, $lt: hueMode + 15}
    }).toArray(function(err, docs) {
      if (docs.length === 0) {
        return null;
      }
      var shortestDist = euclidianDistance(docs[0].data_vector, vector);
      var shortestDoc = docs[0];
      for (var i = 1; i < docs.length; ++i) {
        var dist = euclidianDistance(docs[i].data_vector, vector);
        if (dist < shortestDist) {
          shortestDoc = docs[i];
        }
      }
      return shortestDoc;
    });
  });
}