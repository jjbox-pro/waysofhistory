WebSocketMgr = function(){};

WebSocketMgr.prototype.init = function(){
    this.socketInitDataReceived = false;//не обрабатываем сообщения
	
    this.applInitDataReceived = false;//данные инициализированы
    
    this.connect();
	
	return this;
};

WebSocketMgr.prototype.connect = function(){
	if( !window.WebSocket ){
        wndMgr.$body.html(tmplMgr.preload.noWebSocket());
		
        return;
    }
	
	if( this.ws )
		this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
	
	try{
		this.ws = new WebSocket('wss://' + lib.main.websocket);
	}
    catch(e){}
	
	var self = this;
	
    this.ws.onopen = function(){
		self.getSocketInitData();
    };
    
    this.ws.onmessage = function(e) {
        var message = e.data;
        
        try{
            message = JSON.parse(message);
        }
        catch(err){
            err._extData = message;
            
            throw(err);
            
            return;
        }
		
        if( this.disconnected || (!appl.isInited() && message.type != WebSocketMgr.msg.initData && message.type != WebSocketMgr.msg.requestResponse) )
			return false;
        
		if( debug.isAdmin() )
			console.log('----> ws ' + WebSocketMgr.getMsgName(message.type), utils.clone(message));
		
        switch( message.type ) {
            case WebSocketMgr.msg.addEvent:
                set.events.add(message.data);
                break;
            case WebSocketMgr.msg.deleteEvent:
                set.events.del(message.data.id, true);
                break;
			case WebSocketMgr.msg.updateEvent:
				set.events.update(message.data);
                break;
			case WebSocketMgr.msg.report:
				set.acc.report(message.data);
                break;
            case WebSocketMgr.msg.addAnnounce:
                set.updateAnnounce(message.data);
                break;
			case WebSocketMgr.msg.newTicket:
                set.support.newTicket(message.data);
                break;
			case WebSocketMgr.msg.newTicketMessage:
                set.support.newTicketMessage(message.data);
                break;
			case WebSocketMgr.msg.deleteTicketMessage:
                set.support.deleteTicketMessage(message.data);
                break;
			case WebSocketMgr.msg.ticketUpdate:
                set.support.ticketUpdate(message.data);
                break;
			case WebSocketMgr.msg.streamUpdate:
                set.town.streamUpdate(message.data);
                break;
			case WebSocketMgr.msg.streamDelete:
                set.town.streamDelete(message.data);
                break;
			case WebSocketMgr.msg.streamOffer:
                set.town.streamOffer(message.data);
                break;
			case WebSocketMgr.msg.streamOfferDelete:
                set.town.streamOfferDelete(message.data);
                break;
			case WebSocketMgr.msg.streamOfferDelete:
                set.town.streamOfferDelete(message.data);
                break;
			case WebSocketMgr.msg.battleGroupDelete:
                set.town.battleGroupDelete(message.data);
                break;
            case WebSocketMgr.msg.chat:
                notifMgr.runEvent(Notif.ids.wsChatMessage, message.data);
                break;
            case WebSocketMgr.msg.accountUpdate:
                set.acc.update(message.data);
                break;
			case WebSocketMgr.msg.assistChange:
				set.acc.assistChange(message.data);
                break;
            case WebSocketMgr.msg.newThread:
            case WebSocketMgr.msg.newMessage:
                reqMgr.convertData(message.data, {});
                if (message.data.writer) {
                    var list = message.data[BaseAccOrCountry.isCountry(message.data.writer)? 'countries': 'accounts']
                    message.data.writer = list[message.data.writer];
                }

                notifMgr.runEvent(Notif.ids.accMessage, message.data);
                //set.message.allRead(false);
                break;
            case WebSocketMgr.msg.battle:
				set.town.battle(message.data);
                break;
            case WebSocketMgr.msg.countryUpdate:
                set.country.update(message.data);
                break;
			case WebSocketMgr.msg.countryNote:
				notifMgr.runEvent(Notif.ids.countryNotes);
                break;
            case WebSocketMgr.msg.initData:
                console.warn('WebSocketMgr.initData', Timer.getNowLoc(1));
                
				message.data.locTime = Timer.getNowLoc(); // Запоминаем текущее локальное время
				
				message.data.syncDelay = message.data.locTime - self.initTime; // Запоминаем задержу между запросом и получением ответа от сервера
				
                //предотвращаем повторный запуск
                if( self.applInitDataReceived )
					return;
				
				self.cancelReconnect();
				
                self.applInitDataReceived = true;
                
                message.data.townsinfo = message.data.towns; // Данные по городам в мире
				message.data.accountsinfo = message.data.accounts; // Данные по аккаунтам в мире
				message.data.countriesinfo = message.data.countries; // Данные по странам в мире
				
                if( message.data.admin ){
                    message.data.account.admin = message.data.admin;
					
					if( message.data.account.coins )
						message.data.account.admin.payments = message.data.account.coins.boughtalltime;
                }
                
				message.data.account.chat = message.data.chat;
				
                //переписываем данные сервера
                message.data.account.status = message.data.status;
				
                message.data.platform = servodata.platform;//данные о платформе
				message.data.linkadd = servodata.linkadd; // Доп. параметр для ссылок перехода
				
                servodata = message.data;
                
				if( appl.isInited() )
					self.onUpdate(servodata);
				else
					self.onInit();
                
                break;
            case WebSocketMgr.msg.townUpdate:
                set.town.update(message.data);
				
                break;
			case WebSocketMgr.msg.requestResponse:
                var data;
				
                if( message.data ){
                    try {
                        data = JSON.parse(message.data);   
                    } catch (err) {
                        console.warn('НЕ УДАЛОСЬ РАСПАРСИТЬ ОТВЕТ');
                        data = {};
                    }   
                }
				else
                    data = {};
                
                reqMgr.respSocket(data, message.id, message.time);
				
                break;
			case WebSocketMgr.msg.battleGroupChange:
				set.town.battleGroupChange(message.data);
                break;
			case WebSocketMgr.msg.barterCreate:
                set.trade.barter.barterCreate(message.data);
                break;
			case WebSocketMgr.msg.barterUpdate:
                set.trade.barter.barterUpdate(message.data);
                break;
			case WebSocketMgr.msg.barterDelete:
                set.trade.barter.barterDelete(message.data);
                break;
			case WebSocketMgr.msg.tradeCreate:
                set.trade.trade.tradeCreate(message.data);
                break;
			case WebSocketMgr.msg.tradeUpdate:
                set.trade.trade.tradeUpdate(message.data);
                break;
			case WebSocketMgr.msg.tradeDelete:
                set.trade.trade.tradeDelete(message.data);
                break;
			case WebSocketMgr.msg.streamMarketOfferCreate:
                set.trade.stream.streamMarketOfferCreate(message.data);
                break;
			case WebSocketMgr.msg.streamMarketOfferUpdate:
                set.trade.stream.streamMarketOfferUpdate(message.data);
                break;
			case WebSocketMgr.msg.streamMarketOfferDelete:
                set.trade.stream.streamMarketOfferDelete(message.data);
                break;
			case WebSocketMgr.msg.tradeAllyUpdate:
                set.trade.ally.tradeAllyUpdate(message.data);
                break;
			case WebSocketMgr.msg.tradeAllyDelete:
                set.trade.ally.tradeAllyDelete(message.data);
                break;	
			case WebSocketMgr.msg.defUpdate:
				set.town.defUpdate(message.data);
                break;
			case WebSocketMgr.msg.fleetUpdate:
				set.town.fleetUpdate(message.data);
                break;
			case WebSocketMgr.msg.invite:
				set.invite(message.data, message.time);
                break;
			case WebSocketMgr.msg.fleetDelete:
				set.town.fleetDelete(message.data);
                break;
			case WebSocketMgr.msg.updateGlobal:
				set.global.update(message.data);
                break;
        }
    };
    
    this.ws.onclose = function(e) {
        console.warn('WebSocketMgr.onclose: ', new Date().getTime(), e);
		
        self.error();
    };
	
    this.ws.onerror = function(e) {
        console.log('WebSocketMgr.onerror: ', e);
    };
};

