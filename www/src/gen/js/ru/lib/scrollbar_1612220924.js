function IScroll(wrp, opt){
	opt = opt||{};
	
	if( opt.axis == 'x' && !(this instanceof IScrollX) )
		return new IScrollX(wrp, opt);
	
	this.$wrp = $(wrp);
	
	this.id = IScroll.handler++;
	
	IScroll.appendToList(this);
	
	$.extend(this.options = {
		buttons: true,
		dir: 'right',
		scrollbarPosition: 'inside',
		useTimeout: !window.ResizeObserver,
		autoUpdateTimeout: 250
	}, opt);
	
	this.options.callbacks = $.extend({}, IScroll.callbacks, this.options.callbacks);
};


IScroll.list = {};

IScroll.handler = 0;

IScroll.callbacks = {
	onScroll: function(){console.log('onScroll');},
	onTotalScroll: function(){console.log('onTotalScroll');},
	onTotalScrollBack: function(){console.log('onTotalScrollBack');},
	onUpdate: function(){},
	onRemove: function(){},
	onResize: function(){}
};


IScroll.add = function($wrp, opt){
	$wrp = $($wrp);
	
	if( $wrp.length > 1 )
		return new IScrollList($wrp, opt);
	
	return (new IScroll($wrp, opt)).init();
};

IScroll.appendToList = function(scroll){
	IScroll.list[scroll.id] = scroll;
};

IScroll.removeFromList = function(scroll){
	delete IScroll.list[scroll.id];
};

IScroll.scrollbarInfo = (function(){
	var outer = document.createElement('div'),
		inner = document.createElement('div'),
		value;

	outer.classList.add('__scrollInfoHalper');

	outer.appendChild(inner);

	function ScrollbarInfo(){}

	ScrollbarInfo.prototype.getWidth = function(){
		document.documentElement.appendChild(outer);

		value = outer.offsetWidth - inner.offsetWidth;

		outer.parentNode.removeChild(outer);

		return value;
	};

	return new ScrollbarInfo();
}());


IScroll.inherit = function(Child, Parent){
	var F = function(){};
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
	
	Object.setPrototypeOf(Child, Parent); // Наследование статичных методов
};

IScroll.inDOM = (function(){
	if( typeof(document) != 'object' )
		return function(){return false;}; // В воркере нет объекта document
	
	var node = document.contains ? document : document.documentElement;
	
	return function(scrollArea){
		return node.contains(scrollArea);
	};
}());


IScroll.do = function(wrp, method, arg){
	for(var scroll in this.list){
		scroll = this.list[scroll];
		
		if( scroll.wrp == wrp )
			scroll[method].apply(scroll, arg);
	}
};

IScroll.scrollToY = function(scrollArea, val, opt){    
    if( scrollArea instanceof jQuery )
        scrollArea = scrollArea.get(0);
    
    if( !scrollArea )
        return;
    
    opt = opt||{};
    
	var scrollTop;
	
	if( typeof(val) == 'string' ){
		if( val == 'top' )
			scrollTop = 0;
		else if( val == 'bottom' )
			scrollTop = IScroll.calcViewHeight(scrollArea) + 1;

		val = +val;

		if( !isNaN(val) )
			scrollTop = val;
	}
	else if( typeof(val) == 'number' )
		scrollTop = val;
	else if( typeof(val) == 'object' ){
		if( val instanceof jQuery ){
            if( val.length )
                scrollTop = val.get(0).offsetTop;
            else
               return; 
		}
        else
			scrollTop = val.offsetTop;
	}

	if( opt.scrollOffset )
		scrollTop += opt.scrollOffset;

	if( opt.scrollInertia )
		$(scrollArea).animate({scrollTop: scrollTop}, opt.scrollInertia);
	else
		scrollArea.scrollTop = scrollTop;
};

IScroll.scrollToX = function(scrollArea, val, opt){
    if( scrollArea instanceof jQuery )
        scrollArea = scrollArea.get(0);
    
    if( !scrollArea )
        return;
    
	opt = opt||{};
	
	var scrollLeft;
	
	if( typeof(val) == 'string' ){
		if( val == 'left' )
			scrollLeft = 0;
		else if( val == 'right' )
			scrollLeft = IScroll.calcViewWidth() + 1;
		
		val = +val;
		
		if( !isNaN(val) )
			scrollLeft = val;
	}
	else if( typeof(val) == 'number' )
		scrollLeft = val;
	else if( typeof(val) == 'object' ){
		if( val instanceof jQuery ){
            if( val.length )
                scrollLeft = val.get(0).offsetLeft;
            else
                return;
		}
        else
			scrollLeft = val.offsetLeft;
	}
	
	if( opt.scrollOffset )
		scrollLeft += opt.scrollOffset;
	
	if( opt.scrollInertia )
		$(scrollArea).animate({scrollLeft: scrollLeft}, opt.scrollInertia);
	else
		scrollArea.scrollLeft = scrollLeft;
};

