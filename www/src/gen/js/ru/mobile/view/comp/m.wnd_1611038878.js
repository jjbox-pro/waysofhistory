OriginWnd = function(){
	this.delegate('constructor', OriginWnd, arguments);
};

utils.extend(OriginWnd, Wnd);


OriginWnd.prototype.addBaseNotif = function(){
	this.notif.other[Notif.ids.resize] = this.makeResize;
};

utils.overrideMethod(OriginWnd, 'setCont', function __method__(){
    __method__.origin.apply(this, arguments);
    
    this.setSize(true);
});

utils.overrideMethod(OriginWnd, 'makeResize', function __method__(byWindow){
    if( this.isReady() )
        this.setSize(byWindow);
	
	if( byWindow )
		this.setAutoPos();
	
	__method__.origin.apply(this, arguments);
});

OriginWnd.prototype.setStoredPos = OriginWnd.prototype.moveToCenter;


OriginWnd.prototype.getWndList = function(){
	return wndMgr.getCommonWndList();
};

OriginWnd.prototype.getZoffset = function(){
	return wndMgr.zOffsetPopup;
};

OriginWnd.prototype.setSize = function(resetPos){
	this.contWrpSize = wndMgr.getWindowSize();
    
	// Учитываем паддинги + оставляем небольшой зазор между рамкой окна и краями экрана
	this.contWrpSize.width -= 18;
	this.contWrpSize.height -= 30 + 50;
	
    if( resetPos )
        this.wrp.css({top: 0, left: 0});
    
	this.wrp.find('.wnd-cont-wrp').css({'max-width': this.contWrpSize.width, 'max-height': this.contWrpSize.height});
};

    OriginWnd.prototype.getContWrpSize = function(){
        return this.contWrpSize;
    };

OriginWnd.prototype.prepareConstructorToDelegate = function(constructor){
	while( constructor[utils.symbol.delegate] )
		constructor = constructor[utils.symbol.delegate];
	
	return constructor;
};





utils.reExtend(TooltipWnd, OriginWnd);


TooltipWnd.prototype.onContHover = function(e){
    if( e.cancelable )
        e.preventDefault();
};





OriginContentWnd = function(contOrTmpl, options){
	ContentWnd.apply(this, arguments);
};

utils.extend(OriginContentWnd, OriginWnd);

utils.mix(OriginContentWnd, ContentWnd, {keepOwnProto: true});

ContentWnd[utils.symbol.delegate] = OriginContentWnd;





utils.reExtend(ModalWnd, OriginContentWnd);

    utils.reExtend(SmoothModalWnd, ModalWnd);
    
    utils.reExtend(SelectWnd, ModalWnd);
    
    utils.reExtend(TextEditWnd, ModalWnd);





utils.reExtend(PopupWnd, OriginContentWnd);


PopupWnd.prototype.makeResize = OriginWnd.prototype.makeResize;
	
	
	
	
	
utils.reExtend(AlertWnd, PopupWnd);





utils.reExtend(ConfirmWnd, PopupWnd);





var constChildren = [OriginWnd];


utils.overrideMethod(Wnd, 'calcTmplWrp', function __method__(){
	return tmplMgr.wnd.wrpMob;
}, constChildren);

utils.overrideMethod(Wnd, 'getBaseTypeClass', function __method__(postFix){
	var typeClass = __method__.origin.apply(this, arguments);
	
	typeClass += ' ' + this.getBaseType() + '-mob' + (postFix||'');
	
	return typeClass;
}, constChildren);

utils.overrideMethod(Wnd, 'getExtWrpClass', function __method__(){
	return this.options.swiped ? '-type-swiped' : '';
}, constChildren);

utils.overrideMethod(Wnd, 'initWndOptions', function __method__(){
	this.options.swiped = true;
	this.options.noShadow = true;
	this.options.showBorders = false;
	this.options.setHash = true;
	this.options.canClose = true;
	this.options.moving = false;
	this.options.showButtons = true;
	this.options.clearData = false;
}, constChildren);

