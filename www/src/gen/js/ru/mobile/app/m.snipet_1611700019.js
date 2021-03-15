snip.getFakelinkCls = function(opt){
	opt = opt||{};
	
	return 'button1' + (opt.small ? 's' : '') + ' ' + (opt.type ? '-type-' + opt.type : '');
};



snip.swipeHandler = function($el, opt){
	if( !$el || !$el.length || $el.data('_swipe_') )
		return;
	
	opt = opt||{};
	
	var _swipe_ = {
        axis: opt.axis||'xy',
        threshold: snip.getSwipeThreshold(opt.threshold),
		callbacks: {
			onSwipeStart: function(){},
			onSwipeMove: function(){},
			onSwipeEnd: function(){},
			onSwipeAbort: function(){},
		}
	};
	
	utils.copy(_swipe_.callbacks, opt.callbacks);
	
	snip.swipeHandler.off($el);
	
	$el
		.on('touchstart.swipeHandler', function(e){
			e = e.originalEvent||e;
			
			snip.swipeHandler.swipeStart(this, $(this).data('_swipe_'), e.touches, e);
		})
		.on('touchmove.swipeHandler', function(e){
			e = e.originalEvent||e;
			
			snip.swipeHandler.swipeMove($(this).data('_swipe_'), e.touches, e);
		})
		.on('touchend.swipeHandler touchcancel.swipeHandler', function(e){
			e = e.originalEvent||e;
			
			snip.swipeHandler.swipeEnd($(this).data('_swipe_'), e.touches, e);
		})
		.on('swipeabort.swipeHandler', function(e){
			e = e.originalEvent||e;
			
			snip.swipeHandler.swipeAbort($(this).data('_swipe_'), e.touches, e);
		});
	
	for(var handler in opt.handlers){
		$el.on(handler + '.swipeHandler', opt.handlers[handler]);
	}
	
	$el.data('_swipe_', _swipe_);
	
	return $el;
};
	snip.swipeHandler.off = function($el){
		if( !$el || !$el.length )
			return;

		$el.off('.swipeHandler');
		
		$el.removeData('_swipe_');
		
		return $el;
	};
	snip.swipeHandler.swipeStart = function(el, _swipe_, touches, e){
		if( touches.length != 1 )
			return;
        
		_swipe_.swiping = {
			el: el,
			pointStart: new Vector2D(utils.getPosFromEvent(touches[0]))
		};
		
		_swipe_.callbacks.onSwipeStart.call(_swipe_.swiping.el, _swipe_.swiping, e, touches);
	};
	snip.swipeHandler.swipeMove = function(_swipe_, touches, e){
		if( touches.length != 1 || !_swipe_.swiping )
			return;
        
		_swipe_.swiping.pointDelta = _swipe_.swiping
											.pointStart
											.getDiffVector(utils.getPosFromEvent(touches[0]));
		
        // Проверяем свайп по противоположной оси
        if( _swipe_.axis != 'xy' ){
            if( Math.abs(_swipe_.swiping.pointDelta[_swipe_.axis == 'x' ? 'y' : 'x']) > 50 )
                return snip.swipeHandler.swipeAbort(_swipe_, touches, e);
        }
        
        // В некоторых браузерах, при свайпе влево/вправо, есть нежелательные действия по умолчанию - отменяем
        if( !_swipe_.swiping.preventDefault && _swipe_.axis == 'x' ){
            if( Math.abs(_swipe_.swiping.pointDelta.x) >= Math.abs(_swipe_.swiping.pointDelta.y) )
                _swipe_.swiping.preventDefault = true;
        }
        
        if( e.cancelable && _swipe_.swiping.preventDefault )
            e.preventDefault();
        
		_swipe_.callbacks.onSwipeMove.call(_swipe_.swiping.el, _swipe_.swiping.pointDelta, _swipe_.swiping, e, touches);
	};
	snip.swipeHandler.swipeEnd = function(_swipe_, touches, e){
		if( !_swipe_.swiping || !_swipe_.swiping.pointDelta )
			return;
		
        if( _swipe_.axis != 'xy' ){
            if( Math.abs(_swipe_.swiping.pointDelta[_swipe_.axis]) < _swipe_.threshold )
               return snip.swipeHandler.swipeAbort(_swipe_, touches, e);
        }
        
		_swipe_.callbacks.onSwipeEnd.call(_swipe_.swiping.el, _swipe_.swiping.pointDelta, _swipe_.swiping, e, touches);
		
		delete _swipe_.swiping;
	};
	snip.swipeHandler.swipeAbort = function(_swipe_, touches, e){
		if( !_swipe_.swiping )
			return;
		
		_swipe_.callbacks.onSwipeAbort.call(_swipe_.swiping.el, _swipe_.swiping.pointDelta, _swipe_.swiping, e, touches);
		
		delete _swipe_.swiping;
	};
    
