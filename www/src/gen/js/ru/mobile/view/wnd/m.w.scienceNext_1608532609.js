utils.overrideMethod(bScienceIncom, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	snip.xScrollHandler(this.wrp, this.parent.parent, '.science-barSpec-block');
});



utils.overrideMethod(bScienceNext_columns, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	snip.xScrollHandler(this.wrp, this.parent.parent);
});