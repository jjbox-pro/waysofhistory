wFreeLuck = function(){
	wFreeLuck.superclass.constructor.apply(this, arguments);
};

utils.extend(wFreeLuck, Wnd);


wFreeLuck.prototype.calcName = function(){
	return 'freeLuck';
};


wFreeLuck.prototype.initWndOptions = function(){
	wFreeLuck.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showBorders = false;
	this.options.showButtons = false;
    this.options.setHash = false;
	this.options.showBack = true;
};
