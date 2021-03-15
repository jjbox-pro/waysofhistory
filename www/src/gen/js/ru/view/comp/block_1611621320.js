
/*****************
 * Базовый блок2 *
 *****************/

Block = function(){
    this.initBlock.apply(this, arguments);
};


Block.pendingReqCount = 0;

Block.prepareData = function(){
    return {};
};


Block.prototype.initBlock = function(parent){
	if( parent )
		this.parent = parent;
	
	this.name = this.calcName();
    
    this.fullName = this.calcFullName(); // Полное имя (с учётом имени родителя)
	
    this.tmpl = this.calcTmplFolder();
	
	this.initOptions();
	
	this.timeouts = {};
	
	this.plugins = {};
    
    this.staticData = {};
};

Block.prototype.calcName = function(){return this.name||'';};

Block.prototype.getName = function(){return this.name;};

Block.prototype.getHashName = function(){return this.hashName||this.name;};

Block.prototype.calcTypeName = function(){return '';};

Block.prototype.getTypeName = function(postFix){
	var typeName = this.calcTypeName()||'';
	
	if( typeName )
		typeName += (postFix||'');
	
	return typeName;
};
/*
Block.prototype.getTmplFullName = function(opt){
    opt = opt||{};
    
    var proto = Object.getPrototypeOf(this),
        fullName = '',
        name;
	
    if( proto.getTmplFullName )
        fullName = proto.getTmplFullName.apply(proto, arguments);
	
	name = this.getTypeName();
	
	if( name )
		fullName += ' ' + name + (opt.postFix||'');
	
	return fullName;
};
*/
//собираем полное имя
Block.prototype.calcFullName = function(){
    if( this.parent )
        return this.parent.name + '-' + this.name;
    else
        return this.name;
};

Block.prototype.getFullName = function(){
	return this.fullName||'';
};
//выбираем папку шаблона
Block.prototype.calcTmplFolder = function(){
    if( this.tmpl )
        return this.tmpl;
    else if( this.parent )
        return this.parent.tmpl[this.name];
    else
        return tmplMgr[this.name];
};

Block.prototype.initOptions = function(){
    this.options = this.options||{}; // this.options могут быть установлены раньше вызова конструктора Block
    this.options.resizeParent = true;//если компонент ресайзится, то ресайз передаётся родителю
    this.options.clearData = true;
};


Block.prototype.getId = function(){
	return this.id;
};

Block.prototype.beforeSetHash = function(){};


Block.prototype.initNotif = function(){
	this.resetNotif();
    
	this.addBaseNotif();
	
	this.addNotif();

	this.connectNotif();
};

Block.prototype.resetNotif = function(){
	delete this.reInitNotif;
	
	this.detachNotif();
	
	this.notif = {show: [], other: {}}; // show - действия на показ блока, other - любые другие действия
};

Block.prototype.addBaseNotif = function(){};

Block.prototype.addNotif = function(){};

Block.prototype.connectNotif = function(){
	this.notifHandler = this.getNotifHandler();
	
    this.attachNotif();
};

Block.prototype.detachNotif = function(){
    //отключаем нотификации
    this.doChildren('detachNotif');
	
    if( this.notifHandler ){
		for(var notifList in this.notif)
			this.detachNotifList(this.notif[notifList]);
		
		this.resetNotifHandler();
	}
};

Block.prototype.detachNotifElem = function(notif){
	notifMgr.removeListener(notif, this.notifHandler);
};

Block.prototype.detachNotifList = function(list){
	notifMgr.removeListeners(this.notifHandler, list);
};

Block.prototype.detachNotifOther = function(){
	if( !this.notif )
		return;
	
	this.detachNotifList(this.notif.other);
	
	this.reInitNotif = true;
};

Block.prototype.resetNotifHandler = function(){
	this.notifHandler = 0;
};

Block.prototype.getNotifHandler = function(){
	return notifMgr.getHandler();
};

Block.prototype.attachNotif = function(){
	if( !this.notifHandler )
        return;
	
    for(var notif in this.notif.show)
        notifMgr.addListener(this.notif.show[notif], this.notifHandler, this.show, this);
	
	// Разные
	for (var notif in this.notif.other)
        notifMgr.addListener(notif, this.notifHandler, this.notif.other[notif], this);
};


