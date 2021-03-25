initializeApplication = function(onDeviceReady){
	if( onDeviceReady )
		appl.init();
};

overridePlatform = function(){
	console.log('----> set access cookie'); 
 
    $.get('https://t0.waysofhistory.com/getaccess').complete(function(){ 
        console.log('----> access cookie setted');  
    });
	
	appl.environment.protocol = wofhPlatform.protocol;
	
	appl.environment.domain = wofhPlatform.protocol + '//' + wofhPlatform.mainDomain;
	
	appl.environment.client = cordova.plugins;
	
	
	
	utils.prepareUrl = function(url){
		return url.replace(/^\//, '');
	};

	appl.initPlatform = function(){
		wofh.interface.nodescription = true;

		appl.onPlatformInited();
	};

	appl.initScreen = function(){};
    
    utils.overrideFunc(appl, 'bind', function __func__(){
        var cont = $('.body-wrp');
		
		cont
	//		.on('click', '.glagna-link.-community', function(){
	//			appl.environment.client.openLink($(this).attr('href'));
	//
	//			return false;
	//		})
			.on('click', '.glagna-exitButton', function(){
				cordova.plugins.platformAccessor.minimize();
			})
			.on('click', 'a', function(e){
				var href = $(this).attr('href');
				
				if( href && href[0] == '#' ){
					e.preventDefault();

					location.hash = href;

					return;
				}
			});
        
		__func__.origin.call(this);
    });

	appl.auth.enter = function(session){
		appl.entering = true;
		
		$.get(appl.environment.protocol + '//' + wofh.form.world + '/start?session=' + session + '&uid=' + wofh.uid+'&lang='+wofh.language, function(resp){
            resp = appl.auth.prepareSassoionResp(resp, session, wofh.uid);
            
			$.get(appl.environment.protocol + '//' + wofh.form.world + '/' + resp, function(resp){
				location = resp.replace(/^\//, '') + '&domain=' + wofh.form.world;
			}, 'json');
		}, 'json');
	};
    
        appl.auth.prepareSassoionResp = function(resp){
            return resp;
        };
    
	appl.animateBack.init = function(){
		return false;
	};
	
	appl.changeLang = function(lang){
		location = location.href
								.replace(new RegExp('/' + wofh.language + '/'), '/' + lang + '/')
								.replace(new RegExp('(lang=)' + wofh.language), '$1' + lang)
								.replace(new RegExp('(mainDomain=)' + wofh.language), '$1' + lang);
	};
	
	appl.cnst.domain = glib.main.domain;
	
	
	appl.isMobile = function(){
		return true;
	};
	
    utils.overrideFunc(appl, 'loadMobileDependencies', function __func__(){
        __func__.origin.call(this);
		
		appl.dependencies++;
		
		utils.loadStylesheet('ggen/css/ru/site/mobileApp/mobileApp_glagna_1614209574.css', {callback: function(){
			appl.onDependenciesLoaded();
		}});
		
		appl.dependencies++;

		utils.loadScript('ggen/js/ru/site/mobileApp/app/appllogin_1608525380.js', {async: false, callback: function(){
			appl.onDependenciesLoaded();
		}});
    });
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