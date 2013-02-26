window.console.log("hello from swgreen.js"); // works, appears to require 'window'
// check that dependency has been loaded

/*****
REMOTE CONTROL
*****/

console.log(io);
var remoteServer = 'localhost';

var socket = io.connect(remoteServer, {port:80});
    socket.on('next slide', function () {
        console.log("Got 'next slide' from socket.");
        Reveal.next();
    });

    socket.on('previous slide', function () {
        console.log("Got 'previous slide' from socket.");
        Reveal.prev();
    });

    socket.on('keypress', function(data) {
    	console.log("Got keypress with keycode "+data.keycode);
    	var keymapping = {
    		'39': function () {Reveal.next();},
    		'37': function () {Reveal.prev();},
    		'66': function () {Reveal.togglePause();},
    		'80': function () {Reveal.togglePause();}
    	};
    	// how do I do error-catching when the code doesn't exist?
    	try {
    		keymapping[data.keycode]();
    		console.log("key was mapped: "+data.keycode);    		
    	}
    	catch(e) {
    		console.log("key not mapped: "+data.keycode);
    	}
    });

    socket.on('serverLog', function(data) {console.log("serverLog: "+data.message)});

    socket.on('connect', function() {$('.reveal .socket-status')[0].classList.add('enabled');});
    socket.on('disconnect', function() {$('.reveal .socket-status')[0].classList.remove('enabled');});
    // need try/catch here
    socket.on('clientEvent', function(data) {
        console.log("Got clientEvent. Number of dashboards connected: "+data.dashboards+".");
        // do I need parseInt??
        if (data.dashboards > 0) {
            $('.reveal .dashboard-status')[0].classList.add('enabled');
        } else {
            $('.reveal .dashboard-status')[0].classList.remove('enabled');
        };
    });

/*****
Socket Status Dot
*****/

var pathToStylesheet = "plugin/swgreen/css/swgreen.css";

// when do attribute names need to be quoted?? 
// 
// write a stylesheet
$('<link>', {rel:'stylesheet', href:pathToStylesheet}).appendTo("head");

// add element to the DOM
// (should I access the options object to check if status dot is enabled?)
$('<aside>', {'class':'socket-info', 'style': 'display: block;'})
    .append($('<div>', {'class':'socket-status'}))
    .append($('<div>', {'class':'dashboard-status'}))
    .appendTo($('.reveal'));

