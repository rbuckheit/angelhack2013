/* 
	listeners:

	"gazeOn", {'x', 'y'}	
		user gazed at point (x,y)

	"gazeOff"
		user gazed off the screen (no args)
*/

var attach_listeners = function() {
	var elem = $("body");
		
	$("body").on('gazeOn', function(e, data) {
		console.log("user gazed at point: (" + data.x + ", " + data.y + ")");
		
		chrome.runtime.sendMessage({command: "gazeOn", x: data.x, y: data.y}, function(response) {
			// console.log("backend replied: " + response.response);
		});
	});
	
	$("body").on('gazeOff', function(e, data) {
		console.log("user's gaze left the screen");
		chrome.runtime.sendMessage({command: "gazeOff"}, function(response) {
			// console.log("backend replied: " + response.response);
		});
	});
	
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		console.log("got alert from the backend " + request.command);
		if (request.command == "userExited") {
			fire_exit_hooks();
		}
		sendResponse({response: "OK"});
	});
		
	console.log("gaze :: listeners attached");
}

$(document).ready(attach_listeners); 
	


