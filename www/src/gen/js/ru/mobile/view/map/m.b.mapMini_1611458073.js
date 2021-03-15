utils.overrideMethod(bMapMini, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
});

bMapMini.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mini;
};

utils.overrideMethod(bMapMini, 'getData', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.zoom = {max: 6, min: 1, val: 1};
});

bMapMini.prototype.modifyCont = function(){
	this.$zoom = this.cont.find('.minimap_imgCrop');
	this.$zoomWrp = this.$zoom.wrap(snip.wrp('minimap-zoom-wrp', '', 'div')).parent();
	
	this.$pointer = this.$zoom.find('.minimap_view');
};

utils.overrideMethod(bMapMini, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.bindTouchEvent();
	
	this.bindScrollEvent();
});
	
	bMapMini.prototype.bindMouseEvent = function(){};
	
	bMapMini.prototype.bindTouchEvent = function(){
		var self = this;
		
		if( false ){
			// Установка точки второго касания
			this.wrp
					.on('touchstart', '.minimap_imgCrop', function(e){
						e = e.originalEvent||e;

						if( !e.ctrlKey )
							return;

						e.preventDefault();
						e.stopImmediatePropagation();

						if( window.secondTouch ){
							delete window.secondTouch;
							delete wndMgr.$pointC;

							wndMgr.cont.find('.zoom-point').remove();

							return;
						}

						window.secondTouch = e.touches[0];

						wndMgr.cont.find('.zoom-point').remove();
						wndMgr.$pointC = $('<div class="zoom-point"></div>');
						wndMgr.cont.append(wndMgr.$pointC);
						wndMgr.$pointC.css({
							left: window.secondTouch.pageX - 30,
							top: window.secondTouch.pageY - 30
						});

						window.secondTouchSetted = true;
					})
					.on('touchmove', '.minimap_imgCrop', function(e){
						if( !window.secondTouchSetted )
							return;

						e.preventDefault();
						e.stopImmediatePropagation();
					})
					.on('touchend', '.minimap_imgCrop', function(e){
						if( !window.secondTouchSetted )
							return;

						e.preventDefault();
						e.stopImmediatePropagation();

						delete window.secondTouchSetted;
					});
		}
		
		this.wrp
				.on('touchstart', '.minimap_imgCrop', function(e){
					self.touchStart(e.originalEvent);
				})
				.on('touchmove', '.minimap_imgCrop', function(e){
					self.touchMove(e.originalEvent);
				})
				.on('touchend touchcancel', '.minimap_imgCrop',function(e){
					self.touchEnd(e.originalEvent);
				});
	};
	
	bMapMini.prototype.bindScrollEvent = function(){
		snip.yScrollHandler(this.wrp, this.parent, {selector: '.minimap-zoom-wrp'});
	};
	
		
		bMapMini.prototype.getTouchPos = function(touch, opt){
			var pos = utils.getPosFromEvent(touch, 'page');
			
			pos = this.convertTouchToView(pos, opt);
			
			return pos;
		};

		bMapMini.prototype.convertTouchToView = function(pos, opt){
			opt = opt||{};
			
			if( opt.noConvert )
				return pos;
			
			var $view = this.$zoomWrp;
			
			if( !opt.ignoreScroll ){
				pos.x += $view.scrollLeft();
				pos.y += $view.scrollTop();
			}
			
			if( !opt.ignoreOffset ){
				var viewOffset = $view.offset();

				pos.x -= viewOffset.left;
				pos.y -= viewOffset.top;
			}
			
			if( !opt.ignoreZoom ){
				var zoomFactor = 1/this.zoom.val;

				pos.x *= zoomFactor;
				pos.y *= zoomFactor;
			}
			
			return pos;
		};
		
		
		bMapMini.prototype.touchStart = function(e){
			if( e.touches.length > 1 || window.secondTouch ){
				this.zoomStart(e);
				
				return;
			}
			
			this.touchStartPos = this.getTouchPos(e.touches[0], {noConvert: true});
			
			this.curTouchPos = this.touchStartPos;
			
			this.startHold();
		};

		bMapMini.prototype.touchMove = function(e){
			this.touchMoved = true;
			
			if( !this.holdComplited )
				this.stopHold();
			
			if( e.touches.length > 1 || window.secondTouch ){
				this.zoomMove(e);
				
				return;
			}
		};

		bMapMini.prototype.touchEnd = function(e){
			var touches = e.touches;
			
			if( touches.length && window.secondTouch ){
				touches = [
					e.touches[0],
					window.secondTouch
				];
			}
			
			if( touches.length > 1 ){
				this.checkMouseClick();
				
				return;
			}
			else if( touches.length == 1 ){
				this.zoomEnd(e);
				
				return;
			}
			
			this.zoomEnd(e);
			
			this.checkMouseClick();
			
			this.stopHold();
		};
		
		// Зум
		bMapMini.prototype.zoomStart = function(e){
			var touches = e.touches;
			
			if( window.secondTouch ){
				touches = [
					e.touches[0],
					window.secondTouch
				];
			}
			
			e.preventDefault();
			
			if( !this.holdComplited )
				this.stopHold();
			
			this.touchMoved = true;
			
			this.touchEnd(e);
			
			this.touchMoved = true;
			
			this.zooming = {};
			
			this.zooming.pointA = new Vector2D(touches[0].pageX, touches[0].pageY);
			this.zooming.pointB = new Vector2D(touches[1].pageX, touches[1].pageY);
			
			// Вектор от a к b
			var vacAB = this.zooming.pointA.clone().diffVector(this.zooming.pointB);
			// Расстояние между пальцами
			this.zooming.lengthAB = vacAB.getLength();
			// Находим точку между пальцами (точка фокусировки - точка к которой будет смещаться центр вида во время зума)
			var pointMid = vacAB.doMultScalar(0.5).addVector(this.zooming.pointB);
			
			this.initZooming(this.zooming, this.getTouchPos({pageX: pointMid.x, pageY: pointMid.y}), {
				start: this.getZoom().val,
				min: this.getZoom().min,
				max: this.getZoom().max
			});
			
			
			
			
			// Вспомагательная хрень
			if( false ){
				this.zooming.$point1 = $('<div class="zoom-point"></div>');
				wndMgr.cont.append(this.zooming.$point1);

				this.zooming.$pointC = $('<div class="zoom-point"></div>');
				wndMgr.cont.append(this.zooming.$pointC);

				this.zooming.$point2 = $('<div class="zoom-point"></div>');
				wndMgr.cont.append(this.zooming.$point2);

				this.zooming.$point1.css({
					left: this.zooming.pointA.x - 30,
					top: this.zooming.pointA.y - 30
				});

				this.zooming.$pointC.css({
					left: pointMid.x - 30,
					top: pointMid.y - 30
				});

				this.zooming.$point2.css({
					left: this.zooming.pointB.x - 30,
					top: this.zooming.pointB.y - 30
				});
			}
		};

		bMapMini.prototype.zoomMove = function(e){
			var touches = e.touches;

			if( window.secondTouch ){
				touches = [
					e.touches[0],
					window.secondTouch
				];
			}

			e.preventDefault();

			this.zooming.pointA.set(touches[0].pageX, touches[0].pageY);
			this.zooming.pointB.set(touches[1].pageX, touches[1].pageY);

			var lengthAB = this.zooming.pointA.getDiffVector(this.zooming.pointB).getLength(),
				zoomK = (lengthAB/this.zooming.lengthAB);
			
			zoomK += (zoomK - 1) * 0.1; // Увеличиваем скорость зума на 10%
			
			var newZoom = this.setZoom(this.zoom.val * zoomK);

			this.moveViewTo(this.getZoomPointFocusOffset(newZoom));

			this.zooming.lengthAB = lengthAB;
			
			
			
			
			// Вспомагательная хрень
			if( false ){
				this.zooming.$point1.css({
					left: this.zooming.pointA.x - 30,
					top: this.zooming.pointA.y - 30
				});
				
				this.zooming.$point2.css({
					left: this.zooming.pointB.x - 30,
					top: this.zooming.pointB.y - 30
				});
			}
		};

		bMapMini.prototype.zoomEnd = function(e){
			if( false ){
				wndMgr.cont.find('.zoom-point').remove();
			}
			
			delete this.zooming;
		};

		bMapMini.prototype.moveViewTo = function(pos){
			if( !pos )
				return;

			var contWrp = this.$zoomWrp.get(0);

			contWrp.scrollLeft = (pos.x * this.zoom.val) - (this.$zoomWrp.width() * 0.5);
			contWrp.scrollTop = (pos.y * this.zoom.val)  - (this.$zoomWrp.height() * 0.5);
		};

		bMapMini.prototype.initZooming = function(zooming, pointFocus, opt){
			if( !zooming )
				return;
			
			utils.copy(zooming, opt);

			zooming.max = zooming.max||2;
			zooming.min = zooming.min||0.5;
			zooming.start = zooming.start||zooming.min;
			zooming.end = zooming.end||zooming.max;
			zooming.toCenter = zooming.toCenter||false;

			if( zooming.toCenter ){
				// Данный параметр необходим для смещения точки фокуса к центру вида во время зума (используется при двойном тапе)
				zooming.centerFactor = zooming.end / (zooming.end - zooming.start);
			}


			// Точка, в координатах вида, которая на момент начала зума находилась в центре вида
			zooming.pointCenter = new Vector2D(this.getTouchPos({
				pageX: this.$zoomWrp.width() * 0.5,
				pageY: this.$zoomWrp.height() * 0.5
			}, {ignoreOffset: true}));
			// Точка фокусировки зума в координатах города
			zooming.pointFocus = new Vector2D(pointFocus||zooming.pointCenter);
			// Вектор от центра к точке фокусировки
			zooming.vecCenterToFocus = zooming.pointFocus.getDiffVector(zooming.pointCenter);
		};
		
		bMapMini.prototype.getZoomPointFocusOffset = function(newZoom, zooming){
			zooming = zooming||this.zooming;
			
			newZoom = Math.min(zooming.max, Math.max(newZoom, zooming.min));

			var offset = (newZoom - zooming.start) / newZoom;

			if( zooming.toCenter )
				offset *= zooming.centerFactor; 

			// Вектор на который сместились от центра к точке фокусировки
			var curVecCenterToFocus = zooming.vecCenterToFocus.getMultScalar(offset),
				// Смещение точки фокусировки с учётом нового зума. Необходимо, чтобы точка фокусировки находилась в том же положении относительно экрана
				curPointFocus = zooming.pointCenter.getAddVector(curVecCenterToFocus);

			return curPointFocus;
		};
			// Плавынй зум к указанной точке
			bMapMini.prototype.smoothZoom = function(pointFocus){
				this.stopSmoothZoom();
				
				var zoom = this.getZoom(),
					zooming = {
						dir: 1,
						zoomK: 0.1,
						start: zoom.val,
						max: zoom.max,
						min: zoom.min
					};
				
				zooming.norm = (zoom.max - zooming.min) * 0.5;
				
				if( zooming.start > zooming.norm ){
					if( zooming.start > zooming.norm + (zooming.max - zooming.norm) * 0.4 )
						zooming.end = zooming.norm;
					else
						zooming.end = zooming.min;
				}
				else{
					if( zooming.start > zooming.norm - (zooming.norm - zooming.min) * 0.5 )
						zooming.end = zooming.min;
					else
						zooming.end = zooming.norm;
				}

				zooming.dir = zooming.start > zooming.end ? -1 : 1;

				zooming.toCenter = zooming.dir > 0;
				

				this.initZooming(this.smoothZooming = zooming, pointFocus);

				this.iterSmoothZoom();
			};

			bMapMini.prototype.iterSmoothZoom = function(){
				var zooming = this.smoothZooming,
					newZoom = this.getZoom().val + (zooming.zoomK * zooming.dir);
				
				newZoom = this.setZoom(newZoom);
				
				this.moveViewTo(this.getZoomPointFocusOffset(newZoom, zooming));
				
				if( (zooming.dir > 0 && newZoom >= zooming.end) || (zooming.dir < 0 && newZoom <= zooming.end) ){
					this.stopSmoothZoom();
					
					return;
				}
				
				zooming.TO = this.setTimeout(this.iterSmoothZoom, 16);
			};

			bMapMini.prototype.stopSmoothZoom = function(){
				if( this.smoothZooming )
					this.clearTimeout(this.smoothZooming.TO);

				delete this.smoothZooming;
			};
		
		
		bMapMini.prototype.setZoom = function(zoom, ignore){
			if( ignore === true ) return this.zoom.val;

			zoom = zoom||this.zoom.val;

			zoom = Math.max(zoom, this.zoom.min);

			zoom = Math.min(zoom, this.zoom.max);

			if( this.zoom.val == zoom )
				return zoom;

			this.zoom.val = zoom;

			this.$zoom.css({transform: 'scale('+ zoom +')'});
			
			this.$pointer.css({transform: 'scale('+ 1/zoom +') rotate(45deg)'});
			
			return zoom;
		};
		
		bMapMini.prototype.getZoom = function(){
			return this.zoom;
		};
		
		// Двойной тап(клик)
		bMapMini.prototype.checkMouseClick = function(){
			this.onMouseClick();
			
			this.touchMoved = false;
		};
		
		bMapMini.prototype.isClickAllowed = function(){
			return !(this.touchMoved || this.holdComplited);
		};
		
		utils.overrideMethod(bMapMini, 'onMouseClick', function __method__(){
			if( !this.isClickAllowed() )
				return;
			
			this.detectDoubleClick();
		});
		
		bMapMini.prototype.detectDoubleClick = function(){
			this.clearTimeout(this.doubleTapTO);
			
			if( this.firstTap ){
				var firstTap = this.firstTap;

				delete this.firstTap;

				if( Math.abs(firstTap.x - this.curTouchPos.x) < 20 && Math.abs(firstTap.y - this.curTouchPos.y) < 20 )
					this.onDoubleClick();
				else
					this.onMouseClick.origin.call(this);

				return;
			}
			else
				this.firstTap = this.curTouchPos;
			
			this.doubleTapTO = this.setTimeout(function(){
				delete this.firstTap;
				
				this.onMouseClick.origin.call(this);
			}, 200);
		};
		
		bMapMini.prototype.onDoubleClick = function(){
			this.smoothZoom(this.convertTouchToView(this.curTouchPos));
		};
		
		// Удерживание
		bMapMini.prototype.startHold = function(){
			this.holdTO = this.setTimeout(function(){
				this.onHoldComplete();
			}, 500);
		};
		
		bMapMini.prototype.stopHold = function(){
			this.clearTimeout(this.holdTO);
			
			delete this.holdTO;
			delete this.holdComplited;
			
			this.onHoldStop();
		};
		
		bMapMini.prototype.onHoldStop = function(){
			this.parent.cont.removeClass('-type-translucency');
		};
		
		bMapMini.prototype.onHoldComplete = function(){
			this.holdComplited = true;
			
			this.parent.abortSwipe();
			
			this.parent.cont.addClass('-type-translucency');
		};
		
		
