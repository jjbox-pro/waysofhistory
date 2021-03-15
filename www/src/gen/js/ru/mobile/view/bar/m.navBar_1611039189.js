NavBar = function(){
	NavBar.superclass.constructor.apply(this, arguments);
};

utils.extend(NavBar, Bar);


NavBar.homeThreshold = 100;


NavBar.prototype.calcName = function(){
	return 'navBar';
};

NavBar.prototype.calcTmplFolder = function(){
	return tmplMgr.navBar;
};

NavBar.prototype.addNotif = function(){
	this.notif.other[Notif.ids.sysWndListClosed] = this.checkControls;
};

NavBar.prototype.cacheCont = function(){
	this.$actionGroup = this.cont.find('.navBar-actionGroup');
	
	this.$circle = this.$actionGroup.find('.homeCircle');
};

NavBar.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.navBar-toTop', function(e){
			if( !self.canSmoothScroll() )
				return;
			
			self.wnd.$contWrp.animate({scrollTop: 0}, 250);
		})
		.on('click', '.navBar-toBottom', function(e){
			if( !self.canSmoothScroll() )
				return;
			
			var offset = self.wnd.$cont.height() - self.wnd.$contWrp.height();
			
			if( offset > 0 )
				self.wnd.$contWrp.animate({scrollTop: offset}, 250);
		})
		.on('click', '.navBar-toLeft', function(e){
			if( !self.canSmoothScroll() )
				return;

			self.wnd.$contWrp.animate({scrollLeft: 0}, 250);
		})
		.on('click', '.navBar-toRight', function(e){
			if( !self.canSmoothScroll() )
				return;
			
			var offset = self.wnd.$cont.width() - self.wnd.$contWrp.width();
			
			if( offset > 0 )
				self.wnd.$contWrp.animate({scrollLeft: offset}, 250);
		})
		.on('click', '.navBar-toCenter', function(e){
			if( !self.canSmoothScroll() )
				return;

			var offset = (self.wnd.$cont.width() - self.wnd.$contWrp.width()) * 0.5;

			if( offset > 0 )
				self.wnd.$contWrp.animate({scrollLeft: offset}, 250);
		})
		.on('touchstart', '.navBar-swipeRight, .navBar-swipeLeft', function(e){
			if( !self.wnd ) 
				return;
			
			e.preventDefault();
			e.stopPropagation();
			
			var $this = $(this);
			
			self.wnd.swipeStar({
				touches: e.originalEvent.touches,
				$trigger: $this,
				dir: $this.hasClass('navBar-swipeRight') ? -1 : 1
			});
			
			self.swipingTO = self.setTimeout(function(){
				$this.addClass('-state-swiping');
			}, 100);
			
		})
		.on('touchmove', '.navBar-swipeRight, .navBar-swipeLeft', function(e){
			if( !self.wnd || self.landscape )
				return;
			
			e.preventDefault();
			e.stopPropagation();
			
			self.wnd.swipeMove({touches: e.originalEvent.touches});
		})
		.on('touchend', '.navBar-swipeRight, .navBar-swipeLeft', function(e){
			if( !self.wnd ) 
				return;
			
			e.preventDefault();
			e.stopPropagation();
			
			self.clearTimeout(self.swipingTO);
			
			delete self.swipingTO;
			
			$(this).removeClass('-state-swiping');
			
			self.wnd.swipeEnd();
		});
		
	this.bindSwipe();
};

NavBar.prototype.afterDraw = function(firstShow){
    if( !firstShow )
        return;
    
    this.setTimeout(this.setExpand, 500);
};


NavBar.prototype.getSide = function(){
	return wndMgr.isLandscape() ? 'right' : 'bottom';
};

NavBar.prototype.setSize = function(){
	var size = wndMgr.getWindowSize();

	this.landscape = wndMgr.isLandscape(size);

	if( this.landscape ){
		size.width = '';

		size.height -= wndMgr.getStatusBarHeight();
	}
	else
		size.height = '';

	this.wrp.css(size);

	this.setSizeToActionGroup(true, size);
};

