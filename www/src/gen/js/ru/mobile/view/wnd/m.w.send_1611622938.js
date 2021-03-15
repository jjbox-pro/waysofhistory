wSend.prototype.modifyCont = function(){
	this.setPlugin(IPlugin_footer, {$wrp: this.$cont});
};



wSend_view.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.send-conditions-wrp');
};

wSend_view.prototype.afterContSet = function(){
	this.$tradersWrp = this.wrp.find('.send-traders-wrp');
};

wSend_view.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	this.$tradersWrp.toggleClass('-type-wide', this.$tradersWrp.height() > 20);
	
	utils.adjustBlocksHeight(this.wrp, '.send-resGroup');
};

wSend_view.prototype.afterShow = function(firstShow){
    this.parent.plugins.footer.$setFooter(this.$footer);
};