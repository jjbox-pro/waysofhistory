wMapComments = function(){
	wMapComments.superclass.constructor.apply(this, arguments);
};

utils.extend(wMapComments, OriginWnd);


WndMgr.regWnd('mapComments', wMapComments);


wMapComments.prototype.calcName = function(){
    return 'mapComments';
};

wMapComments.prototype.initWndOptions = function(){
    wMapComments.superclass.initWndOptions.apply(this, arguments);
    
	this.options.showBack = true;
    this.options.moving = false;
};

wMapComments.prototype.getData = function(){
    this.map = wndMgr.interfaces.map;
    
    this.dataReceived();
};

wMapComments.prototype.calcChildren = function(){
    this.children.comments = bMapComments;
};



bMapComments.prototype.calcTmplFolder = function(){
    return tmplMgr.iMap.mapR.comments;
};

bMapComments.prototype.afterDraw = function(){};

bMapComments.prototype.makeResize = function(){
    this.resizeScroll();
};


bMapComments.prototype.resizeParent = 
bMapComments.prototype.resizeScroll = function(delay){
    this.wrp.find('.map_scroll_wrp').css('max-height', this.parent.getContWrpSize().height - this.getContHeight() - 10);
};