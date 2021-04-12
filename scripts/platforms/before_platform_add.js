const {utils} = require('jjbox-utils');

module.exports = function(ctx) {
	console.clear();
	
	const 	argv = utils.prepareArgv(process.argv),
			argp = utils.prepareArgp(argv);
	
	let configText = utils.readFile('config.xml');
	
	utils.log('<--- starting cleaning config icon and splash tags --->');
	
	configText = configText.replace(/<(icon|splash).+?\/>[\r\n\t ]*/g, '');
	
	utils.writeFile('config.xml', configText);
	
	utils.log('<--- done --->');
};

