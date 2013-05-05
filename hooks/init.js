exit_hooks = function() {
	console.log("done processing exit hooks");
}


function register_exit_hook(parameters, callback) {
	var old_exit_hooks = exit_hooks;
	exit_hooks = function() {
		console.log("exit hook: "); console.log(parameters);
		var should_run = true;
		
		// check for url match
		if (parameters.url_pattern) {
			var rexp = new RegExp(parameters.url_pattern);
			var tablink = null;
			chrome.tabs.getCurrent(function callback) { 
			    tablink = tab.url;
			});
			
			if (tablink && !rexp.test(tablink)) {
				should_run = false;
			}
		}		
		
		// continue down the chain (yes this is gross)
		old_exit_hooks();
	}
}

function fire_exit_hooks() {
	exit_hooks();
}


// logs you out from mint.com
register_exit_hook({"url_pattern": "mint",	"timeout": 60}, function() {
	document.getElementById("hdr-links-logout").click()
})

//register_exit_hook({"url_pattern", "facebook"})
//register_exit_hook({"url_pattern", "youtube"})