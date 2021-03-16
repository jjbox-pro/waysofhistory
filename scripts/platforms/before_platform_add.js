const {utils} = require('jjbox-utils');

(function(){
	console.clear();
	
	const 	argv = utils.prepareArgv(process.argv),
			argp = utils.prepareArgp(argv);
	
	let configText = utils.readFile('../../config.xml');
	
	utils.log('<--- start clear config icon and splash  --->');
	
	configText = configText.replace(/<(icon|splash).+?\/>[\r\n\t ]*/g, '');
	
	utils.writeFile('../../config.xml', configText);
	
	utils.log('<--- done --->');
})();

