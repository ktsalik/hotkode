var childProcess = require('child_process');
var fs = require('fs');
var md5 = require('md5');

var ServerWatcher = function(args) {
  
  var self = this;
  
  this.process = null;
  
  var serverFilePath = args.file;
  try {
    if (fs.statSync(serverFilePath).isFile()) {
      self.process = childProcess.fork(serverFilePath);
      args.watch.push(serverFilePath);
    }
  } catch (err) {
    console.error("Invalid server entry file. Can't start the server");
    return;
  }
  
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
              restartServer();
            }
          } catch (err) {
            restartServer();
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
              restartServer();
            }
          } catch (err) {
            restartServer();
          }
        });
      }
    } catch (err) {
      console.warn("File `" + filePath + "` doesn't exist");
    }
  });
  
  function restartServer() {
    self.process.kill();
    self.process = childProcess.fork(serverFilePath);
  }
};

module.exports = ServerWatcher;
