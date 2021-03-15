utils.mix(bckTownOld, mBckTown, {fullMix: true});

bckTownOld.prototype.bindEvent = function(){
	this.wrp.on('click', '.town-area', function(e){
		e.preventDefault();
		
		e.stopPropagation();
	});

	this.bindTouchEvent();
};

utils.overrideMethod(bckTownOld, 'afterDraw', function __method__(e){
	__method__.origin.apply(this, arguments);
	
	this.parent.cont.addClass('-type-oldTown');
});


bckTownOld.prototype.bindTouchEvent = function(){
	var self = this;

	this.wrp
			.on('touchstart', '.town-cont', function(e){
				self.touchStart(e.originalEvent);
			})
			.on('touchmove', '.town-cont', function(e){
				self.touchMove(e.originalEvent);
			})
			.on('touchend', '.town-cont',function(e){
				self.touchEnd(e.originalEvent);
			});
};

bckTownOld.prototype.toggleModeSwapSlot = function(){
	wndMgr.addWnd(wSwapSlot);
};

bckTownOld.prototype.touchStart = function(e){
	if( e.touches.length != 1 )
		return;

	this.posWtl = this.getTouchPos(e.touches[0]);
};

bckTownOld.prototype.touchMove = function(e){
	this.touchMoved = true;
};

bckTownOld.prototype.touchEnd = function(e){
	if( !this.touchMoved ){
		this.clickTarget = $(e.target);

		this.onMouseClick();
	}

	this.touchMoved = false;
};

bckTownOld.prototype.onMouseClick = function(posWtl){
	posWtl = posWtl||this.posWtl;

	if( this.clickTarget && this.clickTarget.hasClass('town-area') )
		hashMgr.applyHash(hashMgr.getRelHref(this.clickTarget.attr('href')));

	delete this.clickTarget;
};

bckTownOld.prototype.stopDrawView = function(){};
	
bckTownOld.prototype.startDrawView = function(){};

bckTownOld.prototype.getMinRatio = function(widthRatio, heightRatio){
	return Math.min(widthRatio, heightRatio);
};


utils.overrideMethod(bckTownOld, 'touchStart', function __method__(e){
	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomStart(e);

		return;
	}

	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(bckTownOld, 'touchMove', function __method__(e){
	this.touchMoved = true;

	if( e.touches.length > 1 || window.secondTouch ){
		this.zoomMove(e);

		return;
	}
});

utils.overrideMethod(bckTownOld, 'touchEnd', function __method__(e){
	var touches = e.touches;

	if( window.secondTouch ){
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

	__method__.origin.apply(this, arguments);
});


// Прохавываем двойной тап
utils.overrideMethod(bckTownOld, 'onMouseClick', function __method__(posWtl, opt){
	opt = opt||{};

	if( opt.immClick )
		__method__.origin.apply(this, [posWtl]);

	if( !opt.noDoubleClick )
		this.detectDoubleClick(opt.immClick);
});