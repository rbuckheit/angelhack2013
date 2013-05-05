
        $(window).load(function() {
            "use strict";

            // lets do some fun
            var video = document.getElementById('webcam');
            var canvas = document.getElementById('canvas');
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
                    $('#canvas').hide();
                    $('#log').hide();
                    $('#no_rtc').html('<h4>WebRTC not available.</h4>');
                    $('#no_rtc').show();
                });
            } catch (error) {
                $('#canvas').hide();
                $('#log').hide();
                $('#no_rtc').html('<h4>Something goes wrong...</h4>');
                $('#no_rtc').show();
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
                canvasWidth  = canvas.width;
                canvasHeight = canvas.height;
                ctx = canvas.getContext('2d');

                ctx.fillStyle = "rgb(0,255,0)";
                ctx.strokeStyle = "rgb(0,255,0)";

                var scale = Math.min(max_work_size/video.videoWidth, max_work_size/video.videoHeight);
                var w = (video.videoWidth*scale)|0;
                var h = (video.videoHeight*scale)|0;

                img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
                edg = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
                work_canvas = document.createElement('canvas');
                work_canvas.width = w;
                work_canvas.height = h;
                work_ctx = work_canvas.getContext('2d');
                ii_sum = new Int32Array((w+1)*(h+1));
                ii_sqsum = new Int32Array((w+1)*(h+1));
                ii_tilted = new Int32Array((w+1)*(h+1));
                ii_canny = new Int32Array((w+1)*(h+1));

                options = new demo_opt();

                faceTracker = new gazetrackr.FaceTracker(video);
                console.log(faceTracker.canvas);
                $("body").append($("<center></center>").append(faceTracker.canvas2));
            }

            function tick() {
                compatibility.requestAnimationFrame(tick);
                if (video.readyState === video.HAVE_ENOUGH_DATA) {

                    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

                    work_ctx.drawImage(video, 0, 0, work_canvas.width, work_canvas.height);
                    var imageData = work_ctx.getImageData(0, 0, work_canvas.width, work_canvas.height);


                    faceTracker.process(imageData);

                    var sc = canvasWidth/img_u8.cols;
                    var r = faceTracker.faceLocation;
                    drawRect(ctx, r, sc);
                    r = faceTracker.rightEyeLocation;
                    drawRect(ctx, r, sc);
                    r = faceTracker.leftEyeLocation;
                    drawRect(ctx, r, sc);
                }
            }

            function drawRect(ctx, r, sc) {
                if (r!= null) {
                    ctx.strokeRect((r.x*sc)|0,(r.y*sc)|0,(r.width*sc)|0,(r.height*sc)|0);
                }
            }

            function draw_faces(ctx, rects, sc, max) {
                var on = rects.length;
                var r;
                if(on && max) {
                    jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
                }
                if (rects.length > 0) {
                    if (!smoother.initialized) {
                        smoother.init(rects[0]);
                    }
                    var r = smoother.smooth(rects[0]);
                    ctx.strokeRect((r.x*sc)|0,(r.y*sc)|0,(r.width*sc)|0,(r.height*sc)|0);
                }
                return r;
                // var n = max || on;
                // n = Math.min(n, on);
                // var r;
                // for(var i = 0; i < n; ++i) {
                //     r = rects[i];
                //     ctx.strokeRect((r.x*sc)|0,(r.y*sc)|0,(r.width*sc)|0,(r.height*sc)|0);
                // }
            }

            $(window).unload(function() {
                video.pause();
                video.src=null;
            });
        });