utils.overrideMethod(Wnd, 'appendWrp', function __method__(){
	wndMgr.$wndLayer.append(this.wrp);
}, constChildren);

utils.overrideMethod(Wnd, 'bindBaseEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.bindBaseSwipe();
}, constChildren);

    Wnd.prototype.bindBaseSwipe = function(){
        this.bindSwipe();

        this.wrp
            .on('touchstart', this.getPreventSwipeCls(), function(e){
                if( e.cancelable )
                    e.stopPropagation();
            })
            .on('touchmove', this.getPreventSwipeCls(), function(e){
                if( $(this).hasClass('ui-disabled') )
                    return;
                
                if( e.cancelable )
                    e.preventDefault();
            });
    };

        Wnd.prototype.bindSwipe = function(){
            var self = this;

            this.wrp
                .on('touchstart', '.wnd-cont-wrp', function(e){
                    if( !e.cancelable || self.getScale() < 0.9 )
                        return;
                    
                    self.userTouch = true;
                    
                    self.swipeStar({touches: e.originalEvent.touches});
                })
                .on('touchmove', '.wnd-cont-wrp', function(e){
                    var touches = e.originalEvent.touches;

                    if( touches.length != 1 || !self.swipe )
                        return;

                    self.initSwipeMove(touches, e);
                })
                .on('touchend', '.wnd-cont-wrp',function(){
                    self.swipeEnd();
                });
        };

    Wnd.prototype.getPreventSwipeCls = function(){
        return '.ui-slider, .swapSlot-slot';
    };

Wnd.prototype.cacheCont = function(){
	this.$topicWrp = this.cont.find('.wnd-topic-wrp');
	
	this.$contWrp = this.cont.find('.wnd-cont-wrp');
	
	this.$cont = this.$contWrp.find('.wnd-cont');
};

utils.overrideMethod(Wnd, 'setCont', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.setSize();
}, constChildren);

utils.overrideMethod(Wnd, 'makeResize', function __method__(){
	if( this.isReady() )
		this.setSize();
}, constChildren);

utils.overrideMethod(Wnd, 'setAutoPos', function __method__(){}, constChildren);

utils.overrideMethod(Wnd, 'moveToCenter', function __method__(){}, constChildren);

utils.overrideMethod(Wnd, 'delete', function __method__(){	
	if( wndMgr.getSwipingWnd() == this )
		wndMgr.cancelSwipe(this, {byRemove: true});
		
	if( !this.options.useCache )
		return __method__.origin.apply(this, arguments);
	
	wndMgr.removeWnd(this);
	
	this.hideCont();
}, constChildren);

Wnd.prototype.onRemove = Block.prototype.onRemove;

utils.overrideMethod(Wnd, 'onRemove', function __method__(){
	__method__.origin.apply(this, arguments);
	
	if( this.$contWrp )
		this.$contWrp.off('scroll');
	
	this.setActive(false);
	
	this.resetZ();
}, constChildren);

utils.overrideMethod(Wnd, 'deleteWrp', function __method__(){
	if( this.allowDeleteWrp() )
		__method__.origin.apply(this, arguments);
	else
		wndMgr.setBackWnd(this);
}, constChildren);

utils.overrideMethod(Wnd, 'activate', function __method__(){
	wndMgr.swipeWnd(this);
}, constChildren);

utils.overrideMethod(Wnd, 'setZ', function __method__(){
	if( this.wrp )
		this.wrp.css('z-index', this.active ? 2 : 1);
}, constChildren);

utils.overrideMethod(Wnd, 'appendToList', function __method__(){
	if( !wndMgr.getTopWnd() || this.showImmediately() )
		return __method__.origin.apply(this, arguments);
	
	wndMgr.insertAfter(this.getInsertIndex(), this);
}, constChildren);