snip.getSwipeThreshold = function(val) {
    if( val !== undefined )
        return val;
    
    return 35;
};



snip.xScrollHandler = function($wrp, parent, selector){
	if( !$wrp || !parent )
		return;
	
	$wrp
		.on('touchstart', selector, function(e){
			var touches = e.originalEvent.touches;
			
			if( touches.length != 1 )
				return;
			
			var scroll = $(this).get(0),
				scrolling = {
					atLeft: !scroll.scrollLeft,
					atRight: scroll.scrollLeft >= (scroll.scrollWidth - scroll.clientWidth) - 1
				};
			
			if( scrolling.atLeft || scrolling.atRight ){
				if( scrolling.atLeft && scrolling.atRight )
					return;
				
				scrolling.startPos = utils.getPosFromEvent(touches[0]);
				
				scroll._scrolling_ = scrolling;
				
				return;
			}
			
			e.stopPropagation();
		})
		.on('touchmove', selector, function(e){
			var touches = e.originalEvent.touches,
				scrolling = this._scrolling_;
			
			if( touches.length != 1 || !scrolling || scrolling.abortSwipe !== undefined )
				return;
			
			var dX = scrolling.startPos.x - utils.getPosFromEvent(touches[0]).x;
			
			scrolling.abortSwipe = (scrolling.atLeft && dX > 0) || (scrolling.atRight && dX < 0);
			
			if( scrolling.abortSwipe )
				parent.abortSwipe();
		})
		.on('touchend', selector, function(e){
			delete this._scrolling_;
		});
};

snip.yScrollHandler = function($wrp, parent, opt){
	if( !$wrp || !parent )
		return;
	
    opt = opt||{};
    
    var checkAbortSwipe = opt.checkAbortSwipe||function(scrolling, dY){
        return (scrolling.atTop && dY > 0) || (scrolling.atBottom && dY < 0);
    };
    
	$wrp
		.on('touchstart', opt.selector, function(e){
			var touches = e.originalEvent.touches;
			
			if( touches.length != 1 )
				return;
			
			var scroll = $(this).get(0),
				scrolling = {
					atTop: !scroll.scrollTop,
					atBottom: scroll.scrollTop >= (scroll.scrollHeight - scroll.clientHeight) - 1
				};
			
			if( scrolling.atTop || scrolling.atBottom ){
				if( scrolling.atTop && scrolling.atBottom )
					return;
				
				scrolling.startPos = utils.getPosFromEvent(touches[0]);
				
				scroll._scrolling_ = scrolling;
				
				return;
			}
			
			e.stopPropagation();
		})
		.on('touchmove', opt.selector, function(e){
			var touches = e.originalEvent.touches,
				scrolling = this._scrolling_;
			
			if( touches.length != 1 || !scrolling || scrolling.abortSwipe !== undefined )
				return;
			
			var dY = scrolling.startPos.y - utils.getPosFromEvent(touches[0]).y;
			
			scrolling.abortSwipe = checkAbortSwipe(scrolling, dY);
			
			if( scrolling.abortSwipe )
				parent.abortSwipe();
		})
		.on('touchend touchcancel', opt.selector, function(e){
			delete this._scrolling_;
		});
};



