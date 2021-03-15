wTradersMove.prototype.notifParentClose = function(){};

wTradersMove.prototype.onDataReceived = function(firstDraw){
	if( firstDraw && this.data.parentWnd ){
		wndMgr.setActiveWnd(this.data.parentWnd);
		
		return;
	}
	
	wTradersMove.superclass.onDataReceived.apply(this, arguments);
};

wTradersMove.prototype.saveWndPos = function(pos){
	wTradersMove.superclass.saveWndPos.apply(this, arguments);
};

wTradersMove.prototype.getInsertIndex = function(){
	if( !this.data.parentWnd )
		return wTradersMove.superclass.getInsertIndex.apply(this, arguments);
	
	var wndIndex = wTradersMove.superclass.getInsertIndex.call(this, this.data.parentWnd);
	
	return Math.max(0, wndIndex - 1);
};