IScroll.calcViewHeight = function(scrollArea){
	return scrollArea.scrollHeight - scrollArea.clientHeight;
};

IScroll.calcViewWidth = function(scrollArea){
	return scrollArea.scrollWidth - scrollArea.clientWidth;
};

IScroll.isBlockInViewByY = function(scrollArea, block){
	if( !block )
		return false;

	if( typeof(block) == 'string' )
		block = $(scrollArea).find(block);
	
	if( block instanceof jQuery )
		block = block.get(0);

	if( block.offsetTop > scrollArea.scrollTop + scrollArea.clientHeight )
		return false;
	else if( block.offsetTop + block.clientHeight < scrollArea.scrollTop )
		return false;

	return true;
};

IScroll.isBlockOverTop = function(scrollArea, block){
	if( !block )
		return false;

	if( typeof(block) == 'string' )
		block = $(scrollArea).find(block);

	if( block instanceof jQuery )
		block = block.get(0);

	return block.offsetTop < scrollArea.scrollTop;
};

IScroll.isScrollOnTop = function(scrollArea){
	return !scrollArea.scrollTop;
};

IScroll.isScrollOnBottom = function(scrollArea){
	return scrollArea.scrollTop >= (scrollArea.scrollHeight - scrollArea.clientHeight) - 1;
};

IScroll.isScrollOnLeft = function(scrollArea){
	return !scrollArea.scrollLeft;
};

IScroll.isScrollOnRight = function(scrollArea){
	return scrollArea.scrollLeft >= (scrollArea.scrollWidth - scrollArea.clientWidth) - 1;
};

IScroll.hasScrollY = function(scrollArea){
	return scrollArea.clientHeight < scrollArea.scrollHeight;
};

IScroll.hasScrollX = function(scrollArea){
	return scrollArea.clientWidth < scrollArea.scrollWidth;
};





IScroll.prototype.init = function(){
	this.initDOM();
	
	this.initPadding();
	
	
	this.prepareScrollbar();
	
	this.resize();
	
	this.bind();
	
	
	return this;
};
	
	IScroll.prototype.initDOM = function(){
		this.$wrp.addClass('__scrollWrp');
		
		var $cont = this.$wrp.children();

		if( $cont.length == 1 )
			this.$scrollCont = $cont.addClass('__scrollCont').data('selfcont', true);
		else
			this.$scrollCont = $('<div class="__scrollCont"></div>').append(this.$wrp.contents());

		this.$scrollArea = $('<div class="__scrollArea"></div>').append(this.$scrollCont);
		
		this.initScrollAreaWrp();
		
		this.$scroll = $('<div class="__scroll" data-id="' + this.id + '"></div>').append(this.$scrollAreaWrp);
		
		this.$wrp.append(this.$scroll);


		this.$scrollBar = $('<div class="__scrollBar"></div>');

		this.$scrollBarTrack = $('<div class="__scrollBarTrack"></div>');

		this.$scrollBarRail = $('<div class="__scrollBarRail"></div>');

		this.$scrollBar.append(this.$scrollBarTrack);

		this.$scrollBar.append(this.$scrollBarRail);

		if( this.options.buttons ){
			this.initButtons();

			this.$scrollBarButtons = this.$scrollBar.find('.__scrollBarButton');
		}

		this.$scroll.append(this.$scrollBar);
		
		
		this.wrp = this.$wrp.get(0);
		
		this.scroll = this.$scroll.get(0);
		
		this.scrollAreaWrp = this.$scrollAreaWrp.get(0);
		
		this.scrollArea = this.$scrollArea.get(0);
		
		this.scrollCont = this.$scrollCont.get(0);
		
		this.scrollBar = this.$scrollBar.get(0);
		
		this.scrollBarTrack = this.$scrollBarTrack.get(0);
		
		this.scrollBarRail = this.$scrollBarRail.get(0);
	};
		
		IScroll.prototype.initScrollAreaWrp = function(){
            if( !IScroll.scrollbarInfo.getWidth() ){
                IScroll.prototype.initScrollAreaWrp = function(){
                    this.$scrollAreaWrp = this.$scrollArea;
                };
                
                IScroll.prototype.hideOriginScrollbar = function(){};
            }
            else{
                IScroll.prototype.initScrollAreaWrp = function(){
                    this.$scrollAreaWrp = $('<div class="__scrollAreaWrp"></div>').append(this.$scrollArea);
                };
            }
            
            this.initScrollAreaWrp();
		};

		IScroll.prototype.initButtons = function(){
			this.$scrollBar.prepend('<div class="__scrollBarButton" data-dir="inc"></div>');
            
			this.$scrollBar.append('<div class="__scrollBarButton"  data-dir="dec"></div>');
		};
	
	IScroll.prototype.initPadding = function(){
		var styles = window.getComputedStyle(this.wrp);
		
		this.padding = {
			left: parseInt(styles.paddingLeft),
			right: parseInt(styles.paddingRight),
			top: parseInt(styles.paddingTop),
			bottom: parseInt(styles.paddingBottom) 
		};
	};
	
	IScroll.prototype.prepareScrollbar = function(){
		this.$scroll.attr({
			'data-dir': this.options.dir,
			'data-pos': this.options.scrollbarPosition,
			'data-axis': this.getAxis()
		});
		
		return this;
	};
	
		IScroll.prototype.getAxis = function(){
			return 'y';
		};
	
	
