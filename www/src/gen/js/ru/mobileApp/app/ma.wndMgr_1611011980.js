utils.overrideMethod(WndMgr, 'createWnd', function __method__(type, id, data){
	var wnd = new type(id, data);

	if( !wnd.options.useCache )
		return wnd;
	
	var wndCached = this.screens[wnd.getName()];

	if( wndCached ){
		var wndList = wndCached.getConflictWnd();

		if( !wndList.length )
			wndCached.appendToList();

		return wndCached;
	}
	else
		this.screens[wnd.getName()] = wnd;

	return wnd;
});

WndMgr.prototype.resizeBars = function(){
	if( this.bars.navBar )
		this.bars.navBar.resize(true);
	
	this.bars.screenBar.resize(true);
};

utils.overrideMethod(WndMgr, 'isSwipeDirRight', function __method__(wnd){
	if( wnd instanceof ScreenWnd )
		return false;
	
	return __method__.origin.apply(this, arguments);
});

WndMgr.prototype.canSwipeNext = function(nextWnd, wnd){
	return !(!nextWnd || nextWnd == wnd || nextWnd.parent == wnd);
};

WndMgr.prototype.getSwipedWndList = function(excludeList){
	return this.getWndList({filter: function(wnd){
		return !wnd.options.swiped;
	}, excludeList: excludeList});
};

WndMgr.prototype.addChat = function(id, data){
	var wnd = new mwChat(id, data);
	
	if( wndMgr.getScreen().constructor == mwChat )
		return;
	
	wnd.options.inactive = true;
	
	wnd = this.prepareWndToAdd(wnd);
	
	wnd.options.inactive = false;
	
	wnd.hideCont();
	
	return wnd;
};

WndMgr.prototype.isLandscape = function(size){
	size = size||this.getWindowSize();
	
	return size.width > size.height;
};