NavBar.prototype.setSizeToActionGroup = function(needCentering, size){
	var size = size||{
            width: this.wrp.width(),
            height: this.wrp.height()
        },
		actionGroup = this.$actionGroup.get(0),
		scrollTo = IScroll.scrollToX,
		scrollSize = 'Width';

	if( this.landscape ){
		size['max-width'] = size.width = '';

		size['max-height'] = size.height + (this.canSwipe ? -100 : 0);

		size.height = '';
		
		scrollTo = IScroll.scrollToY;
		
		scrollSize = 'Height';
	}
	else{
		size['max-height'] = size.height = '';

		size['max-width'] = size.width + (this.canSwipe ? -100 : 0);

		size.width = '';
	}

	this.$actionGroup.css(size);
	
	if( needCentering ){
		var scrollVal = utils.toInt((actionGroup['scroll' +  scrollSize] - actionGroup['client' + scrollSize]) * 0.5);
		
		if( scrollVal > 0 )
			scrollTo(this.$actionGroup, scrollVal, {scrollInertia: 300});
	}
};

NavBar.prototype.setPos = function(){
	var side = this.getSide();
	
	this.wrp.attr('data-side', side);
	
	var top = side == 'right' ? wndMgr.getStatusBarHeight() : '';
	
	this.wrp.css({top: top});
};


NavBar.prototype.bindSwipe = function(){
	var self = this;
	
	this.wrp
		.on('touchstart', function(e){
			self.swipeStar({touches: e.originalEvent.touches});
		})
		.on('touchmove', function(e){
			self.swipeMove({touches: e.originalEvent.touches});
		})
		.on('touchend', function(e){
			self.swipeEnd();
		});
};

NavBar.prototype.swipeStar = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 )
		return;
	
	this.swipe = {
		pointStart: new Vector2D(utils.getPosFromEvent(opt.touches[0]))
	};
};

NavBar.prototype.swipeMove = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe )
		return;
	
	var pointDelta = this.swipe
								.pointStart
								.getDiffVector(utils.getPosFromEvent(opt.touches[0]));
	
	this.swipe.pointDelta = pointDelta;
	
	if( this.atHome )
		return;
	
	var delta = this.getSide() == 'bottom' ? pointDelta.y : pointDelta.x;
	
	if( delta < NavBar.homeThreshold * 0.5 )
		return;
	
	var homeCircle = this.swipe.homeCircle;
	
	if( !homeCircle )
		this.initHomeCircle(delta);
	else
		this.moveHomeCircle(homeCircle, delta);
};

NavBar.prototype.swipeEnd = function(){
	if( !this.swipe )
		return;
	
	this.doSwipe(this.swipe.pointDelta);
	
	delete this.swipe;
};

NavBar.prototype.doSwipe = function(pointDelta){
	if( !pointDelta )
		return;
	
	if( this.swipe.homeCircle ){
		var homeCircle = this.swipe.homeCircle;
		
		homeCircle.$circle.css({top: '', left: '', margin: ''}).removeClass('-state-run');
		
		this.wrp.find('.navBar-toCenter').append(homeCircle.$circle);
		
		this.animateHomeCircleBack(homeCircle.$circle.get(0), homeCircle.dir);
		
		delete this.swipe.homeCircle;
	}
	
	var delta = this.getSide() == 'bottom' ? pointDelta.y : pointDelta.x;
	
	if( delta < NavBar.homeThreshold )
		return;
	
	wndMgr.prepareWndToAdd(wndMgr.getScreen());
};


NavBar.prototype.setWnd = function(wnd){
	this.wnd = wnd;

	this.checkControls();
};

