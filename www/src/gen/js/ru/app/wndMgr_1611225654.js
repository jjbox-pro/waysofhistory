
/*****************
 * Менеджер окон *
 *****************/

WndMgr = function(){
	this.list = [];//список окон
	
	this.zOffset = 1500;//смещение по Z, начиная с которого располагаются окна

	this.interfaces = {};//список интерфейсов
};


WndMgr.regWnd = function(hash, wnd) {
    this.registredWnd = this.registredWnd||{};
    this.registredWnd[hash] = this.registredWnd[hash]||[];
    this.registredWnd[hash].push(wnd);
};


WndMgr.prototype.initEnvironment = function(){
	this.window = window;
	
	this.document = this.window.document;
	
	this.documentElement = this.document.documentElement;
	
    this.head = this.document.head;
	
	this.body = this.document.body;
    
	this.$window = $(this.window);
	
	this.$document = $(this.document);
	
	this.$html = $(this.documentElement);
	
	this.$head = $(this.head);
	
	this.$body = $(this.body);
    
    this.deviceScreen = this.window.screen||{};
    
    return this;
};

WndMgr.prototype.prepareInit = function(){
	this.initConsoleErrorsLog();
};

	WndMgr.prototype.initConsoleErrorsLog = function(){
		this.window.onerror = function(msg, url, lineNo, columnNo, systemError){
			var consoleErrors = ls.getConsoleErrors([]),
				now = timeMgr.getNow(),
				newError = {
					time: now,
					msg: msg,
					url: (url||'').replace(/https.*(ru|de|en)/g, ''), // Вырезаем полный путь
					lineNo: lineNo,
					columnNo: columnNo,
					stack: systemError ? systemError.stack : ''
				};
			
			if( systemError && systemError._extData )
				newError.extData = systemError._extData;
			
			
			if( typeof(newError.stack) == 'object' ){
				try{
					newError.stack = JSON.parse(newError.stack);
				}
				catch(e){}
			}
			
			if( typeof(newError.stack) == 'string' )
				newError.stack = newError.stack
								.replace(/https.*(ru|de|en)/g, '') // Вырезаем полный путь
								.replace(/_[0-9]+\.js/g, '.js'); // Вырезаем версию файла
			
			var hasSameError = false,
				actualErrors = [],
				error;
			
			// Храним ошибки 1 неделю
			for(var i = 0; i < consoleErrors.length; i++){
				error = consoleErrors[i];
				
				if( !hasSameError && newError.lineNo == error.lineNo && newError.columnNo == error.columnNo && newError.url == error.url ){
					hasSameError = true;
					
					continue;
				}
				
				if( now - consoleErrors[i].time < timeMgr.WtS )
					actualErrors.push(consoleErrors[i]);
			}
			
			actualErrors.push(newError);
			
			
			ls.setConsoleErrors(actualErrors);
			
			
			notifMgr.runEvent(Notif.ids.sysConsoleError);
		};
	};
	
	WndMgr.prototype.delConsoleError = function(time){
		if( !time )
			return;
		
		var consoleErrors = ls.getConsoleErrors([]),
			error;
		
		for(var i = 0; i < consoleErrors.length; i++){
			error = consoleErrors[i];
			
			if( error.time == time  ){
				consoleErrors.splice(i, 1);
				
				i--;
			}
		}
		
		ls.setConsoleErrors(consoleErrors);
		
		notifMgr.runEvent(Notif.ids.sysConsoleError);
	};
	
WndMgr.prototype.init = function(){
	this.initWrp();

	this.bindEvents();
	
    this.bindNotif();
    
	return this;
};

WndMgr.prototype.initWrp = function(){
	this.wrp = $(tmplMgr.wnd.layer({}));
	
	this.cont = this.wrp.find('.main-layer');
	
	if( this.cont.length == 0 )
		this.cont = this.wrp;
	
	this.$body.prepend(this.wrp);
};

