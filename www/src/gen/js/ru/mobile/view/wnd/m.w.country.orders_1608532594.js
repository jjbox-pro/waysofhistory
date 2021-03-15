wCountryOrders.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer);
};

utils.overrideMethod(wCountryOrders, 'beforeShowChildren', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.tabs.onOpenTab = function(tab){
		if( !tab )
			return;
		
		var footer = this.parent.plugins.footer;
		
		footer.toggleActive(true);
		
		footer.$setWrp(tab.cont);
		footer.$setFooter(tab.$footer);
		
		if( this.parent.isReady() )
			footer.show();
	};
	
	this.tabs.onHideTab = function(){
		if( !this.parent.isReady() )
			return;
		
		this.parent.plugins.footer.hide(-1);
		
		this.parent.plugins.footer.toggleActive(false);
	};
});


wCountryOrders.getMaxHeight = function(){
	return 'auto';
};



tabCountryOrdersChecked.prototype.afterContSet = 
tabCountryOrdersNoChecked.prototype.afterContSet = 
tabCountryOrdersMy.prototype.afterContSet = 
tabCountryOrdersControl.prototype.afterContSet = function(){
	this.parent.plugins.footer.$setFooter(this.$footer);
};

tabCountryOrdersChecked_list.prototype.modifyCont = 
tabCountryOrdersNoChecked_list.prototype.modifyCont = 
tabCountryOrdersMy_list.prototype.modifyCont = function(){
	this.cont.find('.list-page-nav-wrp').before(this.cont.find('.resFilter-inline'));
};

tabCountryOrdersChecked_list.prototype.initScroll = 
tabCountryOrdersNoChecked_list.prototype.initScroll = 
tabCountryOrdersMy_list.prototype.initScroll = 
tabCountryOrdersControl.prototype.initScroll = function(){};