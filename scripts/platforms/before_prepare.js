const 	{utils} = require('jjbox-utils');

const 	argv = utils.prepareArgv(process.argv),
		argp = utils.prepareArgp(argv);
		

module.exports = function(ctx) {
	console.clear();
	
	utils.log('Running: ' + ctx.hook);
	
	
	(function(){
		let platform = ctx.opts.platforms[0];
	
		utils.makeSymlink(ctx.opts.projectRoot + '/src/platforms/' + platform, 'www/src', 'junction'); // The type argument is only available on Windows and ignored on other platforms.
	})();
};