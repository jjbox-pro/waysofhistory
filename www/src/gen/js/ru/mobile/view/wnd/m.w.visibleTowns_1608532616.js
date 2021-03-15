utils.overrideMethod(bVisibleTowns_view, 'resize', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.resizeTextArea();
});


bVisibleTowns_view.prototype.resizeTextArea = function(){
	if( !this.wrp )
		return;
	
	this.wrp.find('.visibleTowns-textarea').css({
		'height': Math.max(35,	this.parent.$contWrp.height() - 
								this.wrp.find('.visibleTowns-copy').outerHeight(true))
	});
};