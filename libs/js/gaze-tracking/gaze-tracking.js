"use strict";
var gazetrackr = {};
gazetrackr.version = "alpha";

gazetrackr.tickMillis = 20;
gazetrackr.max_work_size = 160;

gazetrackr.FaceTracker = function(video) {
	this.scale = Math.min(gazetrackr.max_work_size/video.videoWidth, gazetrackr.max_work_size/video.videoHeight);
  this.w = (video.videoWidth*this.scale)|0;
  this.h = (video.videoHeight*this.scale)|0;

  this.img_u8 = new jsfeat.matrix_t(this.w, this.h, jsfeat.U8_t | jsfeat.C1_t);
  this.edg = new jsfeat.matrix_t(this.w, this.h, jsfeat.U8_t | jsfeat.C1_t);

	this.smoother = new headtrackr.Smoother(0.35, gazetrackr.tickMillis);
	this.faceLocation = null;

	this.options = {
		"equalize_histogram":true,
		"use_canny":false,
		"scale_factor":1.15,
		"min_scale":1,
		"edges_density":0.13
	}

  this.ii_sum = new Int32Array((this.w+1)*(this.h+1));
  this.ii_sqsum = new Int32Array((this.w+1)*(this.h+1));
  this.ii_tilted = new Int32Array((this.w+1)*(this.h+1));
  this.ii_canny = new Int32Array((this.w+1)*(this.h+1));

  this.classifier = jsfeat.haar.frontalface;
}

gazetrackr.FaceTracker.prototype.process = function(imageData) {
	var options = this.options;
  jsfeat.imgproc.grayscale(imageData.data, this.img_u8.data);

  // possible options
  if(options.equalize_histogram) {
      jsfeat.imgproc.equalize_histogram(this.img_u8, this.img_u8);
  }
  //jsfeat.imgproc.gaussian_blur(this.img_u8, this.img_u8, 3);

  jsfeat.imgproc.compute_integral_image(this.img_u8, this.ii_sum, this.ii_sqsum, this.classifier.tilted ? this.ii_tilted : null);

  if(options.use_canny) {
      jsfeat.imgproc.canny(this.img_u8, this.edg, 10, 50);
      jsfeat.imgproc.compute_integral_image(this.edg, this.ii_canny, null, null);
  }

  jsfeat.haar.edges_density = options.edges_density;
  var rects = jsfeat.haar.detect_multi_scale(this.ii_sum, this.ii_sqsum, this.ii_tilted, options.use_canny? this.ii_canny : null, this.img_u8.cols, this.img_u8.rows, this.classifier, options.scale_factor, options.min_scale);
  rects = jsfeat.haar.group_rectangles(rects, 1);

  if (rects.length > 0) {
  	var on = rects.length;
  	jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
  	if (!this.smoother.initialized) {
  		this.smoother.init(rects[0]);
  	}
  	this.faceLocation = this.smoother.smooth(rects[0]);
  } else {
  	this.faceLocation = {
  		"x":0,
  		"y":0,
  		"width":10, 
  		"height":10
  	};
  }



}