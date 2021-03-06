'use strict';

var net = require('net');
var path = require('path');
var cluster = require('cluster');

function lipstick (appfile, options, done) {
  var parsed = parse.apply(null, arguments);
  if (cluster.isMaster) {
    master(parsed.appfile, parsed.options, parsed.done);
  } else {
    throw new Error('workers shouldn\'t use lipstick!');
  }
}

function parse (appfile, options, done) {
  var parsed = {};
  var length = arguments.length;
  if (length === 1) {
    if (typeof appfile === 'function') {
      done = appfile;
      appfile = undefined;
    } else if (typeof appfile !== 'string') {
      options = appfile;
      appfile = undefined;
    }
  }
  if (length === 2) {
    if (typeof appfile === 'string') {
      if (typeof options === 'function') {
        done = options;
        options = undefined;
      } else {
        done = noop;
      }
    } else {
      done = options;
      options = appfile;
      appfile = undefined;
    }
  }
  appfile = appfile || './app.js';
  options = options || {};
  done = done || noop;
  parsed.appfile = appfile;
  parsed.options = options;
  parsed.done = done;
  return parsed;
}

function master (appfile, options, done) {
  var workerCount = options.workers || defaultWorkerCount();
  var workers = [];
  var clusterOptions = {
    exec: path.resolve(appfile)
  }

  cluster.setupMaster(clusterOptions);
  spawnMany();
  listen();

  function spawnMany () {
    for (var i = 0; i < workerCount; i++) {
      spawn(i);
    }
  }
  function spawn (i) {
    workers[i] = cluster.fork();
    workers[i].once('exit', exit);

    function exit (worker, code, signal) {
      workers.splice(i, 1, null);
      spawn(i);
    }
  }
  function connectionHandler (connection) {
    var worker = workers[hash(connection.remoteAddress, workerCount)];
    worker.send('lipstick:connection', connection);
  }
  function listen () {
    var serverOptions = { pauseOnConnect: true };
    var server = net.createServer(serverOptions, connectionHandler);
    var port = options.port || process.env.PORT;
    server.listen(port, listening);
    function listening () {
      done(null, port);
    }
  }
}

function defaultWorkerCount () {
  var cores = require('os').cpus().length;
  var count = Math.max(cores, 2);
  return count;
}

function hash (ip, len) {
  var parts = '';
  for (var i = 0, _len = ip.length; i < _len; i++) {
    if (ip[i] >= '0' && ip[i] <= '9') {
      parts += ip[i];
    }
  }
  return Number(parts) % len;
}

function listen (server, port, done) {
  if (cluster.isWorker) {
    server.listen(0, 'localhost', listening);
  } else {
    server.listen(port, done);
  }
  function listening () {
    process.on('message', message);
    done.apply(server, arguments);
  }
  function message (type, connection) {
    if (type !== 'lipstick:connection') {
      return;
    }
    server.emit('connection', connection);
    connection.resume();
  }
}

function noop () {
}

lipstick.listen = listen;
module.exports = lipstick;