utils.overrideMethod(Wnd, 'onIdentShow', function __method__(){
	wndMgr.swipeWnd(this, {wndIdent: true});
}, constChildren);

utils.overrideMethod(Wnd, 'onFirstShow', function __method__(){
	wndMgr.swipeWnd(this, {noResize: true});
}, constChildren);

utils.overrideMethod(Wnd, 'afterAllShow', function __method__(){
	this.bindScroll();
	
	if( this.isActive() )
		wndMgr.updNavBarScrollCont();
}, constChildren);

    Wnd.prototype.bindScroll = function(){
        if( !this.canScrollCont() )
            return;
        
        var self = this;

        this.$contWrp.on('scroll', function(e){
            self.onScroll(e, this);
        });
    };

utils.overrideMethod(Wnd, 'setHeaderCont', function __method__(data){
	if( this.hasHeader() )
		this.wrp.find('.wnd-header').html(this.getHeaderCont(data));
}, constChildren);

Wnd.prototype.getInsertIndex = function(wnd){
	return wndMgr.getWndIndex(wnd||wndMgr.getTopWnd());
};

Wnd.prototype.setSize = function(){
	var size = wndMgr.getWndLayerSize();
	
	if( wndMgr.wndChat )
		size.height -= wndMgr.wndChat.getBound();
	
	this.wrp.css(size);
	
	this.setContWrpSize(size);
};

Wnd.prototype.setContWrpSize = function(wndSize){
    this.contWrpSize = this.calcContWrpSize(wndSize);
    
	this.$contWrp.height(this.getContWrpSize().height);
};
    
    Wnd.prototype.calcContWrpSize = function(wndSize){
        return {
            width: wndSize.width,
            height: wndSize.height - this.$topicWrp.outerHeight()
        };
    };
    
    Wnd.prototype.getContWrpSize = function(){
        return this.contWrpSize;
    };

Wnd.prototype.getHeight = function(){
	if( this.wrp )
		return this.wrp.height();
};

Wnd.prototype.resetZ = function(){
	if( this.wrp )
		this.wrp.css('z-index', 1);
};

Wnd.prototype.getOuterWrps = function(data){
	if( this.tmpl.outer )
		return this.tmpl.outer(data||this.data);
	
	return '';
};


Wnd.prototype.allowDeleteWrp = function(){
	var backWnd = wndMgr.getBackWnd();
	
	return !wndMgr.getSwipingWnd() || this.isContHidden() || (backWnd && backWnd != this);
};

Wnd.prototype.onScroll = function(e, scroll){
	wndMgr.updNavBarScrollCont({delay: this.userTouch ? 10 : false});
	
	scroll = scroll||this.$contWrp.get(0);
	
	if( scroll.scrollHeight > scroll.clientHeight ){
		if( scroll.scrollTop == 0 )
			this.onTotalScrollBack(e, scroll);
		else if( scroll.scrollTop >= (scroll.scrollHeight - scroll.clientHeight) )
			this.onTotalScroll(e, scroll);
	}
};

Wnd.prototype.onTotalScrollBack = function(e, scroll){};

Wnd.prototype.onTotalScroll = function(e, scroll){};

Wnd.prototype.allowWndSwipe = function(swipeDX, $contWrp, $cont){
	var contWidth = this.getSwipeContWidth($cont);
	
	if( this.isContScrollable() && contWidth > $contWrp.width() ){
		if( swipeDX > 0 ){
			if( (contWidth - Math.round($contWrp.scrollLeft())) - $contWrp.width() )
				return false;
		}
		else{
			if( $contWrp.scrollLeft() )
				return false;
		}
	}
	
	return true;
};

Wnd.prototype.getSwipeContWidth = function($cont){
	return $cont.width();
};

