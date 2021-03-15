wBonusTowns.prototype.setSize = function(){
	wBonusTowns.superclass.setSize.apply(this, arguments);
	
	utils.adjustBlocksHeight(this.wrp, '.bonusTowns-bonus-block');
};



utils.overrideMethod(wCountryMakeOrder, 'afterDraw', function __method__(){	
	__method__.origin.apply(this, arguments);
	
	utils.adjustBlocksHeight(this.wrp, '.resGroupSelect-group');
});