Block.prototype.initChildren = function(){
    var childrenNew, 
        childrenWas = this.children||{},
        extChildrenData,
        childName;

    this.children = {};

    this.calcChildren();

    childrenNew = this.children;
    
    this.children = {};
    
    extChildrenData = this.getExtChildrenData(childrenNew, childrenWas);
    
    for(childName in childrenWas){
        if( childrenWas[childName].isActualChild(childrenNew[childName], extChildrenData) ){
            this.initChild(childName, childrenNew[childName]);
            
            this.restoreChild(this.children[childName], childrenWas[childName]); // Восстанавливаем необходимые данные от ранее существовавшего потомка
            
            delete childrenNew[childName];
            
            continue;
        }
        
        childrenWas[childName].onRemove();
        
        if( !this.options.__newChildInit )
            delete this[childName];
    }
    
    for(childName in childrenNew)
        this.initChild(childName, childrenNew[childName]);
};
    
    Block.prototype.calcChildren = function(){};
    
    Block.prototype.getExtChildrenData = function(childrenNew, childrenWas){};
    
    Block.prototype.isActualChild = function(constructor){
        return constructor && constructor == this.constructor;
    };
    
    Block.prototype.initChild = function(name, cls){
        if( !this.options.__newChildInit ){
            this[name] = new cls(this);

            this.children[name] = this[name];
        }
        else
            this.children[name] = new cls(this);
        
        return this.children[name];
    };
    
    Block.prototype.restoreChild = function(childNew, childWas){
        childNew.children = childWas.children;
        
        childNew.restoreStaticData(childWas);
        
        childWas.onRemove(true);
    };
        
        Block.prototype.restoreStaticData = function(childWas){
            this.staticData = childWas.staticData;
        };
    
Block.prototype.resetChildren = function(){
    this.doChildren('onRemove');

    this.clearChildren();
};

    Block.prototype.clearChildren = function(){
        if( !this.options.__newChildInit )
            for(var child in this.children)
                delete this[child];
        
        this.children = {};
    };

Block.prototype.doChildren = function(command, params){
    for (var child in this.children){
        if( this.children[child] )
            this.children[child][command](params);
    }
};

Block.prototype.getChild = function(name){
    return this.children[name];
};


Block.prototype.bindBaseEvent = function(){
	var self = this;
    
	// Перенести в клаcc Panel 
    this.wrp.on('mousedown', function(){
        if( (self.parent instanceof Interface && !self.options.inactive) || self.options.activatable)
            wndMgr.setActiveWnd(self);
    });
};

Block.prototype.bindEvent = function(){};

Block.prototype.bindAllEvent = function(){
	this.bindBaseEvent();
	
	this.bindEvent();
};

Block.prototype.beforeResize = function(){};

Block.prototype.getSize = function(){
    if(this.cont){
        return {
            x: this.cont.outerWidth(true),
            y: this.cont.outerHeight(true)
        };
    } else {
        return {x: 0, y: 0};
    }
};

//действия на изменение размера
//усли выставлен параметр - оповещаем дочерние элементы, если не выставлен - родительские
Block.prototype.resize = function(dirDown){
	this.makeResize();
	
    if( dirDown )
        this.doChildren('resize', dirDown);
    else if( this.options.resizeParent && this.parent && this.parent.isReady() )
		this.parent.resize(false, this);
};

Block.prototype.makeResize = function(){};
//формирование данных для шаблона - используются данные блока, синхронная работа
Block.prototype.getTmplData = function(){
    return this.data;
};
//получение главного шаблона
Block.prototype.getTmpl = function(){
    return this.tmpl.main || this.tmpl;
};
//проверяем, стоит ли показывать - ЗАГЛУШКА
Block.prototype.canDisplay = function() {
	return true;
};

Block.prototype.getBaseType = function(){return '';};

Block.prototype.getBaseTypeClass = function(postFix){
	return this.getBaseType() + (postFix||'');
};

Block.prototype.getTypeClass = function(postFix){
	return this.getTypeName(postFix);
};

Block.prototype.getTypeWrpClass = function(){
	return this.getTypeClass('-wrp');
};
//получаем название класса
Block.prototype.getTmplClass = function(postFix){
	var tmplClass = this.getFullName()||'';
	
	if( tmplClass )
		tmplClass += (postFix||'');
	
    return tmplClass;
};
//получаем название класса для врапера
Block.prototype.getTmplWrpClass = function(){
    return this.getTmplClass('-wrp');
};
//устанавливаем обертку
Block.prototype.setWrp = function(){
	if( !this.parent )
		return;
	
	var $parent = this.parent.wrp||this.parent.cont;

	if( $parent )
		this.wrp = $parent.find('.'+this.getTmplWrpClass());
};