IScroll.prototype.bind = function(){
	this.bindEvents();
	
	this.bindResizeObserver();
};

IScroll.prototype.unbind = function(){
	this.unbindEvents();
	
	this.unbindResizeObserver();
};

IScroll.prototype.bindEvents = function(){
	var self = this;
	
	this.$scrollArea.on('scroll.__scroll', function(e){
		self.updateTrack();
		
		self.scrollTracking(this, e);
	});
	
	this.$scrollBar.on('click.__scroll', function(e){
		e = e.originalEvent||e;
		
		if( e._ignoreIScrollBarClick )
			return;
		
		self.onScrollbarClick(e);
	});
	
	this.$scrollBarTrack.on('click.__scroll', function(e){
		e = e.originalEvent||e;
		
		e._ignoreIScrollBarClick = true;
	});
	
	if( this.options.buttons ){
		this.$scrollBarButtons	
			.on('mousedown.__scroll', function(){
				self.onButtonDown($(this));
			})
			.on('click.__scroll', function(e){
				e = e.originalEvent||e;
				
				e._ignoreIScrollBarClick = true;
			});
	}
	
	this.dragStart = this.dragStart.bind(this);
	this.dragMove = this.dragMove.bind(this);
	this.dragEnd = this.dragEnd.bind(this);
	
	this.$scrollBarTrack.on('mousedown.__scroll', this.dragStart);
	
	return this;
};
	
IScroll.prototype.unbindEvents = function(){
	this.$scrollArea.off('.__scroll');

	this.$scrollBar.off('.__scroll');

	this.$scrollBarTrack.off('.__scroll');

	return this;
};

IScroll.prototype.bindResizeObserver = function(){
	if( this.options.noUpdateOnContentResize )
		return this;
	
	if( this.options.useTimeout ){
		this.initObserve();
		
		return this;
	}

	var self = this;
	
	this.resizeObserver = new ResizeObserver(function(entries){
		if( !IScroll.inDOM(self.scrollArea) ){
			self.remove();
			
			return;
		}
        
        if( !self.isSizeChange() )
            return;
        
        console.log('----> resizeObserver: ', entries);
        
        if( debug.isTest() )
            self.resize(true);
        else{
            self.toggleObserve(false); // Отключаем отслеживание изменения размера, т.к. внутри ResizeObserver может возникнуть зацикливание (косяк ResizeObserver)
            
            self.resize(true);
            
            self.toggleObserveTO = setTimeout(function(){
                self.toggleObserve(true);
            }, 10);
        }
	});
	
	this.toggleObserve(true);
	
	this.resizeObserverTO = setTimeout(function(){
		self.resize();
        
        console.log('----> resizeObserverTO');
	}, 50);
	
	return this;
};
	
    IScroll.prototype.toggleObserve = function(toggle){
        if( toggle ){
            if( !debug.isTest() )
                this.resizeObserver.observe(this.wrp.parentNode);
            
            this.resizeObserver.observe(this.wrp);
            this.resizeObserver.observe(this.scrollCont);
        }
        else
            this.resizeObserver.disconnect();
    };
        
	IScroll.prototype.initObserve = function(){
		this.runObserve = this.runObserve.bind(this);
		
		this.runObserve();
	};
	
	IScroll.prototype.runObserve = function(){
		if( !IScroll.inDOM(this.scrollArea) ){
			this.remove();
			
			return;
		}
		
		this.update();
		
		this.observeTO = setTimeout(this.runObserve, this.options.autoUpdateTimeout);
	};
	
	IScroll.prototype.stopObserve = function(){
		clearTimeout(this.observeTO);
	};
	
