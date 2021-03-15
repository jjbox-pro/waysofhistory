NoTownsScreen = function(id, data){
	NoTownsScreen.superclass.constructor.apply(this, arguments);
};

utils.extend(NoTownsScreen, InfScreenWnd);

WndMgr.regWnd('noTowns', NoTownsScreen);


NoTownsScreen.prototype.calcName = function(){
	return 'noTowns';
};
	
NoTownsScreen.prototype.beforeShowChildren = function(){
	return this.inf.beforeShowChildren.apply(this.inf, arguments);
};

NoTownsScreen.prototype.afterDraw = function(){
	return this.inf.afterDraw.apply(this.inf, arguments);
};


NoTownsScreen.prototype.setSize = function(){};