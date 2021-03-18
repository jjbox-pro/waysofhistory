var app = {
    initialize: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },
	
    onDeviceReady: function() {
		//NativeStorage.remove('authorizationData');  alert('authorizationData removed!'); return;
		alert(2);
		app.getAuthorizationData(function(data){			
			var params = [];
			
			params.push('platform=' + data.platformSuffix);
			params.push('gid=' + data.uid);
			params.push('lang=' + data.lang);
			
			if( true )
				params.push('mainDomain=' + 'test' + '.waysofhistory.com');
			else
				params.push('mainDomain=' + data.lang + '.waysofhistory.com');
			
			var url = 'src/ggen/html/' + data.lang + '/glagna_' + data.platformCode + '.html?' + params.join('&');
			
			location = url;
		});
    },
	
	getAuthorizationData: function(callback){
		NativeStorage.getItem('authorizationData', 
			function(data){
				if( !data ){
					app.createAuthorizationData(callback);
					
					return;
				}
				
				callback(data);
			}, 
			function(){
				app.createAuthorizationData(callback);
			}
		);
	},
	
	createAuthorizationData: function(callback){
		document.getElementsByTagName('body')[0].classList.remove('-invis');
		
		setTimeout(function(){ // Анимация при первом получении данных
			cordova.plugins.platformAccessor.getPlatformData( function(platformData){
				app.getPlatformAccountInfo(platformData, function(info){
					if( info ){
						platformData.uid = info.userId;
						
						app.saveAuthorizationData(platformData);
						
						callback(platformData);
						
						return;
					}
					
					// Если не получилось взять google id аккаунта, берём id устройства
					cordova.plugins.platformAccessor.getUid(function(uid){
						platformData.uid = uid;
						
						app.saveAuthorizationData(platformData);
						
						callback(platformData);
					});
				});
			});
		}, 7000);
	},
	
		saveAuthorizationData: function(platformData){
			NativeStorage.setItem('authorizationData', platformData, function(){}, function(){});
		},
	
	getPlatformAccountInfo: function(platformData, callback){
		// Override by specific platform in file ../src/platforms/[platform name]/launcher.js
	},

	confirmPlatformAccountAbort: function(){
		return confirm('Если не использовать учётную запись, то при смене устройства будет невозможно восстановить данные игрового аккаунта. Продолжить?');
	}
};
