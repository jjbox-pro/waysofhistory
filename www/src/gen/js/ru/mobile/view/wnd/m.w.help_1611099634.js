wHelp.pages.env.data.cellAlignCenter = true;


wHelp.prototype.modifyCont = function(){
	this.$menu = this.cont.find('.help-menu');
};

wHelp.prototype.afterAllShow = function(){
	snip.swipeHandler(this.$menu, {
        axis: 'x',
		callbacks: {
			onSwipeStart: function(swiping, e){
				e.stopPropagation();
			},
			onSwipeMove: function(swiping, pointDelta, e){
				e.stopPropagation();
			},
			onSwipeEnd: function(pointDelta){
				var isExpanded = $(this).hasClass('-type-expanded');
				
				if( (!isExpanded && pointDelta.x > 0) || (isExpanded && pointDelta.x < 0) )
					$(this).toggleClass('-type-expanded');
			}
		}
	});
	
	this.$menu.on('click', function(e){
		var $this = $(this);
		
		if( !$this.hasClass('-type-expanded') ){
			$this.toggleClass('-type-expanded');
			
			return;
		}
		
		if( e.target.nodeName == 'INPUT' || e.target.nodeName == 'A' )
			return;
		
		$this.toggleClass('-type-expanded');
	});
	
	wHelp.superclass.afterAllShow.apply(this, arguments);
};

utils.overrideMethod(wHelp, 'showPage', function __method__(){
    __method__.origin.apply(this, arguments);
    
    IScroll.scrollToY(this.$contWrp, 'top');
});



utils.overrideMethod(bHelp_body, 'initScroll', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.wrp.find('.help_body').css({height: 'auto', 'max-height': ''});
});