WndMgr.prototype.bindEvents = function(){
	this.bindKeys();
	
	this.bindCloseAll();
	
	this.$document.on('click', '.js-reconnect', function(){
		appl.reload();
	});
};

WndMgr.prototype.bindKeys = function(){
	//закрыватор по esc
	//вынесен сюда т.к. пока одно окно закрывается, другое уже назначается главным и тоже обрабатывает действие закрытия и далее по цепочке
	this.$document.on('keyup', function(event) {
		if (event.which == 27) {
			if( wndMgr.isEmpty(true) )
				wndMgr.esc();
			else{
				setTimeout(function(){//таймаут, чтобы другие функции обрабатывающие esc (карта) могли сработать раньше
					var wnd = wndMgr.getActiveWnd();

					if( wnd )
						wnd.escClose();
				}, 0);
			}
		}
	});
};

WndMgr.prototype.bindCloseAll = function(){	
	this.cont.on('click', '.js-wnd-closeAll', function(){
		wndMgr.closeAll();
	});
};

WndMgr.prototype.closeAll = function(){
	wndMgr.clearWnd();
	
	sndMgr.playEventSnd(EventSnd.events.sysWndClose);
};

WndMgr.prototype.bindNotif = function(){
	if( utils.isFullScreenAvail() )
        notifMgr.addListener(Notif.ids.sysFullScreen, 'wndMgr', this.notifFullScreen);
};

    WndMgr.prototype.notifFullScreen = function(toggle){
        wndMgr.cont.toggleClass('-state-fullScreen', toggle);
    };

WndMgr.prototype.resize = function(){
	if( this.interface )
		this.interface.resize(true);
	
	notifMgr.runEvent(Notif.ids.resize, true);
};


WndMgr.prototype.push = function(item, list){
    list = list||this.getList();
    
	list.push(item);
};

WndMgr.prototype.splice = function(wndOrPanel, list){
    list = list||this.getList();
    
    var wndIndex = this.getWndIndex(wndOrPanel, list);

	if( wndIndex == -1 )
		return;
	
	list.splice(wndIndex, 1);
    
    return wndIndex;
};

WndMgr.prototype.insertAfter = function(i, item){
	this.insert(+i+1, item);
};

WndMgr.prototype.insert = function(i, item){
	this.list.splice(+i, 0, item);
};

WndMgr.prototype.getList = function(){
	return this.list;
};

WndMgr.prototype.getLength = function(){
	return this.list.length;
};
//закрываем окна, с индексом выше выбранного
WndMgr.prototype.closeWndAfter = function(i){
	while(this.list.length > i){
		this.list[i].close();
	}
};

WndMgr.prototype.getActiveBlock = function() {
	//активный элемент - самый последний
	if( this.isEmpty() ) 
		return false;
	
	return this.list[this.list.length-1];
};

WndMgr.prototype.getWndList = function(opt) {
	opt = opt||{};
	
	var list = [];

	for (var block in this.list) {
		block = this.list[block];
		
		if( block instanceof Wnd ){
			if( (opt.filter && opt.filter(block)) || (opt.excludeList && utils.inArray(opt.excludeList, block.constructor)) )
				continue;
			
			list.push(block);
		}
	}

	return list;
};

WndMgr.prototype.getActiveWnd = function(list){
	if( this.isEmpty() )
		return false;
	
	list = list||this.getWndList();
	
	if( list.length == 0 )
		return false;
	
	return list[list.length-1];
};

WndMgr.prototype.getWndIndex = function(wnd, list){
	list = list||this.getList();
	
    return (list||[]).indexOf(wnd);
};

WndMgr.prototype.setActiveWnd = function(wndOrPanel, list){
	if ( !wndOrPanel || wndOrPanel.options.inactive || wndOrPanel.isActive() || wndOrPanel.isRemoved() ) 
		return;
	
	list = list||this.getList(wndOrPanel);
	
	this.updActiveWnd(wndOrPanel, list);
	
	this.updateOrder(wndOrPanel);
	
	//апдейтим z-index у окон
	this.updateZ(list);
	
	this.trySetHash(wndOrPanel);
};

