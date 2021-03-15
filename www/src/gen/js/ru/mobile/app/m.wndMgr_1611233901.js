utils.overrideMethod(WndMgr, 'prepareInit', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.zOffsetPopup = 10000;
	
	this.setWndSwipeTime(ls.getWndSwipeTime(300))
        .setBarAnimTime(ls.getBarAnimTime(500));
    
    if( debug.useTransformZoom() )
        this.zoom = {max: 3, min: 1, val: 1};
	
	this.screens = {};
	
	this.bars = {};
	
	this.originViewArea = this.getViewArea();
	
	if( this.documentElement.animate && this.documentElement.style ){
		this.useHardwareAnimation = true;
		
		WndMgr.prototype.runSwipeAnimation = WndMgr.prototype.runHardwareSwipeAnimation;
	}
	
	this.swipeLocked = 0;
});

utils.overrideMethod(WndMgr, 'initWrp', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.$wndLayer = this.wrp.find('.wnd-layer');
	
    this.$wndLayer._bound_ = {}; // Хранит фактические границы слоя (без учета анимации)
	
	if( debug.useTransformZoom() ){
		this.$zoomWrp = this.$html;
//		this.$zoomWrp = this.wrp;
	
		this.$zoom = this.$body;
//		this.$zoom = this.cont;

		this.wrp = this.cont;
	}
});