Wnd.prototype.swipeStar = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || this.swipe )
		return;
	
	var swipe = this.initSwipeAction(opt);
	
	if( !swipe )
		return;
	
	swipe.startPos = swipe.prevPos = utils.getPosFromEvent(opt.touches[0]);
	
	this.swipe = swipe;
	
	wndMgr.setTouchSwipingWnd(this);
};

	Wnd.prototype.initSwipeMove = function(touches, e){
		if( !this.swipeAllowed ){
			var curSwipePos = utils.getPosFromEvent(touches[0]),
				swipe = this.swipe;
                
			swipe.dX = swipe.startPos.x - curSwipePos.x;
			swipe.dY = swipe.startPos.y - curSwipePos.y;

			if( Math.abs(swipe.dY) > Math.abs(swipe.dX) || !this.allowWndSwipe(swipe.dX, this.$contWrp, this.$cont) ){
				delete this.swipe;

				return;
			}
			else{
				swipe.dir = swipe.dX > 0 ? 1 : -1;

				this.initSwipedWnd(swipe);

				if( !swipe.nextWnd ){
					delete this.swipe;

					return;
				}

				this.swipeAllowed = true;
			}
		}
        
		if( this.swipeAllowed ){
            e.preventDefault();
            
			this.swipeMove({touches: touches});
		}
	};

Wnd.prototype.swipeMove = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe ){
		if( this.swipe )
			this.abortSwipe();
			
		return;
	}
	
	var curSwipePos = utils.getPosFromEvent(opt.touches[0]),
		swipe = this.swipe;
	
	if( !swipe.start ){
		swipe.start = true;
		
		this.onSwipeStart(swipe.nextWnd);
	}
	
	swipe.dX = swipe.startPos.x - curSwipePos.x;
    swipe.curDir = swipe.prevPos.x - curSwipePos.x;
	swipe.prevPos = curSwipePos;
    
	if( swipe.dir < 0 ){
		if( swipe.dX < 0 ){
			this.makeSwipeStep(swipe.nextWnd, swipe.dX);
			
			if( swipe.$trigger )
				swipe.$trigger.css('left', -swipe.dX);
		}
	}
	else{
		if( swipe.dX > 0 ){
			this.makeSwipeStep(swipe.nextWnd, swipe.dX);
			
			if( swipe.$trigger )
				swipe.$trigger.css('right', swipe.dX);
		}
	}
};

Wnd.prototype.swipeEnd = function(){
	delete this.userTouch;
	delete this.swipeAllowed;
	
	wndMgr.unsetTouchSwipingWnd();
	
	if( !this.swipe || !this.swipe.nextWnd ){
		delete this.swipe;
		
		return;
	}
	
	var swipe = this.swipe;
	
	if( swipe.resetSwipe ){
		this.resetSwipe();
		
		delete this.swipe;
		
		return;
	}
	
	if( swipe.$trigger && Math.abs(swipe.dX||0) < 10 )
		this.doSwipe(swipe, swipe.dir > 0);
	else{
		if( (swipe.dir < 0 && swipe.dX > 0) || (swipe.dir > 0 && swipe.dX < 0) )
			this.resetSwipe();
        else if( (swipe.dir < 0 && swipe.curDir > 0) || (swipe.dir > 0 && swipe.curDir < 0) )
            this.swipeBack();
        else{
            if( Math.abs(swipe.dX) > snip.getSwipeThreshold() )
                this.doSwipe(swipe, !(swipe.dX > 0));
            else
                this.swipeBack();
        }
	}
	
	delete this.swipe;
};

Wnd.prototype.doSwipe = function(swipe, dirRight, swipeTime){
	if( swipe.$trigger ){
		if( swipe.dir < 0 )
			swipe.$trigger.animate({left: this.$cont.width()}, wndMgr.swipeTime, function(){
				swipe.$trigger.css({left: 0});
			});
		else
			swipe.$trigger.animate({right: this.$cont.width()}, wndMgr.swipeTime, function(){
				swipe.$trigger.css({right: 0});
			});
	}

	wndMgr.swipeWnd(swipe.nextWnd, {dirRight: dirRight, noPrepare: true});
};


