wTradeFreeMarket.prototype.cacheCont = function(){
	wTradeFreeMarket.superclass.cacheCont.apply(this, arguments);
	
	this.$footer = this.cont.find('.wnd-footer');
};

wTradeFreeMarket.prototype.modifyCont = function(){
	wTradeFreeMarket.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.$footer,
		$wrp: this.$cont
	});
};