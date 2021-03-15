bckMap.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.back;
};

utils.overrideMethod(bckMap, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.notif.other[Notif.ids.mobBarExpandStart] = function(){
        this.map.isBarExpanding = true;
    };
    this.notif.other[Notif.ids.mobBarExpandEnd] = function(){
        this.resize();
        
        this.map.isBarExpanding = false;
    };
    
});

bckMap.prototype.onRemove = function(){
	this.stopSmoothMove();
	
	bckMap.superclass.onRemove.apply(this, arguments);
};

bckMap.prototype.bindTouchEvent = function(canvasSelector){
	var self = this;
	
	if( false ){
		this.wrp
			// Установка точки второго касания
			.on('touchstart', '.map-back', function(e){
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
			.on('touchmove', '.map-back', function(e){
				if( !window.secondTouchSetted )
					return;

				e.preventDefault();
				e.stopImmediatePropagation();
			})
			.on('touchend', '.map-back', function(e){
				if( !window.secondTouchSetted )
					return;

				e.preventDefault();
				e.stopImmediatePropagation();

				delete window.secondTouchSetted;
			});
	}
	
	this.wrp
		// Обработка тачей на карте
		.on('touchstart', '.map-back', function(e){
			e = e.originalEvent||e;

			if( !$(e.target).hasClass('map-canvas') ){
				self.bindGuiTouchEvent(e.target, e);

				return;
			}

			self.touchStart(e);
		})
		.on('touchmove', canvasSelector, function(e){
			self.touchMove(e.originalEvent);
		})
		.on('touchend touchcancel', canvasSelector,function(e){
			self.touchEnd(e.originalEvent);
		});
};
	// Перехват событий с элементов GUI, которые находятся поверх карты
	bckMap.prototype.bindGuiTouchEvent = function(targer, e){
		if( !targer || targer._map_ )
			return;
		
		targer._map_ = this;
		
		targer.addEventListener('touchmove', this.touchMoveGui, false);
		targer.addEventListener('touchend', this.touchEndGui, false);
		targer.addEventListener('touchcancel', this.touchEndGui, false);
		
		this.touchStartGui(e);
	};
		
		bckMap.prototype.touchStartGui = function(e){
			this.setBlockClick(true);
			
			this.touchStart(e, true);
		};
		
		bckMap.prototype.touchMoveGui = function(e){
			this._map_.touchMove(e);
		};
		
		bckMap.prototype.touchEndGui = function(e){
			this._map_.unbindGuiTouchEvent(this);
			
			this._map_.clearLastMCoords();
			
			this._map_.touchEnd(e);
			
			delete this._map_;
		};
		
	bckMap.prototype.unbindGuiTouchEvent = function(targer){
		targer.removeEventListener('touchmove', this.touchMoveGui, false);
		targer.removeEventListener('touchend', this.touchEndGui, false);
		targer.removeEventListener('touchcancel', this.touchEndGui, false);
	};
	
	
bckMap.prototype.bindKeysEvent = function(){};


utils.overrideMethod(bckMap, 'touchStart', function __method__(e, isGuiTouch){
	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomStart(e);
		
		return;
	}
	
    __method__.origin.call(this, e);
	
	if( isGuiTouch )
		return;
	
	e.preventDefault();
	
	if( this.smoothMoving ){
		this.map.isMoving = false;

		this.stopSmoothMove();
	}
	else
		this.startHold();
	
	this.hoverTracking(e.touches[0], {onlyDraw: true});
});

utils.overrideMethod(bckMap, 'touchMove', function __method__(e){
	e.preventDefault();
    
	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomMove(e);
		
		return;
	}
	
	__method__.origin.apply(this, arguments);
	
	if( this.holdComplited || !ls.getSmoothMapScroll(true) )
		return;
	
	if( !this.touchDelta ){
		if( !this.map.isMoving )
			return;
		
		this.touchDelta = {
			pointStart: new Vector2D(e.touches[0].pageX, e.touches[0].pageY),
			pointEnd: new Vector2D(),
			vecDelta: new Vector2D()
		};
        
		return;
	}
	
	var tD = this.touchDelta;
	
	tD.pointEnd.set(e.touches[0].pageX, e.touches[0].pageY);
	
	tD.vecDelta.set(tD.pointStart.getDiffVector(tD.pointEnd));
	
	tD.pointStart.set(tD.pointEnd);
});

