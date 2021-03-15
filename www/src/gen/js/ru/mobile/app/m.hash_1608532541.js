HashMgr.prototype.validateHash = function(hashArr){
	var validHashArr = [],
		curIndex = 0,
		screen = wndMgr.getScreenHash();

	if( wndMgr.getScreenClassByHash(hashArr[curIndex]) ){
		validHashArr[0] = hashArr[curIndex];
		
		curIndex++;
	} 
	else
		validHashArr[0] = screen ? screen.getName() : 'town';
	
	if( wndMgr.getWndClassesByHash(hashArr[curIndex]).length ){
		validHashArr[1] = screen ? screen.getId() : '';
		validHashArr[2] = hashArr[curIndex];
		validHashArr[3] = hashArr[curIndex+1];
	}
	else{
		if( !hashArr[curIndex] && (screen && screen.getName() == validHashArr[0]) )
			validHashArr[1] = screen.getId();
		else
			validHashArr[1] = hashArr[curIndex]||'';
			
		if( wndMgr.getWndClassesByHash(hashArr[curIndex+1]).length ){
			validHashArr[2] = hashArr[curIndex+1];
			validHashArr[3] = hashArr[curIndex+2];
		}
	}
	
	return validHashArr;
};

HashMgr.prototype.parseScreen = function(newArr){
	var screen = wndMgr.getScreen();
	
	if( !screen || newArr[0] != screen.getName() )
		wndMgr.tryShowScreen(newArr[0], newArr[1]);
	else if( newArr[1] != '' && newArr[1] != screen.getId() ){
		screen.onIdChange(newArr[1]);
		
		if( !newArr[2] )
			return screen == wndMgr.getTopWnd() ? true : false;
	}
	
	this.prepareScreenHash(newArr);
};

HashMgr.prototype.parseInterface = HashMgr.prototype.parseScreen;

HashMgr.prototype.prepareWndHash = function(hash){
	this.prepareInterfaceHash(hash);
};

utils.overrideMethod(HashMgr, 'addWndHash', function __method__(hashArr, wndHash, wndId){
	if( hashArr[0] == wndHash )
		return;
	
	__method__.origin.apply(this, arguments);
	
	/*
	if( hashArr[0] == wndHash ){
		var curHashArr = this.getHashArr();
		
		if( !curHashArr[2] )
			return;
		
		wndHash = curHashArr[2];
		wndId = curHashArr[3];
	}
	
	__method__.origin.call(this, hashArr, wndHash, wndId);
	*/
});

HashMgr.prototype.prepareScreenHash = function(arr, screen){
	screen = screen||wndMgr.getScreenHash();
	
	if( !screen )
		return;
	
	arr[0] = screen.getHashName();
	
	arr[1] = screen.getId();
};

HashMgr.prototype.prepareInterfaceHash = HashMgr.prototype.prepareScreenHash;

HashMgr.prototype.onValidHashApplied = function(hashArr, important){
	if( !this.isActualHash() && !important )
		wndMgr.swipeToScreen();
};