const 	{utils} = require('jjbox-utils'),
		child_process = require("child_process");

module.exports = function(ctx) {
	utils.makeSymlink(ctx.opts.projectRoot, 'quasar-icongenie/src-cordova', 'junction'); // The type argument is only available on Windows and ignored on other platforms.
	
	child_process.execSync('icongenie generate -m cordova -i src-cordova/res/icon.png --theme-color 000', {cwd: 'quasar-icongenie/', stdio: 'inherit'});
};