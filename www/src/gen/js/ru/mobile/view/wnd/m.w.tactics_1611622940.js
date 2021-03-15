wTactics.prototype.addNotif = function(){
	this.notif.other[Notif.ids.sysStopWndSwipe] = this.swipeEnd;
	
	this.notif.other[Notif.ids.sysDragToggled] = function(opt){
		opt = opt||{};
		
		this.plugins.footer.toggle(!opt.toggle, opt.toggle ? -1 : null);
		
		this.cont.toggleClass('-state-dragging', opt.toggle);
	};
};


wTactics.prototype.modifyCont = function(){
	wTactics.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {active: false});
};


utils.overrideMethod(wTactics, 'onScroll', function __method__(e){
	__method__.origin.apply(this, arguments);
	
	if( this.$sort )
		this.$sort.sortable('refreshPositions');
});


tabTacticsList.prototype.setScrollSize = function($scroll){
	this.resetScrollSize($scroll);
};


utils.overrideMethod(tabTacticsEdit, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	snip.xScrollHandler(this.wrp, this.parent, '.view-tactics-editMain-tacticListScroll, .view-tactics-editTemplates-templateList');
});

utils.overrideMethod(tabTacticsEdit, 'cacheCont', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.$tamplates = this.cont.find('.view-tactics-editTemplates');
	
	this.$footer = this.cont.find('.view-tactics-editMain-saveTacticWrp').addClass('wnd-footer');
});

utils.overrideMethod(tabTacticsEdit, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.showTamplates();
});

tabTacticsEdit.prototype.beforeResize = function(firstShow){
    tabTacticsEdit.superclass.beforeResize.apply(this, arguments);
    
	var footer = this.parent.plugins.footer;
	
    footer.$setWrp(this.cont);
	
	footer.$setFooter(this.$footer, !firstShow && this.isActiveTab());
};
    
    utils.overrideMethod(tabTacticsEdit, 'updTacticsListScroll', function __method__($elem, opt){
        opt = opt||{};

        if( opt.$nameEdit ){
            opt.$nameEdit.data('view-inline', 'nearest');

            return;
        }

        __method__.origin.apply(this, arguments);
    });
	
	tabTacticsEdit.prototype.setFocusToElem = function($elem){
		$elem.get(0).focus({preventScroll:true});
		
		$elem.select();
	};
	
	
	
tabTacticsEdit.prototype.afterOpenTab = function(){
	this.parent.plugins.footer.toggleActive(true);
	
	if( !this.parent.isReady() )
		return;
	
	this.parent.plugins.footer.show();
};

tabTacticsEdit.prototype.onHide = function(){
	this.parent.plugins.footer.hide(-1);
	
	this.parent.plugins.footer.toggleActive(false);
};


utils.overrideMethod(tabTacticsEdit, 'initSortable', function __method__($el, opt){
	opt.create = function(event, ui){
		var $this = $(this),
			options = $this.sortable('option'),
			cls = options.handle||options.items;
		
		$this
			.on('touchstart', cls, function(e){
				console.log('--> Sort touchstart');
				
				if( this._touchHold ){
					if( !this._touchHold.holdCompleted ){
						this._touchHold.holdCanceled = true;
					
						clearTimeout(this._touchHold.TO);	
					}
					
					return;
				}
				
				$(this).addClass('-noSel'); // Убираем появление контекстного меню при зажатии
				
				e = e.originalEvent||e;
				
				this._touchHold = {
					event: e,
					toggleUI: function($el, toggle){
						notifMgr.runEvent(Notif.ids.sysDragToggled, {toggle: toggle});
						
						$el.closest('.ui-sortable').sortable(toggle ? 'enable' : 'disable');
						
						return $el.get(0);
					}
				};
				
				this._touchHold.TO = setTimeout(function(){
					this._touchHold.holdCompleted = true;
					
					var ui = this._touchHold.toggleUI($(this), true),
						event = this._touchHold.event;
					
					ui.dispatchEvent(new event.constructor(event.type, event));
					
					sndMgr.vibrate(50);
					
					notifMgr.runEvent(Notif.ids.sysStopWndSwipe);
					
					console.log('----> sortStart', ui);
				}.bind(this), 500);
			})
			.on('touchmove', cls, function(e){
				if( !this._touchHold || this._touchHold.holdCanceled || this._touchHold.holdCompleted )
					return;
				
				e = e.originalEvent||e;
				
				var startTouch = this._touchHold.event.touches[0],
					curTouch = e.touches[0];
				
				if( Math.abs(startTouch.pageX - curTouch.pageX) > 10 || Math.abs(startTouch.pageY - curTouch.pageY) > 10 ){
					this._touchHold.holdCanceled = true;
					
					clearTimeout(this._touchHold.TO);
				}
			})
			.on('touchend', cls, function(e){
				e = e.originalEvent||e;
				
				if( e.touches.length > 0 || !this._touchHold )
					return;
				
				clearTimeout(this._touchHold.TO);
				
				if( this._touchHold.holdCompleted )
					this._touchHold.toggleUI($(this), false);
				
				delete this._touchHold;
			});
	};
	opt.start = function(event, ui){
		var $this = $(this),
			wndTactics = $this.sortable('option').wndTactics;
		
		wndTactics.$sort = $this;
		
		$this.sortable('refreshPositions');
	};
	opt.stop = function(event, ui){
		var wndTactics = $(this).sortable('option').wndTactics;
		
		delete wndTactics.$sort;
	};
	
	opt.distance = 0;
	opt.scrollSpeed = 10;
	opt.disabled = true;
	
	opt.wndTactics = this.parent;
	
    __method__.origin.call(this, $el, opt);
});

