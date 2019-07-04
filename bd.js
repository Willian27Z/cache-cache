var MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:G5JYxQAEzOqzrlTa@cache-cache-o1uzn.gcp.mongodb.net/test?retryWrites=true&w=majority";
var state = {
  db: null,
};

exports.connect = function(done) {
  if (state.db) {
    return done();
  }

  MongoClient.connect(uri, { useNewUrlParser: true }, function(err, db) {
    if (err) {
      return done(err);
    }
    state.db = db;
    done();
  });
};

exports.get = function() {
  return state.db;
};

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null;
      state.mode = null;
      if (err) {
        done(err);
      }
    });
  };
};