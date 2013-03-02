# reveal-sync

plugin for [hakimel/reveal.js](https://github.com/hakimel/reveal.js) for sync'd and remote-controlled presentations.

# Installation

1. Install this directory into `reveal.js/plugin`. 
2. In `reveal.js/index.html`, find the call to `Reveal.initialize`. The `dependencies` attribute of the argument object is a list of objects that specify dependencies. Add the following entries to this list:

	```javascript
	{ src: 'plugin/reveal-sync/js/jquery.min.js', condition: function() { return !!document.body.classList;}},
	{ src: 'plugin/reveal-sync/js/socket.io.js', condition: function() { return !!document.body.classList; } },
	{ src: 'plugin/reveal-sync/js/reveal-sync.js', async: true, condition: function() { return !!document.body.classList; } }
	```
3. Run the node.js application which is in the `node` directory either locally or in the cloud (e.g. on Heroku).
4. In `js/reveal-sync.js`, change the `remoteServer` variable to match your server and port.

# Todo

* Explain dashboard.html