Wnd.prototype.abortSwipe = function(){
	if( !this.swipe )
		return;
	
	this.swipe.resetSwipe = true;
	
	this.swipeEnd();
};

Wnd.prototype.initSwipeAction = function(opt){
	var wndList = wndMgr.getSwipedWndList();
	
	if( wndList.length < 2 )
		return;
	
	var swipe = {
		wndList: wndList,
		wndIndex: +wndMgr.getWndIndex(this, wndList)
	};
	
	if( opt.$trigger )
		swipe.$trigger = opt.$trigger;
	
	if( opt.dir ){
		swipe.dir = opt.dir;
		
		this.initSwipedWnd(swipe);
		
		if( !swipe.nextWnd )
			return;
	}
	
	return swipe;
};

Wnd.prototype.initSwipedWnd = function(swipe){
	var nextWnd = this.findSwipedWnd(swipe);
	
	if( !nextWnd )
		return;
	
	nextWnd.setSwipeMode(swipe);
	
	nextWnd.toggleSwiping(true);
	
	nextWnd.showCont();
	
	swipe.nextWnd = nextWnd;
};

Wnd.prototype.findSwipedWnd = function(swipe){
	if( !swipe )
		return;
	
	var nextWnd = swipe.wndList[swipe.wndIndex+swipe.dir];
	
	if( !nextWnd )
		nextWnd = swipe.wndList[swipe.dir > 0 ? 0 : swipe.wndList.length - 1];
	
	return nextWnd;
};

Wnd.prototype.setSwipeMode = function(swipe){
	if( !swipe )
		return;
	
	this.swipeMode = {
		startOpacity: 0.3,
		startPos: this.getSwipeOffset() * swipe.dir
	};
	
	if( wndMgr.useHardwareAnimation ){
		this.wrp.css({
			zIndex: 3,
			transform: 'translateX(' + this.swipeMode.startPos + 'px)',
			opacity: this.swipeMode.startOpacity
		});
	}
	else{
		this.wrp.css({
			zIndex: 3,
			left: this.swipeMode.startPos,
			opacity: this.swipeMode.startOpacity
		});
	}
	
	
};

Wnd.prototype.getSwipeOffset  = function(){
	return wndMgr.$wndLayer.width();
};

Wnd.prototype.toggleSwiping  = function(state){
	this.swiping = state;
	
	this.wrp.toggleClass('-state-swiping', state);
};

Wnd.prototype.isSwiping  = function(){
	return this.swiping;
};

Wnd.prototype.makeSwipeStep = function(wnd, dX){
	if( wndMgr.useHardwareAnimation ){
		wnd.wrp.css({
			opacity: wnd.swipeMode.startOpacity + Math.abs(dX/wndMgr.getWindowSize().width),
			transform: 'translateX(' + (wnd.swipeMode.startPos - dX) + 'px)'
		});
	}
	else{
		wnd.wrp.css({
			opacity: wnd.swipeMode.startOpacity + Math.abs(dX/wndMgr.getWindowSize().width),
			left: wnd.swipeMode.startPos - dX
		});
	}
};

Wnd.prototype.resetSwipe = function(){
	if( this.swipe.$trigger ){
		if( this.swipe.dir < 0 )
			this.swipe.$trigger.css({left: 0});
		else
			this.swipe.$trigger.css({right: 0});
	}

	this.swipe.nextWnd.hideCont();
	
	this.swipe.nextWnd.toggleSwiping(false);
	
	this.onSwipeReset();
};