IScroll.prototype.unbindResizeObserver = function(){
	if( this.options.noUpdateOnContentResize )
		return this;
	
	if( this.options.useTimeout ){
		this.stopObserve();

		return this;
	}
    
    this.toggleObserve(false);
	
	clearTimeout(this.resizeObserverTO);
    
    clearTimeout(this.toggleObserveTO);
	
	return this;
};


IScroll.prototype.scrollTracking = function(scrollArea){
	this.onScroll(200);
	
	if( this.hasScroll() ){
		if( this.isScrollOnStart() ){
			this.onScroll(-1);
			
			this.options.callbacks.onTotalScrollBack.call(scrollArea, this);
		}
		else if( this.isScrollOnEnd() ){
			this.onScroll(-1);
			
			this.options.callbacks.onTotalScroll.call(scrollArea, this);
		}
	}
};

IScroll.prototype.onScroll = function(delay){
	if( delay < 0 ){
		clearTimeout(this.onScrollTO);
		
		this.onScrollTO = false;
		
		this.options.callbacks.onScroll.call(this.scrollArea, this);

		return;
	}
	
	if( this.onScrollTO )
		return;
	
	this.onScrollTO = setTimeout(function(){
		this.onScrollTO = false;
		
		this.options.callbacks.onScroll.call(this.scrollArea, this);
	}.bind(this), delay||200);
};


IScroll.prototype.onScrollbarClick = function(e){
	var coorY = e.offsetY;
	
	if( e.offsetY > this.scrollBarTrack.offsetTop + this.scrollBarTrack.offsetHeight )
		coorY -= this.scrollBarTrack.offsetHeight;
	
	this.moveByScrollbar(coorY);
};

IScroll.prototype.onButtonDown = function($button){
	var self = this,
		pos = 'scrollTop',
		dir = $button.data('dir') == 'inc' ? -1 : 1,
		speed = self.scrollArea.scrollHeight/self.scrollArea.clientHeight,
		intervalId = setInterval(function(){
			self.scrollArea[pos] += speed * 2 * dir;
		}, 17);

	$(document)
		.on('mouseup.__scroll', function(){
			clearInterval(intervalId);

			$(document).off('.__scroll');
		});
};


IScroll.prototype.dragStart = function(e){
	e = e.originalEvent||e;
	
	this._dragging = {
		posStart: e.clientY,
		scrollTopStartPos: this.scrollArea.scrollTop
	};
	
	$(document)
			.on('mousemove.__scroll', this.dragMove)
			.on('mouseup.__scroll', this.dragEnd);
};

IScroll.prototype.dragMove = function(e){
	if( !this._dragging )
		return;

	e = e.originalEvent||e;

	var offsetY = e.clientY - this._dragging.posStart;

	this.moveByScrollbar(offsetY, this._dragging.scrollTopStartPos);
};

IScroll.prototype.dragEnd = function(e){
	if( !this._dragging )
		return;

	delete this._dragging;

	$(document).off('.__scroll');
};


