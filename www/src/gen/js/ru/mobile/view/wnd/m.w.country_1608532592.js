utils.overrideMethod(wCountry, 'toggleRenameBtns', function __method__($el){
	__method__.origin.apply(this, arguments);
	
	var $header = $el.closest('.wnd-header');
	
	$header.animate({scrollLeft: $header.width()});
});



utils.overrideMethod(tabMyCountryInfo, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	snip.xScrollHandler(this.wrp, this.parent.parent, '.country-accounts-block');
});

tabMyCountryInfo.prototype.actualizeHeight = function(){};



tabMyCountryMoney.prototype.makeResize = function(){
	utils.adjustBlocksHeight(this.wrp, '.country-money-subBlock');
};

tabMyCountryMoney.prototype.checkTaxesBlockHeight = function(){};



tabMyCountryArmy.prototype.modifyCont = function(){
	this.$filterWrp = this.cont.find('.filter-wrp ');
	
	this.$armyHead = this.cont.find('.tbl-thead');
	
	this.$armyHead	.prepend('<div class="tbl-tr"><div class="tbl-th th-filterUnits"></div></div>')
					.find('.th-filterUnits')
					.append(this.$armyHead.find('.country-army-filterUnits-block'));
	
	this.$armyBody = this.cont.find('.tbl-tbody');
	
	this.$armyFooter = this.cont.find('.tbl-tfoot');
};

tabMyCountryArmy.prototype.makeResize = function(){
	if( !this.$armyBody )
		return;
	
	var $wndContWrp = this.parent.parent.$contWrp;
	
	this.$armyBody.css('max-height',	$wndContWrp.height() -
										$wndContWrp.find('.tabs-wrp').height() - 
										this.$filterWrp.height() - 
										this.$armyHead.height() - 
										this.$armyFooter.height() - 1);
	
	if( this.table )
		this.table.updBlocks();
};





wProduction.prototype.modifyCont = function(){
	wProduction.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont
	});
};





utils.reExtend(wCountryExit, ConfirmWnd);





wCountryMoneyUnits.prototype.modifyCont = function(){
	wCountryMoneyUnits.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont
	});
};





wCountryHelps.prototype.modifyCont = function(){
	wCountryHelps.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont
	});
};





wCountryMoneyTrainUnits.prototype.modifyCont = function(){
	wCountryMoneyTrainUnits.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont
	});
};





wCountryMoneyDep.prototype.modifyCont = function(){
	wCountryMoneyDep.superclass.modifyCont.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.wnd-footer'),
		$wrp: this.$cont
	});
};