WndMgr.prototype.updActiveWnd = function(wndOrPanel, list){
	for(var i in list){
		list[i].setActive(false);
	}
	
	wndOrPanel.setActive(true);
};

WndMgr.prototype.updateOrder = function(wndOrPanel, list){
    list = list||this.getList();
    
    this.splice(wndOrPanel, list);
	
	this.push(wndOrPanel, list);
};

WndMgr.prototype.updateZ = function(list, from){
	list = list||this.getList();
	
	if( !from ) 
		from = 0;
	
	for(var i = from; i < list.length; i++) {
		var wnd = list[i];
		
		wnd.setZ(i + wnd.getZoffset());
	}
};

WndMgr.prototype.trySetHash = function(wndOrPanel){
	if( appl.inited )
		this.setHash(wndOrPanel);
};

WndMgr.prototype.setHash = function(wnd){
	if( wnd === undefined ) 
		wnd = this.getActiveWnd();
	
	if( !wnd || !wnd.options.setHash || wnd.isRemoved() )
		return;
	
	wnd.beforeSetHash();
	
	hashMgr.setHash(wnd.getHashName(), wnd.getId());
	
	delete this.needUnsetHash;
};

WndMgr.prototype.removeWnd = function(wnd){
    var wndPos = this.splice(wnd, this.getList());
	
	this.needUnsetHash = true;
	
	if( !wnd.options.noActivatePrev )
		this.activatePrev(wndPos, wnd); // При активации перыдущего окна в цепоче, может быть установлено новое значение хеша. Флаг needUnsetHash в таком случае сбрасывается.
	
	if( wnd.options.setHash && this.needUnsetHash )
		hashMgr.setHash();
	
	delete this.needUnsetHash;
};

WndMgr.prototype.activatePrev = function(wndPos){
	if( wndPos > 0 && wndPos == this.getLength() )
		this.setActiveWnd(wndMgr.getWndByPos(wndMgr.getLength()-1));
	else
		this.updateZ();
};

WndMgr.prototype.closeWndList = function(wndList){
	for (var wnd in wndList) {
		wnd = wndList[wnd];
		
		if( wnd.options.canClose )
			wnd.close();
	}
	
	notifMgr.runEvent(Notif.ids.sysWndListClosed);
};

WndMgr.prototype.closeModalWnd = function(){
	var list = this.getWndList({filter: function(wnd){
		return !wnd.options.showBack;
	}});
	
	for(var wnd in list)
		list[wnd].close();
};

WndMgr.prototype.deactivateActiveWnd = function(list){
	var wnd = this.getActiveWnd(list);
	
	if( wnd )
		wnd.setActive(false);
};

WndMgr.prototype.clear = function(){
	while(this.list.length > 0){
		this.list[0].close();
	}
};

WndMgr.prototype.clearWnd = function(opt){
	this.closeWndList(this.getWndList(opt));
};

WndMgr.prototype.clearList = function(){
	this.clearWnd();
	
	this.list = [];
};

WndMgr.prototype.refreshWnd = function(wndToTop){
	if( !wndMgr.interface )
		return;
	
	var list = this.getWndList();

	for(var wnd in list){
		wnd = list[wnd];
		
		wnd.refresh();
	}

	if( wndToTop )
		this.setActiveWnd(this.getActiveWnd());
};

WndMgr.prototype.centerWnd = function(){
	var list = this.getWndList();
	
	for(var wnd in list){
		list[wnd].moveToCenter();
	}
};
//список окон по типу
WndMgr.prototype.getWndByType = function(type){
	var list = [];

	for (var wnd in this.list){
		wnd = this.list[wnd];

		if( wnd.constructor == type )
			list.push(wnd);
	}

	return list;
};

WndMgr.prototype.getWndByPos = function(pos){
	return this.getList()[pos];
};

