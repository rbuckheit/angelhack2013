/*
 *	Responds to messages from the background event pages.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("got alert from the backend " + request.command);
	if (request.command == "userExited") {
		fire_exit_hooks();
		sendResponse({response: "OK"});
	}
});