window.onerror = function(msg, url, lineNo, columnNo, systemError){
	var error = {
		msg: msg,
		url: url,
		lineNo: lineNo,
		columnNo: columnNo,
		stack: systemError ? systemError.stack : ''
	};

	alert('Error: ' + JSON.stringify(error, undefined, 2));

	window.onerror = null;
};


window.baseTag = document.getElementById('base');

window.baseTag.w_root = location.href.replace(/ggen\/.*/, '');

window.baseTag.href = baseTag.w_root;

document.write('<script type="text/javascript" src="../cordova.js"></script>');

window.wofhPlatform = {
	mainDomain: location.search.match(/mainDomain=(.*?)(\s|&|$)/)[1],
	protocol: 'https:' 
};

document.write('<script type="text/javascript" src="' + wofhPlatform.protocol + '//' + wofhPlatform.mainDomain + '/ggen/js/ru/gconst.js?1560026396' + '"><\/script>');
	
document.write('<script type="text/javascript" src="' + wofhPlatform.protocol + '//' + wofhPlatform.mainDomain + '/ggen/js/ru/const.js?1614582625' + '"><\/script>');