Wnd.prototype.swipeBack = function(){
	if( this.swipe.$trigger ){
		if( this.swipe.dir < 0 )
			this.swipe.$trigger.animate({left: 0}, wndMgr.swipeTime);
		else
			this.swipe.$trigger.animate({right: 0}, wndMgr.swipeTime);
	}

	var nextWnd = this.swipe.nextWnd,
		css = {
			opacity: nextWnd.swipeMode.startOpacity,
			left: nextWnd.swipeMode.startPos + 'px'
		},
		callback = function(){
			nextWnd.hideCont();
			
			nextWnd.toggleSwiping(false);
			
			this.onSwipeBack();
		}.bind(this);
	
	if( wndMgr.useHardwareAnimation ){
		delete css.left;

		css.transform = 'translateX(' + nextWnd.swipeMode.startPos + 'px)';
		
		utils.animateElem(nextWnd.wrp.get(0), {
			endCSS: css,
			callback: callback,
			anim: {duration: wndMgr.swipeTime}
		});
	}
	else
		nextWnd.wrp.animate(css, wndMgr.swipeTime, callback);
};

Wnd.prototype.canScrollCont = function(){
	return this.options.swiped;
};

Wnd.prototype.isContScrollable = function(){
	return this.$contWrp && this.$contWrp.css('overflow') != 'hidden';
};

Wnd.prototype.scrollIntoWrp = function($elem, opt){
	opt = opt||{};
	
	var $scroll = opt.$scroll;
	
	if( !$scroll && !this.isContScrollable() )
		return;
	
	opt = opt||{};
	
	$scroll = $scroll||this.$contWrp;
	
	var scrollDirs = {};
	
	if( opt.scrollDirs )
		scrollDirs = opt.scrollDirs;
	else{
		if( !$elem || !$elem.length )
			return;
		
		var scroll = $scroll.get(0),
			scrollRect = scroll.getBoundingClientRect(),
			elemRect = $elem.get(0).getBoundingClientRect(),
			scrollMarg = utils.copy({top: 5, left: 5, right: 5, bottom: 5}, opt.scrollMarg),
			elemOffset = {
				top: elemRect.top - scrollRect.top - scrollMarg.top,
				left: elemRect.left - scrollRect.left - scrollMarg.left,
				right: elemRect.right - scrollRect.right + scrollMarg.right,
				bottom: elemRect.bottom - scrollRect.bottom + scrollMarg.bottom
			};
		
		if( elemRect.left < scrollRect.left )
			scrollDirs.scrollLeft = scroll.scrollLeft + elemOffset.left;
		else if( elemRect.right > scrollRect.right )
			scrollDirs.scrollLeft = scroll.scrollLeft + Math.min(elemOffset.left, elemOffset.right);

		if( elemRect.top < scrollRect.top )
			scrollDirs.scrollTop = scroll.scrollTop + elemOffset.top;
		else if( elemRect.bottom > scrollRect.bottom )
			scrollDirs.scrollTop = scroll.scrollTop + Math.min(elemOffset.top, elemOffset.bottom);
	}
	
	if( !utils.sizeOf(scrollDirs) )
		return;
	
	$scroll.animate(scrollDirs, opt.duration||500);
};

Wnd.prototype.showImmediately = function(){
	return false;
};

Wnd.prototype.getScale = function(){
	return wndMgr.getScale();
};


Wnd.prototype.onSwipeStart = function(nextWnd){
	if( !nextWnd )
		return;
	
	nextWnd.resize(true);
	
	nextWnd.onSwipeStart();
};

Wnd.prototype.onSwipeEnd = function(){};

Wnd.prototype.onSwipeCancel = function(){};

Wnd.prototype.onSwipeReset = function(){};

Wnd.prototype.onSwipeBack = function(){};

Wnd.prototype.onSwipe = function(){};

Wnd.prototype.onTop = function(){};





function ScreenWnd(id, data){
	ScreenWnd.superclass.constructor.apply(this, arguments);
}

utils.extend(ScreenWnd, Wnd);


ScreenWnd.prototype.initBlock = function(){
	ScreenWnd.superclass.initBlock.apply(this, arguments);
	
	this.initScreen();
};

