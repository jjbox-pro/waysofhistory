utils.overrideMethod(Panel, 'initOptions', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.options.expanded = true;
});

Panel.prototype.cacheCont = function(){
	this.$expandWrp = this.cont.find('.panel-expand-wrp');
	
	this.$contBlk = this.cont.find('.panel-cont-blk');
	
	this.$headerWrp = this.$contBlk.find('.panel-header-wrp');
	
	this.$contWrp = this.$contBlk.find('.panel-cont-wrp');
	
	this.$cont = this.$contWrp.find('.panel-cont');
	
	this.$footerWrp = this.$contBlk.find('.panel-footer-wrp');
};

utils.overrideMethod(Panel, 'bindBaseEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	var self = this;
	
	this.wrp
		.on('touchstart', '.panel-expand-wrp', function(e){
			self.swipeStarExpand({touches: e.originalEvent.touches});
		})
		.on('touchmove', '.panel-expand-wrp', function(e){
			self.swipeMoveExpand({touches: e.originalEvent.touches});
		})
		.on('touchend', '.panel-expand-wrp',function(){
			self.swipeEndExpand();
		});
});

utils.overrideMethod(Panel, 'makeResize', function __method__(){
	if( !this.wrp )
		return;
	
	if( this.isExpanded() )
		this.setSize();
	
	this.setExpandPos();
});

Panel.prototype.afterContSet = function(firstDraw){
	this.$expandWrp.find('.panel-expand-button').removeAttr('data-title');
	
	this.toggleExpand(this.isExpanded(), {duration: -1, forceToggle: true});
};

Panel.prototype.afterAllShow = function(){
	var self = this,
        side = this.getSide(),
        swipeAxis = 'xy';
	
    if( side )
        swipeAxis = side == 'left' || side == 'right' ? 'x' : 'y';
    
	snip.swipeHandler(this.$contBlk, {
        axis: swipeAxis,
		callbacks: {
			onSwipeMove: function(swiping, pointDelta, e){
				e.stopPropagation();
			},
			onSwipeEnd: function(pointDelta){
				self.doSwipe(pointDelta);
			}
		}
	});
	
	Panel.superclass.afterAllShow.apply(this, arguments);
};

utils.overrideMethod(Panel, 'onRemove', function __method__(){
	__method__.origin.apply(this, arguments);
    
    if( !this.options.inactive )
        wndMgr.splice(this);
});

Panel.prototype.getOuterWrps = function(data){
	if( this.tmpl.outer )
		return this.tmpl.outer(data||this.data);
	
	return '';
};


Panel.prototype.showCont = function(){
	this.$contBlk.removeClass('-hidden');
	
	this.setSize();
};

Panel.prototype.hideCont = function(){
	this.$contBlk.addClass('-hidden');
};

Panel.prototype.getSide = function(){
	return this.side||'';
};

Panel.prototype.setSide = function(side){
    this.side = side||this.getSide();
    
	this.cont.attr('data-side', this.side);
};


Panel.prototype.setSize = function(){
	var contHeight =	this.parent.getContWrpSize().height -
						this.$headerWrp.height() - 
						this.$footerWrp.height();
	
	this.$contWrp.height(contHeight);
};

Panel.prototype.toggleExpand = function(expanded, opt){
	opt = opt||{};
	
    var oldExpandedState = this.isExpanded();
    
	if( expanded !== undefined )
		this.expanded = expanded;
	else
		this.expanded = !this.expanded;
    
    if( !opt.forceToggle && oldExpandedState === this.isExpanded() ){
        this.onToggleCancel();
        
        return;
    }
	
    this.clearTimeout(this.toggleExpandTO);
    
	if( this.isExpanded() )
		this.showCont();
	
	var callback = opt.callback,
        duration = this.getExpandDuration(opt.duration),
		onAnimationEnd = function(){
            this.cont.removeClass('-state-animation');
            
			if( !this.isExpanded() )
				this.hideCont();
			
			if( callback )
				callback();
			
			this.onToggleEnd(duration);
		};
	
	this.onToggleStart(duration);
	
    this.cont.css('transition-duration', Math.max(duration, 0) + 'ms');
    
    this.cont.toggleClass('-type-expanded', this.isExpanded());
    
	if( opt.duration < 0 ){
		onAnimationEnd.call(this);
		
		return;
	}
	
	this.cont.addClass('-state-animation');
	
    this.toggleExpandTO = this.setTimeout(onAnimationEnd, duration);
};

    Panel.prototype.getExpandDuration = function(duration){
        return duration||wndMgr.getBarAnimTime();
    };

