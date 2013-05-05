// TODO decide if this is an app, browser_action page_action, etc
// chrome.app.runtime.onLaunched.addListener(function() { 
// 	console.log("gaze :: event model launched")
// 	// chrome.app.window.create('main.html', {
// 	// 	    bounds: {
// 	// 	      width: 800,
// 	// 	      height: 600,
// 	// 	      left: 100,
// 	// 	      top: 100
// 	// 	    },
// 	// 	    minWidth: 800,
// 	// 	    minHeight: 600
// 	// 	  });
// });

MAX_EVENTS = 1000
gaze_events = []

function push_event(evt) {
	gaze_events.push(evt)
	if (gaze_events.length >= MAX_EVENTS) {
			gaze_events = gaze_events.slice(-MAX_EVENTS);
	}
	dbg_print_events();
}

function dbg_print_events() {
	console.log("top of event stack: ")
	top_evts = gaze_events.slice(-5).reverse();
	for (var i = 0; i < top_evts.length; i++) {
		evt = top_evts[i];
		if (evt.event == "gazeOff"){
			console.log("\t" + i + ": [gazeOff]");
		} else {
			console.log("\t" + i + ": [gazeOn] x="+evt.x + " y=" + evt.y);
		}
	}
}

function alertIfNeeded() {
	if (gaze_events.length <= 0) {
		return;
	}	
	var lastGaze = gaze_events[gaze_events.length-1]
	
	if (lastGaze.event == "gazeOff") {
		// query for all active tabs and tell them that gaze has left screen.
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {command: "userExited"}, function(response) {
					// ignore response
			  });
			}
		});
	}	
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("gaze :: event-model received " + request.command);
	
	// track the event
	if (request.command == "gazeOn") {
		push_event({"event": "gazeOn", "x": request.x, "y":request.y});
	}
	else if (request.command == "gazeOff") {
		push_event({"event": "gazeOff"})
	}
	// alert other tabs
	alertIfNeeded();
	sendResponse({response: "OK"});
});

// communication port 
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "alerts");
  port.onMessage.addListener(function(msg) {
		console.log("port message: "); console.log(msg);
  });
});

