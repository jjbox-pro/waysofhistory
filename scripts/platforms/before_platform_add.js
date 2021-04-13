const 	{utils} = require('jjbox-utils'),
		child_process = require("child_process");

const 	argv = utils.prepareArgv(process.argv),
		argp = utils.prepareArgp(argv);


module.exports = function(ctx) {
	console.clear();
	
	utils.log('Running: ' + ctx.hook);
	
	
	(function(){
		utils.log('<--- Starting cleaning config icon and splash tags --->');
		
		let configText = utils.readFile('config.xml');
		
		configText = configText.replace(/<(icon|splash).+?\/>[\r\n\t ]*/g, '');
		
		utils.writeFile('config.xml', configText);
		
		utils.log('<--- done --->');
	})();
	
	
	(function(){
		if( utils.isDirExist('plugins') )
			return;
		
		utils.log('<--- Plugins installing --->');
		
		let plugins = [
			'cordova plugin add https://github.com/jjbox-pro/cordova-plugin-platform-accessor.git',
			'cordova plugin add cordova-plugin-googleplus --save --variable REVERSED_CLIENT_ID=com.googleusercontent.apps.530673218839-iroukardu627knpn91f0qrmog3omc4jk --variable WEB_APPLICATION_CLIENT_ID=530673218839-9vr964emi57ra48q9soe2vei25o5bkg5.apps.googleusercontent.com',
			'cordova plugin add cordova-plugin-firebasex@latest-cli --variable ANDROID_FIREBASE_CONFIG_FILEPATH="credentials/google-services.json" --variable IOS_FIREBASE_CONFIG_FILEPATH="credentials/GoogleService-Info.plist"',
			'cordova plugin add cordova-plugin-game-center',
			'cordova plugin add cordova-plugin-nativestorage',
			'cordova plugin add cordova-plugin-android-permissions',
			'cordova plugin add cordova-plugin-splashscreen'
		];
		
		for(var plugin of plugins)
			child_process.execSync(plugin, {cwd: ctx.opts.projectRoot, stdio: 'inherit'});
		
		utils.log('<--- done --->');
	})();
};