Block.prototype.setCont = function(){
    // Создаём контент
    this.cont = $(this.createCont());
    
	this.wrapCont(this.cont);
	
	// Кеширование контента до вставки во враппер
	this.cacheCont(this.cont);
	
	// Модификация контента до вставки во враппер
	this.modifyCont(this.cont);
	
	//пишем его во врапер
    this.addContToWrp();
};

Block.prototype.wrapCont = function(cont){
    if( cont.length > 1 )
        this.cont = $('<div></div>').append(cont);
};

Block.prototype.cacheCont = function(){};

Block.prototype.modifyCont = function(){};

Block.prototype.addContToWrp = function(){
    this.wrp.html(this.cont);
};

Block.prototype.deleteWrp = function(){
    if( !this.wrp )
        return;
    
    this.wrp.unbind().off();
    
    delete this.wrp;
};

Block.prototype.removeWrp = function(){
    if( this.wrp )
        this.wrp.remove();
};

//удаляем блок
Block.prototype.clearWrp = function(){
    // убираем детей
    this.doChildren('clearWrp');
	
	this.clearGarbage();
	
	this.destroyScroll(); // Уничтожение скролла должно происходить до чистки враппера иначе будет утечка памати
	
    // убираем контент
    if( this.wrp )
		this.wrp.empty();
};

Block.prototype.clearGarbage = function(){};
//создаём контент для установки во врапер
Block.prototype.createCont = function(){
    var tmpl = this.getTmpl();
	
    return tmpl(this.getTmplData());
};

Block.prototype.refresh = function(){
	this.show();
};

Block.prototype.allowShow = function(){
	return !this.parent || (!this.parent.dataReceiving && this.parent.allowShow());
};
// Показываем блок, если возможно
Block.prototype.show = function(){
	if( !this.allowShow() )
		return;
	
	if( this.options.hasReqData ){
		if( !this.prepareReq() )
			return;
	}
	
    this.data = (this.data && !this.options.clearData) ? this.data : {};
	
	this.dataReceiving = true;
	
    this.getData();
};
//функция сбора данных, по завершении нужно выполнить this.dataReceived()
Block.prototype.getData = function(){
    this.dataReceived();
};
// Данные блока получены - отображаем блок
Block.prototype.dataReceived = function(){
	this.ready = false;
	
	var firstDraw = this.isFirstDraw();
	
	this.afterDataReceived();
	
	if( this.needInitNotif(firstDraw) )
		this.initNotif();
	
	this.clearWrp(firstDraw);
	
	if( !this.canDisplay() ){
		this.drawIsOver(true);
		
		return;
	}
	
	if( firstDraw )
		this.setWrp();
	
	if( !this.wrp ){
		this.drawIsOver(true);
        
		return;
	}
	
	this.setCont(firstDraw);
	
	this.afterContSet(firstDraw);
	
	if( this.needInitChildren(firstDraw) )
		this.initChildren();
		
	if( firstDraw )
		this.bindAllEvent();
	
	this.beforeShowChildren(firstDraw);
	
	this.showChildren();
	
	this.afterDraw(firstDraw);
	
	this.drawIsOver();
	
	this.drawn = true;
	
	this.onDataReceived(firstDraw);
	
	this.ready = true;
};

Block.prototype.needInitNotif = function(firstDraw){
	return firstDraw || !this.notifHandler || this.reInitNotif;
};

Block.prototype.needInitChildren = function(firstDraw){
	var needInit = firstDraw;
	
	if( this.reInitChildren ){
		needInit = true;
		
		delete this.reInitChildren;
	}
	
	return needInit;
};

Block.prototype.drawIsOver = function(noWrp){
	var firstShow = !this.wasShown();
	
    if( noWrp ){
        this.resetChildren();
		
		this.reInitChildren = true;
    }
    
	if( !this.isChildrenShown() ){
        this.applyResize(firstShow);
		
		return;
	}
	
	if( !noWrp ){
		this.shown = true;
		
		this.afterShowChildren(firstShow);
		
		this.applyResize(firstShow);
		
		this.afterShow(firstShow);
		
		this.afterAllShow(firstShow);
	}
	
	if( this.parent )
		this.parent.setChildShown(this);
};

Block.prototype.applyResize = function(firstShow){
	this.beforeResize(firstShow);
	
	this.resize();
	
	this.afterResize(firstShow);
};

