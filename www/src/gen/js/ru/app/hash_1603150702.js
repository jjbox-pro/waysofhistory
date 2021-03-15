
/*
 * Хэш состоит из четырёх компонентов
 * 1. interface название интерфейса town, map и т.д.
 * 2. interfaceId параметры окружения - tid для НГ, координаты для карты
 * 3. wnd название окна
 * 4. wndId идентификатор окна
 * компоненты можно пропускать, но нельзя менять местами, wndId без wnd не используется.
 */


HashMgr = function(){};
// Добавляется ко всем хеш ссылкам для отображения абсолютного пути в статусной строке браузера
HashMgr.absHref = '/';
// Получаем ссылку для атрибута href
HashMgr.getHref = function(href){
	return HashMgr.absHref + href;
};
// Получаем относительную ссылку
HashMgr.getRelHref = function(href){
	if( HashMgr.absHref )
		return href.slice(1);
	
	return href;
};
// Получаем хеш ссылку на окно
HashMgr.getWndHref = function(wndName, params, opt){
	opt = opt||{};
	
	if( typeof(params) == 'object' )
		params = utils.objToUrl(params);
	else if( typeof(params) != 'number' )
		params = params||'';
	
	return HashMgr.getHref('#/'+wndName+'/' + params);
},

HashMgr.getTownHref = function(town, account, towns, sep){
	town = (account instanceof Object ? town.id : town);
	towns = towns||wofh.towns;
	
	if( towns[town] )
		return HashMgr.getHref('#town/'+town);
	else
		return '/' + hashMgr.addAccountToHref(account, sep) + HashMgr.getLinkadd('&') + '#town/' + town;
};

    HashMgr.getLinkadd = function(sep){
        sep = sep||'?';
        
        return wofh.linkadd ? sep + wofh.linkadd : '';
    };

HashMgr.getMapHref = function(o, point){
	if( typeof(o) != 'string' ){
		if( o instanceof Object ){
			point = {x: o.x, y: o.y};

			o = o.o;
		}

		if( o !== undefined ){
			o = 'o='+o;

			if( point )	
				o += '&x=' + point.x + '&y=' + point.y;
		}
	}
	
	return HashMgr.getHref('#map/'+(o||''));
};

HashMgr.addAccountToHref = function(account, sep){
	return (sep === undefined ? '?' : '') + 'acc=' + (account instanceof Object ? account.id : account);
};


HashMgr.prototype.init = function(){
	this.enabled = true;
	
    this.bindEvent();
	
	return this;
};

HashMgr.prototype.bindEvent = function(){
	window.onhashchange = function(){
		/*  
			onhashchange может быть вызван несколько раз с одинаковым location.hash в случае, 
			когда location.hash изменялся несколько раз !!синхронно!! и остолся с первоначальным значением
		*/
		if( hashMgr.isActualHash() )
			return;
		
		hashMgr.parse();
    };
	
	$(document).on('click', 'a, area', function(){ // area - ссылки слотов в гибридном городе
		var href = $(this).attr('href');

		if( !href )
			return;
			
		href = HashMgr.getRelHref(href);
		
		if( href[0] == '#' ){
			var hrefArr = href.slice(1).split('/');
			
			if( hrefArr[0] == '' ){
				hashMgr.parse(hrefArr);
				
				return false;
			}	
			
			if( HashMgr.absHref ){
				hashMgr.applyHash(href + (hrefArr[1] ? '' : '/'));
				
				return false;
			}
		}
	});
};
// Обработка хэша, включение интерфейсов и окон.
// Флаг important может менять поведение устновки хеша в зависимости от контекста ситуации
HashMgr.prototype.parse = function(newArr, important){
	if( !this.enabled )
		return;
    
    if( !newArr )
    	newArr = this.getHashArr();	
	
	newArr = this.validateHash(newArr);
	
	if( this.parseInterface(newArr) )
		return;
	
	if( newArr[2] )
		this.showWnd(newArr[2], newArr[3]);
	else
		this.applyParsedHash(newArr, important);
	
	this.actualizeHash();
};
// Приводим невалидный хэш к валидному виду
HashMgr.prototype.validateHash = function(hashArr){
	var validHashArr = [],//валидный хэш
		curElem = 0;//текущая позиция в невалидном хэше

	if( wndMgr.interfaces[hashArr[curElem]] ){
		validHashArr[0] = hashArr[curElem];
		
		curElem++;
	} 
	else
		validHashArr[0] = wndMgr.interface ? wndMgr.interface.name : 'town';
	
	var newIf = wndMgr.interfaces[validHashArr[0]];
	
	if( wndMgr.getWndClassesByHash(hashArr[curElem]).length ) {
		validHashArr[1] = newIf.getId();
		validHashArr[2] = hashArr[curElem];
		validHashArr[3] = hashArr[curElem+1];
	}
	else{
		if( !hashArr[curElem] && wndMgr.interface )
			validHashArr[1] = newIf.getId();
		else
			validHashArr[1] = hashArr[curElem];

		if( wndMgr.getWndClassesByHash(hashArr[curElem+1]).length ){
			validHashArr[2] = hashArr[curElem+1];
			validHashArr[3] = hashArr[curElem+2];
		}
	}
	
	return validHashArr;
};

