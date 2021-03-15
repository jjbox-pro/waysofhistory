iTown.prototype.addNotif = function(){};

iTown.prototype.onDataReceived = function(){
	this.updRes();
	
	notifMgr.runEvent(Notif.ids.townEnter);
};


iTown.prototype.tryResize = function(){};

iTown.prototype.doResize = function(){};

iTown.prototype.resizeLeft = function(){};


iTown.prototype.getStock = function(){
	return this.screen.children.stock;
};

iTown.prototype.getTown = function(){
	return this.screen.children.town;
};

iTown.prototype.startTown = function(){};

iTown.prototype.stopTown = function(){};

iTown.prototype.toggleModeSwapSlot = function(slot, mousePos){
	this.getTown().toggleModeSwapSlot(slot, mousePos);
};