utils.overrideMethod(bckMap, 'touchEnd', function __method__(e){	
	var touches = e.touches;
	
	if( touches.length && window.secondTouch )
		touches = [e.touches[0], window.secondTouch];
	
	if( touches.length > 1 ){
		this.clearLastMCoords();
		
		__method__.origin.apply(this, arguments);
		
		return;
	}
	else if( touches.length == 1 ){
		this.zoomEnd(e);
		
		this.stopHold();
		
		this.map.toggleMove(true);
		
		this.touchStart.origin.apply(this, arguments);
		
		return;
	}
	
	this.zoomEnd(e);
	
	if( ls.getSmoothMapScroll(true) ){
		if( this.touchDelta ){
			this.smoothMove(this.touchDelta.vecDelta.doMultScalar(-1));
			
			delete this.touchDelta;
		}
		
		if( this.smoothMoving ){
			this.map.isMoving = false;
			
			this.setBlockClick(true);
		}
	}
	
	__method__.origin.apply(this, arguments);
	
	if( this.smoothMoving )
		this.map.isMoving = true;
	
	this.resetBlockClick();
	
	this.resetHold();
});
	
	bckMap.prototype.handleTouchEvent = function(e){};
	
    bckMap.prototype.onTouchEndHoverTracking = function(){};
    
	bckMap.prototype.smoothMove = function(vecMove, opt){
		this.stopSmoothMove();
		
		opt = opt||{};
		
		var dist, speed;
		
		if( opt.byDist ){
			dist = vecMove.getLength();
			
			speed = 0;
		}
		else{
			var viewDiag = Math.sqrt(this.sizeVpx.x * this.sizeVpx.x + this.sizeVpx.y * this.sizeVpx.y),
				maxSpeed = viewDiag * 0.05,
				speed = Math.min(vecMove.getLength(), maxSpeed),
				normalizedSpeed = speed / maxSpeed; // Приводим величину скорости к диапазону от 0 до 1
			
			// Если скорость меньше 10% от максимума - не двигаемся
			if( normalizedSpeed < 0.1 )
				return;
			
			dist = normalizedSpeed * viewDiag * 1.5; // Вычисляем дистанцию на которую необходимо переместиться за определенное время (duration)
		}
        
		if( !dist ){
            if( !this.smoothMoving )
                this.map.toggleMove(false);

            return;
        }
		
		if( !this.map.isMoving )
			this.map.toggleMove(true);
		
		this.smoothMoving = {
			posStart: new Vector2D(this.posMWpx),
			timeStart: timeMgr.getNowLocMS(),	
			moveDir: vecMove.getNormalized(),
			duration: Math.max(0, opt.duration||1000),
			// Коэфициенты для анимации перемещения (квадратичная Кривая Безье)
			p1: speed/dist, // Начинаем анимацию с шага равного скорости перемещения
			p2: 1, // Затухание к концу анимации
			p3: 1,
			dist: dist,
			iteration: this.iterSmoothMove.bind(this)
		};
		
		this.iterSmoothMove();
	};
	
	bckMap.prototype.iterSmoothMove = function(){
		if( !this.smoothMoving )
			return;
		
		var sM = this.smoothMoving,
			t = (timeMgr.getNowLocMS() - sM.timeStart) / sM.duration, // Вычисляем в какой точке анимации находимся (зависит от времени)
            t1, curDistPos; 
		
		if( t >= 1 ){
			t = 1;
			
			sM.stop = true;
		}
		
		t1 = 1-t;
        
        curDistPos = sM.dist * (t1 * t1 * sM.p1 + 2 * t1 * t * sM.p2 + t * t * sM.p3); // Вычисляем текущую позицию на карте
		
		this.setPosMWpx(sM.posStart.getAddVector(sM.moveDir.getMultScalar(curDistPos)).getPoint());
		
		this.showView();
		
		if( sM.stop ){
			this.stopSmoothMove(true);
			
			return;
		}
		
		sM.TO = window.requestAnimFrame(sM.iteration);
		
		// Если использовать timeout для анимыции, то любое событие touchstart без preventDefault вызывает коротковременную остановку таймера (анимация фризит)
//		sM.TO = this.setTimeout(this.iterSmoothMove, 16);
	};
	
	bckMap.prototype.stopSmoothMove = function(byTimeout){
		if( !this.smoothMoving  )
			return;
		
		this.stopHold();
		
		if( byTimeout ){
			this.map.toggleMove(false);
			
			this.resetHold();
		}
		
		window.cancelAnimationFrame(this.smoothMoving.TO);
		
//		this.clearTimeout(this.smoothMoving.TO);
		
		delete this.smoothMoving;
	};
		
	
	bckMap.prototype.detectMovement = function(){
		return !this.map.isMoving;
	};
	
	
	bckMap.prototype.zoomStart = function(e){
		e.preventDefault();
		e.stopPropagation();
		
		var touches = e.touches;
		
		if( window.secondTouch )
			touches = [e.touches[0], window.secondTouch];
		
		this.setBlockClick(true);
		
		this.map.toggleZoom(true);
		
		this.touchEnd(e);
		
		this.stopHold();
		
		
		
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
			start: this.map.zoomLevel,
			min: this.map.getMinZoom(),
			max: this.map.getMaxZoom()
		});
		
		
		
		
		
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
	
	bckMap.prototype.zoomMove = function(e){
		e.preventDefault();
		e.stopPropagation();
		
		var touches = e.touches;
		
		if( window.secondTouch ){
			touches = [
				e.touches[0],
				window.secondTouch
			];
		}
		
		
		
		this.zooming.pointA.set(touches[0].pageX, touches[0].pageY);
		this.zooming.pointB.set(touches[1].pageX, touches[1].pageY);
		
		var lengthAB = this.zooming.pointA.getDiffVector(this.zooming.pointB).getLength(),
			zoomK = (lengthAB/this.zooming.lengthAB);
		
		zoomK += (zoomK - 1) * 0.1; // Увеличиваем скорость зума на 10%
		
		var newZoomLevel = this.map.setZoom(this.map.zoomLevel * zoomK);
		
		this.moveViewTo(this.getZoomPointFocusOffset(newZoomLevel).getMultScalar(-1));
		
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
	
	bckMap.prototype.zoomEnd = function(e){
		if( !this.zooming )
			return;
		
		delete this.zooming;
		
		this.map.toggleZoom(false);
		
		if( false ){
			wndMgr.cont.find('.zoom-point').remove();
		}
	};
	
	bckMap.prototype.initZooming = function(zooming, pointFocus, opt){
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
			pageX: this.sizeVpx.x * 0.5,
			pageY: this.sizeVpx.y * 0.5
		}, {ignoreOffset: true}));
		// Точка фокусировки зума в координатах города
		zooming.pointFocus = new Vector2D(pointFocus||zooming.pointCenter);
		// Вектор от центра к точке фокусировки
		zooming.vecCenterToFocus = zooming.pointFocus.getDiffVector(zooming.pointCenter);
	};
	
	bckMap.prototype.getZoomPointFocusOffset = function(newZoom, zooming){
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
		
		bckMap.prototype.smoothZoom = function(pointFocus){
			this.stopSmoothZoom();
			
			this.removeTooltip();
			
			this.map.toggleZoom(true);
			
			
			var zooming = {
				dir: 1,
				zoomK: 5,
				start: this.map.zoomLevel,
				max: this.map.getMaxZoom(),
				min: this.map.getMinZoom()
			};
			
			zooming.norm = zooming.max;
			
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
		
		bckMap.prototype.iterSmoothZoom = function(){
			var zooming = this.smoothZooming,
				newZoomLevel = this.map.zoomLevel + (zooming.zoomK * zooming.dir);
			
			newZoomLevel = this.map.setZoom(newZoomLevel);
			
			this.moveViewTo(this.getZoomPointFocusOffset(newZoomLevel, zooming).getMultScalar(-1));
			
			if( (zooming.dir > 0 && newZoomLevel >= zooming.end) || (zooming.dir < 0 && newZoomLevel <= zooming.end) ){
				this.stopSmoothZoom();
				
				return;
			}
			
			zooming.TO = this.setTimeout(this.iterSmoothZoom, 16);
		};
		
		bckMap.prototype.stopSmoothZoom = function(){
			if( this.smoothZooming )
				this.clearTimeout(this.smoothZooming.TO);

			delete this.smoothZooming;

			this.map.toggleZoom(false);
		};
		
		
	bckMap.prototype.getTouchPos = function(touch, opt){
		var pos = utils.getPosFromEvent(touch, 'page');

		pos = this.convertTouchToView(pos, opt);

		return pos;
	};
	
	bckMap.prototype.convertTouchToView = function(pos, opt){
		opt = opt||{};

		if( opt.noConvert )
			return pos;

		if( !opt.ignoreScroll ){
			pos.x -= this.posMWpx.x/this.map.zoom;
			pos.y -= this.posMWpx.y/this.map.zoom;
		}

		var $view = this.cont;

		if( !opt.ignoreOffset ){
			var viewOffset = $view.offset();
			
			pos.x -= viewOffset.left;
			pos.y -= viewOffset.top + (this.dispClimPx_y)/this.map.zoom;
		}
		
		if( !opt.ignoreZoom ){
			var zoomFactor = this.map.zoom;
			
			pos.x *= zoomFactor;
			pos.y *= zoomFactor;
		}

		return pos;
	};
	
	bckMap.prototype.moveViewTo = function(pos){
		if( !pos )
			return;
		
		this.moveToPx(pos);
	};
	
	
bckMap.prototype.startHold = function(){
	if( this.holdInactive )
		return;
	
	this.holdPosTMT = this.getPosTMTByMouse(this.lastMCoords);
	
	this.holdTO = this.setTimeout(function(){
		this.completeHold();
	}, 500);
};

bckMap.prototype.stopHold = function(){
	this.holdInactive = true;
	
	this.clearTimeout(this.holdTO);
};

bckMap.prototype.completeHold = function(){
    // На устройстве событие touchmove, почему-то может отрабатывать просто при зажатии (без движения пальца), т.е. просто может зацыкливаться 
    // Для обработки такой ситуации удаляем обьект this.touchDelta и выставляем флаг this.holdComplited после удержания
    
    delete this.touchDelta;
    
    this.holdComplited = true;
    
	this.setBlockClick(true);
	
	notifMgr.runEvent(Notif.ids.mapTileHold, this.holdPosTMT);
	
	sndMgr.vibrate(50);
};

bckMap.prototype.resetHold = function(){
	this.stopHold();
	
    delete this.holdComplited;
	delete this.holdInactive;
};

utils.overrideMethod(bckMap, 'setBlockClick', function __method__(state){
	if( state )
		this.stopHold();
	
	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(bckMap, 'onMouseClick', function __method__(e){
	__method__.origin.apply(this, arguments);
	
	if( this.map.isMoving )
		return;
		
	this.detectDoubleClick();
});


bckMap.prototype.detectDoubleClick = function(){
	this.clearTimeout(this.doubleTapTO);
	
	if( this.firstTap ){
		var firstTap = this.firstTap;
		
		delete this.firstTap;
		
		if( Math.abs(firstTap.pageX - this.lastMCoords.pageX) < 20 && Math.abs(firstTap.pageY - this.lastMCoords.pageY) < 20 )
			this.onDoubleClick();
		
		return;
	}
	else
		this.firstTap = this.lastMCoords;
	
	this.doubleTapTO = this.setTimeout(function(){
		delete this.firstTap;
	}, 200);
};

bckMap.prototype.onDoubleClick = function(){
	this.smoothZoom(this.getTouchPos(this.lastMCoords));
	/*
	var tileSelect = this.map.tileSelect;
	
	if( tileSelect )
		this.map.moveTo(tileSelect.posTMT);
	*/
};

bckMap.prototype.setMap = function(parent){
	this.map = parent.inf;
	
	this.map.map = this;
};

bckMap.prototype.getViewSize = function(){
	return {
        x: Math.max(this.parent.getContWrpSize().width, this.parent.$contWrp.width()),
        y: Math.max(this.parent.getContWrpSize().height, this.parent.$contWrp.height()) 
    };
};

bckMap.prototype.updPos = function(){
    if( !this.posMWpx || (!this.map.isBarExpanding && !wndMgr.lastResizeByKeyboard) )
        this.map.showCenter();
    else
        this.showView();
};

bckMap.prototype.getMousePos = function(mouse){
	var offset = this.wrp.offset();
	
	return {x: mouse.pageX - offset.left, y: mouse.pageY  - offset.top};
};

bckMap.prototype.addTooltipWnd = function(cont, posTWpx, opt){
	var wnd = tooltipMgr.show(cont, posTWpx, opt);
	
	wnd.map = this;
	
	if( wnd ){
		// Реализуем возможность пролистывать карту, если был тач по тултипу (делегируем тачи от тултипа к карте)
		wnd.onContHover = function(e, $cont){
			this.map.bindGuiTouchEvent($cont.get(0), e.originalEvent||e);
		};
	}
	
	return wnd; 
};

bckMap.prototype.calcTooltipPosSqr = function(){
	// Позиционируем тултип так, чтобы он не перекрывал кнопки
	// 46 - выота/ширина кнопки
	
	var posSqr = {};
	
	if( wndMgr.isLandscape() ){
		posSqr.top = posSqr.bottom = -this.dispClimPx_y;
		posSqr.left = posSqr.right = Tile.sizePxArr[0].x / 2 + (46 * 0.5);
	}
	else{
		posSqr.top = this.dispClimPx_y + 46;
		posSqr.bottom = Tile.sizePxArr[0].y - this.dispClimPx_y;
		posSqr.left = posSqr.right = 0;
	}
	
	return posSqr;
};

bckMap.prototype.calcTooltipPosOffset = function(){
	var bounds = wndMgr.getWndBounds();
	
	return {x: bounds.left, y: bounds.top};
};

bckMap.prototype.getRoadCacheQueuePack = function(){
    return 2;
};