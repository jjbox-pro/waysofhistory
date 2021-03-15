wMenu = function(){
	this.hashName = 'systmenu';
	
	wMenu.superclass.constructor.apply(this, arguments);
};

utils.extend(wMenu, Wnd);

WndMgr.regWnd('systmenu', wMenu);


wMenu.prototype.calcName = function(){
	return 'systmenu';
};

wMenu.prototype.calcTmplFolder = function(){
	return tmplMgr.systmenu;
};

wMenu.prototype.bindEvent = pSystMenu.prototype.bindEvent;

wMenu.prototype.afterDraw = function(){};

wMenu.prototype.toggleExpand = function(){};

utils.mix(wMenu, pSystMenu);

