utils.overrideFunc(IScroll, 'add', function __func__($wrp, opt){
    if( !opt || !utils.sizeOf(opt.callbacks) ){
		IScroll.prepareWrpSize($wrp, opt);

		return null;
	}

	return __func__.origin.apply(IScroll, arguments);
});

IScroll.prepareWrpSize = function($wrp, opt){
	opt = opt||{};

	if( opt.noResetSize )
		return;

	if( !opt.axis )
		IScroll.setScrollSize($wrp);
	else
		$wrp.css({'max-height': '', 'overflow-x': 'auto'});
};

	IScroll.setScrollSize = function($wrp){
		if( $wrp.css('max-height') == 'none' )
			$wrp.css({'overflow-y': 'auto'});
		else
			IScroll.resetScrollSize($wrp);
	};

	IScroll.resetScrollSize = function($wrp){
		$wrp.css({height: 'auto', 'max-height': ''});
	};





IScroll.prototype.initDOM = function(){
	this.$scroll =
	this.$scrollAreaWrp = 
	this.$scrollArea = 
	this.$scrollCont = this.$wrp;

	this.wrp =
	this.scroll =
	this.scrollAreaWrp = 
	this.scrollArea = 
	this.scrollCont = this.$wrp.get(0);

	this.$scrollArea.addClass('__scrollArea');

	IScroll.prepareWrpSize(this.$wrp, this.options);
};


IScroll.prototype.calcPadding = function(){};

IScroll.prototype.prepareScrollbar = function(){
	this.$scrollArea.attr({
		'data-axis': this.getAxis()
	});
};


IScroll.prototype.bind = function(){
	this.bindEvents();
};

IScroll.prototype.unbind = function(){
	this.unbindEvents();
};

IScroll.prototype.bindEvents = function(){
	var self = this;

	this.$scrollArea.on('scroll.__scroll', function(e){
		self.scrollTracking(this, e);
	});
};

IScroll.prototype.unbindEvents = function(){
	this.$scrollArea.off('.__scroll');

	return this;
};


IScroll.prototype.update = 
IScroll.prototype.resize = function(forceResize){
	if( !forceResize && !this.isSizeChange() )
		return this;
    
	this.storeSize();
    
	this.options.callbacks.onResize();
    

	console.log('----> IScroll resize');

	return this;
};

IScroll.prototype.storeSize = function(){
	this.oldWrpScrollHeight = this.wrp.scrollHeight;;
};

IScroll.prototype.isSizeChange = function(){
	return this.oldWrpScrollHeight != this.wrp.scrollHeight;
};


IScroll.prototype.restore = function(){
	this.unbind();

	this.$scrollArea.removeClass('__scrollArea');

	IScroll.removeFromList(this);

	this.options.callbacks.onRemove.call(this);

	console.log('scroll restored');
};

IScroll.prototype.remove = function(){
	this.unbind();

	this.$wrp.remove();

	IScroll.removeFromList(this);

	this.options.callbacks.onRemove.call(this);

	console.log('scroll removed');
};


IScroll.prototype.updateTrack = function(){};





IScrollX.prototype.bindEvents = IScroll.prototype.bindEvents;


IScrollX.prototype.updateTrack = function(){};

