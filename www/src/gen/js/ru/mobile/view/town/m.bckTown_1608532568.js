mBckTown = function(){};

mBckTown.prototype.detectDoubleClick = function(noOriginClick){
	this.clearTimeout(this.doubleTapTO);

	if( this.firstTap ){
		var firstTap = this.firstTap;

		delete this.firstTap;

		if( Math.abs(firstTap.x - this.posWtl.x) < 20 && Math.abs(firstTap.y - this.posWtl.y) < 20 )
			this.onDoubleClick();
		else if( !noOriginClick )
			this.onMouseClick.origin.call(this);;

		return;
	}
	else
		this.firstTap = this.posWtl;

	this.doubleTapTO = this.setTimeout(function(){
		delete this.firstTap;
        
		if( !noOriginClick )
			this.onMouseClick.origin.call(this);;
	}, 200);
};

mBckTown.prototype.onDoubleClick = function(){
	this.smoothZoom(this.posWtl);
};
// Зум
mBckTown.prototype.zoomStart = function(e){
	var touches = e.touches;

	if( window.secondTouch ){
		touches = [
			e.touches[0],
			window.secondTouch
		];
	}
	
	
	
	this.stopDrawView();
	
	e.preventDefault();
	
	if( debug.useTransformZoom() )
		e.__stopWndZoom = true;
	
	this.touchMoved = true;
	
	this.touchEnd(e);
	
	this.touchMoved = true;

	this.zooming = {};
	
	this.zooming.pointA = new Vector2D(touches[0].pageX, touches[0].pageY);
	this.zooming.pointB = new Vector2D(touches[1].pageX, touches[1].pageY);

	// Вектор от a к b
	var vacAB = this.zooming.pointA.getDiffVector(this.zooming.pointB);
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

mBckTown.prototype.zoomMove = function(e){
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
	
	var newZoom = this.setZoom(this.getZoom().val * zoomK);
	
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

mBckTown.prototype.zoomEnd = function(e){
	if( false ){
		wndMgr.cont.find('.zoom-point').remove();
	}
	
	if( this.zooming )
		this.startDrawView();

	delete this.zooming;
};

mBckTown.prototype.initZooming = function(zooming, pointFocus, opt){
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
		pageX: this.parent.$contWrp.width() * 0.5,
		pageY: this.parent.$contWrp.height() * 0.5
	}, {ignoreOffset: true}));
	// Точка фокусировки зума в координатах города
	zooming.pointFocus = new Vector2D(pointFocus||zooming.pointCenter);
	// Вектор от центра к точке фокусировки
	zooming.vecCenterToFocus = zooming.pointFocus.getDiffVector(zooming.pointCenter);
};

mBckTown.prototype.getZoomPointFocusOffset = function(newZoom, zooming){
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

	mBckTown.prototype.smoothZoom = function(pointFocus, zoomEnd){
		this.stopSmoothZoom();
		
		var zoom = this.getZoom(),
			zooming = {
				dir: 1,
				zoomK: 0.05,
				start: zoom.val,
				max: zoom.max,
				min: zoom.min,
				end: zoomEnd
			};
		
		zooming.norm = (zoom.max - zooming.min) * 0.5;
		
		if( zooming.end )
			zooming.dir = zooming.start > zooming.end ? -1 : 1;
		else{
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
		}
		
		this.initZooming(this.smoothZooming = zooming, pointFocus);
		
		this.iterSmoothZoom();
	};

	mBckTown.prototype.iterSmoothZoom = function(){
		var zooming = this.smoothZooming,
			newZoom = this.getZoom().val + (zooming.zoomK * zooming.dir);

		newZoom = this.setZoom(newZoom);

		this.moveViewTo(this.getZoomPointFocusOffset(newZoom, zooming));

		if( (zooming.dir > 0 && newZoom >= zooming.end) || (zooming.dir < 0 && newZoom <= zooming.end) ){
			this.stopSmoothZoom(true);

			return;
		}

		zooming.TO = this.setTimeout(this.iterSmoothZoom, 16);
	};

	mBckTown.prototype.stopSmoothZoom = function(toggleDrawView){
		if( toggleDrawView )
			this.startDrawView();
		else
			this.stopDrawView();

		if( this.smoothZooming )
			this.clearTimeout(this.smoothZooming.TO);

		delete this.smoothZooming;
	};

mBckTown.prototype.touchZoom = function(e){};

mBckTown.prototype.setZooming = function(state){};

mBckTown.prototype.isZooming = function(){
	return this.zooming||this.smoothZooming;
};

mBckTown.prototype.setZoom = function(zoom, ignore){
    return this.parent.setZoom(zoom, ignore);
};

mBckTown.prototype.getZoom = function(){
	return this.parent.zoom;
};

mBckTown.prototype.setMinZoom = function(){
	this.parent.setMinZoom();
};

mBckTown.prototype.getTouchPos = function(touch, opt){
	var pos = utils.getPosFromEvent(touch, 'page');

	return this.convertTouchToView(pos, opt);
};

mBckTown.prototype.convertTouchToView = function(pos, opt){
	opt = opt||{};

	var $view = this.parent.$contWrp;

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
		var zoomFactor = 1/this.getZoom().val;

		pos.x *= zoomFactor;
		pos.y *= zoomFactor;
	}

	return pos;
};

