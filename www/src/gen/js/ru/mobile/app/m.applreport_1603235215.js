ApplReport.prototype.initDevice = function(){
	var viewportCont = 'width=device-width, initial-scale=1, user-scalable=0',
		viewport = document.querySelector('meta[name=viewport]');
	
	viewport.setAttribute('content', viewportCont);
	
	wndMgr.$html.addClass('-if-mob');
};

ApplReport.prototype.initResizeDelay = function(){
	this.resizeDelay = 0;
};