app.getPlatformAccountInfo = function(platformData, callback){
	app.getAppleAccountInfo(platformData, callback);
};
	
	app.getAppleAccountInfo = function(platformData, callback) {
		gamecenter.auth(function(user){
			var info;
			
			if( user.playerID )
				info = {userId: user.playerID};

			callback(info);
		},
		function() {
			var result = app.confirmPlatformAccountAbort();
					
			if( result )
				callback(null);
			else
				app.getAppleAccountInfo(platformData, callback);
		});
	};