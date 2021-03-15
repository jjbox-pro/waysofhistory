initializeApplication = function(onDeviceReady){
	if( onDeviceReady )
		appl.init();
};

overridePlatform = function(){
	appl.environment.protocol = wofhPlatform.protocol;
	
	appl.environment.domain = wofhPlatform.protocol + '//' + wofhPlatform.domain;
	
	appl.environment.mainDomain = wofhPlatform.protocol + '//' + lib.main.maindomain;
	
	appl.environment.client = cordova.plugins;
	
	
	reqMgr.toWorld = appl.environment.domain;
	
	reqMgr.toGlagna = appl.environment.mainDomain;
	
	utils.prepareUrl = function(url){
		return url.replace(/^\//, '');
	};
	
	ApplGame.prototype.reloadNow = function(){
		location.reload();
	};
	
    ApplGame.prototype.checkMobile = function(){
        return true;
    };
    
	ApplGame.prototype.loadMobileExt = function(){
		this.dependencies++;
		
		utils.loadStylesheet('gen/css/ru/mobileApp/mobileApp_1614209520.css', {async: false, callback: function(){
			appl.onDependenciesLoaded();
		}});
        
//        this.dependencies++;
//        
//        utils.loadStylesheet('gen/css/ru/mobileApp/mobileApp_import_1614223299.css', {async: false, callback: function(){
//			appl.onDependenciesLoaded();
//		}});
		
		appl.useMobileAppScripts = true;
	};
	
	reqMgr.logOut = function(getParams){
		if( getParams ){
			if( getParams[0] != '&' )
				getParams = '&' + getParams;
		}

		this.send(reqMgr.toWorld + '/logout' + location.search + (getParams||''), {}, {iface: 'ajax', method: 'GET', callback: function(resp){
			reqMgr.send(reqMgr.toGlagna + '/' + resp, {}, {iface: 'ajax', method: 'GET', callback: function(resp){
				reqMgr.loadFile(resp + '&mainDomain=' + lib.main.maindomain);
			}});
		}});
	};
	
	reqMgr.loadFile = function(href){
		location = href.replace(/^\//, '');
	};
	
	reqMgr.openLink = function(href){
		location = href;
	};
	
	WorkerMgr.prototype.getScriptsRoot = function(){
		return baseTag.w_root;
	};
	
	iNoTowns.prototype.afterDraw = function(){
		var req = {};
		req.world = lib.main.domain;
		req.name = wofh.account.name;
		req.key = wofh.account.deletelinkkey;

		$.post(reqMgr.toGlagna + '/aj_delfast', req);
	};
    
    utils.overrideMethod(pSystMenu, 'afterDraw', function __method__(){
        __method__.origin.call(this);
        
		this.wrp.on('click', '.js-smenu-community', function(){
			reqMgr.openLink($(this).attr('href'));
			
			return false;
		});
	});
	/*
	wShop.prototype.processBuy = function(el){
		this.data.select = el.data('pos');

		// Проверяем есть ли акция для получения халявного ВГ
		if( this.data.actionSpecialist ){
			if( !this.data.isSpecialistSelected && this.getPayCoins() >= this.data.actionSpecialist.luck ){
				wndMgr.addWnd(wShopSpecialists, '', {parentWnd: this, el: el});

				return;
			}
		}

		if( this.data.actionSpecialist )
			delete this.data.isSpecialistSelected;

		reqMgr.initSteamPay(this.getPayCoins());
	};
	*/
};

overridePlatformDependencies = function(){
	NoTownsScreen.prototype.bindEvent = function(){
		this.cont.on('click', '.noTowns-link', function(e){
			e.preventDefault();
			
			reqMgr.logOut();
		});
	};
};

var cordovaApp = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
	
    onDeviceReady: function() {
		var initApp = function(){
			initializeApplication(true);
		};
		
		cordova.plugins.platformAccessor.initWebView(initApp, initApp);
    }
};

cordovaApp.initialize();