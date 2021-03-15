/**
	Панель с гарнизоном
*/

bSwapSlot = function(){
	bSwapSlot.superclass.constructor.apply(this, arguments);
	
	this.timoutTime = 60000;
	this.timerTimoutTime = 40000;
};

utils.extend(bSwapSlot, Block);
	
	
	bSwapSlot.prototype.calcName = function(){
		return 'swapSlot';
	};
	
	bSwapSlot.prototype.calcTmplFolder = function(){
		return tmplMgr.swapSlot;
	};
	
	bSwapSlot.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.townSwapSlot];
		
		this.notif.other[Notif.ids.townSwapSlotTimer] = this.setTimeout;
		this.notif.other[Notif.ids.townSwapSlotHold] = this.setHoldTimeout;
	};
	
	bSwapSlot.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.js-swapSlot-exit', function(){
				self.toggleMode();
			});
	};
	
	bSwapSlot.prototype.getData = function(){
		this.data.slot = (this.parent.town.modeSwap||{}).slot;
		
		this.dataReceived();
	};
	
	bSwapSlot.prototype.afterDraw = function(){
		this.$timer = this.wrp.find('.js-swapSlot-timer');
		
		this.setTimeout(true);
	};
	
	bSwapSlot.prototype.setTimeout = function(init){
		this.unsetTimeout();
		
		if( !init )
			this.unsetHoldTimeout();
		
		if( !this.parent.town.modeSwap || this.holdTimeout )
			return;
		
		var self = this;
		
		this.timeoutId = setTimeout(function(){
			self.toggleMode();
		}, this.timoutTime);
		
		this.timerTimeoutId = setTimeout(function(){
			self.$timer.html(' '+snip.timer(timeMgr.getNow() + (self.timoutTime - self.timerTimoutTime) * timeMgr.invStMS, 'dec'));
		}, this.timerTimoutTime);
	};
	
	bSwapSlot.prototype.unsetTimeout = function(){
		clearTimeout(this.timeoutId);
		clearTimeout(this.timerTimeoutId);
		
		this.$timer.html('');
	};
	
	bSwapSlot.prototype.setHoldTimeout = function(){
		this.holdTimeout = true;
	};
	
	bSwapSlot.prototype.unsetHoldTimeout = function(){
		this.holdTimeout = false;
	};
	
	bSwapSlot.prototype.toggleMode = function(){
		wndMgr.doInf('toggleModeSwapSlot');
	};