Panel.prototype.onToggleCancel = function(){};

Panel.prototype.onToggleStart = function(duration){};

Panel.prototype.onToggleEnd = function(duration){};


Panel.prototype.doSwipe = function(pointDelta){
	var toggle = false;
	
	if( this.getSide() == 'left' && pointDelta.x > 0 )
		toggle = true;
	else if( this.getSide() == 'right' && pointDelta.x < 0 )
		toggle = true;
	
	if( toggle )
		this.toggleExpand();
};
    

Panel.prototype.setExpandPos = function(pos){
	if( !this.$expandWrp.length )
		return;
	
	var storedPanelsPos = ls.getPanelExpandPos({}),
		storedPos = storedPanelsPos[this.getName()]||{},
		orientation = wndMgr.isLandscape() ? 'l' : 'p';
	
	if( typeof(storedPos) != 'object' )
		storedPos = {};
	
	if( pos === undefined )
		pos = storedPos[orientation];
	
	if( !this.initExpandPos )
		this.initExpandPos = true;
	
	var contWrpHeight = this.parent.$contWrp.height();
	
	pos = pos||(contWrpHeight - 10);
	
	pos = Math.max(5, pos);
	
	pos = Math.min(pos, contWrpHeight - this.$expandWrp.height() - 5);
	
	this.$expandWrp.css({top: pos});
	
	if( wndMgr.isKeyboardOpen() )
		return;
	
	storedPos[orientation] = pos;
	
	storedPanelsPos[this.getName()] = storedPos;
	
	ls.setPanelExpandPos(storedPanelsPos);
};

Panel.prototype.swipeStarExpand = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 )
		return;
	
	this.swipe = {
		startPosition: this.$expandWrp.position(),
		startPos: new Vector2D(utils.getPosFromEvent(opt.touches[0]))
	};
};

Panel.prototype.swipeMoveExpand = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe )
		return;
	
	var curSwipePos = utils.getPosFromEvent(opt.touches[0]);
	
	this.doSwipeExpand(new Vector2D(curSwipePos).diffVector(this.swipe.startPos));
};

Panel.prototype.swipeEndExpand = function(){
	if( !this.swipe )
		return;
	
	delete this.swipe;
};

Panel.prototype.doSwipeExpand = function(dPoint){
	if( !this.swipe )
		return;
	
	if( !this.swipe.allowMove ){
		if( Math.abs(dPoint.y||0) < 10 )
			return;
		
		this.swipe.allowMove = true;
	}
	
	this.setExpandPos(this.swipe.startPosition.top + dPoint.y);
};





hPanel = function(){
	hPanel.superclass.constructor.apply(this, arguments);
};

utils.extend(hPanel, Panel);


hPanel.prototype.setSize = function(){};


hPanel.prototype.setExpandPos = function(pos){
	if( !this.$expandWrp.length )
		return;
	
	var storedPanelsPos = ls.getPanelExpandPos({}),
		storedPos = storedPanelsPos[this.getName()]||{},
		orientation = wndMgr.isLandscape() ? 'l' : 'p';
	
	if( typeof(storedPos) != 'object' )
		storedPos = {};
	
	if( pos === undefined )
		pos = storedPos[orientation];
	
	if( !this.initExpandPos ){
		if( !pos )
			pos = (this.parent.$contWrp.width() * 0.5) - (this.$expandWrp.width() * 0.5);
		
		this.initExpandPos = true;
	}
	
	pos = pos||this.$expandWrp.position().left;
	
	pos = Math.max(5, pos);
	
	pos = Math.min(pos, this.parent.$contWrp.width() - this.$expandWrp.width() - 5);
	
	this.$expandWrp.css({left: pos});
	
	if( wndMgr.isKeyboardOpen() )
		return;
	
	storedPos[orientation] = pos;
	
	storedPanelsPos[this.getName()] = storedPos;
	
	ls.setPanelExpandPos(storedPanelsPos);
};


hPanel.prototype.doSwipe = function(pointDelta){
	var toggle = false;
	
	if( this.getSide() == 'top' && pointDelta.y > 0 )
		toggle = true;
	else if( this.getSide() == 'bottom' && pointDelta.y < 0 )
		toggle = true;
	
	if( toggle )
		this.toggleExpand();
};


hPanel.prototype.doSwipeExpand = function(dPoint){
	if( !this.swipe )
		return;
	
	if( !this.swipe.allowMove ){
		if( Math.abs(dPoint.x||0) < 10 )
			return;
		
		this.swipe.allowMove = true;
	}
	
	this.setExpandPos(this.swipe.startPosition.left + dPoint.x);
};