Block.prototype.wasDrawn = function(){
	return this.drawn;
};

Block.prototype.isReady = function(){
	return this.ready;
};

Block.prototype.wasShown = function(){
	return this.shown;
};

Block.prototype.isFirstDraw = function(){
	return !this.wrp || !this.parent;
};

Block.prototype.afterContSet = function(){};

Block.prototype.afterDataReceived = function(){
	this.dataReceiving = false;
	
	if( this.options.hasReqData )
		this.resetReq();
};

Block.prototype.onDataReceived = function(){};

//действия перед показом детей
Block.prototype.beforeShowChildren = function(){};

Block.prototype.showChildren = function(){
	this.doChildren('deleteWrp');
	
	this.shownChildren = {};
	
    this.doChildren('show');
};

Block.prototype.setChildShown = function(child){
	if( this.shownChildren[child.name] )
		return;
	
	this.shownChildren[child.name] = true;
	
	if( this.isReady() && this.isChildrenShown() )
		this.drawIsOver();
};

Block.prototype.isChildrenShown = function(){
	for(var child in this.children){
		if( !this.shownChildren[this.children[child].name] )
			return false;
	}
	
	return true;
};


Block.prototype.afterShowChildren = function(){};

Block.prototype.afterShow = function(){};

Block.prototype.afterAllShow = function(){};

//действия выполняемые после показа блока (например переподключение слайдеров)
Block.prototype.afterDraw = function(){};
// Действия выполняемые после пересчета размеров дочерних или родительских элементов
Block.prototype.afterResize = function(){};
//сделать активным - пока больше для Wnd и задников
Block.prototype.setActive = function(active){
    this.active = active;
	
    this.setActiveCls(active);
};

Block.prototype.setActiveCls = function(active){
	if( this.cont )
        this.cont.toggleClass('-active', active);
};

Block.prototype.isActive = function(){
    return this.active;
};

Block.prototype.getZoffset = function(){
	return wndMgr.zOffset;
};

Block.prototype.setZ = function(z){
    if( this.options.staticZ ) return;
	
    if( this.wrp )
        this.cont.css('z-index', z);
};
//размеры контейнера
Block.prototype.getSizePx = function(opt){
	opt = opt||{};
	
	var marg = opt.marg||false;
	
    if( this.cont )
		return utils.getElemSize(this.cont, {
			getSize: function($cont){
				return {
					width: $cont.outerWidth(marg),
					height: $cont.outerHeight(marg)
				};
			},
			ignoreHidden: opt.ignoreHidden
		});
	
    return {width: 0, height: 0};
};
//установка стиля контейнеру(в основном размеры и позиционирование)
Block.prototype.setStyle = function(style){
    if( this.cont )
        this.cont.css(style);
};

Block.prototype.isInstanceOf = function(Type){
    return this instanceof Type;
};


Block.prototype.initScroll = function(opt){
    opt = opt||{};

    this.$scroll = this.getScrollTag(opt.cls);

    if( this.$scroll.length )
        this.$scroll = IScroll.add(this.$scroll, opt);
    else
        delete this.$scroll;

    return this;
};

Block.prototype.getScrollTag = function(cls){
    return this.wrp.find(cls||'.js-scroll-wrp');
}; 

Block.prototype.updScroll = function(forceUpdate){
    if( this.$scroll )
        this.$scroll.update(forceUpdate);

    return this;
};

Block.prototype.doScroll = function(method, val, opt){
    if( this.$scroll )
        this.$scroll.do(method, [val, opt]);

    return this;
};

Block.prototype.destroyScroll = function(){
    if( this.$scroll )
        this.$scroll.remove();

    delete this.$scroll;

    return this;
};

Block.prototype.$getScrollWrp = function(){
    return this.$scroll.$getWrp();
};


Block.prototype.onRemove = function(noChildren){
	this.removed = true;
	
	this.detachNotif();
	
	this.removeTables();
	
	this.clearAllTimeouts(true);
	
	this.removePlugins(true);
	
    if( !noChildren )
        this.doChildren('onRemove');
};	

Block.prototype.isRemoved = function(){
	return this.removed;
};

Block.prototype.toggleDisplay = function(show){
	if( this.wrp )
		this.wrp.toggleClass('-hidden', !show);
};

Block.prototype.showCont = function(){
	if( this.wrp )
		this.wrp.removeClass('-hidden');
};

Block.prototype.hideCont = function(){
	if( this.wrp )
		this.wrp.addClass('-hidden');
};

