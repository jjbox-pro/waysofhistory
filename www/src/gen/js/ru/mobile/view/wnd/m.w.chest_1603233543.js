wChest.prototype.appendWrp = OriginWnd.prototype.appendWrp;

wChest.prototype.bindBaseEvent = OriginWnd.prototype.bindBaseEvent;

wChest.prototype.setCont - OriginWnd.prototype.setCont;

wChest.prototype.setAutoPos = OriginWnd.prototype.setAutoPos;

wChest.prototype.moveToCenter = OriginWnd.prototype.moveToCenter;

wChest.prototype.delete = OriginWnd.prototype.delete;

wChest.prototype.onRemove = OriginWnd.prototype.onRemove;

wChest.prototype.deleteWrp = OriginWnd.prototype.deleteWrp;

wChest.prototype.activate = OriginWnd.prototype.activate;

wChest.prototype.appendToList = OriginWnd.prototype.appendToList;

wChest.prototype.onIdentShow = OriginWnd.prototype.onIdentShow;

wChest.prototype.onFirstShow = OriginWnd.prototype.onFirstShow;

wChest.prototype.afterAllShow = OriginWnd.prototype.afterAllShow;

wChest.prototype.setHeaderCont = OriginWnd.prototype.setHeaderCont;


wChest.prototype.initWndOptions = function(){
	wChest.superclass.initWndOptions.apply(this, arguments);
	
	this.options.swiped = false;
};

wChest.prototype.addBaseNotif = function(){
	this.notif.other[Notif.ids.resize] = this.makeResize;
};

wChest.prototype.afterContSet = function(){
	this.wrp.append(this.wrp.find('.chest-backClick').clone());
};

wChest.prototype.makeResize = function(){
    this.setSize();
};


wChest.prototype.setSize = function(){
	var size = wndMgr.getWindowSize(),
		minSide = Math.min(size.width, size.height),
		scale = minSide / this.cont.width();
	
	this.cont.css({transform: 'scale('+scale+')'});
	
	var contRect = this.cont.get(0).getBoundingClientRect();
	
	this.wrp.css({width: contRect.width, height: contRect.height});
};