snip.sliderHandler = function($el, opt){
	opt = opt||{};
	
	opt.createOrigin = function(){};
	
	if( opt.create )
		opt.createOrigin = opt.create;
	
	opt.create = function(){
		var $slider = $(this),
			touchStartPos = null,
			threshold = 5,
            multiTouchDetected = false;
		
		$slider
			.on('touchstart', function(e){
				e = e.originalEvent||e;
				
				if( e.touches.length > 1 || touchStartPos ){
					touchStartPos = null;
					
					return;
				}
                
				touchStartPos = e.touches[0];
			})
			.on('touchmove', function(e){
				e = e.originalEvent||e;
                
				if( e.touches.length > 1 ){
                    if( multiTouchDetected )
                        return;
                    
                    touchStartPos = null;

					this.dispatchEvent(new TouchEvent('touchend', e));
                    
                    multiTouchDetected = true;
				}
				else if( multiTouchDetected ){
                    multiTouchDetected = false;
                    
                    touchStartPos = e.touches[0];;
                } 
                
				if( !touchStartPos )
                    return;
                
                if( Math.abs(touchStartPos.pageY - e.touches[0].pageY) > threshold )
                    touchStartPos = null;
                else if( Math.abs(touchStartPos.pageX - e.touches[0].pageX) > threshold ){
                    $slider.slider('enable');
                    
                    $slider.trigger('slider_smoothslidestart', [true]);
                    
                    this.dispatchEvent(new TouchEvent('touchstart', e));
                }
			})
			.on('touchend', function(e){
				e = e.originalEvent||e;
				
				if( touchStartPos ){
					$slider.slider('enable');
					
                    $slider.trigger('slider_smoothslidestart');
                    
					this.dispatchEvent(new TouchEvent('touchstart', e));
					
					this.dispatchEvent(new TouchEvent('touchend', e));
                    
                    touchStartPos = null;
				}
				
                $slider.slider('disable');
			});
		
        
		$slider.slider('option', 'createOrigin').apply(this, arguments);
	};
	
	opt.disabled = true;
	
	return $el.slider(opt);
};



IPlugin = function(block, opt){
	this.init(block, opt);
};

IPlugin.prototype.init = function(block, opt){
	this.timeouts = {};
	
	this.initParentBlock(block);

	this.bindEvent();
};

IPlugin.prototype.getName = function(){
	return 'plugin';
};

IPlugin.prototype.setParentBlock = function(block){
	this.block = block;
	
	return this;
};

IPlugin.prototype.getParentBlock = function(){
	return this.block;
};

IPlugin.prototype.initParentBlock = function(block){
	this.setParentBlock(block);
	
	this.block.plugins[this.getName()] = this;
};

IPlugin.prototype.bindEvent = function(){};

IPlugin.prototype.onRemove = function(){
	this.clearAllTimeouts();
};	


IPlugin.prototype.setTimeout = function(callback, delay){
	// Игнорируем большую задержку
	if( delay > timeMgr.maxTimeoutDelay )
		return;
	
	var timeoutId = setTimeout(function(){
		callback.call(this);
		
		// После срабатывания тймера удаляем timeoutId из списка timeouts
		this.delTimeoutId(timeoutId);
	}.bind(this), delay);
	
	this.timeouts[timeoutId] = {id: timeoutId};
	
	return timeoutId;
};

IPlugin.prototype.clearTimeout = function(timeoutId){
	if( this.timeouts[timeoutId] ){
		clearTimeout(timeoutId);
		
		this.delTimeoutId(timeoutId);
	}
};

IPlugin.prototype.delTimeoutId = function(timeoutId){
	delete this.timeouts[timeoutId];
};

IPlugin.prototype.clearAllTimeouts = function(){
	for(var timeoutId in this.timeouts)
		clearTimeout(timeoutId);
	
	this.timeouts = {};
};



IPlugin_footer = function(){
	IPlugin_footer.superclass.constructor.apply(this, arguments);
};


utils.extend(IPlugin_footer, IPlugin);


IPlugin_footer.prototype.init = function(block, opt){
	IPlugin_footer.superclass.init.apply(this, arguments);
	
	opt = opt||{};
	
	this.$setWrp(opt.$wrp);
	
	this.$setFooter(opt.$footer);
	
	this.toggleActive(opt.active === undefined ? true : opt.active);
	
	this.delay = 750;
};

IPlugin_footer.prototype.getName = function(){
	return 'footer';
};

