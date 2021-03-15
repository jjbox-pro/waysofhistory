wCountryMakeOrder.prototype.cacheCont = function(){
	wCountryMakeOrder.superclass.cacheCont.apply(this, arguments);
	
	this.$footer = this.cont.find('.wnd-footer');
};

wCountryMakeOrder.prototype.modifyCont = function(){
	wCountryMakeOrder.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.$footer,
		$wrp: this.$cont
	});
};