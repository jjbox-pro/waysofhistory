app.googleAccountErrors = {
	IGN_IN_CANCELLED: 12501,
	SIGN_IN_FAILED: 12500,
	SIGN_IN_REQUIRED: 4,
	INTERNAL_ERROR: 8,
	NETWORK_ERROR: 7
};
	
app.googleAccountWebClientId = '530673218839-9vr964emi57ra48q9soe2vei25o5bkg5.apps.googleusercontent.com';
	
app.getPlatformAccountInfo = function(platformData, callback){
	app.getGoogleAccountInfo(callback);
};
	
	app.getGoogleAccountInfo = function(callback) {
		window.plugins.googleplus.trySilentLogin({
			//webClientId: app.googleAccountWebClientId
		}, 
		callback,
		function(errorCode){
			if( errorCode == app.googleAccountErrors.SIGN_IN_REQUIRED )
				app.requestGoogleAccountInfo(callback);
			else
				alert('Error of google trySilentLogin: ' + errorCode);
		});
	};
		
		app.requestGoogleAccountInfo = function(callback) {
			window.plugins.googleplus.login({
				//webClientId: app.googleAccountWebClientId
			}, 
			callback,
			function(errorCode){
				if( errorCode == app.googleAccountErrors.IGN_IN_CANCELLED ){
					var result = confirm('Если не зарегаешь под акком, будет плохо! Продолжить?');
					
					if( result )
						callback(null);
					else
						app.requestGoogleAccountInfo(callback);
				}
				else
					alert('Error of google login: ' + errorCode);
			});
		};