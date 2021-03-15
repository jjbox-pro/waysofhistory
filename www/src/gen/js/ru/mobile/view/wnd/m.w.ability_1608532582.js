wAbility.prototype.appendWrp = OriginWnd.prototype.appendWrp;

wAbility.prototype.bindBaseEvent = OriginWnd.prototype.bindBaseEvent;

wAbility.prototype.setAutoPos = OriginWnd.prototype.setAutoPos;

wAbility.prototype.moveToCenter = OriginWnd.prototype.moveToCenter;

wAbility.prototype.delete = OriginWnd.prototype.delete;

wAbility.prototype.onRemove = OriginWnd.prototype.onRemove;

wAbility.prototype.deleteWrp = OriginWnd.prototype.deleteWrp;

wAbility.prototype.activate = OriginWnd.prototype.activate;

wAbility.prototype.appendToList = OriginWnd.prototype.appendToList;

wAbility.prototype.onIdentShow = OriginWnd.prototype.onIdentShow;

wAbility.prototype.onFirstShow = OriginWnd.prototype.onFirstShow;

wAbility.prototype.afterAllShow = OriginWnd.prototype.afterAllShow;

wAbility.prototype.setHeaderCont = OriginWnd.prototype.setHeaderCont;


utils.overrideMethod(wAbility, 'initWndOptions', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.options.allowBack = this.options.showBack;
	this.options.swiped = false;
});

wAbility.prototype.addBaseNotif = function(){
	this.notif.other[Notif.ids.resize] = this.makeResize;
};

utils.reOverrideMethod(wAbility, 'setZ', function __method__(z){
	__method__.origin.call(this, z + 4000);
});

wAbility.prototype.setSize = function(){
    var size = wndMgr.getWindowSize();
    
	this.wrp.css(size);
	
	this.setContWrpSize(size);
	
	this.topOffset = wndMgr.getWndLayerPos().top;
	
	this.$cont.css('padding-top', this.topOffset);
};

utils.overrideMethod(wAbility, 'getTopOffset', function __method__(){
	var topOffset = __method__.origin.apply(this, arguments);
	
	return topOffset - (this.topOffset||0);
});

wAbility.prototype.getAnimCont = function(){
	return this.cont;
};