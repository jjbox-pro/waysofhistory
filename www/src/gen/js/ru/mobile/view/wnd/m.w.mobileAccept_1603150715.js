wMobileAccept = function(){
	wMobileAccept.superclass.constructor.apply(this, arguments);
};

utils.extend(wMobileAccept, Wnd);


wMobileAccept.prototype.calcName = function(){
    return 'mobile';
};

wMobileAccept.prototype.initWndOptions = function(){
    wMobileAccept.superclass.initWndOptions.apply(this, arguments);
	
	this.options.setHash = false;
};

wMobileAccept.prototype.bindEvent = function(){
    this.wrp.on('click', '.mobile-turn' , function(){
        ls.setGameIf(Appl.interface.standart, {servStorageDelay: false});
		
        appl.reload();
    });
};