WndMgr.prototype.getWndById = function(id, type){
	if( type )
		var list = this.getWndByType(type);
	else
		var list = this.getWndList();

	for (var wnd in list) {
		wnd = list[wnd];
		
		if( wnd.id == id )
			return wnd;
	}

	return false;
};

WndMgr.prototype.getFirstWndByType = function(type){
	var list = this.getWndByType(type);

	return list[0]||false;
};

// onlyWnd == true - возвращает количество окон без учета панелей
WndMgr.prototype.isEmpty = function(onlyWnd, excludeList){
	return (onlyWnd ? this.getWndList({excludeList: excludeList}).length : this.getLength()) == 0;
};

//реакция на изменение размеров окна браузера
WndMgr.prototype.getWindowSize = function(){
	return {width: this.$window.width(), height: this.$window.height()};
};

WndMgr.prototype.getPageOffset = function(){
	return {x: window.pageXOffset, y: window.pageYOffset};
};

WndMgr.prototype.scrollTo = function(){
	window.scrollTo.apply(window, arguments);
};

//Действия после того, как окно отображено в первый раз
WndMgr.prototype.onWndFirstShow = function(wnd){
	this.setActiveWnd(wnd);
	
	wnd.onFirstShow();
	
	wnd.playSound(EventSnd.events.sysWndOpen);
};

 //убираем фокус со всех добавляемых окон
WndMgr.prototype.blur = function(){
	this.$body.find(':focus').blur();
};

WndMgr.prototype.getWndClassesByHash = function(hash){
	return WndMgr.registredWnd[hash]||[];
};

/*тип, идентификатор окна*/
WndMgr.prototype.addWnd = function(type, id, data){
    if( this.abortAddWnd(type, id, data) )
        return false;
    
    type = this.prepareWndType(type, id, data);
	
	data = this.prepareWndData(type, id, data);
	
	if( !data )
		return false;
	
	var wnd = this.prepareWndToAdd(this.createWnd(type, id, data));
	
	return wnd;
};

    WndMgr.prototype.abortAddWnd = function(type, id, data){
        return !type;
    };
    
    WndMgr.prototype.prepareWndType = function(type, id, data){
        if( type.prepareType )
            type = type.prepareType(type, id, data)||type;
        
        return type;
    };
    
    WndMgr.prototype.prepareWndData = function(type, id, data){
        return type.prepareData ? type.prepareData(id, data) : {};
    };

WndMgr.prototype.createWnd = function(type, id, data){
	return new type(id, data);
};

WndMgr.prototype.prepareWndToAdd = function(wnd){
    if( !wnd )
        return false;
    
	var list = this.getList(wnd);
	
	if( !wnd.options.noBlur )
		this.blur();
	
	if( !wnd.options.inactive )
		this.deactivateActiveWnd(list);
	
	// Ищем идентичные окна. Если есть, новое окно не создаём, а выделяем существующее
	var wndIdent = wnd.getIdentWnd();
	
	if( wndIdent ){
		this.setActiveWnd(wndIdent, list);
		
		wnd = wndIdent;
		
		wnd.onIdentShow();
	} 
	else{
		//удаляем конфликтующие окна
		this.closeWndList(wnd.getConflictWnd());
		
		wnd.appendToList();
		
		wnd.show();//окно всегда показываем сразу же после создания
	}
	
	return wnd;
};

WndMgr.prototype.insertWnd = function(pos, type, id, data){
    if( this.abortInsertWnd(pos, type, id, data) )
        return false;
    
    type = this.prepareWndType(type, id, data);
	
	data = this.prepareWndData(type, id, data);
	
	if( !data )
		return false;
	
	var wnd = this.prepareWndToInsert(pos, this.createWnd(type, id, data));
	
	return wnd;
};
    
    WndMgr.prototype.abortInsertWnd = function(pos, type, id, data){
        return !type;
    };
    
    WndMgr.prototype.prepareWndToInsert = function(pos, wnd){
        if( !wnd )
            return false;

        var wndIdent = wnd.getIdentWnd();

        if( wndIdent ){
            wnd = wndIdent;

            wnd.onIdentShow();
        } 
        else{
            this.closeWndList(wnd.getConflictWnd());
            
            wnd.insertToList(pos);
            
            wnd.ignoreFirstDraw = true;
            
            wnd.show();
            
            this.updateZ(this.getList(wnd));
            
            this.trySetHash();
        }

        return wnd;
    };

