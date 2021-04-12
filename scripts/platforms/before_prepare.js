const 	{utils} = require('jjbox-utils');

module.exports = function(ctx) {
	let platform = ctx.opts.platforms[0];
	
	utils.makeSymlink(ctx.opts.projectRoot + '/src/platforms/' + platform, 'www/src', 'junction'); // The type argument is only available on Windows and ignored on other platforms.
};