NavBar.prototype.checkControls = function(){
	this.canSwipe = wndMgr.getSwipedWndList().length > 1;
	
	var hasControls = this.canSwipe || this.canScrollCont();
	
	this.toggleExpand(hasControls, {lockExpand: !hasControls});
	
	if( !hasControls )
		return;
	
	this.cont.toggleClass('-state-noSwipe', !this.canSwipe);
    
	this.checkScrollCont();
	
	this.setSizeToActionGroup();
};

NavBar.prototype.checkScrollCont = function(opt){
	opt = opt||{};

	this.clearTimeout(this.scrollContTO);

	this.scrollContTO = this.setTimeout(this.checkScrollArrows, opt.delay||100);
};

NavBar.prototype.checkScrollArrows = function(){
	var noScrollCont = !this.canScrollCont(),
		hasControls = !noScrollCont || this.canSwipe;
	
	this.cont.toggleClass('-state-atHome', (this.atHome = this.wnd && this.wnd == wndMgr.getScreen()));
	
	if( hasControls )
		this.cont.toggleClass('-state-noScrollCont', noScrollCont);
	
	if( noScrollCont )
		return;

	var contWrp = this.wnd.$contWrp.get(0),
		availScrollContX = contWrp.scrollWidth - contWrp.clientWidth,
		availScrollContY = contWrp.scrollHeight - contWrp.clientHeight;

	this.$actionGroup
		.toggleClass('-type-noScrollX', !availScrollContX)
		.toggleClass('-type-noScrollY', !availScrollContY)
		.toggleClass('-type-endScrollX', !!availScrollContX && !!contWrp.scrollLeft && availScrollContX - contWrp.scrollLeft < 1)
		.toggleClass('-type-beginScrollX', !!availScrollContX && !contWrp.scrollLeft)
		.toggleClass('-type-endScrollY', !!availScrollContY && !!contWrp.scrollTop && availScrollContY - contWrp.scrollTop < 1)
		.toggleClass('-type-beginScrollY', !!availScrollContY && !contWrp.scrollTop);
};

NavBar.prototype.canScrollCont = function(){
	return this.wnd && this.wnd.$contWrp && this.wnd.canScrollCont();
};

NavBar.prototype.canSmoothScroll = function(){
	return this.wnd && this.wnd.isContScrollable();
};

NavBar.prototype.initHomeCircle = function(delta){
	var homeCircle = {};
		
	var circle = this.$circle.get(0),
		rect1 = circle.getBoundingClientRect();

	this.wrp.append(this.$circle.css({margin: 0}));

	var rect2 = circle.getBoundingClientRect(),
		startPos = {
			top: rect1.top - rect2.top, 
			left: rect1.left - rect2.left
		};

	this.$circle.css(startPos);

	homeCircle.$circle = this.$circle;
	homeCircle.startPos = startPos;
	homeCircle.startDelta = delta;
	homeCircle.endPos = wndMgr.getWndLayerSize();
	homeCircle.endPos.top = homeCircle.endPos.width * 0.5;
	homeCircle.endPos.left = homeCircle.endPos.height * 0.5;
	homeCircle.pos = {};
	homeCircle.dir = this.getSide() == 'bottom' ? 'top' : 'left';

	this.swipe.homeCircle = homeCircle;
};

NavBar.prototype.moveHomeCircle = function(homeCircle, delta){
	var dir = homeCircle.dir;
		
	homeCircle.pos[dir] = Math.max(-homeCircle.endPos[dir], homeCircle.startPos[dir] + (homeCircle.startDelta - delta));

	homeCircle.$circle.css(homeCircle.pos);

	homeCircle.$circle.toggleClass('-state-run', delta > NavBar.homeThreshold);
};

NavBar.prototype.animateHomeCircleBack = function(circle, dir){
	var initCSS = {},
		endCSS = {};

	initCSS[dir] = '60px';
	endCSS[dir] = '0';
	
	utils.animateElem(circle, {
		initCSS: initCSS,
		endCSS: endCSS,
		anim: {duration: wndMgr.swipeTime}
	});
};