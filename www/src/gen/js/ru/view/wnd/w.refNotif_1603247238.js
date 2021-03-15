wRefNotif = function(){
	this.name = 'refNotif';
	
	wRefNotif.superclass.constructor.apply(this, arguments);
};

utils.extend(wRefNotif, Wnd);


wRefNotif.prototype.bindEvent = function(){
    this.wrp.find('.refNotif-link').select();
};

wRefNotif.prototype.saveWndPos = function(){};
	
wRefNotif.prototype.setAutoPos = function(){
	this.moveToCenter();
};