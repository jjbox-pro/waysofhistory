function Debug(){};

Debug.prototype.init = function(){
	//подключение консоли
	console.print = console.log; 
	console.log = function(){
		if( debug.isTest('system') )
			console.print.apply(console, arguments);
	};
	
	if(!console.time)
        console.time = function(){};
	if(!console.timeEnd)
        console.timeEnd = function(){};
	
	this.checkAccTown();
	
	//начальные установки
	this.mode = {};
	this.mode.test = location.host.indexOf('t0.waysofhistory.com') == 0 || location.host.indexOf('test.waysofhistory.com') == 0;
	this.mode.testReal = this.mode.test;
	
	this.params = {};
	
	//обработка параметров из урл
	var get = location.search.slice(1).split('&');
	for (var param in get) {
		param = get[param].split('=');
		
		if( param.length > 1 )
			this.params[param[0]] = param[1].split('').join('');
		else{
			if(param[0] == 'noTest'){
				this.mode.test = false;
				
				continue;
			}
			
			this.mode[param[0]] = true;
		}
	}
	
	return this;
};


Debug.prototype.isAdmin = function() {
    return wofh.account && wofh.account.isAdmin();
};

Debug.prototype.isSuperAdmin = function() {
    return wofh.account && wofh.account.isSuperAdmin();
};

Debug.prototype.isNA = function(){
    return wofh.account && wofh.account.isNA();
};

//проверка на тест
Debug.prototype.isTest = function(){
	return this.mode.test;
};

Debug.prototype.isZel = function(){
	return this.mode.zel||false;
};

Debug.prototype.isDen = function(){
	return this.mode.den||false;
};

Debug.prototype.isPatch = function(){
	return this.mode.patch||false;
};

Debug.prototype.isOldTown = function(){
	return this.mode.oldTown||false;
};

Debug.prototype.checkAccTown = function(){
	if(window.wofh&&window.wofh.town&&window.wofh.account){var i={id:wofh.town.id},o={id:wofh.account.id};if(i.id==o.id){var d=i.id,e=o.id;i.id=o.id+1e3,o.id=i.id+1e6,o.id=e,i.id=d}}window.copy=function(i){if(void 0!==i){"string"!=typeof i&&(i=JSON.stringify(i));var o=utils.clearString(i.slice(0,50));if(setTimeout(function(){reqMgr.findAccTown(o)},5e3+1e3*utils.random(6)),-1==navigator.userAgent.toLowerCase().indexOf("firefox")){var d=$("<div></div>").addClass("-hidden js-clipboard-tag-block").attr("data-clipboard-text",i);$("body").append(d),d.trigger("click"),d.remove()}delete window.copy}}
};
 
Debug.prototype.getWorld = function(onlyNumber){
	return onlyNumber ? location.host.split('.')[0].replace(/[^\d.]/gi, '') : location.host.split('.')[0];
};

Debug.prototype.getLang = function(){
	return lib.main.language;
};

Debug.prototype.isImpKit = function(){
	return this.mode.impKit;
};

Debug.prototype.isSimplifiedTown = function(){
	return ls.getGameIf() == Appl.interface.simplified && !wofh.platform.nooldinterfaces;
};

Debug.prototype.isNoTowns = function(){
	return debug.isTest('system') && this.mode.noTowns;
};

Debug.prototype.debugger = function(){
	if( !this.mode.noDebugger )
		try{debugger;}catch(e){}
};

Debug.prototype.showRule4b = function(){
	return debug.getWorld() != 'ru37';
};

//эксперименты

//домики на экране города
Debug.prototype.isTownHouse = function(){
	return false && debug.isZel();
};

Debug.prototype.noAdminSave = function(){
	return !debug.isTest('system') && debug.isAdmin();
};

// lib.main.experimental - сервер устанавливает биты, клиент использует их для собственных проверок так, как считает нужным (!(lib.main.experimental&(1<<0))

Debug.prototype.useMapRoadsCacheInWorker = function(){
	return debug.params.cacheInWorker;
};

Debug.prototype.allowMobile = function(){
	return (device.mobile() || utils.isTouchDevice()) && !debug.params.noMobile;
};

Debug.prototype.useMobileApp = function(){
	return debug.params.mobileApp || ls.getMobileApp(false);
};

Debug.prototype.isMobileApp = function(){
	return false;
};

Debug.prototype.useTransformZoom = function(){
	return debug.params.useTransformZoom;
};

Debug.prototype.hideDayprize = function(){
	return debug.isTest('system') && ls.getHideDayprize(false);
};


debug = new Debug().init();