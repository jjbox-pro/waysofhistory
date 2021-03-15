wMessage.prototype.setSize = function(){
	wMessage.superclass.setSize.apply(this, arguments);
	
	this.$cont.find('.view-message').width(this.$contWrp.width() - 10);
};



bMessage_view.prototype.afterContSet = function(){
	this.wrp.find('.message-input-msg').after('<input class="message-input-helper" type="text" data-scroll-view="none">');
	
	this.resizeMessageList();
};

bMessage_view.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	this.resizeMessageList();
};

utils.overrideMethod(bMessage_view, 'initScroll', function __method__(){
	__method__.origin.call(this, {
        noResetSize: true
    });
    
    this.setScrollInited(true);

    this.setTimeout(function(){	
        this.$scroll.$getScrollArea().trigger('scroll');
    }, 250);
});

bMessage_view.prototype.setFocusAfterDraw = function(){};

bMessage_view.prototype.resizeMessageList = function(){
	this.wrp.find('.message-list').css({
		'max-height': Math.max(50,	this.parent.$contWrp.height() - 
									this.wrp.find('.message-topic').outerHeight(true) -
									this.wrp.find('.message-input-wrp').outerHeight(true) - 30)
	});
	
	if( this.scrollInited && this.isTotalEnd )
		this.scrollToNew();
};

utils.overrideMethod(bMessage_view, 'toggleDisabledText', function __method__($el, disabled){
	if( disabled )
		this.wrp.find('.message-input-helper').focus();
	
	__method__.origin.apply(this, arguments);
});
