wGroundhog = function(){
	this.name = 'groundhog';
	
	wGroundhog.superclass.constructor.apply(this, arguments);
	
	this.options.setHash = false;
};

utils.extend(wGroundhog, Wnd);