const 	{utils} = require('jjbox-utils'),
		child_process = require("child_process");

const 	argv = utils.prepareArgv(process.argv),
		argp = utils.prepareArgp(argv);
		

module.exports = function(ctx) {
	utils.log('Running: ' + ctx.hook);
	
	
	(function(){
		let buildType = ctx.opts.options.release ? 'Release' : 'Debug'
			command = 'gradlew :app:bundle' + buildType;
		
		if( process.platform !== 'win32' )
			command = './' + command;
		
		child_process.execSync(command, {cwd: 'platforms/android', stdio: 'inherit'});
	})();
};