IScroll.prototype.update = 
IScroll.prototype.resize = function(forceResize){
	if( !forceResize && !this.isSizeChange() )
		return this;
	
    if( !debug.isTest() )
        this.updSize();
	
	this.storeSize();
	
	this.checkNoScroll();
	
	this.cacheSize();
	
	this.updateTrack();
	
	this.options.callbacks.onResize();
	
	console.log('----> IScroll resize', this.$scrollArea);
	
	return this;
};
	
	IScroll.prototype.isSizeChange = function(){
		return	(!debug.isTest() && this.oldWrpParentNodeClientHeight != (this.wrp.parentNode||{}).clientHeight) || 
                this.oldWrpClientHeight != this.wrp.clientHeight || 
				this.oldScrollContClientHeight != this.scrollCont.clientHeight;
	};
	
	IScroll.prototype.updSize = function(){
		var oldScrollTop = this.scrollArea.scrollTop;
        
		this.$scrollArea
			.css('height', '')
			.css('height', this.wrp.getBoundingClientRect().height - this.padding.top - this.padding.bottom);
            
		this.scrollArea.scrollTop = oldScrollTop;
	};
	
	IScroll.prototype.storeSize = function(){
        if( !debug.isTest() )
            this.oldWrpParentNodeClientHeight = (this.wrp.parentNode||{}).clientHeight;
        
		this.oldWrpClientHeight = this.wrp.clientHeight;
        this.oldScrollContClientHeight = this.scrollCont.clientHeight;
	};
	
	IScroll.prototype.cacheSize = function(){
		this.scrollBarTrack.style.height = (this.scrollBar.offsetHeight * (this.scrollArea.clientHeight/this.scrollArea.scrollHeight)) + 'px';
		
		this.sizeInfo = {
			scrollbarRestSpace: this.calcScrollbarRestSpace(),
			viewHeight: this.calcViewHeight()
		};
		
		this.sizeInfo.scrollbarViewRatio = this.sizeInfo.scrollbarRestSpace / this.sizeInfo.viewHeight;
	};
		
		IScroll.prototype.calcScrollbarRestSpace = function(){
			return	this.scrollArea.clientHeight - 
					(this.scrollArea.clientHeight - this.scrollBar.offsetHeight) - 
					this.scrollBarTrack.offsetHeight;
		};
		
		IScroll.prototype.calcViewHeight = function(){
			return IScroll.calcViewHeight(this.scrollArea);
		};
	
	IScroll.prototype.hasScroll = function(){
		return IScroll.hasScrollY(this.scrollArea);
	};
	
	IScroll.prototype.checkNoScroll = function(e){
		var noScroll = !this.hasScroll();
        
		this.$scroll.toggleClass('-type-noScroll', noScroll);
        
        this.checkOriginScrollbar(noScroll);
        
		return noScroll;
	};
        
        IScroll.prototype.checkOriginScrollbar = function(noScroll){
			this.$scrollArea.css('margin-' + this.options.dir, noScroll ? '' : -IScroll.scrollbarInfo.getWidth());
		};
	
IScroll.prototype.restore = function(){
    this.clearTimeouts();
    
	this.unbind();
    
    this.$scrollArea.stop(true);
    
	this.restoreDOM();
	
	IScroll.removeFromList(this);
	
	this.options.callbacks.onRemove.call(this);
	
	console.log('scroll restored');
};

	IScroll.prototype.restoreDOM = function(){
		this.$wrp.addClass('__scrollWrp');
		
		var $cont = this.$scrollCont;
		
		if( this.$scrollCont.data('selfcont') )
			$cont.removeClass('__scrollCont');
		else
			$cont = $cont.contents();
		
		this.$scroll.after($cont);
		
		this.$scroll.remove();
	};

IScroll.prototype.remove = function(){
    this.clearTimeouts();
    
	this.unbind();
    
    this.$scrollArea.stop(true);
    
	this.$wrp.remove();
	
	IScroll.removeFromList(this);
	
	this.options.callbacks.onRemove.call(this);
	
	console.log('scroll removed');
};

IScroll.prototype.clearTimeouts = function(){
    clearTimeout(this.onScrollTO);
};


IScroll.prototype.updateTrack = function(){
	if( !this.hasScroll() )
		return this;
	
	var pos = (this.scrollArea.scrollTop * this.sizeInfo.scrollbarViewRatio)||0;
	
	this.scrollBarTrack.style.top = pos + 'px';
	
	return this;
};

IScroll.prototype.moveByScrollbar = function(coor, scrollOffset){
	this.scrollTo((scrollOffset||0) + (coor / this.sizeInfo.scrollbarViewRatio));
};





IScroll.prototype.$getWrp = function(){
	return this.$wrp;
};

IScroll.prototype.$getScrollArea = function(){
	return this.$scrollArea;
};

IScroll.prototype.$getCont = function(){
	return this.$scrollCont;
};

IScroll.prototype.getWrp = function(){
	return this.wrp;
};