mBckTown.prototype.centerView = function(){
	this.parent.centerView();

	this.refreshBack = true;
};

mBckTown.prototype.moveViewTo = function(pos){
	this.parent.moveViewTo(pos);
};



utils.mix(bckTown, mBckTown, {fullMix: true});

bckTown.prototype.calcName = function(){
	return 'back';
};

bckTown.prototype.calcTmplFolder = function(){
	return tmplMgr.town.back;
};

bckTown.prototype.resize = function(){};


bckTown.prototype.isDrawStop = function(){
	return this.drawStop && bckTown.shownTowns[wofh.town.id];
};

utils.overrideMethod(bckTown, 'bindTouchEvent', function __method__(){
	if( false ){
		// Установка точки второго касания
		this.wrp
			.on('touchstart', '#town-canvas', function(e){
				e = e.originalEvent||e;
				
				if( !e.ctrlKey )
					return;
				
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
				
				e.preventDefault();
				e.stopImmediatePropagation();
			})
			.on('touchmove', '#town-canvas', function(e){
				if( !window.secondTouchSetted )
					return;
				
				e.preventDefault();
				e.stopImmediatePropagation();
			})
			.on('touchend', '#town-canvas', function(e){
				if( !window.secondTouchSetted )
					return;
				
				e.preventDefault();
				e.stopImmediatePropagation();
				
				delete window.secondTouchSetted;
			});
	}
	
	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(bckTown, 'touchStart', function __method__(e){
	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomStart(e);
		
		return;
	}

	this.posClickView = utils.getPosFromEvent(e.touches[0], 'page');

	__method__.origin.apply(this, arguments);

	if( this.modeSwap )
		this.swapStart(e);
});

utils.overrideMethod(bckTown, 'touchMove', function __method__(e){
	this.touchMoved = true;

	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomMove(e);

		return;
	}

	if( !this.modeSwap )
		this.stopDrawView();

	__method__.origin.apply(this, arguments);

	if( this.modeSwap )
		this.swapMove(e);
});

utils.overrideMethod(bckTown, 'touchEnd', function __method__(e){
	var touches = e.touches;

	if( touches.length && window.secondTouch ){
		touches = [
			e.touches[0],
			window.secondTouch
		];
	}
	
	if( touches.length > 1 ){
		__method__.origin.apply(this, arguments);

		return;
	}
	else if( touches.length == 1 ){
		this.zoomEnd(e);

		this.touchStart(e);

		return;
	}
	
	this.zoomEnd(e);
	
	if( !this.modeSwap )
		this.startDrawView(true);
	
	__method__.origin.apply(this, arguments);
	
	if( this.modeSwap )
		this.swapEnd(e);
});

	bckTown.prototype.handleTouchEvent = function(e){};

// Прохавываем двойной тап
utils.overrideMethod(bckTown, 'onMouseClick', function __method__(posWtl, opt){
	opt = opt||{};

	if( opt.immClick )
		__method__.origin.apply(this, [posWtl]);

	if( !opt.noDoubleClick )
		this.detectDoubleClick(opt.immClick);
});

bckTown.prototype.initZoom = function(){
	this.zoom = 1;
};

bckTown.prototype.getDefZoom = function(){
	return this.zoom||1;
};

// Режим смены слотов
utils.overrideMethod(bckTown, 'toggleModeSwapSlot', function __method__(){
	if( !this.parent.wrp )
		return;

	this.parent.wrp.toggleClass('-mode-swapSlot');

	wndMgr.clearWnd();
	
	__method__.origin.apply(this, arguments);
});


bckTown.prototype.saveSwapModeBackup = function(){
	if( !this.modeSwap )
		return;

	this.modeSwap.backup = {
		zoom: this.getZoom().val, // Отодвигаем город и сохраняем страй зум
		zoomLock: ls.getTownZoomLock(0)
	};
};

bckTown.prototype.restoreSwapModeZoom = function(){
	if( this.modeSwap.backup.zoom == this.getZoom().val )
		return;
	
	var backupZoom = this.modeSwap.backup.zoom;
	
	this.setTimeout(function(){
		this.smoothZoom(null, backupZoom);
	}, 50);
};

