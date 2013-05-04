// $("body").

// chrome.tabs.getSelected(null, function(tab) {
// 	console.log("found tab: "); console.log(tab);
// });

function gotStream(stream) {   
    // stream_handler(stream)
    //other stuff to show webcam output on the webpage
}

function noStream() {
	
}

navigator.webkitGetUserMedia({video: true}, gotStream, noStream);