bMapMini.prototype.makeResize = function(){
	this.setView(true);
};


utils.overrideMethod(bMapMini, 'setView', function __method__(byResize){
	// Устанавливем вид только при ресайзе
	if( !byResize )
		return;
	
	__method__.origin.apply(this, arguments);
});

bMapMini.prototype.getMap = function(){
	return this.parent.parent.map.map;
};

bMapMini.prototype.calcFrameSize = function($frame){
	var frameSize = {},
		$ppContWrp = this.parent.parent.$contWrp;
	
	frameSize.x = $ppContWrp.width() - $frame.find('.minimap_btns').width();
	frameSize.y = frameSize.x / (lib.map.size.x / lib.map.size.y);
	
	if( frameSize.y + 30 > $ppContWrp.height() ){
		frameSize.y = $ppContWrp.height() - 30;
		frameSize.x = frameSize.y * lib.map.size.x / lib.map.size.y;
	}
	
	return frameSize;
};


bMapMini.prototype.getClickPos = function(){
	return {
		x: this.curTouchPos.x, 
		y: this.curTouchPos.y
	};
};

utils.overrideMethod(bMapMini, 'calcClickPos', function __method__(event, frameOffset){
	var pos = __method__.origin.apply(this, arguments);
	
	pos.x *= 1/this.zoom.val;
	pos.y *= 1/this.zoom.val;
	
	return pos;
});