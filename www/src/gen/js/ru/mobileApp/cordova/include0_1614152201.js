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

window.baseTag.w_root = location.href.replace(/gen\/.*/, '');

window.baseTag.href = baseTag.w_root;

document.write('<script type="text/javascript" src="../cordova.js"></script>');

window.wofhPlatform = {
	domain: location.search.match(/domain=(.*?)(\s|&|$)/)[1],
	protocol: 'https:' 
};

document.write('<script type="text/javascript" src="' + wofhPlatform.protocol + '//' + wofhPlatform.domain + '/gen/js/ru/const.js?1613870462' + '"><\/script>');