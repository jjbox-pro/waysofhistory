wMarket.prototype.makeResize = function(){
	this.delegate('makeResize', wMarket, arguments);
	
	var tabBuy = this.children.buy;
	
	if( !tabBuy || !tabBuy.wrp )
		return;
	
	this.$contWrp = this.$contWrp||this.wrp.find('.wnd-cont-wrp'),
	this.$marketPanel = this.$marketPanel||this.$contWrp.find('.market-panel-wrp');
	this.$tabs = this.$tabs||this.$contWrp.find('.market-tabs-wrp');
	
	tabBuy.wrp.css('min-height',	this.$contWrp.height() - 
									this.$marketPanel.height() - 
									this.$tabs.height());
};


utils.overrideMethod(wMarket, 'closeInheritorWnd', function __method__(wnd){
	wndMgr.lockSwipe();
	
//	this.saveScrollOffsets(wnd);
	
	__method__.origin.apply(this, arguments);
	
	wndMgr.unlockSwipe();
	
	this.immediateShow = true;
});

utils.overrideMethod(wMarket, 'afterContSet', function __method__(){
//	this.applyScrollOffsets();
});

wMarket.prototype.saveScrollOffsets = function(wnd){
	this.scrollOffsets = {
		top: wnd.$contWrp.scrollTop(),
		left: wnd.$contWrp.scrollLeft()
	};
};

wMarket.prototype.applyScrollOffsets = function(){
	if( !this.scrollOffsets )
		return;
	
	this.$contWrp
		.scrollTop(this.scrollOffsets.top)
		.scrollLeft(this.scrollOffsets.left);
	
	delete this.scrollOffsets;
};

wMarket.prototype.showImmediately = function(){
	return this.immediateShow;
};

wMarket.prototype.onTop = function(){
	delete this.immediateShow;
	
	this.delegate('onTop', wMarket, arguments);
};