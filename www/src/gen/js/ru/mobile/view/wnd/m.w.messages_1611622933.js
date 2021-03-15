wMessages.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer);
};



utils.overrideMethod(tabMessagesWrite, 'resize', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.resizeTextArea();
});


tabMessagesWrite.prototype.resizeTextArea = function(){
	if( !this.wrp )
		return;
	
	this.wrp.find('.messages-write-text').css({
		'max-height': Math.max(35,	this.parent.$contWrp.height() - 
									this.parent.$contWrp.find('.tabs-wrp').height() - 
									this.wrp.find('.messages-write-info').height() - 50)
	});
};



tabMessagesList.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabMessagesList.prototype.beforeResize = function(firstShow){
    tabMessagesList.superclass.beforeResize.apply(this, arguments);
    
	var footer = this.parent.plugins.footer;
	
    footer.$setWrp(this.cont);
	
	this.parent.plugins.footer.$setFooter(this.$footer, !firstShow && this.isActiveTab());
};

tabMessagesList.prototype.afterOpenTab = function(){
	this.parent.plugins.footer.toggleActive(true);
	
	if( !this.parent.isReady() )
		return;
	
	this.parent.plugins.footer.show();
};
	
tabMessagesList.prototype.onHide = function(){
	if( !this.parent.isReady() )
		return;
	
	this.parent.plugins.footer.hide(-1);
	
	this.parent.plugins.footer.toggleActive(false);
};



utils.overrideMethod(tabMessagesNote, 'resize', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.resizeTextArea();
});

tabMessagesNote.prototype.resizeTextArea = function(){
	if( !this.wrp )
		return;
	
	this.wrp.find('.messages-note-text').css({
		'max-height': Math.max(35,	this.parent.$contWrp.height() - 
									this.parent.$contWrp.find('.tabs-wrp').height() - 50)
	});
};