IPlugin_footer.prototype.bindEvent = function(){
	var self = this;
    
	this.$getScroll()
		.on('focusin', function(e){
			if( self.isInactive() )
				return;
			
			var isFocused = wndMgr.isFocusableElem(e.target);
			
			if( e._footerTarget_ || !isFocused ){
				if( isFocused ){
					self.toggleFixed(true, -1);
					
					self.toggle(true);
				}
				
				return;
			}

			self.toggle(false);
		})
		.on('focusout', function(e){
			if( self.isInactive() )
				return;
			
			self.toggleFixed(false);
		})
		.on('touchstart', function(e){
			e = e.originalEvent||e;
			
			if( e.touches.length != 1 || e._footerTarget_ || self.isInactive() )
				return;
			
			delete self._scrollAfterTouch; // Флаг определеяющий была ли прокрутка страницы после касания
			
			// Если происходит тач во время скролла страницы, то после него будет вызвано "нежелательное" событие onScroll
			delete self._detectScroll; // Флаг указывающий, что нужно реагировать на скролл
			
			self._touchActive = true; // Флаг указывающий, что пользователь касается экрана
			
			self.clearDelayedShow(true);
		})
		.on('touchmove', function(e){
			e = e.originalEvent||e;

			if( e.touches.length != 1 || e._footerTarget_ || self.isInactive() )
				return;

			self._detectScroll = true; // Реагируем на скролл, только в том случае если он был вызван пользователем
		})
		.on('touchend', function(e){
			e = e.originalEvent||e;

			if( e.touches.length > 0 || e._footerTarget_ || self.isInactive() )
				return;
			
			delete self._touchActive;

			if( self._scrollAfterTouch )
				self.hideForAwhile(self.delay);
			else
				self.onClick(e);
		});

	this.bindCallbacks();
};

	IPlugin_footer.prototype.bindCallbacks = function(){
		var parentWnd = this.getParentWnd();
		
		parentWnd.makeResize = function(){
			this.delegate('makeResize', this.constructor);
			
			this.plugins.footer.onResize();
		};
		
		parentWnd.onScroll = function(e){
			this.plugins.footer.onScroll(e);
			
			this.delegate('onScroll', this.constructor);
		};

		parentWnd.onSwipeStart = function(nextWnd){
			this.plugins.footer.onSwipeStart(nextWnd);

			this.delegate('onSwipeStart', this.constructor);
		};

		parentWnd.onSwipeReset = function(){
			this.plugins.footer.onSwipeReset();

			this.delegate('onSwipeReset', this.constructor);
		};

		parentWnd.onSwipeBack = function(){
			this.plugins.footer.onSwipeBack();

			this.delegate('onSwipeBack', this.constructor);
		};

		parentWnd.onTop = function(){
			this.plugins.footer.onTop();

			this.delegate('onTop', this.constructor);
		};
	};

IPlugin_footer.prototype.getParentWnd = IPlugin.prototype.getParentBlock;


IPlugin_footer.prototype.$setWrp = function($wrp){
	this.$wrp = $wrp||$();
	
	return this;
};

IPlugin_footer.prototype.$getWrp = function(){
	return this.$wrp;
};

IPlugin_footer.prototype.$setFooter = function($footer, noReset){
	this.$footer = $footer||$();
	
	if( !noReset )
		this.reset();
	
	this.$getFooter().addClass('-type-plugin-footer');
	
	var self = this;
	
	snip.swipeHandler(this.$getFooter(), {
		callbacks: {
			onSwipeStart: function(swiping, e){
				e._footerTarget_ = true;
				
				/*
				self.pointStart = new Vector2D(e.touches[0].pageX, e.touches[0].pageY);
				*/
			},
            onSwipeMove: function(pointDelta, swiping, e){
				e._footerTarget_ = true;
				
				/*
                self.pointMove = new Vector2D(e.touches[0].pageX, e.touches[0].pageY);
                
                self.block.$contWrp.get(0).scrollTop += self.pointStart.y - self.pointMove.y;
                
                self.pointStart = self.pointMove;
				*/
			},
			onSwipeEnd: function(pointDelta, swiping, e){
				e._footerTarget_ = true;
				
				if( self.isInactive() || !pointDelta || Math.abs(pointDelta.y||0) < 35 )
					return;
				
				self.hideForAwhile(5000);
			}
		},
		handlers: {
			focusin: function(e){
				e._footerTarget_ = true;
			}
		}
	});
	
	return this;
};

IPlugin_footer.prototype.$getFooter = function(){
	return this.$footer||$();
};

IPlugin_footer.prototype.$getScroll = function(){
	return this.getParentWnd().$contWrp;
};


IPlugin_footer.prototype.toggleActive = function(toggle){
	this.active = toggle||false;
};

IPlugin_footer.prototype.isActive = function(){
	return this.active;
};

IPlugin_footer.prototype.isInactive = function(){
	return !this.active;
};

IPlugin_footer.prototype.reset = function(){
	if( !this.$footer )
		return;
	
	this.toggleFixed(false, -1);
	
	this.toggleHidden(false);
	
	this.hide(-1);
};

IPlugin_footer.prototype.hide = function(delay){
	if( this.isHidden() || this.isFixed() ){
		if( this.isFixed() )
			this.show();
		
		return;
	}
	
	this.toggleHidden(true);
	
	this.clearTimeout(this.animationTO);
	
	if( delay < 0 )
		this.hideImmediately();
	else
		this.animationTO = this.setTimeout(this.hideImmediately, delay||25);
};

	IPlugin_footer.prototype.hideImmediately = function(){
		this.$getFooter()
			.css({bottom: -(this.getOuterHeight() + 5)})
			.addClass('-state-hidden');
	};
	
	IPlugin_footer.prototype.toggleHidden = function(toggle){
		this._hidden = toggle||false;
	};
	
		IPlugin_footer.prototype.isHidden = function(){
			return this._hidden;
		};
	
