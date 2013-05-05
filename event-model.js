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
	var lastGaze = gaze_events[gaze_events.length-1];
	if (lastGaze.event == "gazeOff") {
		// query for all active tabs and tell them that gaze has left screen.
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {command: "userExited"}, function(response){});				
			}
		});
	}	
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("gaze :: event-model received " + request.command);
	
	//=== EVENT TRACKING ===
	if (request.command == "gazeOn") {
		push_event({"event": "gazeOn", "x": request.x, "y":request.y});
	}
	if (request.command == "gazeOff") {
		push_event({"event": "gazeOff"})
		// alert other tabs
		alertIfNeeded();
	}

	//=== COOKIES ===
	if (request.command == "flushCookies") {
		var facebookDomain = "http://www.facebook.com";
		// chrome.cookies.remove ( {"url": facebookDomain, "name": "act" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "c_user" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "checkpoint" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "lu" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "s" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "sct" } );
		// 		chrome.cookies.remove ( {"url": facebookDomain, "name": "xs" } );
		chrome.cookies.getAll({domain: request.domain}, function(cookies) {
		    for(var i=0; i<cookies.length;i++) {
						chrome.cookies.remove({url: "http://" + request.domain + cookies[i].path, name: cookies[i].name});
		        chrome.cookies.remove({url: "https://" + request.domain + cookies[i].path, name: cookies[i].name});
		    }
		});
	}

	sendResponse({response: "OK"});
});
