//TODO cancellation
var exit_hooks_cancelled = false;
var fire_exit_hooks = function() {
	/* this will be built up below */
}

function register_exit_hook(parameters, callback) {
	var old_exit_hooks = fire_exit_hooks;
	fire_exit_hooks = function() {
		var should_run = true;
		
		//check for url match
		if (parameters.url_pattern) {
				var rexp = new RegExp(parameters.url_pattern);
				var tablink = $(location).attr("href");
				should_run &= rexp.test(tablink);	
		}		
		
		if (should_run) {
			console.log("exit hook: "); console.log(parameters);
			callback();
		}
		// continue down the chain (yes this is gross)
		old_exit_hooks();
	}
}

function flush_cookies(domain) {
	chrome.runtime.sendMessage({command: "flushCookies", domain:domain}, function(response) {
		console.log("flushCookies (" + domain +"):" + response.response);
	});
}

function close_tabs(domain) {
	chrome.runtime.sendMessage({command: "closeTabs", domain:domain}, function(response) {});
}

function refresh_delayed() {
	setTimeout(function() { window.location.href=window.location.href; }, 500);
}

// logs you out from mint.com
register_exit_hook({"url_pattern": "mint",	"timeout": 60}, function() {
	flush_cookies("mint.com");
	document.getElementById("hdr-links-logout").click();
	refresh_delayed();
});
// pauses youtube video
register_exit_hook({"url_pattern": "youtube"}, function() {
	document.getElementById("movie_player").pauseVideo();
	document.getElementById("movie_player").stopVideo();
});
// logs you out of facebook
register_exit_hook({"url_pattern":"facebook"}, function(){
	flush_cookies("facebook.com");
	refresh_delayed();
});
register_exit_hook({"url_pattern":"justinbiebermusic.com"},function() {
	close_tabs("justinbiebermusic");
});