IScroll.prototype.getScrollArea = function(){
	return this.scrollArea;
};

IScroll.prototype.getCont = function(){
	return this.scrollCont;
};


IScroll.prototype.do = function(method, arg){
	this[method].apply(this, arg);
};

IScroll.prototype.scrollTo = function(val, opt){
	IScroll.scrollToY(this.scrollArea, val, opt);
	
	return this;
};

IScroll.prototype.isBlockInView = function(block){
	return IScroll.isBlockInViewByY(this.scrollArea, block);
};

IScroll.prototype.isBlockOverTop = function(block){
	return IScroll.isBlockOverTop(this.scrollArea, block);
};

IScroll.prototype.isScrollOnStart = 
IScroll.prototype.isScrollOnTop = function(){
	return IScroll.isScrollOnTop(this.scrollArea);
};

IScroll.prototype.isScrollOnEnd = 
IScroll.prototype.isScrollOnBottom = function(){
	return IScroll.isScrollOnBottom(this.scrollArea);
};





function IScrollX(wrp, opt){
	opt = opt||{};
	
	IScrollX.superclass.constructor.apply(this, arguments);
	
	this.options.dir = opt.dir||'bottom';
};

IScroll.inherit(IScrollX, IScroll);


IScrollX.prototype.initButtons = function(){
	this.$scrollBar.prepend('<div class="__scrollBarButton" data-dir="left"></div>');
	
	this.$scrollBar.append('<div class="__scrollBarButton"  data-dir="right"></div>');
};

IScrollX.prototype.getAxis = function(){
	return 'x';
};


IScrollX.prototype.bindEvents = function(){
	IScrollX.superclass.bindEvents.apply(this, arguments);
	
	// Чтобы скролл работал без shift
	this.$scrollArea.on('wheel.__scroll', function(e){
		e = e.originalEvent||e;
        
		if( e.cancelable )
            e.preventDefault();
		
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		
		this.scrollLeft -= delta * 120;
	});
	
	return this;
};


IScrollX.prototype.onScrollbarClick = function(e){
	var coorX = e.offsetX;
	
	if( coorX > this.scrollBarTrack.offsetLeft + this.scrollBarTrack.offsetWidth )
		coorX -= this.scrollBarTrack.offsetWidth;
	
	this.moveByScrollbar(coorX);
};

IScrollX.prototype.onButtonDown = function($botton){
	var self = this,
		pos = 'scrollLeft',
		dir = $botton.data('dir') == 'left' ? -1 : 1,
		speed = self.scrollArea.scrollWidth/self.scrollArea.clientWidth,
		intervalId = setInterval(function(){
			self.scrollArea[pos] += speed * 2 * dir;
		}, 17);
		
	$(document)
		.on('mouseup.__scroll', function(){
			clearInterval(intervalId);
			
			$(document).off('.__scroll');
		});
};


IScrollX.prototype.dragStart = function(e){
	e = e.originalEvent||e;

	this._dragging = {
		posStart: e.clientX,
		scrollLeftStartPos: this.scrollArea.scrollLeft
	};

	$(document)
			.on('mousemove.__scroll', this.dragMove)
			.on('mouseup.__scroll', this.dragEnd);
};

IScrollX.prototype.dragMove = function(e){
	if( !this._dragging )
		return;

	e = e.originalEvent||e;

	var offsetX = e.clientX - this._dragging.posStart;

	this.moveByScrollbar(offsetX, this._dragging.scrollLeftStartPos);
};

IScrollX.prototype.dragEnd = function(e){
		if( !this._dragging )
			return;
		
		delete this._dragging;
		
		$(document).off('.__scroll');
	};


IScrollX.prototype.updSize = function(){
	var oldScrollLeft = this.scrollArea.scrollLeft;

	this.$scrollArea
		.css('width', '')
		.css('width', this.wrp.getBoundingClientRect().width - this.padding.left - this.padding.right);

	this.scrollArea.scrollLeft = oldScrollLeft;
};

IScrollX.prototype.isSizeChange = function(){
	return	(!debug.isTest() && this.oldWrpParentNodeClientWidth != (this.wrp.parentNode||{}).clientWidth) ||
            this.oldWrpClientWidth != this.wrp.clientWidth || 
			this.oldScrollContClientWidth != this.scrollCont.clientWidth;
};

