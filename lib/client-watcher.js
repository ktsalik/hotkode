var childProcess = require('child_process');
var fs = require('fs');
var md5 = require('md5');
var http = require('http');
var sockjs = require('sockjs');

var ClientWatcher = function(args) {
  
  var self = this;
  
  this.process = null;
  
  this.files = {};
  
  args.watch.forEach(function(file) {
    var filePath, recursive;
    if (typeof file === 'object') {
      filePath = file.path;
      recursive = file.recursive || false;
    } else {
      filePath = file;
    }
    
    var fileStats;
    try {
      fileStats = fs.statSync(filePath);
      if (fileStats.isDirectory()) {
        fs.watch(filePath, {
          persistent: true,
          recursive: recursive
        }, function(eventType, filename) {
          try {
            if (filename in self.files && self.files[filename] == md5(fs.readFileSync(filePath + '/' + filename))) {
              return;
            } else {
              self.files[filename] = md5(fs.readFileSync(filePath + '/' + filename));
              restartBrowser();
            }
          } catch (err) {
            restartBrowser();
          }
        });
      } else if (fileStats.isFile()) {
        fs.watch(filePath, {
          persistent: true
        }, function(eventType, filename) {
          try {
            if (filename in self.files && self.files[filename] == md5(fs.readFileSync(filePath))) {
              return;
            } else {
              self.files[filename] = md5(fs.readFileSync(filePath));
              restartBrowser();
            }
          } catch (err) {
            restartBrowser();
          }
        });
      }
    } catch (err) {
      console.warn("File `" + filePath + "` doesn't exist");
    }
  });
  
  this.sockjs = sockjs.createServer({ sockjs_url: './lib/sockjs-client.js' });
  this.sockets = {};
  
  this.sockjs.on('connection', function(connection) {
    self.sockets[connection.id] = connection;
    
    connection.on('close', function() {
      delete self.sockets[connection.id];
    });
  });
  
  this.socketsServer = http.createServer();
  this.sockjs.installHandlers(this.socketsServer, { prefix: '/hotkode' });
  this.socketsServer.listen(3001, 'localhost');
  
  function restartBrowser() {
    for (var id in self.sockets) {
      self.sockets[id].write('restart');
    }
  }
};

module.exports = ClientWatcher;