WndMgr.prototype.addContentWnd = function(type, contOrTmpl, options){
	var wnd = new type(contOrTmpl, options);
	
	this.deactivateActiveWnd(this.getList(wnd));
	
	wnd.appendToList();
	
	wnd.show();
	
	return wnd;
};

WndMgr.prototype.addPopupWnd = function(type, contOrTmpl, options){
	var wnd = new type(contOrTmpl, options);
	
	this.blur();
	
	this.deactivateActiveWnd(this.getList(wnd));
	
	wnd.appendToList();
	
	wnd.show();
	
	return wnd;
};


WndMgr.prototype.addSimple = function(contOrTmpl, options){
	var wnd = new SimpleWnd(contOrTmpl, options);
	
	return this.prepareWndToAdd(wnd);
};

WndMgr.prototype.addModal = function(contOrTmpl, options){
	return this.addContentWnd(ModalWnd, contOrTmpl, options);
};

WndMgr.prototype.addSmoothModal = function(contOrTmpl, options){
	return this.addContentWnd(SmoothModalWnd, contOrTmpl, options);
};

WndMgr.prototype.addAlert = function(contOrTmpl, options){
	return this.addPopupWnd(AlertWnd, contOrTmpl, options);
};

WndMgr.prototype.addConfirm = function(contOrTmpl, options){
	return this.addPopupWnd(ConfirmWnd, contOrTmpl, options);
};

WndMgr.prototype.addTextEdit = function(contOrTmpl, options){
	return this.addContentWnd(TextEditWnd, contOrTmpl, options);
};

WndMgr.prototype.addSelect = function(list, options){
	if( !list )
		return false;
	
	var wnd = new SelectWnd(list, options);
	
	this.deactivateActiveWnd(this.getList(wnd));
	
	wnd.appendToList();
	
	wnd.show();
	
	return wnd;
};

WndMgr.prototype.addTooltip = function(cont, pos, posSqr, dir, area, offset){
	var wnd = wndMgr.addWnd(TooltipWnd, cont);
	
	if( wnd )
		wnd.moveOn(pos, posSqr, dir, area, offset);
	
	return wnd;
};


WndMgr.prototype.addInterface = function(interface){
	this.interfaces[interface.getName()] = interface;
};

WndMgr.prototype.getInterface = function(){
	return this.interface;
};

WndMgr.prototype.showInterface = function(ifName, ifId){
	if( this.interface )
		this.interface.close();
	
	this.interface = this.interfaces[ifName];
	this.interface.setId(ifId);
	this.interface.show();
	
	tooltipMgr.hide();
};

WndMgr.prototype.tryShowInterface = function(ifName, ifId){
	var interface = this.interfaces[ifName];
	
	if( interface.canDisplay() )
		this.showInterface(ifName, ifId);
};

WndMgr.prototype.toggleInterface = function(){
	if( this.interface )
		this.interface.toggleInterface();
};


WndMgr.prototype.show = function(){
	if( this.interface )
		this.interface.show();
};

WndMgr.prototype.esc = function(){
	if( this.interface )
		this.interface.esc();
};

WndMgr.prototype.getTownInf = function(){
	return this.interfaces.town;
};

WndMgr.prototype.getMapInf = function(){
	return this.interfaces.map;
};

WndMgr.prototype.doInf = function(commands, args){
	if( !this.interface )
		return;
	
	var context = this.interface;
	
	commands = commands.split('.');
	
	for(var command in commands){
		command = context[commands[command]];
		
		if( !command )
			return;
		
		if( typeof(command) == 'function' )
			break;
		
		context = command;
	}
	
	return command.apply(context, args);
};


wndMgr = new WndMgr();