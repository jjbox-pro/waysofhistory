const 	{utils} = require('jjbox-utils'),
		child_process = require("child_process");

module.exports = function(ctx) {
	let buildType = ctx.opts.options.release ? 'Release' : 'Debug'
		command = 'gradlew :app:bundle' + buildType;
	
	if( process.platform !== 'win32' )
		command = './' + command;
	
	child_process.execSync(command, {cwd: 'platforms/android', stdio: 'inherit'});
};