ScreenWnd.prototype.getName = function(){
	return this.name;
};

ScreenWnd.prototype.initWndOptions = function(){
	ScreenWnd.superclass.initWndOptions.apply(this, arguments);
	
	this.options.main = true;
	this.options.showButtons = false;
	this.options.canClose = false;
};

ScreenWnd.prototype.beforeSetHash = function(){
	wndMgr.setScreenHash(this);
};

ScreenWnd.prototype.afterDataReceived = function(){
	ScreenWnd.superclass.afterDataReceived.apply(this, arguments);
	
	this.prepareScreen();
};

ScreenWnd.prototype.onSwipe = function(){
	notifMgr.runEvent(Notif.ids.mobAppScreenSwipe, this);
};

ScreenWnd.prototype.onSwipeEnd = function(){
	if( wndMgr.bars.navBar )
		wndMgr.bars.navBar.checkControls();
};

ScreenWnd.prototype.onSwipeCancel = function(){
	if( wndMgr.getScreen() != this )
		this.close();
};

ScreenWnd.prototype.onTop = function(){
	if( wndMgr.getScreen() != this ){
		wndMgr.setScreen(this);
		
		this.checkConflicts();
		
		notifMgr.runEvent(Notif.ids.ifShown);
	}
};

ScreenWnd.prototype.onSetted = function(){};


ScreenWnd.prototype.initScreen = function(){};

ScreenWnd.prototype.prepareScreen = function(){};

ScreenWnd.prototype.checkConflicts = function(){
	var wndList = wndMgr.getScreenList([this.constructor]);
	
	if( wndList.length ){
		wndMgr.clearList();
		
		for(var wnd in wndList)
			wndList[wnd].close();
	}
};


ScreenWnd.prototype.update = function(){
	this.show();
};




/* Интерфейсный экран (интерфейс город, интерфейс карты, интерфейс отсутствия городов) */
function InfScreenWnd(){
	InfScreenWnd.superclass.constructor.apply(this, arguments);
}

utils.extend(InfScreenWnd, ScreenWnd);


InfScreenWnd.prototype.setId = function(id){
	return this.inf.setId.apply(this.inf, arguments);
};
	
InfScreenWnd.prototype.getId = function(){
	return this.inf.getId.apply(this.inf, arguments);;
};

InfScreenWnd.prototype.afterDataReceived = function(){
	InfScreenWnd.superclass.afterDataReceived.apply(this, arguments);
	
	this.inf.show();
};

InfScreenWnd.prototype.initNotif = function(){
	InfScreenWnd.superclass.initNotif.apply(this, arguments);
	
	this.inf.initNotif();
};

InfScreenWnd.prototype.onDataReceived = function(){
	this.inf.onDataReceived();

	this.inf.shown = this.inf.ready = true;
	
	InfScreenWnd.superclass.onDataReceived.apply(this, arguments);
};

InfScreenWnd.prototype.refresh = function(){};

InfScreenWnd.prototype.close = function(){
	this.inf.close();
    
    delete this.inf.screen;
    
	InfScreenWnd.superclass.close.apply(this, arguments);
};


InfScreenWnd.prototype.onIdChange = function(newId){
	this.setId(newId);
	
	this.show();
};


InfScreenWnd.prototype.initScreen = function(){
	this.initInterface();
};

InfScreenWnd.prototype.initInterface = function(){
	this.inf = this.getInterface();
};

InfScreenWnd.prototype.getInterface = function(){
	return wndMgr.interfaces[this.getName()];
};

InfScreenWnd.prototype.prepareScreen = function(){
	InfScreenWnd.superclass.prepareScreen.apply(this, arguments);
	
	this.prepareInterface();
};

InfScreenWnd.prototype.prepareInterface = function(){
	wndMgr.interface = this.inf;
	
	this.inf.screen = this;
};