utils.overrideMethod(tabTacticsEdit, 'initDraggable', function __method__($el, opt){
	opt.create = function(event, ui){
		var $this = $(this),
			options = $this.draggable('option'),
			cls = options.handle||undefined;
		
		$this
			.on('touchstart', cls, function(e){
				console.log('--> Drag touchstart');
				
				if( this._touchHold ){
					if( !this._touchHold.holdCompleted ){
						this._touchHold.holdCanceled = true;
						
						clearTimeout(this._touchHold.TO);	
					}
					
					return;
				}
				
				$(this).addClass('-noSel'); // Убираем появление контекстного меню при зажатии
				
				e = e.originalEvent||e;
				
				this._touchHold = {
					event: e,
					toggleUI: function($el, toggle){
						var ui = $el.get(0);
						
						if( !$el.hasClass('ui-draggable') )
							$el = $el.closest('.ui-draggable');
						
						notifMgr.runEvent(Notif.ids.sysDragToggled, {toggle: toggle});
						
						$el.draggable(toggle ? 'enable' : 'disable');
						
						return ui;
					}
				};
				
				this._touchHold.TO = setTimeout(function(){
					this._touchHold.holdCompleted = true;
					
					var ui = this._touchHold.toggleUI($(this), true),
						event = this._touchHold.event;
					
					ui.dispatchEvent(new event.constructor(event.type, event));
					
					sndMgr.vibrate(50);
					
					notifMgr.runEvent(Notif.ids.sysStopWndSwipe);
					
					console.log('----> dragStart', ui);
				}.bind(this), 500);
			})
			.on('touchmove', cls, function(e){
				if( !this._touchHold || this._touchHold.holdCanceled || this._touchHold.holdCompleted )
					return;
				
				e = e.originalEvent||e;
				
				var startTouch = this._touchHold.event.touches[0],
					curTouch = e.touches[0];
				
				if( Math.abs(startTouch.pageX - curTouch.pageX) > 10 || Math.abs(startTouch.pageY - curTouch.pageY) > 10 ){
					this._touchHold.holdCanceled = true;
					
					clearTimeout(this._touchHold.TO);
				}
			})
			.on('touchend', cls, function(e){
				e = e.originalEvent||e;
				
				if( !this._touchHold )
					return;
				
				clearTimeout(this._touchHold.TO);
				
				if( e.touches.length > 0 )
					return;
				
				if( this._touchHold.holdCompleted ){
					console.log('----> dragEnd', ui);
					
					this._touchHold.toggleUI($(this), false);
				}
				
				delete this._touchHold;
			});
	};
	
	opt.distance = 0;
	opt.scrollSpeed = 10;
	opt.revertDuration = 250;
	opt.refreshPositions = true;
	opt.disabled = true;
	
    __method__.origin.call(this, $el, opt);
});
	
	tabTacticsEdit.prototype.getDragAppendTo = function(){
		return this.cont.find('.activeTactic-scroll-block');
	};
	
	tabTacticsEdit.prototype.getDragContainment = function(){
		return this.wrp;
	};

utils.overrideMethod(tabTacticsEdit, 'afterShowActiveTactic', function __method__(){
	this.showTamplates();
	
	__method__.origin.apply(this, arguments);
});

tabTacticsEdit.prototype.showTamplates = function(){
	this.cont.find('.view-tactics-editMain-reserve2Wrp').before(this.$tamplates);
};





wEditWRTR.prototype.addNotif = function(){
	this.notif.other[Notif.ids.sysStopWndSwipe] = this.swipeEnd;
	
	this.notif.other[Notif.ids.sysDragToggled] = function(opt){
		opt = opt||{};
		
		this.plugins.footer.toggle(!opt.toggle, opt.toggle ? -1 : null);
		
		this.cont.toggleClass('-state-dragging', opt.toggle);
	};
};

wEditWRTR.prototype.modifyCont = function(){
	wEditWRTR.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont.find('.view-tactics-editWaveCont')
	});
};


wEditWRTR.prototype.getDragAppendTo = function(){
	return this.wrp.find('.view-tactics-editWaveCont');
};

wEditWRTR.prototype.getDragCursorAt = function(){
	return {top: 70};
};

wEditWRTR.prototype.getUnitsTemplatesBlockWidth = function(){
	return {width: '100%', maxWidth: '100%'};
};