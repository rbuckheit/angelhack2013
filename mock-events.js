
// $("body").on("click", function(e) {
// 	yMax = $(window).height();
// 	xMax = $(window).width();
// 	
// 	if (isOffscreen(e.pageX, xMax) || isOffscreen(e.pageY, yMax)) {
// 		$("body").trigger('gazeOff');
// 	} else {
// 		$("body").trigger('gazeOn', {'x': e.pageX, 'y': e.pageY});	
// 	}
// });
// 
// var isOffscreen = function(point, max) {
// 	percentage = point/max;
// 	return (percentage <= 0.03 || percentage >= 0.97);
// }