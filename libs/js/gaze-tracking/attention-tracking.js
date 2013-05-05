"use strict";
var attentiontrackr = {};

attentiontrackr.tickMillis = 20;
attentiontrackr.max_work_size = 160;

attentiontrackr.FaceTracker = function(video) {
	this.scale = Math.min(attentiontrackr.max_work_size/video.videoWidth, attentiontrackr.max_work_size/video.videoHeight);
  this.w = (video.videoWidth*this.scale)|0;
  this.h = (video.videoHeight*this.scale)|0;

  this.img_u8 = new jsfeat.matrix_t(this.w, this.h, jsfeat.U8_t | jsfeat.C1_t);
  this.edg = new jsfeat.matrix_t(this.w, this.h, jsfeat.U8_t | jsfeat.C1_t);

	this.smoother = new headtrackr.Smoother(0.35, attentiontrackr.tickMillis);
	this.faceLocation = null;
  this.lastUpdate = new Date();

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

attentiontrackr.FaceTracker.prototype.isPayingAttention = function() {
	return new Date() - this.lastUpdate < 1000;
}

attentiontrackr.FaceTracker.prototype._haarMatch = function(classifier, options) {
	// precondition: this.img_u8 contains grayscale version of image data.	
  // possible options
  if(options.equalize_histogram) {
      jsfeat.imgproc.equalize_histogram(this.img_u8, this.img_u8);
  }
  //jsfeat.imgproc.gaussian_blur(this.img_u8, this.img_u8, 3);

  jsfeat.imgproc.compute_integral_image(this.img_u8, this.ii_sum, this.ii_sqsum, classifier.tilted ? this.ii_tilted : null);

  if(options.use_canny) {
      jsfeat.imgproc.canny(this.img_u8, this.edg, 10, 50);
      jsfeat.imgproc.compute_integral_image(this.edg, this.ii_canny, null, null);
  }

  jsfeat.haar.edges_density = options.edges_density;
  var rects = jsfeat.haar.detect_multi_scale(this.ii_sum, this.ii_sqsum, this.ii_tilted, options.use_canny? this.ii_canny : null, this.img_u8.cols, this.img_u8.rows, classifier, options.scale_factor, options.min_scale);
  rects = jsfeat.haar.group_rectangles(rects, 1);

  return rects;
}

attentiontrackr.rectContains = function(containingRect, rect) {
	return containingRect.x < rect.x &&
		containingRect.y < rect.y &&
		containingRect.x + containingRect.width > rect.x + rect.width &&
		containingRect.y + containingRect.height > rect.y + rect.height;
}

attentiontrackr.FaceTracker.prototype.process = function(imageData) {
	//  only update occasionally, otherwise this makes everything slow
	if (new Date() - this.lastUpdate < 500) { return; }
	
  jsfeat.imgproc.grayscale(imageData.data, this.img_u8.data);

  // Track face
  var rects = this._haarMatch(jsfeat.haar.frontalface, this.options);

  if (rects.length > 0) {
  	var on = rects.length;
  	jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
  	if (!this.smoother.initialized) {
  		this.smoother.init(rects[0]);
  	}
  	this.faceLocation = this.smoother.smooth(rects[0]);
    this.lastUpdate = new Date();
  }
}