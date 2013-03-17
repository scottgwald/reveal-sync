window.console.log("hello from reveal-sync.js"); // works, appears to require 'window'
// check that dependency has been loaded

var options = {
    statusDots: true    
};

/*****
REMOTE CONTROL
*****/

console.log(io);
// var remoteServer = {url:'remote-slideshow.herokuapp.com',port:''};
var remoteServer = {url:'localhost',port:''};

var socket = io.connect(remoteServer.url, {port:remoteServer.port});
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

    socket.on('serverLog', function(data) {
        var theMessage = '';
        if (data.message === undefined) {
            console.log("Using JSON.stringify on serverLog data.");
            theMessage = JSON.stringify(data);
        } else {
            theMessage = data.message;
        }
        console.log("serverLog: "+theMessage);
    });

    if (options.statusDots) {
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
    };

    // this gets stuck in loops... need to somehow prevent a single
    //   request from bouncing back and forth.    
    socket.on('syncEvent',function(data){
        // register
        switch(data.eventType) {
            case 'slideChange':
                var currentIndices = Reveal.getIndices();
                // TODO can leave this in there for now, but it shouldn't be necessary
                // if (currentIndices.h === data.indexh && currentIndices.v === data.indexv) {
                //     console.log("Incoming event matches current indices. Ignoring.");
                //     break;
                // } else {
                var aSlideSpec = new SlideSpec(data.indexh,data.indexv,data.indexf);
                commandArbiter.register(aSlideSpec);
                Reveal.slide(data.indexh, data.indexv);
                break;
                // };
        };
    });

function SlideSpec(h,v,f) {
    this.h = h; this.v = v; this.f = f;
}

SlideSpec.prototype.toString = function() {return JSON.stringify(this)};

var commandArbiter = (function(){
    var commandRegister = {};
    function now() {
        return new Date().getTime();
    };

    function defineIfUndefined(aSlideSpec) {
        if (aSlideSpec instanceof SlideSpec) {
            if (commandRegister[aSlideSpec] === undefined) {
                commandRegister[aSlideSpec] = [];
            }
            if (!(commandRegister[aSlideSpec] instanceof Array)) {
                // TODO throw error
            }
        } else {
            console.log("Improperly formed SlideSpec "+aSlideSpec);
        // TODO else throw error
        }
    }

    function staleEntries() {
        var out = "";
        var num = 0;
        for (var key in commandRegister) {
            num += commandRegister[key].length;
            out += key+commandRegister[key].length;
        };
        out = "Number of stale entries: "+num+" "+out;
        return out;
    }

    function clear() {
        commandRegister = {};
    }

    function register(aSlideSpec) {
        console.log("Registering incoming slidechange event.");
        defineIfUndefined(aSlideSpec);
        commandRegister[aSlideSpec].push(now());
    };

    //TODO: could add ignoring of stale entries based on time
    function letPass(aSlideSpec) {
        defineIfUndefined(aSlideSpec); //race condition?
        if (commandRegister[aSlideSpec].length === 0) {
            console.log("Proactive event: Giving the go-ahead.");
            return true;
            //let pass
        } else {
            console.log("Reactive event: Filtering. asdf. "+commandRegister[aSlideSpec]);
            commandRegister[aSlideSpec].pop();
            return false;
        };
    };

    return {
        register: register,
        letPass: letPass,
        reg: commandRegister,
        stale: staleEntries,
        clear: clear
    };
})();

/*****
Socket Status Dot
*****/

var pathToStylesheet = "plugin/reveal-sync/css/reveal-sync.css";

// when do attribute names need to be quoted?? 
// 

if (options.statusDots) {
    // write a stylesheet
    $('<link>', {rel:'stylesheet', href:pathToStylesheet}).appendTo("head");

    // add element to the DOM
    // (should I access the options object to check if status dot is enabled?)
    $('<aside>', {'class':'socket-info', 'style': 'display: block;'})
        .append($('<div>', {'class':'socket-status'}))
        .append($('<div>', {'class':'dashboard-status'}))
        .appendTo($('.reveal'));
};

/*****
Sync State with Server
*****/

// NOTE: support for f-index is non-uniform
Reveal.addEventListener('slidechanged', function(event) {
    var message = 'event.previousSlide: '+event.previousSlide+' event.currentSlide: '+event.currentSlide+' event.indexh: '+event.indexh+' event.indexv: '+event.indexv;
    socket.emit('serverLog',{'message':message});
    // check if it's registered
    var aSlideSpec = new SlideSpec(event.indexh,event.indexv,event.indexf);
    if (commandArbiter.letPass(aSlideSpec)) {
        socket.emit('syncEvent', {eventType:'slideChange',indexh:event.indexh,indexv:event.indexv});
    };
});

/*****
CAN I OVERRIDE THE SLIDE FUNCTION?
No, seems to throw exception becuase the variables are out of scope,
and then fall back 
This doesn't work because it doesn't replace references within the object.
*****/

var oldSlide = Reveal.slide;

Reveal.slide = function(h,v,f,options) {
    console.log("This is the override.");
    oldSlide(h,v,f);
}

/*****
size my image
*****/


// $('.reveal .fullsize').each(function(index){
//     this.classList.add('fillheight');
// });

// $('#myprecious').style({padding:'0px 0px', margin:'0px 0px','max-width':"100%",'max-height':"100%"})
//                 .width("100%")
//                 .height("100%");
