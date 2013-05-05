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
	this.leftEyeSmoother = new headtrackr.Smoother(0.35, gazetrackr.tickMillis);
	this.rightEyeSmoother = new headtrackr.Smoother(0.35, gazetrackr.tickMillis);
	this.faceLocation = null;
	this.leftEyeLocation = null;
	this.rightEyeLocation = null;

	this.options = {
		"equalize_histogram":true,
		"use_canny":false,
		"scale_factor":1.15,
		"min_scale":1,
		"edges_density":0.13
	}
	this.eyeOptions = {
		"equalize_histogram":true,
		"use_canny":false,
		"scale_factor":2.0,
		"min_scale":1,
		"edges_density":0.32
	}

  this.ii_sum = new Int32Array((this.w+1)*(this.h+1));
  this.ii_sqsum = new Int32Array((this.w+1)*(this.h+1));
  this.ii_tilted = new Int32Array((this.w+1)*(this.h+1));
  this.ii_canny = new Int32Array((this.w+1)*(this.h+1));

  this.classifier = jsfeat.haar.frontalface;
  this.canvas = document.createElement('canvas');
	this.canvas.width = this.w;
	this.canvas.height = this.h;
	this.canvas2 = document.createElement('canvas');
	this.canvas2.width = this.w;
	this.canvas2.height = this.h;
	this.eyeScale = 1;
	this.ctx = this.canvas.getContext('2d');
	this.ctx2 = this.canvas2.getContext('2d');
	this.ctx2.scale(this.eyeScale, this.eyeScale);
}

gazetrackr.FaceTracker.prototype._haarMatch = function(classifier, options) {
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

gazetrackr.rectContains = function(containingRect, rect) {
	return containingRect.x < rect.x &&
		containingRect.y < rect.y &&
		containingRect.x + containingRect.width > rect.x + rect.width &&
		containingRect.y + containingRect.height > rect.y + rect.height;
}

gazetrackr.FaceTracker.prototype.process = function(imageData) {
	
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
  }

  if (!!this.faceLocation) {
  	this.trackEyes(imageData);
	}
}

gazetrackr.FaceTracker.prototype.trackEyes = function(imageData) {
  	// Track eyes
	  var rects = this._haarMatch(jsfeat.haar.eye, this.eyeOptions);

	  if (rects.length > 0) {
	  	var on = rects.length;
	  	jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
	  	var leftEye = null;
	  	var rightEye = null;
	  	var centerFace = this.faceLocation.x + this.faceLocation.width / 2;
	  	for (var i = 0; i < on; i++) {
	  		var r = rects[i];
	  		if (gazetrackr.rectContains(this.faceLocation, r)) {
	  			if (r.x < centerFace) {
	  				leftEye = r;
	  			} else {
	  				rightEye = r;
	  			}
	  			if (rightEye != null && leftEye != null) {
	  				break;
	  			}
	  		}
	  	}
	  	if (rightEye != null) {
	  		if (!this.rightEyeSmoother.initialized) {
	  			this.rightEyeSmoother.init(rightEye);
	  		}
	  		this.rightEyeLocation = this.rightEyeSmoother.smooth(rightEye);
	  	}
	  	if (leftEye != null) {
		  	if (!this.leftEyeSmoother.initialized) {
	  			this.leftEyeSmoother.init(leftEye);
	  		}
	  		this.leftEyeLocation = this.leftEyeSmoother.smooth(leftEye);	
	  	}
	  }

}

gazetrackr.FaceTracker.prototype.trackEyes2 = function(imageData) {
  	var ctx = this.ctx;
  	var ctx2 = this.ctx2;
  	var eyeScale = this.eyeScale;
  	ctx.clearRect(0, 0, this.w, this.h);
  	ctx2.clearRect(0, 0, this.w, this.h);
  	ctx.putImageData(imageData, -this.faceLocation.x, -this.faceLocation.y);
  	ctx2.drawImage(this.canvas, 0, 0);
  	//, -this.faceLocation.x, -this.faceLocation.y, this.faceLocation.width * 2, this.faceLocation.height * 2);
  	
  	// // Track eyes
  	jsfeat.imgproc.grayscale(ctx2.getImageData(0, 0, this.w, this.h), this.img_u8.data);
	  rects = this._haarMatch(jsfeat.haar.eye, this.eyeOptions);

	  if (rects.length > 0) {
	  	var on = rects.length;
	  	jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
	  	var leftEye = null;
	  	var rightEye = null;
	  	for (var i = 0; i < on; i++) {
	  		var r = rects[i];
	  		if (r.x + r.width < this.faceLocation.width * eyeScale &&
	  			r.y + r.height < this.faceLocation.height * eyeScale) {
	  			if (r.x < this.faceLocation.width * eyeScale / 2) {
	  				leftEye = r;
	  			} else {
	  				rightEye = r;
	  			}
	  			if (rightEye != null && leftEye != null) {
	  				break;
	  			}
	  		}
	  		if (i == 0) {
	  			ctx2.strokeRect(r.x, r.y, r.width, r.height);
	  		}
	  	}
	  	if (rightEye != null) {
	  		if (!this.rightEyeSmoother.initialized) {
	  			this.rightEyeSmoother.init(rightEye);
	  		}
	  		this.rightEyeLocation = gazetrackr.convertEyeRect(this.rightEyeSmoother.smooth(rightEye), this.faceLocation, eyeScale);
	  		ctx2.strokeRect(rightEye.x, rightEye.y, rightEye.width, rightEye.height);
	  	}
	  	if (leftEye != null) {
		  	if (!this.leftEyeSmoother.initialized) {
	  			this.leftEyeSmoother.init(leftEye);
	  		}
	  		ctx2.strokeRect(leftEye.x, leftEye.y, leftEye.width, leftEye.height);
	  		this.leftEyeLocation = gazetrackr.convertEyeRect(this.leftEyeSmoother.smooth(leftEye), this.faceLocation, eyeScale);	
	  	}
	  }
}

gazetrackr.convertEyeRect = function(eyeRect, faceLocation, scale) {
	var rect = {};
	rect.x = faceLocation.x + eyeRect.x / scale;
	rect.y = faceLocation.y + eyeRect.y / scale;
	rect.width = eyeRect.width / scale;
	rect.height = eyeRect.height / scale;
	return rect;
}