IScrollX.prototype.storeSize = function(){
    if( !debug.isTest() )
        this.oldWrpParentNodeClientWidth = (this.wrp.parentNode||{}).clientWidth;
    
	this.oldWrpClientWidth = this.wrp.clientWidth;
	this.oldScrollContClientWidth = this.scrollCont.clientWidth;
};

IScrollX.prototype.cacheSize = function(){
	this.scrollBarTrack.style.width = (this.scrollBar.offsetWidth * (this.scrollArea.clientWidth/this.scrollArea.scrollWidth)) + 'px';

	this.sizeInfo = {
		scrollbarRestSpace: this.calcScrollbarRestSpace(),
		viewWidth: this.calcViewWidth()
	};

	this.sizeInfo.scrollbarViewRatio = this.sizeInfo.scrollbarRestSpace / this.sizeInfo.viewWidth;
};

	IScrollX.prototype.calcScrollbarRestSpace = function(){
		return	this.scrollArea.clientWidth - 
				(this.scrollArea.clientWidth - this.scrollBar.offsetWidth) - 
				this.scrollBarTrack.offsetWidth;
	};

	IScrollX.prototype.calcViewWidth = function(){
		return IScroll.calcViewWidth(this.scrollArea);
	};

IScrollX.prototype.hasScroll = function(){
	return IScroll.hasScrollX(this.scrollArea);
};


IScrollX.prototype.updateTrack = function(){
	if( this.hasScroll() )
		return this;
	
	var pos = this.scrollArea.scrollLeft * this.sizeInfo.scrollbarViewRatio;
	
	this.scrollBarTrack.style.left = (pos||0) + 'px';
	
	return this;
};


IScrollX.prototype.scrollTo = function(val, opt){
	IScroll.scrollToX(this.scrollArea, val, opt);
	
	return this;
};

IScrollX.prototype.isScrollOnStart = 
IScrollX.prototype.isScrollOnLeft = function(){
	return IScroll.isScrollOnLeft(this.scrollArea);
};

IScrollX.prototype.isScrollOnEnd = 
IScrollX.prototype.isScrollOnRight = function(){
	return IScroll.isScrollOnRight(this.scrollArea);
};





IScrollList = function($wrp, opt){
	opt = opt||{};
	
	var self = this;
	
	this.list = [];
	this.$wrp = $wrp;
	
	opt.callbacks = opt.callbacks||{};
	
	opt.callbacks.onRemove = function(){
		self.delete(this);
	};
	
	$wrp.each(function(){
		self.list.push((new IScroll(this, opt)).init());
	});
};

IScrollList.prototype.each = function(callback){
	var scroll, l = this.list.length;
	
	for(var i = 0; i < l; i++){
		scroll = this.list[i];
		
		if( !scroll ){
			this.list.splice(i, 1);
			
			i--;
			
			continue;
		}
		
		if( callback.call(scroll, i, this) )
			return;
	}
};

IScrollList.prototype.push = function(scroll){
	this.list.push(scroll);
};

IScrollList.prototype.delete = function(scroll){
	var index = this.list.indexOf(scroll);
	
	if( index < 0 )
		return;
	
	this.list[index] = null;
};

IScrollList.prototype.get = function(i){
	return this.list[i];
};


IScrollList.prototype.restore = function(){
	this.each(function(){
		this.restore();
	});
	
	this.list = [];
	
	return this;
};

IScrollList.prototype.remove = function(){
	this.each(function(){
		this.remove();
	});
	
	this.list = [];
	
	return this;
};

IScrollList.prototype.update = 
IScrollList.prototype.resize = function(forceResize){
	this.each(function(){
		this.resize(forceResize);
	});
	
	return this;
};

IScrollList.prototype.updateTrack = function(){
	this.each(function(){
		this.updateTrack();
	});
	
	return this;
};


IScrollList.prototype.$getWrp = function(){
	return this.$wrp;
};

IScrollList.prototype.do = function(method, arg){
	this[method].apply(this, arg);
};

IScrollList.prototype.scrollTo = function(val, opt){
	this.each(function(){
		this.scrollTo(val, opt);
	});
	
	return this;
};

IScrollList.prototype.isBlockInView = function(block, i){
	if( i === undefined )
		i = 0;
	
	return this.list[i].isBlockInView(block);
};

IScrollList.prototype.isBlockOverTop = function(block, i){
	if( i === undefined )
		i = 0;
	
	return this.list[i].isBlockOverTop(block);
};