Block.prototype.isContHidden = function(){
	return !this.wrp || this.wrp.hasClass('-hidden');
};

/* Отслеживание таблиц (пока они не переведены на block) */

Block.prototype.appendTable = function(table){
	if( !this.tables )
		this.tables = [];
	
	var _table;
	
	for(var i = 0; i < this.tables.length; i++){
		_table = this.tables[i];
		
		if( !utils.inDOM(_table.cont.get(0)) || _table.cont.get(0) == table.cont.get(0) ){
			this.tables[i].onRemove();
			
			this.tables.splice(i, 1);
			
			break;
		}
	}
	
	this.tables.push(table);
};

Block.prototype.removeTables = function(){
	for(var table in this.tables){
		this.tables[table].onRemove();
	}
};

/* Работа с асинхронными данными */

Block.prototype.prepareReq = function(){
	console.log('a----> prepareReq <----');
	console.log('a----> this.dataReceiving <----', this.dataReceiving||false);
	console.log('a----> this.reqId', this.reqId);
	
	this.resetReqId();
	
	console.log('a----> this.reqId', this.reqId);
	
	if( this.dataReceiving ){
		/*
			Флаг указывающий, что полученные ответы и запросы ожидающие отправки более неактуальны (будут проигнорированы в момент обработки)
			и необходимо заново запросить актуальные данные.
		*/
		this.needUpdData = true;
		
		console.log('a----> this.needUpdData', this.needUpdData);
		console.log('a-------------------------------------------');
		
		return false;
	}
	
	this.needUpdData = false;
	
	console.log('a----> this.needUpdData', this.needUpdData);
	/*
		Идентификатор отложенных запросов.
		При каждом вызове show создаётся новый id для последующих запросов.
		Если происходит попытка отправить запрос с неактуальный id, такой запрос игнорируется.
		Такая ситуация может произойти если блок параллельно отправляет несколько запросов.
	*/
	this.pendingReqId = this.updPendingReqCount();

	console.log('a----> this.pendingReqId', this.pendingReqId);
	/*
		Если данный флаг установлен в момент вызова tryProcessResp, то ответ не актуален и не обрабатывается.
		Такая ситуация может возникнуть если блок параллельно отправляет несколько запросов. 
		Установка флага в false происходит непосредственно в момент отправки запроса в функции tryGetReqData.
	*/
	this.waitingReqSend = true;
	
	console.log('a----> this.waitingReqSend', this.waitingReqSend);
	
	console.log('a-------------------------------------------');
	
	this.clearAllTimeouts();
	
	this.removePlugins();
	
	this.detachNotifOther();
	
	this.doChildren('detachNotif');
	
	return true;
};
/*
	Для получения данных от сервера в блоке используется конструкция getReqData => tryProcessResp.
	getReqData запоминает id текущего запроса, который используется для проверки необходимости обрабатывать ответ в tryProcessResp.
	P.S. Абсолютное большинство запросов в блоках должно делаться через getReqData => tryProcessResp.
*/
Block.prototype.getReqData = function(callback, opt){
	console.log('a----> getReqData <----');
	
	console.log('a----> this.pendingReqId', this.pendingReqId);
	
	setTimeout(this.tryGetReqData.bind(this, this.pendingReqId, callback, opt), 0);
	
	console.log('a-------------------------------------------');
};

Block.prototype.tryGetReqData = function(pendingReqId, callback, opt){
	console.log('a----> tryGetReqData <----');
	
	if( this.isRemoved() ){
		console.log('a----> isRemoved', true);
		console.log('a-------------------------------------------');
		
		return;
	}
	
	opt = opt||{};
	
	if( opt.noChecks ){
		console.log('a----> noChecks', true);
		console.log('a----> this.canReqData', true);
		
		callback.call(this);
		
		console.log('a-------------------------------------------');
		
		return;
	}
	
	console.log('a----> pendingReqId', pendingReqId);
	console.log('a----> this.pendingReqId', this.pendingReqId);
	
	if( !this.canReqData(pendingReqId) ){
		console.log('a----> this.canReqData', false);
		console.log('a-------------------------------------------');
		
		return;
	}
	
	console.log('a----> this.needUpdData', this.needUpdData);
	
	if( this.needUpdData ){
		console.log('a----> this.canReqData', false);
		console.log('a-------------------------------------------');
		
		this.updReqData();
		
		return;
	}
	
	console.log('a----> this.canReqData', true);
	
	this.waitingReqSend = false;
	
	callback.call(this);
	
	var reqId = reqMgr.getCurReqId();
	// Если в блок отправляет несколько параллельных запросов, сохраняем минимальный reqId
	this.reqId = opt.minReqId ? Math.min(this.reqId||999999999999, reqId) : reqId;
	
	console.log('a----> reqId', reqId);
	console.log('a----> this.reqId', this.reqId);
	console.log('a-------------------------------------------');
};

