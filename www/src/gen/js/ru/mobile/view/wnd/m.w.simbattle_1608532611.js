utils.overrideMethod(wSimbattle, 'modifyCont', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.setPlugin(IPlugin_footer, {
		$footer: this.cont.find('.simbattle-footer'),
		$wrp: this.$cont
	});
});

utils.overrideMethod(wSimbattle, 'afterDraw', function __method__(firstDraw){
	__method__.origin.apply(this, arguments);
	
	if( !firstDraw )
		this.plugins.footer.show();
});