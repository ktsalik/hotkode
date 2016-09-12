var ServerWatcher = require('./lib/server-watcher');
var ClientWatcher = require('./lib/client-watcher');

var Hotkode = function(args) {
  if (typeof args != 'object') {
    console.error('Hotkode requires some arguments');
    return;
  }

  var serverWatcher, clientWatcher;

  if (typeof args.server == 'object') {
    serverWatcher = new ServerWatcher(args.server);
  } else if (typeof args.server == 'string') {
    new ServerWatcher({
      file: args.server,
      watch: [
        __dirname + '/' + args.server
      ]
    });
  }
  
  if (typeof args.client == 'object') {
    clientWatcher = new ClientWatcher(args.client);
  }
};

module.exports = Hotkode;