WebSocketMgr.prototype.getSocketInitData = function(){
	var self = this;
	
	clearTimeout(this.socketInitDataTimeout);
	
	reqMgr.getSocketInitData(function(resp){
		if( self.socketInitDataReceived || self.disconnected )
			return;
		
		clearTimeout(self.socketInitDataTimeout);
		
		self.socketInitDataReceived = true;
		
		var params = {
			com: 0,
			acc: resp.acc,
			status: resp.status,
			key: resp.key,
			password: resp.password,
			init: true
		};

		params = JSON.stringify(params);
		
		self.initTime = Timer.getNowLoc();
		
		self.initParams = params;
		
		self.ws.send(params);
	});
	
	this.socketInitDataTimeout = setTimeout(this.getSocketInitData.bind(this), 15000);
};

WebSocketMgr.prototype.error = function(){
	if( this.socketInitDataReceived )
		this.reconnect();
	else
		this.connect();
};

WebSocketMgr.prototype.close = function(){
	if( this.ws )
		this.ws.close();
};

WebSocketMgr.prototype.reconnect = function(){
	if( this.reconnectTO )
		return;
	
	this.socketInitDataReceived = false;
	
	this.applInitDataReceived = false;
	
	this.connect();
	
	this.reconnectTO = setTimeout(function(){
		clearTimeout(this.socketInitDataTimeout);
		
		this.disconnect();
	}.bind(this), WebSocketMgr.reconnectDelay);
};

