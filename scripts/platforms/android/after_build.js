const 	{utils} = require('jjbox-utils'),
		child_process = require("child_process");

module.exports = function(ctx) {
	let buildType = ctx.opts.options.release ? 'Release' : 'Debug'
		command = 'gradlew :app:bundle' + buildType;
	
	child_process.execSync(command, {cwd: 'platforms/android', stdio: 'inherit'});
};