utils.overrideMethod(WndMgr, 'bindEvents', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.$document.on('focusin', function(e){
		wndMgr.tryScrollToFocused({
			elem: e.target,
			focusEvent: e
		});
	});
    
	if( debug.useTransformZoom() ){
		// Установка точки второго касания
		this.$zoomWrp
				.on('touchstart', function(e){
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
				.on('touchmove', function(e){
					if( !window.secondTouchSetted )
						return;

					e.preventDefault();
					e.stopImmediatePropagation();
				})
				.on('touchend', function(e){
					if( !window.secondTouchSetted )
						return;

					e.preventDefault();
					e.stopImmediatePropagation();

					delete window.secondTouchSetted;
				});

		this.$zoomWrp
			.on('touchstart', function(e){
				wndMgr.touchStart(e.originalEvent);
			})
			.on('touchmove', function(e){
				wndMgr.touchMove(e.originalEvent);
			})
			.on('touchend touchcancel', function(e){
				wndMgr.touchEnd(e.originalEvent);
			});
	}
});

utils.overrideMethod(WndMgr, 'notifFullScreen', function __method__(){
	__method__.origin.apply(this, arguments);
	
    setTimeout(function(){
        notifMgr.runEvent(Notif.ids.applResize);
    }, 1000);
});
    
	if( debug.useTransformZoom() ){
		WndMgr.prototype.getTouchPos = function(touch, opt){
			var pos = utils.getPosFromEvent(touch, 'page');
			
			pos = this.convertTouchToView(pos, opt);
			
			return pos;
		};

		WndMgr.prototype.convertTouchToView = function(pos, opt){
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

		WndMgr.prototype.touchStart = function(e){
			if( e.touches.length > 1 || window.secondTouch ){
				this.zoomStart(e);

				return;
			}

	//			this.touchStartPos = this.getTouchPos(e.touches[0], {noConvert: true});
	//			
	//			this.curTouchPos = this.touchStartPos;
	//			
	//			this.startHold();
		};

		WndMgr.prototype.touchMove = function(e){
	//		this.touchMoved = true;
	//
	//		if( !this.holdComplited )
	//			this.stopHold();

			if( e.touches.length > 1 || window.secondTouch ){
				this.zoomMove(e);

				return;
			}
		};

		WndMgr.prototype.touchEnd = function(e){
			var touches = e.touches;

			if( touches.length && window.secondTouch ){
				touches = [
					e.touches[0],
					window.secondTouch
				];
			}

			if( touches.length > 1 ){
	//			this.checkMouseClick();

				return;
			}
			else if( touches.length == 1 ){
				this.zoomEnd(e);

				return;
			}

			this.zoomEnd(e);

	//		this.checkMouseClick();

	//		this.stopHold();
		};

		// Зум
		WndMgr.prototype.zoomStart = function(e){
			if( e.__stopWndZoom )
				return;

			var touches = e.touches;

			if( window.secondTouch ){
				touches = [
					e.touches[0],
					window.secondTouch
				];
			}

	//		e.preventDefault();

	//		if( !this.holdComplited )
	//			this.stopHold();
	//
	//		this.touchMoved = true;

			this.touchEnd(e);

	//		this.touchMoved = true;

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

		WndMgr.prototype.zoomMove = function(e){
			if( !this.zooming )
				return;

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

		WndMgr.prototype.zoomEnd = function(e){
			if( false ){
				wndMgr.cont.find('.zoom-point').remove();
			}

			delete this.zooming;
		};

		WndMgr.prototype.moveViewTo = function(pos){
			if( !pos )
				return;

			var contWrp = this.$zoomWrp.get(0);

			contWrp.scrollLeft = (pos.x * this.zoom.val) - (this.$zoomWrp.width() * 0.5);
			contWrp.scrollTop = (pos.y * this.zoom.val)  - (this.$zoomWrp.height() * 0.5);
		};

		WndMgr.prototype.initZooming = function(zooming, pointFocus, opt){
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

		WndMgr.prototype.getZoomPointFocusOffset = function(newZoom, zooming){
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
			WndMgr.prototype.smoothZoom = function(pointFocus){
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

			WndMgr.prototype.iterSmoothZoom = function(){
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

			WndMgr.prototype.stopSmoothZoom = function(){
				if( this.smoothZooming )
					this.clearTimeout(this.smoothZooming.TO);

				delete this.smoothZooming;
			};


		WndMgr.prototype.setZoom = function(zoom, ignore){
			if( ignore === true )
				return this.zoom.val;

			zoom = zoom||this.zoom.val;

			zoom = Math.max(zoom, this.zoom.min);

			zoom = Math.min(zoom, this.zoom.max);

			if( this.zoom.val == zoom )
				return zoom;

			this.zoom.val = zoom;

			this.$zoom.css({transform: 'scale('+ zoom +')'});

			return zoom;
		};

		WndMgr.prototype.getZoom = function(){
			return this.zoom;
		};
	}
	
WndMgr.prototype.bindCloseAll = function(){	
	this.cont
		.on('touchstart', '.js-wnd-close', function(e){
			wndMgr.closeAllTO = setTimeout(function(){
				wndMgr.closeAll();
				
				sndMgr.vibrate(50);
			}, 500);
		})
		.on('touchmove', '.js-wnd-close', function(){
			clearTimeout(wndMgr.closeAllTO);
		})
		.on('touchend', '.js-wnd-close', function(){
			clearTimeout(wndMgr.closeAllTO);
		});
};


WndMgr.prototype.getList = function(wnd){
	if( wnd && wnd.getWndList )
		return wnd.getWndList();
	
	return this.list;
};

WndMgr.prototype.trySetHash = WndMgr.prototype.setHash;


WndMgr.prototype.getWindowSize = function(){
    //return {width: wndMgr.window.innerWidth, height: Math.min(wndMgr.window.innerHeight, wndMgr.window.outerHeight)}; // При переходе в полноэкранный режим outerHeight может быть больше чем innerHeight (пока замеченно только в фоксе)
    return {width: wndMgr.body.clientWidth, height: wndMgr.body.clientHeight};
};

WndMgr.prototype.getViewArea = function(size){
	size = size||wndMgr.getWindowSize();
	
	return size.width + size.height;
};


WndMgr.prototype.setWndSwipeTime = function(swipeTime){
	this.swipeTime = +swipeTime;
    
    ls.setWndSwipeTime(this.swipeTime);
    
    return this;
};

    WndMgr.prototype.getWndSwipeTime = function(){
        return this.swipeTime;
    };

WndMgr.prototype.setBarAnimTime = function(barAnimTime){
    this.barAnimTime = +barAnimTime;
    
    var $barAnimation = this.$head.find('.barAnimation'),
        cssRule =  '.-if-mob .-state-barAnimation .wnd-mob-wrp,' +  
                   '.-if-mob .-state-barAnimation .wnd-cont-wrp,' + 
                   '.-if-mob .-state-barAnimation .panel-cont-wrp,' + 
                   '.-if-mob .-state-barAnimation .wnd-layer,' + 
                   '.-if-mob .-state-barAnimation .quest-listWrp,' + 
                   '.-if-mob .-state-barAnimation .map-canvas,' + 
                   '.-if-mob .-state-barAnimation .menuBar-wrp[data-side="bottom"]' + 
                   this.getBarAnimCls() + 
                    '{-webkit-transition-duration: ' + Math.max(this.barAnimTime, 0) + 'ms; transition-duration: ' + Math.max(this.barAnimTime, 0) + 'ms;}';
    
    if( !$barAnimation.length ){
        $barAnimation = $('<style></style>').addClass('barAnimation');
        
        this.$head.append($barAnimation);
    }
    
    $barAnimation.text(cssRule);
    
    ls.setBarAnimTime(this.barAnimTime);
    
    return this;
};

    WndMgr.prototype.getBarAnimTime = function(){
        return this.barAnimTime;
    };
    
    WndMgr.prototype.getBarAnimCls = function(){
        return '';
    };
    
WndMgr.prototype.toggleBarAnimation = function(toggle){
    if( this.barAnimCounter === undefined )
        this.barAnimCounter = 0;
    
    if( toggle ){
        if( this.barAnimCounter == 0 ){
            this.cont.addClass('-state-barAnimation');
            
            notifMgr.runEvent(Notif.ids.mobBarExpandStart);
        }
    }
    else{
        if( this.barAnimCounter == 1 ){
            wndMgr.cont.removeClass('-state-barAnimation');
            
            notifMgr.runEvent(Notif.ids.mobBarExpandEnd);
        }
    }
    
    this.barAnimCounter += toggle ? 1 : -1;
    
    this.barAnimCounter = Math.max(this.barAnimCounter, 0);
};
    

WndMgr.prototype.canSwipe = function(wnd){
	var can = !(this.getSwipingWnd() || this.isSwipeLocked());
	
	if( can && wnd )
		can = !(!wnd.wrp || !wnd.options.swiped || wnd == this.getTopWnd());
		
	return can;
};

WndMgr.prototype.lockSwipe = function(){
	++this.swipeLocked;
};

WndMgr.prototype.unlockSwipe = function(){
	--this.swipeLocked;
	
	if( this.swipeLocked < 0 )
		this.swipeLocked = 0;
};

WndMgr.prototype.isSwipeLocked = function(){
	return this.swipeLocked > 0;
};

WndMgr.prototype.canSwipeNext = function(nextWnd, wnd){
	return !(!nextWnd || nextWnd == wnd);
};

WndMgr.prototype.swipeNextWnd = function(wnd, opt){
	if( !wnd || !this.canSwipe() )
		return;
	
	var wndList = wndMgr.getSwipedWndList();
				
	if( !wndList.length )
		return;
	
	opt = opt||{};
	
	var wndIndex = +(opt.wndPos !== undefined ? opt.wndPos : wndMgr.getWndIndex(wnd, wndList)),
		dir = opt.dir === undefined ? 1 : opt.dir,
		nextWnd = wndList[wndIndex+dir];
	
	if( !nextWnd ){
		wndIndex = dir > 0 ? 0 : wndList.length - 1;
		
		nextWnd = wndList[wndIndex];
	}
	
	if( !wndMgr.canSwipeNext(nextWnd, wnd) )
		return;
	
	wndMgr.swipeWnd(nextWnd, {dirRight: !(dir > 0)});
};

WndMgr.prototype.swipeWnd = function(wnd, opt){
	opt = opt||{};
	
	this.checkSwipeConflict(wnd);
	
	if( !wnd || !this.canSwipe(wnd) )
		return;
	
	this.hideTooltip();
	
	this.abortTouchSwiping();
	
	// Активируем окно, которое уже существует в карусели.
	// Ищем в какую сторону быстрее добратся до будущего активного окна, 
	// относительно текущего активного (определяем направление свайпа)
	if( opt.wndIdent )
		opt.dirRight = this.isSwipeDirRight(wnd);
    
	if( !opt.noPrepare )
		wnd.wrp.css({opacity: 0});
	
	if( !wnd.isActive() )
		this.setActiveWnd(wnd);
	
	wnd.showCont();
	
	if( !opt.noResize )
		wnd.resize(true);
	
	wnd.onSwipe();
	
	if( this.immediateShowWnd || wnd.showImmediately() ){
		this.setTopWnd(wnd);
		
		return;
	}
	
	this.setSwipingWnd(wnd);
	
	this.doSwipe(wnd, opt);
};
    
	WndMgr.prototype.isSwipeDirRight = function(wnd){
		var list = this.getSwipedWndList(),
			wndIndex = this.getWndIndex(wnd, list),
			topWndIndex = this.getWndIndex(this.getTopWnd(), list),
			dI = topWndIndex - wndIndex,
			length = list.length,
			lOffset = (dI+length)%length,
			rOffset = length - lOffset;
		
		if( lOffset == rOffset )
			return dI > 0;
		
		return rOffset > lOffset;
	};
    
    
WndMgr.prototype.hideTooltip = function(delay){
	setTimeout(function(){tooltipMgr.hide();}, delay||0);
};

WndMgr.prototype.checkSwipeConflict = function(wnd){
	if( !wnd || !wnd.options.swiped )
		return;
	
	var swipingWnd = this.getSwipingWnd();
	
	if( swipingWnd && swipingWnd != wnd )
		this.cancelSwipe(swipingWnd, {byNewSwipe: wnd});
};

WndMgr.prototype.doSwipe = function(wnd, opt){
	wnd.toggleSwiping(true);
	
	wnd.onSwipeStart();
	
	this.runSwipeAnimation(wnd, opt);
};

WndMgr.prototype.cancelSwipe = function(wnd, opt){
	if( !wnd )
		return;
	
	opt = opt||{};
	
	wnd.hideCont();
	
	var finishOpt = {};
	
	if( opt.byRemove ){
		if( this.getBackWnd() ){	
			this.topWnd = wnd;
			
			finishOpt.dontSetTopWnd = true;
		}
		else{
			wnd.preventSwipeNextWnd = true;
			
			finishOpt.setOldTopWnd = true;
		}
	}
	else if( opt.byNewSwipe )
		finishOpt.dontSetTopWnd = true;
	
	this.finishSwiping(wnd, finishOpt);
	
	wnd.onSwipeCancel(wnd, finishOpt);
};

WndMgr.prototype.runHardwareSwipeAnimation = function(wnd, opt){
	var initCSS, endCSS = {
		opacity: 1,
		transform: 'translateX(0)'
	};
	
	if( !opt.noPrepare ){
		initCSS = {
			transform: 'translateX(' + (wnd.getSwipeOffset() * (opt.dirRight ? -1 : 1)) + 'px)',
			opacity: 0
		};
	}
	
	utils.animateElem(wnd.wrp.get(0), {
		initCSS: initCSS,
		endCSS: endCSS,
		callback: function(){
			wndMgr.onSwipeEnd(wnd);
		},
		anim: {duration: opt.swipeTime === undefined ? this.swipeTime : opt.swipeTime}
	});
};

WndMgr.prototype.runCSSSwipeAnimation = function(wnd, opt){
	if( !opt.noPrepare )
		wnd.wrp.css({left: wnd.getSwipeOffset() * (opt.dirRight ? -1 : 1)});
	
	wnd.wrp.animate({left: 0, opacity: 1}, opt.swipeTime === undefined ? this.swipeTime : opt.swipeTime, function(){
		wndMgr.onSwipeEnd(wnd);
	});
};

WndMgr.prototype.runSwipeAnimation = WndMgr.prototype.runCSSSwipeAnimation;

WndMgr.prototype.onSwipeEnd = function(wnd){
	this.finishSwiping(wnd, {callback: function(wnd){
		wnd.onSwipeEnd();
	}});
};

WndMgr.prototype.finishSwiping = function(wnd, opt){
	if( !wnd || !wnd.isSwiping() )
		return;
	
	opt = opt||{};
	
	wnd.toggleSwiping(false);
	
	if( wnd == this.getSwipingWnd() )
		this.unsetSwipingWnd();
	
	if( opt.dontSetTopWnd )
		return;
	
	if( opt.setOldTopWnd )
		wnd = this.getTopWnd(true);
	
	this.setTopWnd(wnd);
	
	if( opt.callback )
		opt.callback(wnd, opt);
};

WndMgr.prototype.abortTouchSwiping = function(){
	if( this.touchSwipingWnd )
		this.touchSwipingWnd.abortSwipe();
};


WndMgr.prototype.setTopWnd = function(wnd){
	if( !wnd )
		return;
	
	this.topWnd = wnd;
	
	wnd.wrp.css({opacity: 1});
	
	if( !wnd.isActive() )
		this.setActiveWnd(wnd);
	
	this.hideInactiveWnds();
	
	if( this.bars.navBar )
		this.bars.navBar.setWnd(wnd);
	
	wnd.onTop();
	
	this.removeBackWnd();
};

WndMgr.prototype.getTopWnd = function(ignoreSwipingWnd){
	return (!ignoreSwipingWnd && this.getSwipingWnd())||this.topWnd;
};

WndMgr.prototype.findTopWnd = function(){
	var list = this.getSwipedWndList();
	
	for(var wnd in list){
		wnd = list[wnd];
		
		if( wnd.isActive() )
			return wnd;
	}
	
	return false;
};

WndMgr.prototype.setBackWnd = function(wnd){
	this.backWnd = wnd;
};

WndMgr.prototype.getBackWnd = function(){
	return this.backWnd;
};

WndMgr.prototype.removeBackWnd = function(){
	if( !this.backWnd )
		return;
	
	this.backWnd.deleteWrp();
	
	delete this.backWnd;
};

WndMgr.prototype.setSwipingWnd = function(wnd){
	this.swipingWnd = wnd;
};

WndMgr.prototype.unsetSwipingWnd = function(){
	delete this.swipingWnd;
};

WndMgr.prototype.getSwipingWnd = function(){
	return this.swipingWnd;
};

WndMgr.prototype.setTouchSwipingWnd = function(wnd){
	this.touchSwipingWnd = wnd;
};

WndMgr.prototype.getTouchSwipingWnd = function(wnd){
	return this.touchSwipingWnd;
};

WndMgr.prototype.unsetTouchSwipingWnd = function(){
	delete this.touchSwipingWnd;
};

WndMgr.prototype.tryShowScreen = function(scName, scId){
	var screenCls = wndMgr.getScreenClassByHash(scName);
	
	if( screenCls )
		return this.showScreen(screenCls, scId);
};

WndMgr.prototype.getScreenClassByHash = function(hash){
	var screenCls = wndMgr.getWndClassesByHash(hash)[0];
	
	if( screenCls && screenCls.prototype instanceof ScreenWnd )
		return screenCls;
};

WndMgr.prototype.showScreen = function(screenCls, scId){
	wndMgr.immediateShowWnd = !wndMgr.getSwipedWndList().length;
	
	var wnd = wndMgr.addWnd(screenCls, scId);
	
	wndMgr.immediateShowWnd = false;
	
	return wnd;
};

WndMgr.prototype.setScreen = function(screen){
	this.screen = screen;
	
	screen.onSetted();
};

WndMgr.prototype.getScreen = function(){
	return this.screen;
};

WndMgr.prototype.swipeToScreen = function(){
	if( wndMgr.getScreen() != wndMgr.getTopWnd() )
		wndMgr.prepareWndToAdd(wndMgr.getScreen());
};


WndMgr.prototype.hideInactiveWnds = function(){
	var wndList = this.getSwipedWndList();
	
	for(var wnd in wndList){
		wnd = wndList[wnd];
		
		if( !wnd.isActive() )
			wnd.hideCont();
	}
};

WndMgr.prototype.getSwipedWndPosByСommonPos = function(pos, list){
	var swipedPos = pos;
	
	list = list||this.getList();
	
	for(var i = 0; i < pos; i++){
		if( !list[i].options.swiped )
			swipedPos--;
	}

	return swipedPos;
};

utils.overrideMethod(WndMgr, 'activatePrev', function __method__(wndPos, wnd){
	if( !wnd.options.swiped || this.getTopWnd(true) != wnd || wnd.preventSwipeNextWnd ){
		delete this.needUnsetHash;
		
		return;
	}
	
	this.swipeNextWnd(wnd, {
		wndPos: +this.getSwipedWndPosByСommonPos(wndPos), 
		dir: -1
	});
});

utils.overrideMethod(WndMgr, 'updActiveWnd', function __method__(wndOrPanel, list){
	if( this.getSwipingWnd() ){
		if( !wndOrPanel.options.swiped )
			wndOrPanel.setActiveCls(true);
		
		return;
	}
	
	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(WndMgr, 'deactivateActiveWnd', function __method__(list){
	if( this.getSwipingWnd() )
		return;
	
	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(WndMgr, 'resize', function __method__(){
	var size = this.getWindowSize();
    
    //this.$html.css('height', size.height); // Устанавливаем высоту корневому элементу такую же, как у окна браузера
    //wndMgr.addAlert(JSON.stringify(size));
    
	this.resetScrollView();
    
	this.wrp.toggleClass('-ori-landscape', this.isLandscape(size));
	
	this.checkKeyboard(size);
	
	this.resizeBars();
	
	this.resizeWndLayer(size);
	
	if( this.wndChat )
		this.wndChat.resize(true);
	
	var wnd = this.getTopWnd();
	
	if( wnd )
		wnd.resize(true);
	
	__method__.origin.call(this);
	
	this.tryScrollToFocused({delay: -1});
});

WndMgr.prototype.checkKeyboard = function(size){
    var wasKeyboardState = this.isKeyboardOpen(),
        curKeyboardState = this.isKeyboardOpen(false, size);
    
    // lastResizeByKeyboard может устанавливаться не точно, т.к при открытой клавиатуре и повороте устройства, 
    // событие onresize может вызываться дважды (первый раз без учёта клавиатуры, второй с учётом)
    this.lastResizeByKeyboard = wasKeyboardState != curKeyboardState;
    
    this.wrp.toggleClass('-screen-keyboard', curKeyboardState);
};

WndMgr.prototype.clearList = function(list){
	this.clearWnd(list);
};

utils.overrideMethod(WndMgr, 'clearWnd', function __method__(list){
	wndMgr.prepareWndToAdd(this.getScreen());
	
	if( list )
		this.closeWndList(list);
	else
		__method__.origin.apply(this, arguments);
});

utils.overrideMethod(WndMgr, 'closeWndList', function __method__(wndList){
	if( !wndList || !wndList.length )
		return;
	
	var topWnd = this.getTopWnd(true);
	
	if( topWnd ){
		// Если в момент чистки верхнее окно - это город/карта, запрещаем свайп
		if( topWnd == this.getScreen() )
			this.lockSwipe();
		else{
			var pos = wndList.indexOf(topWnd);
			
			if( !(pos < 0) )
				wndList.unshift(wndList.splice(pos, 1)[0]); // Первым всегда удаляем окно, которое находится "на верху"
		}
	}
	
	__method__.origin.apply(this, arguments);
	
	this.unlockSwipe();
});


WndMgr.prototype.resetScrollView = function(){
	// При скроле к сфокусированному элменту может происходить прокрутка контента внутри блока $wndLayer (несмотря на то, что у него overflow: hidden).
	// Хотя при ресайзе прокрутка должна сбрасываться (для элементов, которые могут редактировать текст вроде всегда сбрасывается), на всякий случай подстраховываемся.
	// Возможно в будущем можно будет выпилить.
	this.$wndLayer.scrollTop(0).scrollLeft(0);
};

WndMgr.prototype.tryScrollToFocused = function(opt){
	opt = opt||{};
	
	clearTimeout(this.tryScrollToFocusedTO);
	
	var elem = opt.elem||this.document.querySelector(':focus');
	
	if( !elem )
		return;
	
	if( !this.isFocusableElem(elem) )
		return;
	
	var delay = opt.delay||1000;
	
	if( opt.focusEvent ){
        if( opt.focusEvent.cancelable )
            opt.focusEvent.preventDefault();
		
		clearTimeout(wndMgr.focusoutTO);
		
		if( this.lastFocusedElem ){
			if( elem.__scrollIntoViewId == this.lastFocusedElem.__scrollIntoViewId )
				return;
			
			delay = 50;
		}
	}
	
	elem.onblur = function(){
        wndMgr.focusoutTO = setTimeout(function(){
            delete wndMgr.lastFocusedElem;
        }, 100);
		
        this.onblur = null;
    };
	
	this.lastFocusedElem = elem;
	
	if( delay < 0 )
		wndMgr.scrollToFocused();
	else
		this.tryScrollToFocusedTO = setTimeout(wndMgr.scrollToFocused, delay);
};

WndMgr.prototype.isFocusableElem = function(elem){
	if( !elem || elem.readOnly || elem.disabled )
		return false;
	
	try{
		return typeof(elem.selectionStart) == 'number' || elem.isContentEditable || elem.type == 'number';
	}
	catch(e){
		return false; // В некоторых браузерах, доступ к полю selectionStart, у нетекстовых элементов, может вызвать исключение. Но в обычном случае возвращается null.
	}
	
};


WndMgr.prototype.scrollToFocused = function(){
	var elem = wndMgr.lastFocusedElem;

	if( !elem || wndMgr.getSwipingWnd() )
		return;

	if( !elem.scrollIntoView ){
		elem.blur();
		elem.focus();

		return;
	}
	
	if( wndMgr.scrollIntoViewCounter === undefined )
		wndMgr.scrollIntoViewCounter = 0;
	// Запоминаем уникальный идентификатор сфокусированного элемента.
	// Необходим, чтобы не скролить к нему заново, если была быстрая (такая, что клавиатура не успела скрыться и появиться) потеря и установка фокуса
	if( !elem.__scrollIntoViewId )
		elem.__scrollIntoViewId = ++wndMgr.scrollIntoViewCounter;

	var $elem = $(elem);
	
	if( $elem.data('scroll-view') == 'none' )
		return;
	
	var opt = {
			behavior: 'smooth', 
			block: $elem.data('view-block')||'nearest', 
			inline: $elem.data('view-inline')||'nearest'
		},
		elemRect = elem.getBoundingClientRect(),
		wndSize = wndMgr.getWndSize();
	
	if( wndMgr.isElemRectInView(elemRect, wndSize) )
		return;
	
	if( elemRect.right - elemRect.left > wndSize.width )
		opt.inline = 'nearest';
	
	try{
		elem.scrollIntoView(opt);
	}
	catch(e){
		var alignToTop = $elem.data('view-block') != 'start';
		
		elem.scrollIntoView(alignToTop);
	}
};

WndMgr.prototype.isElemRectInView = function(elemRect, wndSize){
	if( !elemRect )
		return false;
	
	wndSize = wndSize||wndMgr.getWndSize();
	
	return elemRect.left > 0 && elemRect.right < wndSize.width && elemRect.top > 0 && elemRect.bottom < wndSize.height;
};

WndMgr.prototype.isKeyboardOpen = function(elem, size){
	if( !size )
		return this.keyboardIsOpen;
	
	this.keyboardIsOpen = this.getViewArea(size) < this.originViewArea - 100;
	
	if( this.keyboardIsOpen )
		this.keyboardIsOpen = !!(elem||this.document.querySelector(':focus'));
	
	return this.keyboardIsOpen;
};


WndMgr.prototype.resizeBars = function(){
	this.bars.statusBar.resize(true);
	
	if( this.bars.navBar )
		this.bars.navBar.resize(true);
	
	this.bars.menuBar.resize(true);
};

WndMgr.prototype.resizeWndLayer = function(size){
    size = size||this.getWindowSize();
    
	var bounds = this.getWndBounds();
	
    this.$wndLayer._bound_.width = size.width - bounds.left - bounds.right;
    this.$wndLayer._bound_.height = Math.max(size.height - bounds.top - bounds.bottom, 100); // Оставляем минимальную высоту в 100px для корректного позиционированя инпутов при фокусе
    this.$wndLayer._bound_.top = bounds.top;
    this.$wndLayer._bound_.left = bounds.left;
    
	this.$wndLayer.css(bounds);
};

WndMgr.prototype.getWndLayerSize = function(){
    return {width: this.$wndLayer._bound_.width, height: this.$wndLayer._bound_.height};
};

WndMgr.prototype.getWndLayerPos = function(){
    return {top: this.$wndLayer._bound_.top, left: this.$wndLayer._bound_.left};
};

WndMgr.prototype.isLandscape = function(size){
	size = size||this.getWindowSize();
	
	return size.width > size.height;
};

WndMgr.prototype.getScale = function(){
	if( debug.useTransformZoom() )
		return 1/this.getZoom().val;
	
	var topWindow = window.top||window;
	
	if( topWindow.visualViewport )
		return 1/topWindow.visualViewport.scale;
	
	return 1;
};


WndMgr.prototype.getSwipedWndList = function(){
	return this.getWndList({filter: function(wnd){
		return !wnd.options.swiped;
	}});
};

WndMgr.prototype.getCommonWndList = function(){
	return this.getWndList({filter: function(wnd){
		return wnd.options.swiped;
	}});
};

WndMgr.prototype.refreshWnd = function(){
	var list = this.getWndList();
    
    wndMgr.lockSwipe();
    
	for(var wnd in list){
		wnd = list[wnd];
		
		wnd.refresh();
	}
    
    wndMgr.unlockSwipe();
};

WndMgr.prototype.getScreenList = function(excludeList){
	return this.getWndList({filter: function(wnd){
		return !wnd.options.main;
	}, excludeList: excludeList});
};

WndMgr.prototype.updateOrder = function(wndOrPanel){
	var wndIndex = this.getWndIndex(wndOrPanel);
	
	if( wndOrPanel.options.swiped ){
		if( wndIndex == -1 )
			this.list.push(wndOrPanel);
		
		return;
	}
	
	if( wndIndex != -1 )
		this.list.splice(wndIndex, 1);
	
	this.list.push(wndOrPanel);
};

WndMgr.prototype.getStatusBarHeight = function(){
	if( !this.bars.statusBar )
		return 0;
	
	return this.bars.statusBar.getSizePx({ignoreHidden: true}).height;
};

WndMgr.prototype.getMenuHeight = function(){
	if( !this.bars.menuBar )
		return 0;
	
	return this.bars.menuBar.getSizePx({ignoreHidden: true}).height;
};

WndMgr.prototype.addNavBar = function(wnd){
	if( this.bars.navBar || ls.getNoNavBar(debug.isMobileApp()) )
		return;
	
	var navBar = new NavBar();
	
	navBar.show();
	
	if( wnd )
		navBar.setWnd(wnd);
};

WndMgr.prototype.closeNavBar = function(){
	if( this.bars.navBar )
		this.bars.navBar.close();
};

WndMgr.prototype.getNavBarHeight = function(){
	if( this.bars.navBar && this.bars.navBar.hasBound() )
		return this.bars.navBar.getSizePx({ignoreHidden: true}).height;
	
	return 0;
};

WndMgr.prototype.updNavBarScrollCont = function(opt){
	if( this.bars.navBar )
		this.bars.navBar.checkScrollCont(opt);
};

WndMgr.prototype.getWndBounds = function(){
	var bounds = {top: 0, left: 0, right: 0, bottom: 0},
		bound;
	
	for(var bar in this.bars){
		bar = this.bars[bar];
		
		bound = bar.getBound();
		
		for(var b in bound)
			bounds[b] += bound[b];
	}
	
	return bounds;
};

WndMgr.prototype.getWndSize = function(){
	var size = this.getWindowSize();
	
	size.height -= this.getStatusBarHeight();
	
	return size;
};

WndMgr.prototype.setContHight = function(height){
	return;
	
	if( height === undefined )
		return;
	
	wndMgr.cont.height(height + this.getStatusBarHeight());
};

WndMgr.prototype.addBar = function(bar){
	this.bars[bar.getName()] = bar;
};

WndMgr.prototype.toggleBars = function(hide, byOpt){
	ls.setLandscapeNoPanels(hide);
	
	notifMgr.runEvent(Notif.ids.mobToggleBars, {hide: hide, byOpt: byOpt});
	
	for(var bar in this.bars){
		this.bars[bar].resize();
	}
};

WndMgr.prototype.toggleMenuSide = function(side){
	if( !this.bars.menuBar )
		return;
	
	this.bars.menuBar.toggleExpand(false, {callback: function(){
		ls.setMenuSide(side);
        
        if( wndMgr.isLandscape() )
            return;
        
		this.makeResize();
		
		this.toggleExpand(true);
	}});
};



WndMgr.prototype.showInterface = function(ifName, ifId){
	this.tryShowScreen(ifName, ifId);
};

WndMgr.prototype.setScreenHash = function(screen){
	this.screenHash = screen;
};

WndMgr.prototype.getScreenHash = function(screen){
	return this.screenHash;
};



WndMgr.prototype.addPopupWnd = function(type, contOrTmpl, options){
	var list = this.getWndList({filter: function(wnd){
		return wnd.options.swiped;
	}});
	
	var wnd = new type(contOrTmpl, options);
	
	this.blur();
	
	this.deactivateActiveWnd(list);
	
	wnd.appendToList();
	
	wnd.show();
	
	return wnd;
};