Block.prototype.tryProcessResp = function(resp, reqId, callbacks, opt){
	console.log('a----> tryProcessResp <----');
	
	if( this.isRemoved() ){
		console.log('a----> isRemoved', true);
		console.log('a----> canProcessResp', false);
		console.log('a-------------------------------------------');
		
		return;
	}
	
	if( callbacks instanceof Function )
		callbacks = {onSuccess: callbacks};
	
	opt = opt||{};
	
	if( opt.noChecks ){
		console.log('a----> noChecks', true);
		console.log('a----> canProcessResp', true);
		
		callbacks.onSuccess.call(this, resp);
		
		console.log('a-------------------------------------------');
		
		return;
	}
	
	console.log('a----> reqId', reqId);
	console.log('a----> this.reqId', this.reqId);
	console.log('a----> this.needUpdData', this.needUpdData);
	console.log('a----> this.waitingReqSend', this.waitingReqSend);
	
	if( !this.canProcessResp(reqId) ){
		console.log('a----> canProcessResp', false);
		
		console.log('a-------------------------------------------');
		
		if( callbacks.onFail )
			callbacks.onFail.call(this, resp);
		
		if( this.needUpdData )
			this.updReqData();
		
		return;
	}
	
	console.log('a----> canProcessResp', true);
	
	console.log('a-------------------------------------------');
	
	callbacks.onSuccess.call(this, resp);
};

Block.prototype.canProcessResp = function(reqId){
	var canProcess = (!this.reqId || reqId >= this.reqId) && !this.needUpdData && !this.waitingReqSend;
	
	if( !canProcess || !this.parent )
		return canProcess;
	
	return this.parent.canProcessResp(reqId);
};

Block.prototype.canReqData = function(pendingReqId){
	var canReq = (!this.pendingReqId || pendingReqId >= this.pendingReqId);
	
	if( !canReq || !this.parent )
		return canReq;
	
	return this.parent.canReqData(pendingReqId);
};

Block.prototype.updReqData = function(){
	this.needUpdData = 
	this.dataReceiving = false;

	this.show();
};

Block.prototype.resetReqId = function(){
	this.reqId = 0;
};

Block.prototype.resetReq = function(){
	this.needUpdData = this.waitingReqSend = false;
};

Block.prototype.updPendingReqCount = function(){
	return ++Block.pendingReqCount;
};

/* Таймерами */

Block.prototype.setTimeout = function(callback, delay){
	// Игнорируем большую задержку
	if( delay > timeMgr.maxTimeoutDelay )
		return;
	
	var self = this,
        timeoutId = setTimeout(function(){
		callback.call(self);
		
		// После срабатывания тймера удаляем timeoutId из списка timeouts
		self.delTimeoutId(timeoutId);
	}, delay);
	
	this.timeouts[timeoutId] = {id: timeoutId};
	
	return timeoutId;
};

Block.prototype.clearTimeout = function(timeoutId){
	if( this.timeouts[timeoutId] ){
		clearTimeout(timeoutId);
		
		this.delTimeoutId(timeoutId);
	}
};

Block.prototype.delTimeoutId = function(timeoutId){
	delete this.timeouts[timeoutId];
};

Block.prototype.clearAllTimeouts = function(noChildren){
	for(var timeoutId in this.timeouts)
		clearTimeout(timeoutId);
	
	this.timeouts = {};
	
	if( !noChildren )
		this.doChildren('clearAllTimeouts');
};

/* Делегирование (вызов методов родителей в цепочке прототипов) */

Block.prototype.delegate = function(methodName, constructor, args){
	return utils.delegate(this, methodName, constructor, args);
};

/* Плагинами */

Block.prototype.setPlugin = function(Plugin, opt){
	new Plugin(this, opt);
};

Block.prototype.removePlugins = function(noChildren){
	for(var plugin in this.plugins)
		this.plugins[plugin].onRemove();
	
	this.plugins = {};
	
	if( !noChildren )
		this.doChildren('removePlugins');
};