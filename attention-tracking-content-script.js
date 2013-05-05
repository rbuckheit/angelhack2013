


// Attention tracking
function initAttentionTracker() {
	"use strict";
	var video = document.createElement("video");
  try {
    compatibility.getUserMedia({video: true}, function(stream) {
	    try {
        video.src = compatibility.URL.createObjectURL(stream);
      } catch (error) {
        video.src = stream;
      }
      setTimeout(function() {
        video.play();
        demo_app();
                        
        compatibility.requestAnimationFrame(tick);
      }, 500);
    }, function (error) {
    	console.error("webrtc not available", error);
    });
  } catch (error) {
  	console.error("nor foos", error);
  }

  var gui,options,ctx,canvasWidth,canvasHeight;
  var img_u8,work_canvas,work_ctx,ii_sum,ii_sqsum,ii_tilted,edg,ii_canny;
  var classifier = jsfeat.haar.frontalface;

  var faceTracker;

  var max_work_size = 160;

  var smoother = new headtrackr.Smoother(0.35,  20);

  var demo_opt = function(){
      this.min_scale = 1;
      this.scale_factor = 1.15;
      this.use_canny = false;
      this.edges_density = 0.13;
      this.equalize_histogram = true;
  }

  function demo_app() {
      var scale = Math.min(max_work_size/video.videoWidth, max_work_size/video.videoHeight);
      var w = (video.videoWidth*scale)|0;
      var h = (video.videoHeight*scale)|0;
      work_canvas = document.createElement('canvas');
      work_canvas.width = w;
      work_canvas.height = h;
      work_ctx = work_canvas.getContext('2d');
      faceTracker = new attentiontrackr.FaceTracker(video);
  }

  var haveAttention = false;

  function tick() {
      compatibility.requestAnimationFrame(tick);
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
          work_ctx.drawImage(video, 0, 0, work_canvas.width, work_canvas.height);
          var imageData = work_ctx.getImageData(0, 0, work_canvas.width, work_canvas.height);


          faceTracker.process(imageData);

          var updateHaveAttention = faceTracker.isPayingAttention();
          if (haveAttention != updateHaveAttention) {
              haveAttention = updateHaveAttention;
              if (haveAttention) {
                $("body").trigger("gazeEnter");
              } else {
                $("body").trigger("gazeOff");
              }
          }
      }
  }

  $(window).unload(function() {
      video.pause();
      video.src=null;
  });
}

$(document).ready(initAttentionTracker); 