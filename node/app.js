var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , sharedVar = 10 
  , port = process.env.PORT || 80
  , dashboardsConnected = 0
  , clientTypes = {};

// magical shit from heroku docs
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.configure(function () {
  io.set("heartbeat interval", 1);
});

app.listen(port);
console.log("Starting the app (id=2013-01-25T21:08:12.854Z).")

function handler (req, res) {
  console.log("The url of the request is "+req.url);
  if ((req.url === "/") || (req.url === "/index.html")) {
    fs.readFile(__dirname + '/index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
      });
  } else if (req.url === "/dashboard.html") {
    fs.readFile(__dirname + '/dashboard.html',
      function(err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading dashboard.html');
        }
        res.writeHead(200);
        res.end(data);
      }
    );
  }
}

function increment() {
  console.log("Calling increment33.");
  sharedVar +=1;
}

function decrement() {
  console.log("Calling decrement33.");
  sharedVar -=1;
}

function broadcastClients(socket) {
    var data = {clients:dashboardsConnected};
    io.sockets.emit('clientEvent',data);
}

function serverLog(message) {
  io.sockets.emit('serverLog',{'message':message});
}

io.sockets.on('connection', function (socket) {
  io.sockets.emit('clientEvent',{dashboards:dashboardsConnected});
  function updateAllSockets() {
    socket.emit('updateSharedVariable',sharedVar);
    socket.broadcast.emit('updateSharedVariable', sharedVar);
  }

  // var clientTypeGet = '';
  // socket.get('client', function(err,name){
  //   clientTypeGet = name;
  // });
  
  socket.on('serverLog', function(data) {serverLog(data.message)});
  
  // TODO: get rid of up and down, they're subsumed by 'keypress'
  socket.on('upArrow', function() {io.sockets.emit('previous slide')});
  socket.on('downArrow', function() {socket.emit('next slide'); socket.broadcast.emit('next slide')});

  // whenever a keypress event comes it, broadcast it along with its data    
  socket.on('keypress', function(data) {io.sockets.emit('keypress',data);});
  // socket.on('keypress', function(data) {socket.emit('keypress',data); socket.broadcast.emit('keypress',data)});

  socket.on('clientEvent', function(data) {

    // 1. check clientType in order to adjust dashboardsConnected

    var clientType = data.clientType;
    if (clientType === 'dashboard') {
      serverLog("A dashboard connected, and now there are "+dashboardsConnected+" dashboards connected.");
      dashboardsConnected += 1;
    }

    io.sockets.emit('clientEvent',{dashboards:dashboardsConnected});

    // 2. store type so it can be checked upon disconnect

    // probably no point in using the 'set' function for this,
    //   since I can't use 'get' after disconnect.
    //   but for now it doesn't hurt.
    socket.set('clientType', clientType, function(){
      clientTypes[socket.id] = clientType;
    });
  });

  socket.on('disconnect', function() {
    if (clientTypes[socket.id] === 'dashboard') {
      serverLog("A dashboard was disconnected");
      dashboardsConnected -= 1;
      serverLog("Now there are "+dashboardsConnected+" dashboards connected.");
    } else {
      serverLog("Some non-dashboard client was disconnected.");
    };

    io.sockets.emit('clientEvent',{dashboards:dashboardsConnected});

  });
});