bckTown.prototype.swapStart = function(e){
	this.touchMoved = true;

	this.mouseHold = false;

	if( !this.modeSwap.slot )
		this.onMouseClick(this.posWtl, {immClick: true, noDoubleClick: true});

	if( this.modeSwap.slot )
		e.preventDefault();
};

bckTown.prototype.swapMove = function(e){
	if( !this.modeSwap.slot )
		return;

	this.posSwapHover = this.getTouchPos(e.touches[0], {ignoreScroll: true, ignoreZoom: true});

	var movingDirs = {};

	if( this.checkMoveViewWhileSwap(this.posSwapHover, movingDirs) ){
		if( !this.moving )
			this.startMoveView(movingDirs);
	}
	else
		this.stopMoveView();

	e.preventDefault();
};

bckTown.prototype.swapEnd = function(e){
	this.onMouseClick(this.posWtl, {immClick: true});

	this.stopMoveView();

	delete this.posSwapHover;
};

bckTown.prototype.checkMoveViewWhileSwap = function(posSwapHover, dirs){
	var $view = this.parent.$contWrp,
		atLeft = posSwapHover.x < 40,
		atRight = posSwapHover.x > $view.width() - 40,
		atTop = posSwapHover.y < 40,
		atBottom = posSwapHover.y > $view.height() - 40;

	if( !(atLeft || atRight || atTop || atBottom) )
		return false;

	if( dirs ){
		dirs.atLeft = atLeft;
		dirs.atRight = atRight;
		dirs.atTop = atTop;
		dirs.atBottom = atBottom;
	}

	return true;
};


utils.overrideMethod(bckTown, 'setZoom', function __method__(e){
	var zoom = __method__.origin.apply(this, arguments);
    
    this.updBldEventZoom(zoom);
    
    return zoom;
});

bckTown.prototype.updBldEventZoom = function(zoom){
    zoom = zoom||this.getZoom().val;
    
    this.cont.find('.town2-bldEvents').css('transform', 'scale(' + Math.max(1 + (1 - zoom), 1) +')');
};

utils.overrideMethod(bckTown, 'showSlotQueue', function __method__(e){
	__method__.origin.apply(this, arguments);
    
    this.updBldEventZoom();
});

bckTown.prototype.getSlotPosOffsetY = function(){
    return 110;
};


bckTown.prototype.setCanvasDimension = function(){
	this.sizeW.x = this.sizeO.x;
	this.sizeW.y = this.sizeO.y;

	this.wrp.find('.view-town').css({
		width: this.sizeW.x,
		height: this.sizeW.y
	});
};

bckTown.prototype.viewPosTracking = function(){};

// Перемещение внутри вида по направлениям
bckTown.prototype.startMoveView = function(movingDirs){
	this.moving = {dirs: movingDirs};

	this.iterMoveView();
};

bckTown.prototype.iterMoveView = function(){
	if( !this.moving )
		return;

	var moveDirs = this.moving.dirs,
		view = this.parent.$contWrp.get(0),
		moveX,
		moveY;

	if( moveDirs.atLeft )
		moveX = -1;
	else if( moveDirs.atRight )
		moveX = 1;

	if( moveDirs.atTop )
		moveY = -1;
	else if( moveDirs.atBottom )
		moveY = 1;

	if( moveX )
		view.scrollLeft += (moveX * (1 + 15 * this.getZoom().val));

	if( moveY )
		view.scrollTop += (moveY * (1 + 15 * this.getZoom().val));

	this.onViewMoved();

	this.moving.TO = this.setTimeout(this.iterMoveView, 17);
};

bckTown.prototype.stopMoveView = function(){
	if( !this.moving )
		return;

	this.clearTimeout(this.moving.TO);

	delete this.moving;
};

bckTown.prototype.onViewMoved = function(){
	if( !this.posSwapHover )
		return;

	this.posWtl = this.convertTouchToView(utils.clone(this.posSwapHover), {ignoreOffset: true});

	this.requestRender();
};


bckTown.prototype.afterDraw = function(){};

bckTown.prototype.runClicker = function(clicker){
	new TownClicker(wndMgr.cont, clicker, this.posClickView, this);
};

bckTown.prototype.getMinRatio = function(widthRatio, heightRatio){
	return Math.max(widthRatio, heightRatio) + 0.01;
};

utils.overrideMethod(bckTown, 'buildQueueImm', function __method__($el){
    var self = this;
    
    wndMgr.addConfirm().onAccept = function(){
        var err = wofh.town.getSlots().canBuildUp();

        if( err.isOk() )
            __method__.origin.call(self, $el);
        else
            wndMgr.addAlert(tmplMgr.bldqueue.alert.immediate());
    };
});