IPlugin_footer.prototype.show = function(delay){
	if( !this.isHidden() || (!this.isFixed() && wndMgr.isKeyboardOpen()) )
		return;
	
	this.toggleHidden(false);
	
	this.clearTimeout(this.animationTO);
	
	if( delay < 0 )
		this.showImmediately();
	else
		this.animationTO = this.setTimeout(this.showImmediately, delay||25);
};

	IPlugin_footer.prototype.showImmediately = function(){
		this.$getFooter()
			.removeClass('-state-hidden')
			.css({bottom: 0});
	};

IPlugin_footer.prototype.toggle = function(toggle, delay){
	this.clearDelayedShow();
	
	if( toggle )
		this.show(delay);
	else
		this.hide(delay);
};

IPlugin_footer.prototype.toggleFixed = function(toggle, delay){
    this.clearTimeout(this.toggleFixedTO);
	
	if( delay < 0 )
		this.toggleFixedImmediately(toggle);
	else
		this.toggleFixedTO = this.setTimeout(function(){
            this.toggleFixedImmediately(toggle);
        }, delay||50);
	
	return this;
};
    
    IPlugin_footer.prototype.toggleFixedImmediately = function(toggle){
        this._fixed = toggle||false;
        
        this.$getFooter().toggleClass('-type-fixed', this._fixed);
        
        return this;
    };
    
	IPlugin_footer.prototype.isFixed = function(){
		return this._fixed;
	};

IPlugin_footer.prototype.hideForAwhile = function(delay){
	this.hide();
	
	this.clearTimeout(this.showTO);
	
	this.showTO = this.setTimeout(this.showAfterDelay, delay||this.delay);
};

IPlugin_footer.prototype.showAfterDelay = function(){
	this.clearDelayedShow();
	
	this.show();
};

IPlugin_footer.prototype.clearDelayedShow = function(keepAutoScrolling){
	if( !keepAutoScrolling )
		delete this._autoScrolling;
	
	this.clearTimeout(this.showTO);
};

IPlugin_footer.prototype.getOuterHeight = function(margin){
	if( !this.$footer )
		return 0;
	
	return utils.getElemSize(this.$getFooter(), {
		getSize: function($cont){return $cont.outerHeight(margin||false);}
	})||0;
};

IPlugin_footer.prototype.getException = function(){
	return 'input, a, select, .select1';
};


IPlugin_footer.prototype.onResize = function(){
	this.$getWrp().css('padding-bottom', this.getOuterHeight(true));
	
	if( this.isInactive() || !this.getParentWnd().isReady() || this.getParentWnd().isSwiping() )
		return;
	
	this.toggle(true);
	
	this.clearTimeout(this.disableScrollDetectionTO);
	
	this.disableScrollDetectionTO = this.setTimeout(function(){
		delete this.disableScrollDetectionTO;
	}, this.delay);
};

IPlugin_footer.prototype.onScroll = function(e){
	if( this.isInactive() || this.disableScrollDetectionTO || !this._detectScroll )
		return;

	if( this._scrollAfterTouch ){
		if( !this._touchActive ){
			this.hideForAwhile(this.delay);

			this._autoScrolling = true;
		}
	}
	else{
		this._scrollAfterTouch = true;

		this.hide();
	}
};

IPlugin_footer.prototype.onClick = function(e){
	if( !this._autoScrolling && this.isHidden() && $(e.target).closest(this.getException()).length ){	
		this.hideForAwhile(this.delay);
		
		return;
	}
	
	this.toggle(true);
};

IPlugin_footer.prototype.onSwipeStart = function(nextWnd){
	if( this.isInactive() )
		return;
	
	if( !nextWnd )
		this.hide();
	else
		this.clearDelayedShow();
};

IPlugin_footer.prototype.onSwipeReset = function(){
	if( this.isInactive() )
		return;
	
	this.show();
};

IPlugin_footer.prototype.onSwipeBack = function(){
	if( this.isInactive() )
		return;
	
	this.show();
};

IPlugin_footer.prototype.onTop = function(){
	if( this.isInactive() )
		return;
	
	this.show();
};