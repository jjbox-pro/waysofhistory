tabCountryAdviserTown.prototype.modifyCont = function(){
	this.$filterWrp = this.cont.find('.cAdv-town-filterWrp');
	
	this.$townsHead = this.cont.find('.tbl-thead');
	
	this.$townsBody = this.cont.find('.tbl-tbody');
};

tabCountryAdviserTown.prototype.makeResize = function(){
	if( !this.$townsBody )
		return;
	
	var $wndContWrp = this.parent.parent.$contWrp;
	
	this.$townsBody.css('max-height',	Math.max(70, $wndContWrp.height() -
											$wndContWrp.find('.tabs-wrp').height() - 
											this.$filterWrp.outerHeight(true) - 
											this.$townsHead.height() - 1));
	
	if( this.table )
		this.table.updBlocks();
};


utils.overrideMethod(tblCountryAdviserTown, 'setOptions', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.options.rowHeight = 0;
});



utils.overrideMethod(tabCountryAdviserStat, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	snip.xScrollHandler(this.wrp, this.parent.parent, '.cAdv-stat-btns, .cAdv-stat-graphs-wrp');
});



wCountryAdviserTownFilterRange.prototype.afterContSet = function(){
	this.cont.find('.tooltip-cnt').addClass('-type-noTouch');
};


wCountryAdviserTownFilterRange.prototype.onContHover = function(){};