bReport_view.prototype.modifyCont = function(){
	this.$footer = this.cont.find('.report-bottom');
};

bReport_view.prototype.makeResize = function(){
	if( !this.cont )
		return;
	
	var footerHeight = utils.getElemSize(this.$footer, {
		getSize: function($cont){return $cont.outerHeight();}
	});
	
	this.cont.css('margin-bottom', footerHeight);
};

bReport_view.prototype.initScroll = function(){};