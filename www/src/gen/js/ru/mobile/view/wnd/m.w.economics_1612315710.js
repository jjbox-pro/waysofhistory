wEconomics.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer);
};



tabEconomicsRule.prototype.beforeResize = function(firstShow){
    tabEconomicsRule.superclass.beforeResize.apply(this, arguments);
    
	var footer = this.parent.plugins.footer;
	
	footer.$setWrp(this.cont);
    
	this.$footer = this.cont.find('.wnd-footer'); // Нельзя поместить в cacheCont т.к. wnd-footer устанавливается в чилде bEconomics_budget
	
	footer.$setFooter(this.$footer, !firstShow && this.isActiveTab());
};

tabEconomicsRule.prototype.afterOpenTab = function(){
	this.parent.plugins.footer.toggleActive(true);
	
	if( !this.parent.isReady() )
		return;
	
	this.parent.plugins.footer.show();
};

tabEconomicsRule.prototype.onHide = function(){
	this.parent.plugins.footer.hide(-1);
	
	this.parent.plugins.footer.toggleActive(false);
};



tblEconomicsStock.getTableLayout = function(){
	return snip.sTable;
};



tblEconomicsProd.getTableLayout = function(){
	return snip.sTable;
};

utils.overrideMethod(tblEconomicsProd, 'prepareFormat', function __method__(){
	this.data.roundFunc = function(val){return +utils.toFixed(val, 2, true);};
	this.data.defVal = 1;
	this.data.dim = '';
});



tabEconomicsPop.getTableLayout = function(){
	return snip.sTable;
};


utils.overrideMethod(tabEconomicsPop, 'prepareFormat', function __method__(){
	this.data.roundFunc = function(val){return +utils.toFixed(val, 2, true);};
	this.data.defVal = 1;
	this.data.dim = '';
});