HashMgr.prototype.parseInterface = function(newArr){
	var interface = wndMgr.getInterface();

	if( !interface || newArr[0] != interface.getName() ){
		if( wndMgr.interfaces[newArr[0]] )
			wndMgr.tryShowInterface(newArr[0], newArr[1]);
	}
	else if( newArr[1] != '' && newArr[1] != interface.getId() ){
		interface.onIdChange(newArr[1]);
		
		if( !newArr[2] )
			return true;
	}
	// В админке нет wndMgr.interface
	if( interface )
		this.prepareInterfaceHash(newArr);
};

HashMgr.prototype.prepareInterfaceHash = function(arr, interface){
	interface = interface||wndMgr.interface;
	
	if( !interface )
		return;
	
	arr[0] = interface.getName();
			
	arr[1] = interface.getId();
};

HashMgr.prototype.applyParsedHash = function(newArr, important){
	this.enabled = false;
	
	this.applyHash(newArr.join('/'));
	
	this.onValidHashApplied(newArr, important);
	
	this.enabled = true;
};
// Программная установка хэша
HashMgr.prototype.setHash = function(wndHash, wndId){	
	this.enabled = false;
	
	var hashArr = [];
    
	this.prepareWndHash(hashArr);
	
	this.addWndHash(hashArr, wndHash, wndId);
    
	this.applyHash(hashArr.join('/'), true);
	
    this.enabled = true;
};

HashMgr.prototype.prepareWndHash = function(hash){
	// В админке нет wndMgr.interface
	if( wndMgr.interface )
		this.prepareInterfaceHash(hash);
	else
		hash.push(this.setFirstParam());
};

HashMgr.prototype.addWndHash = function(hashArr, wndHash, wndId){
	if( !wndHash )
		return;
	
	hashArr.push(wndHash);
	
	if( wndId )
		hashArr.push(wndId);
};

HashMgr.prototype.onFirstParamChange = function(firstParam){};

HashMgr.prototype.onValidHashApplied = function(hashArr, important){};

HashMgr.prototype.isActualHash = function(){
    return this.actualHash == document.location.hash;
};

HashMgr.prototype.actualizeHash = function(){
    this.actualHash = document.location.hash;
};

HashMgr.prototype.applyHash = function(hash, needActualize){
	//if( hash[0] != '#' )
	//	hash = '#' + hash;
	
	//if( document.location.hash != hash )
		document.location.hash = hash;
		
	if( needActualize )
		this.actualizeHash();
};

HashMgr.prototype.getHashArr = function(){
	return document.location.hash.slice(1).split('/');
};

//Установка первого параметра по умолчанию - заглушка
HashMgr.prototype.setFirstParam = function(){
    return '';
};
//Получение текущего первого параметра из хэша
HashMgr.prototype.getFirstParam = function(){
	if( !this.enabled ) 
		return '';
	
	var arr = this.getHashArr();
    
    return arr[0]||'';
};
//Получение текущего второго  параметра из хэша
HashMgr.prototype.getSecondParam = function(){
	if ( !this.enabled )
		return '';
	
	var arr = this.getHashArr();
    
    return arr[1]||'';
};
//Получение параметров интерфейса (первые два параметра)
HashMgr.prototype.getInterfaceParam = function(){
	if( !this.enabled ) 
		return '';
	
	var arr = this.getHashArr(); 
	
	arr.splice(2);
	
    return arr.join('/');
};

HashMgr.prototype.showWnd = function(viewName, viewId, viewData) {    
    var list = wndMgr.getWndClassesByHash(viewName);
	
    var showHash = false;//показываем ли хэш
	
    for(var item in list){
        var wnd = wndMgr.addWnd(list[item], viewId, viewData);
		
        if( wnd && wnd.options.setHash )
        	showHash = false;
    }
	
    return showHash;
};

//хэш массив в строку
HashMgr.prototype.toStr = function(hash, noSeparator){
	var hashArr = [];
	
	for(var hashName in hash){
		var hashValue = hash[hashName];
		
		if( hashValue === '' )
			continue;
		if( hashValue === true )
			hashArr.push(hashName);
		else 
			hashArr.push(hashName+'='+hashValue);
	}
	return (!noSeparator ? '#' : '') + hashArr.join('&');
};

HashMgr.prototype.getHref = function(){
	return HashMgr.getHref.apply(this, arguments);
};

HashMgr.prototype.getRelHref = function(){
	return HashMgr.getRelHref.apply(this, arguments);
};

HashMgr.prototype.getWndHref = function(){
	return HashMgr.getWndHref.apply(this, arguments);
};

HashMgr.prototype.getTownHref = function(){
	return HashMgr.getTownHref.apply(this, arguments);
};

HashMgr.prototype.getMapHref = function(){
	return HashMgr.getMapHref.apply(this, arguments);
};

HashMgr.prototype.addAccountToHref = function(account, sep){
	return HashMgr.addAccountToHref.apply(this, arguments);
};