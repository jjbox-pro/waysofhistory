wBattle.prototype.afterContSet = function(){
	this.frame = this.wrp.find('iframe').get(0);
};

wBattle.prototype.afterDraw = function(){
	this.setFrameFocus();
};

wBattle.prototype.afterShow = function(){
	this.scrollToCenter();
};

wBattle.prototype.resize = Wnd.prototype.resize;

wBattle.prototype.escClose = function(){};

wBattle.prototype.onClose = function(){};

wBattle.prototype.setAutoPos = function(){};


wBattle.prototype.onScroll  = function(e, scroll){
	wBattle.superclass.onScroll.apply(this, arguments);
	
	var axis = {x: true, y: true};
	
	if( scroll.scrollHeight > scroll.clientHeight || scroll.scrollWidth > scroll.clientWidth ){
		if( scroll.scrollHeight > scroll.clientHeight )
			axis.y = scroll.scrollTop == 0 || scroll.scrollTop >= (scroll.scrollHeight - scroll.clientHeight);
		
		if( scroll.scrollWidth > scroll.clientWidth )
			axis.x = scroll.scrollLeft == 0 || scroll.scrollLeft >= (scroll.scrollWidth - scroll.clientWidth);
	}
	
	this.setFrameMovementAxis(axis);
};

wBattle.prototype.setSize = function(){
	wBattle.superclass.setSize.apply(this, arguments);
	
	this.wrp.find('.view-battle').css({
		width: Math.max(1000, this.$contWrp.width()),
		height: Math.max(750, this.$contWrp.height())
	});
};

wBattle.prototype.minimize = function($el){};

wBattle.prototype.onEndMinimize = function(){};


wBattle.prototype.setFrameMovementAxis = function(axis){
	try{
		this.frame.contentWindow.__allowedMouseMovementAxis.x = axis.x;
		this.frame.contentWindow.__allowedMouseMovementAxis.y = axis.y;
	}
	catch(e){}
};

wBattle.prototype.scrollToCenter = function(){
	var contWrp = this.$contWrp.get(0);
	
	IScroll.scrollToX(this.$contWrp.get(0), (contWrp.scrollWidth - contWrp.clientWidth) * 0.5);
	
	IScroll.scrollToY(this.$contWrp.get(0), (contWrp.scrollHeight - contWrp.clientHeight) * 0.5);
};

wBattle.prototype.stopTown = function(){};

wBattle.prototype.startTown = function(){};