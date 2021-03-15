wRate.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer);
};

utils.overrideMethod(wRate, 'beforeShowChildren', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.tabs.onOpenTab = function(tab){
		if( !tab )
			return;
		
		var footer = this.parent.plugins.footer;
		
		footer.toggleActive(true);
		
		footer.$setWrp(tab.cont);
		footer.$setFooter(tab.$footer);
		
		if( this.parent.isReady() ){
			if( tab.list.wasShown() )
				footer.show();
			else
				tab.list.afterShow = function(){
					footer.show();
				};
		}
	};
	
	this.tabs.onHideTab = function(){
		if( !this.parent.isReady() )
			return;
		
		this.parent.plugins.footer.hide(-1);
		
		this.parent.plugins.footer.toggleActive(false);
	};
});



tabRateTown.prototype.cacheCont = 
tabRatePlayer.prototype.cacheCont = 
tabRateCountry.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabRateTown.prototype.afterContSet = 
tabRatePlayer.prototype.afterContSet = 
tabRateCountry.prototype.afterContSet = function(){
	this.parent.plugins.footer.$setFooter(this.$footer);
};