WebSocketMgr.prototype.cancelReconnect = function(){
	clearTimeout(this.reconnectTO);
	
	delete this.reconnectTO;
};

WebSocketMgr.prototype.disconnect = function(){
	this.disconnected = true;
	
	if( wofh.account && wofh.account.tryDel ){
		this.reload(0);
		
		return;
	}
	
	var time = WebSocketMgr.disconnectDelay + utils.random(WebSocketMgr.disconnectDelay);
	
	this.showDisconnectAlert(time);
	
	this.reload(time);
};

// Показывает алерт с задержко, т.к. фокс разрывает сокет соединение сразу же после ручной перезагрузки
WebSocketMgr.prototype.showDisconnectAlert = function(time){
	var delay = 2;
	
	time -= delay;
	setTimeout(function(){
		wndMgr.$body.append(snip.socket.disconnect({time:time}));
		
		wndMgr.$body.addClass('-disconnect');
	}, delay * 1000);
};

WebSocketMgr.prototype.send = function(msg){
    if( !this.isReady() )
		return;
	
	this.ws.send(msg);
	
	this.refreshPing();
};

WebSocketMgr.prototype.sendChat = function(msg){
    this.send('{"com":1,"data":"'+msg+'"}');
};

WebSocketMgr.prototype.ping = function(){
    this.send('{"com":5}');
};

WebSocketMgr.prototype.reload = function(time){
    return setTimeout(function(){
		appl.reload();
	}, time * 1000); // обертка в timeout, т.к. ff перехватывает управление при переходе на другую страницу
};

WebSocketMgr.prototype.isReady = function(){
    return this.ws.readyState == WebSocketMgr.status.open;
};

WebSocketMgr.prototype.onInit = function(){
	appl.onComponentsInited();

	notifMgr.runEvent(Notif.ids.wsOpen);
};

WebSocketMgr.prototype.onUpdate = function(data){
	if( !data )
		return;
	
	appl.update(data);
};

WebSocketMgr.prototype.refreshPing = function(){
	clearTimeout(this.toPing);
	
    this.toPing = setTimeout(function(){webSocketMgr.ping();}, 20000);
};


WebSocketMgr.getMsgName = function(code){
	for(var name in WebSocketMgr.msg){
		if( WebSocketMgr.msg[name] == code )
			return name;
	}
	
	return false;
};

WebSocketMgr.status = {
    connecting: 0,
    open: 1,
    closing: 2,
    closed: 3
};

WebSocketMgr.msg = {
    addEvent: 0,
    deleteEvent: 1,
    updateEvent: 2,
    report: 3,
    addAnnounce: 4, // Приходит как на добавление объявления так и на удаление и продление
    ping: 5,
    chat: 6,
    accountUpdate: 8,
    newThread: 9,
    newMessage: 10,
    battle: 11,
    countryUpdate: 12,//обновление страны
    initData: 13,//данные для инициализации игры
    townUpdate: 14,//обновление города
	newTicket: 15,
	newTicketMessage: 16,
	ticketUpdate: 17,
	deleteTicketMessage: 18,
	streamUpdate: 19,
	streamDelete: 20,
	streamOffer: 21,
	streamOfferDelete: 22,
	requestResponse: 23,//ответ на запрос по сокету
	countryNote: 24,
	assistChange: 25,
    battleGroupChange: 26,
	barterCreate: 27,
	barterUpdate: 28,
	barterDelete: 29,
	tradeCreate: 30,
	tradeUpdate: 31,
	tradeDelete: 32,
	streamMarketOfferCreate: 33,
	streamMarketOfferUpdate: 34,
	streamMarketOfferDelete: 35,
	tradeAllyUpdate: 36,
	tradeAllyDelete: 37,
	battleGroupDelete: 38,
	defUpdate: 39,
	fleetUpdate: 40,
    invite: 41,
	fleetDelete: 42,
	updateGlobal: 44
};

WebSocketMgr.disconnectDelay = 40;

WebSocketMgr.reconnectDelay = 5000;