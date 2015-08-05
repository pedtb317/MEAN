var mongo = process.env.VCAP_SERVICES;
var port = process.env.PORT || 3030;
var conn_str = "";

console.log("mongo::::" + mongo);

var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("netstat -an", puts);

if (mongo) {
  var env = JSON.parse(mongo);
  if (env['mongolab']) {
    mongo = env['mongolab'][0]['credentials'];
    console.log(mongo);
    if (mongo.uri) {
    console.log(mongo.uri);
      conn_str = mongo.uri;
      
      console.log(conn_str);
    } else {
      console.log("No mongo found");
    }
  } else {
  conn_str = 'mongodb://localhost:27017';
  }
} else {
  conn_str = 'mongodb://localhost:27017';
}

var MongoClient = require('mongodb').MongoClient;
var db;
MongoClient.connect(conn_str, function(err, database) {
  if(err) throw err;
  db = database;
});

var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.write('Two APIs are provided: "/api/insertMessage" and "/api/render"' + "\n"
    + 'When "/api/insertMessage" is called, messages will be written to database' + "\n"
    + 'When "/api/render" is called, the inserted message will be shown');
  res.end();
});

app.get('/api/insertMessage', function (req, res) {
  var message = { 'message': 'Hello, Bluemix', 'ts': new Date() };
  if (db && db !== "null" && db !== "undefined") {
    db.collection('messages').insert(message, {safe:true}, function(err){
      if (err) {
        console.log(err.stack);
        res.write('mongodb message insert failed');
        res.end();
      } else {
        res.write('following messages has been inserted into database' + "\n"
        + JSON.stringify(message));
        res.end();
      }
    });
  } else {
    res.write('No mongo found');
    res.end();
  }
});

app.get('/api/render', function (req, res) {
  if (db && db !== "null" && db !== "undefined") {
    // list messages
    db.collection('messages').find({}, {limit:10, sort:[['_id', 'desc']]}, function(err, cursor) {
      if (err) {
        console.log(err.stack);
        res.write('mongodb message list failed');
        res.end();
      } else {
        cursor.toArray(function(err, items) {
          if (err) {
            console.log(err.stack);
            res.write('mongodb cursor to array failed');
            res.end();
          } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            for (i=0; i < items.length; i++) {
              res.write(JSON.stringify(items[i]) + "\n");
            }
            res.end();
          }
        });
      }
    });
  } else {
    res.write('No mongo found');
    res.end();
  }
});
app.listen(port);


