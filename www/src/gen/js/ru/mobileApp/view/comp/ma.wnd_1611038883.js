Wnd.prototype.initSwipeAction = function(opt){
    return {};
};

utils.overrideMethod(Wnd, 'initSwipeMove', function __method__(touches, e){
    if( !this.swipeAllowed ){
        var curSwipePos = utils.getPosFromEvent(touches[0]),
            swipe = this.swipe;
            
        swipe.dX = swipe.startPos.x - curSwipePos.x;
        swipe.dY = swipe.startPos.y - curSwipePos.y;
        
        if( Math.abs(swipe.dY) > Math.abs(swipe.dX) || !this.allowWndSwipe(swipe.dX, this.$contWrp, this.$cont) ){
            delete this.swipe;
            
            return;
        }
        else
            swipe.dir = swipe.dX > 0 ? 1 : -1;
        
        this.swipeAllowed = true;
    }
    
    if( this.swipeAllowed ){
        e.preventDefault();

        this.swipeMove({touches: touches});
    }
});

utils.overrideMethod(Wnd, 'swipeMove', function __method__(opt){
    opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe ){
		if( this.swipe )
			this.abortSwipe();
        
        return;
	}
    
    var curSwipePos = utils.getPosFromEvent(opt.touches[0]);
    
    this.swipe.dX = this.swipe.startPos.x - curSwipePos.x;
    
    if( Math.abs(this.swipe.startPos.y - curSwipePos.y) > 50 )
        this.abortSwipe();
});

utils.overrideMethod(Wnd, 'swipeEnd', function __method__(){
    delete this.userTouch;
	delete this.swipeAllowed;
	
	wndMgr.unsetTouchSwipingWnd();
	
	if( !this.swipe ){
		delete this.swipe;
		
		return;
	}
	
	var swipe = this.swipe;
	
	if( swipe.resetSwipe ){
		delete this.swipe;
		
		return;
	}
	
    if( (swipe.dir < 0 && swipe.dX > 0) || (swipe.dir > 0 && swipe.dX < 0) ){
        delete this.swipe;
        
        return;
    }

    if( Math.abs(swipe.dX||0) > 50 && Math.abs(swipe.dY||0) < 50 )
        this.doSwipe(swipe, !(swipe.dX > 0));
	
	delete this.swipe;
});

utils.overrideMethod(Wnd, 'doSwipe', function __method__(swipe, dirRight){
    var wndList = wndMgr.getSwipedWndList();
	
	if( !wndList.length )
		return;
    
    var wndIndex = +wndMgr.getWndIndex(this, wndList),
		nextWnd = wndList[wndIndex-1]; // Всегда выбираем окно левее текущего
	
	if( !nextWnd ){
        nextWnd = wndMgr.getScreen();
        
        if( !nextWnd )
            nextWnd = wndList[0];
    }
    
    wndMgr.swipeWnd(nextWnd, {dirRight: dirRight});
    
    this.close();
});








ScreenWnd.prototype.initSwipeAction = function(opt){
	var screenBar = wndMgr.bars.screenBar;
	
	if( !screenBar )
		return;
	
	if( screenBar.data.screenPages.length < 2 )
		return;
	
	var swipe = {screenBar: screenBar};
	
	return swipe;
};

ScreenWnd.prototype.initSwipeMove = Wnd.prototype.initSwipeMove.origin;

ScreenWnd.prototype.swipeMove = Wnd.prototype.swipeMove.origin;

ScreenWnd.prototype.swipeEnd = Wnd.prototype.swipeEnd.origin;

ScreenWnd.prototype.doSwipe = Wnd.prototype.doSwipe.origin;

ScreenWnd.prototype.initSwipedWnd = function(swipe){
	var nextWnd = this.findSwipedWnd(swipe);
	
	if( !nextWnd )
		return;
	
	nextWnd.setSwipeMode(swipe);
	
	nextWnd.toggleSwiping(true);
	
	nextWnd.showCont();
	
	swipe.nextWnd = nextWnd;
};

ScreenWnd.prototype.findSwipedWnd = function(swipe){
	if( !swipe )
		return;
	
	var screenBar = swipe.screenBar,
        nextScreen,
        constructor,
        nextIndex = screenBar.getSelectedPage().index;

    while(!constructor){
        nextIndex = (nextIndex + swipe.dir)%screenBar.data.screenPages.length;
	
        if( nextIndex < 0 )
            nextIndex = screenBar.data.screenPages.length - 1;

        constructor = screenBar.data.screenPages[nextIndex].getScreenConstructor();
    };
	
	wndMgr.lockSwipe();
	
	nextScreen = wndMgr.showScreen(constructor);
	
	wndMgr.unlockSwipe();
	
	/* crutch */
	if( nextScreen && !nextScreen.wrp )
		return;
	
	return nextScreen;
};

ScreenWnd.prototype.onTop = function(){
	if( wndMgr.getScreen() != this ){
		wndMgr.setScreen(this);
		
		this.checkConflicts();
		
		notifMgr.runEvent(Notif.ids.ifShown);
	}
	else
		this.checkConflicts(wndMgr.getSwipedWndList());
};

ScreenWnd.prototype.checkConflicts = function(list){
	var wndList = wndMgr.getScreenList([this.constructor]);
	
	if( wndList.length || list){
		wndMgr.clearList(list);
		
		for(var wnd in wndList)
			wndList[wnd].close();
	}
};


ScreenWnd.prototype.getPageConstructor = function(){
	return this.constructor;
};
