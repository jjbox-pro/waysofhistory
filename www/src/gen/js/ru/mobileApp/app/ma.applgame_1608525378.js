utils.overrideMethod(ApplGame, 'initDevice', function __method__(){
	__method__.origin.apply(this, arguments);
	
	wndMgr.$html.addClass('-if-mobApp');
});

    ApplGame.prototype.isDeviceZoomAvailable = function(){
        return false;
    };

utils.reOverrideMethod(ApplGame, 'addInterfaces', function __method__(){
    this.addBars();
    
	__method__.origin.call(this);
    
    //if( !debug.isNA() ) this.initSize();
});

ApplGame.prototype.afterHashParsed = function(){
	wndMgr.lockSwipe();
	
	wndMgr.addChat();
	
	wndMgr.unlockSwipe();
};


utils.overrideMethod(ApplGame, 'initIterators', function __method__(){
	__method__.origin.apply(this, arguments);
});


ApplGame.prototype.addBars = function(){
	(new StatusBar()).show();
	
	(new ScreenBar()).show();
	
	wndMgr.resizeWndLayer();
};

ApplGame.prototype.initQuests = function(){};





Debug.prototype.isMobileApp = function(){
	return true;
};