var ChatMgr = function(){};

ChatMgr.prototype.init = function(){
	this.logChannel = false;//канал по которому в данный момент идёт обработка лога, такой канал всегда только один
	
	this.period = 86400;//период на который собирается лог
	
	this.access = [];
	
	this.account = wofh.account.isAdmin() ? new Account(Account.admin) : wofh.account;
	
	this.initChannels();
	
	//подключаем обработку сообщений чата
	notifMgr.addListener(Notif.ids.wsChatMessage, 'chat', function(e){
		chatMgr.processMessage(e);
	});
	
	//и только после входа на основной канал мы запрашиваем информацию о подключении к каналам. Почему так? Ктож знает?
	notifMgr.addListener(Notif.ids.chatChannelReady, 'chat', function(channel){
		if( channel.type == 1 )
			chatMgr.reqAccess();
	});
	
	// Отлавливае вступление и исключение из страны
	notifMgr.addListener(Notif.ids.countryAccounts, 'chat', function(){
		if( !chatMgr.channelCountry || !wofh.country )
			return;
		
		var shortList = chatMgr.channelCountry.users||{},
			shortListSize = utils.sizeOf(shortList);
		
		if( !shortListSize )
			return;
		
		var longList = wofh.country.accounts,
			longListSize = utils.sizeOf(longList),
			action = '+';
		
		if( shortListSize == longListSize )
			return;
		
		if( shortListSize > longListSize ){
			var tmpList = shortList;
			
			shortList = longList;
			longList = tmpList;
			
			action = '-';
		}
		
		for(var account in longList){
			if( shortList[account] === undefined ){
				account = longList[account]||wofh.world.getAccount(account);
				
				break;
			}
		}
		
		var body = ChatMgr.commandGet.channelAddUser;
		
		body += chatMgr.channelCountry.name;
		body += '>' + timeMgr.getNow();
		body += '>' + account.id;
		body += '>' + account.name;
		body += '>' + wofh.country.id;
		body += '>' + utils.escapeHtml(wofh.country.name);
		body += '>' + action;
		
		chatMgr.processMessage(body);
	});
	
	return this;
};

ChatMgr.prototype.reqAccess = function(){
	var cmd = ChatMgr.commandSend.getAccess;
	
	this.send(cmd);
};

ChatMgr.prototype.initChannels = function(){
	//системные каналы
	this.channels = [];
	
	var channel = new ChatChannel({
		title: 'Мир',
		name: wofh.account.chat.channel,
		key: wofh.account.chat.key,
		type: cnst.chatChannelTypes.main,
		status: wofh.account.chat.status,
		autoLoad: true
	});
	this.channelWorld = channel;
	this.channels.push(channel);
	
	this.addCountryChannel();
	
	//загружаем сохраненные каналы из локального хранилища
	this.storedCopy = servBuffer.serv.chat.channels||{};
	
	var enabled;
	
	for(var channel in this.storedCopy) {
		// Костылек подчищающий каналы некорректной длины. Убрать через месяц-два 09.08.2018
		if( channel.length < lib.chat.minchannelname || channel.length > lib.chat.maxchannelname ){
			delete servBuffer.temp.chat.channels[channel];
			
			var channelsCleaned = true;
			
			continue;
		}
		
		enabled = this.storedCopy[channel];
		
		channel = new ChatChannel({name: channel, autoLoad: true});
		
		if( !enabled )
			channel.toggleDisable(true);
		
		this.channels.push(channel);
	}
	
	if( channelsCleaned )
		servBuffer.apply();
	
	this.checkComplexChannel();
};

ChatMgr.prototype.addCountryChannel = function(){
	if( !wofh.country )
		return;
	
	var channel = new ChatChannel({
		title: snip.countryFlag(wofh.country, {flag: 'normal'})+' '+wofh.country.name,
		name: wofh.account.chat.country.channel,
		key: wofh.account.chat.country.key,
		type: cnst.chatChannelTypes.country,
		color: [95, 246, 66],
		status: wofh.account.chat.country.status,
		autoLoad: true
	});
	
	this.channelCountry = channel;

	for( var i = 0; i < this.channels.length; i++ ){
		// Вставляем канал страны всегда после главного
		if( this.channels[i].type == cnst.chatChannelTypes.main ){
			this.channels.splice(++i, 0, channel);
			
			break;
		}
	}
};

ChatMgr.prototype.delCountryChannel = function(){
	if ( this.channelCountry ){
		for( var i = 0; i < this.channels.length; i++ ){
			if( this.channels[i].type == cnst.chatChannelTypes.country ){
				this.channels.splice(i, 1);
				
				delete this.channelCountry;
				
				break;
			}
		}
	}
};


ChatMgr.prototype.loadMessages = function(channel){
	this.logChannel = channel;//канал по которому в настоящий момент отправлен запрос на получение логов
	
	var param = '';
	
	if( channel.time )
		param = channel.time - this.period;
	
	this.execChannelCommand(ChatMgr.commandSend.log, channel.name, [param]);
};


// обработка входящего сообщения
ChatMgr.prototype.processMessage = function(data) {
	var command = data[0];
	var body = data.substring(1);
	
	switch( command ){
		case ChatMgr.commandGet.message://сообщение
			var body = body.split('>'),
				channel = this.getChannel(body[0]);
			
			if(!channel) return;
			
			var item = this.parseMessage(channel, command, body.splice(1));
			
			notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
			
			break;
		case ChatMgr.commandGet.channelReady://окончание загрузки канала?
			var channel = this.getChannel(body);
			
			if( !channel ) return;
			
			channel.ready = true;
			
			if( !channel.autoLoad ){
				//только если зашли сами, не при загрузке
				var item = this.parseMessage(channel, ChatMgr.commandGet.enter, body);
				
				notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
			}

			notifMgr.runEvent(Notif.ids.chatChannelReady, channel);
			
			break;
		case ChatMgr.commandGet.log://лог
			if( !this.logChannel )
				return;
			
			var channel = this.logChannel;
			
			this.logChannel = false;
			
			if( !body.length ){
				channel.finish = true;//сообщений нет, из канала выкачали всё, что есть
				
				break;
			}

			var time = body.substring(0, body.indexOf('>'));
			var list = body.substring(body.indexOf('>') + 1).split('\n');
			
			channel.time = time;

			for (var i = list.length-2; i >=0; i--) {
				var type = list[i][0];
				var body = list[i].substring(1).split('>');
				
				this.parseMessage(channel, type, body);
			}
			
			notifMgr.runEvent(Notif.ids.chatChannelLog, channel);
			
			break;
		case ChatMgr.commandGet.deleteMessage://удаление сообщения
			body = body.split('>');
			
			var channelName = body[0];
			var time = body[1];
			
			channel = this.getChannel(channelName);
			
			channel.removeMessage(time);
			
			notifMgr.runEvent(Notif.ids.chatMessageDel, time);
			break;
		case ChatMgr.commandGet.channelInfo:
			body = JSON.parse(body);
			
			var channel = this.getChannel(body.name);

			if( !channel ) 
				return;
			
			if( channel.type == cnst.chatChannelTypes.country ){
				reqMgr.getCountry(channel.countryId, function(resp){
					if( resp && resp.country && resp.country[channel.countryId] ){
						var accounts = resp.country[channel.countryId].accounts;
						
						body.users = [];
						
						for(var account in accounts){
							account = accounts[account];
							
							body.users.push([account.id, account.name]);
						}
					}
					
					this.prepareChannelInfo(body, channel);
				}.bind(this), {full: true});
			}
			else
				this.prepareChannelInfo(body, channel);
			
			break;
		case ChatMgr.commandGet.channelInfo2:
			body = JSON.parse(body);
		   
			var channel = this.getChannel(body.name);

			if (!channel) 
				return;
			
			this.parseChannelInfo(channel, body);
			
			channel.myStatus = ChatMgr.userStatus.excluded;
			
			this.parseMessage(channel, command, body);
			
			channel.ready = true;
			
			notifMgr.runEvent(Notif.ids.chatChannelReady, channel);
			
			notifMgr.runEvent(Notif.ids.chatChannelLog, channel);
			
			notifMgr.runEvent(Notif.ids.chatChannelInfo);
			
			break;
		case ChatMgr.commandGet.channelAddUser:
			body = body.split('>');
			
			var channelName = body[0];
			var time = body[1];
			var accId = body[2];
			var accName = body[3];
//			var moderId = body[4];
//			var moderName = body[5];
			var action = body[6] == '+';
			
			var channel = this.getChannel(channelName);
			
			if (!channel) return;
			
			var acc = new Account([accId, accName]);
			
			wofh.world.addElem(acc);
			
			if( channel.isReady() ) {
				channel.colorifyUser(acc);
				
				if( action )
					channel.addUser(acc);
				else
					channel.delUser(acc.id);
				
				notifMgr.runEvent(Notif.ids.chatChannelInfo, channel);
			}

			var item = this.parseMessage(channel, command, body.splice(1));
			
			notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
			
			break;
		case ChatMgr.commandGet.channelAddModer:
			body = body.split('>');

			var channelName = body[0];
			var time = body[1];
			var accId = body[2];
			var accName = body[3];
			var action = body[4] == '+';

			var channel = this.getChannel(channelName);
			
			if( !channel ) return;

			if( channel.isReady() ){
				channel.switchModerator(accId, action);
				
				notifMgr.runEvent(Notif.ids.chatChannelInfo, channel);   
			}

			var item = this.parseMessage(channel, command, body.splice(1));

			notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
			
			break;
		case ChatMgr.commandGet.channelAddAdmin:
			body = body.split('>');

			var channelName = body[0];
			var time = body[1];
			var accIdOld = body[2];
			var accNameOld = body[3];
			var accIdNew = body[4];
			var accNameNew = body[5];

			var channel = this.getChannel(channelName);
			
			if (!channel) return;

			if (channel.isReady()) {
				channel.switchAdmin(accIdNew);
				
				notifMgr.runEvent(Notif.ids.chatChannelInfo, channel);   
			}

			var item = this.parseMessage(channel, command, body.splice(1));

			notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
			
			break;
		case ChatMgr.commandGet.access:
			body = JSON.parse(body);
			
			this.access = body.channels.access;
			
			notifMgr.runEvent(Notif.ids.chatAccess);
			
			break;
		case ChatMgr.commandGet.inviteNotif:
			body = body.split('>');
			
			var channelName = body[0];
			var action = body[1] == '+';

			if (action){
				var channel = this.getChannel(channelName);
				
				if( channel ){
					if( channel.myStatus == ChatMgr.userStatus.excluded ){
						var active = channel.active;
						
						this.removeChannel(channel.name);
						
						channel = this.createChannel(channel.name);
						
						channel.active = active;
					}
				}
				else
					this.access.push(channelName);
			} 
			else {
				for(var i in this.access){
					if( this.access[i] == channelName ){
						
						this.access.splice(i, 1);
						
						break;
					}
				}
			}
			
			notifMgr.runEvent(Notif.ids.chatAccess);
			
			break;
	}
};

ChatMgr.prototype.prepareChannelInfo = function(body, channel){
	this.parseChannelInfo(channel, body);
	
	channel.updMyStatus();
	
	notifMgr.runEvent(Notif.ids.chatChannelInfo, channel);
};

ChatMgr.prototype.parseChannelInfo = function(channel, info){
	//приходят параметр админа чата и массивы модераторов и пользователей
	//пользователи - все, включая модератора и админа
	//массив пользователей с "полными" данными, в админе и модераторах лежат только id
	//но не все данные могут быть в user - сервер лажает и не всегда присылает админа
	channel.admin = info.admin;
	channel.moderators = info.moderators||[];
	channel.users = info.users||[];

	BaseItem.prepArray2(channel.users, Account);
	
	wofh.world.addElemList(channel.users);

	//красим пользователей
	channel.colorifyUsers();

	//приводим в порядок списки пользователей
	channel.users = utils.arrToObj(channel.users);

	if (channel.admin){
		//channel.admin = channel.users[channel.admin];
		channel.admin = wofh.world.getAccount(channel.admin).clone();
		channel.colorifyUser(channel.admin);

		delete channel.users[channel.admin.id];
	}

	var moderList = {};
	for (var userPos in channel.moderators){
		var userId = channel.moderators[userPos];
		if( channel.users[userId] ){
			moderList[userId] = channel.users[userId];
			delete channel.users[userId];
		}
	}
	channel.moderators = moderList;
};

ChatMgr.prototype.allChannelsReady = function(){
	for (var channel in this.channels){
		if( !this.channels[channel].ready && !this.channels[channel].complex )
			return false;
	}
	
	return true;
};


ChatMgr.prototype.parseMessage = function(channel, type, body){
	var item = false;
	
	if (type == ChatMgr.commandGet.enter){
		item = {
			time: timeMgr.getNow()+ChatMgr.messTimeOffset,
			syst: 2,
			text: tmplMgr.chat.messages.standart({type: type, channel: channel})
		};
	} else if (type == ChatMgr.commandGet.channelAddUser){
		var action = body[5] == '+';

		var acc = wofh.world.getAccount(body[1]);

		var text = tmplMgr.chat.messages.standart({type: type, action: action, acc: acc, channel: channel});

		item = {
			time: body[0],
			syst: 2,
			text: text
		};
	} else if (type == ChatMgr.commandGet.channelAddModer){
		var action = body[3] == '+';

		var acc = wofh.world.getAccount(body[1]);

		var text = tmplMgr.chat.messages.standart({type: type, action: action, acc: acc, channel: channel});

		item = {
			time: body[0],
			syst: 2,
			text: text,
		};
	} else if (type == ChatMgr.commandGet.channelAddAdmin){
		var acc = wofh.world.getAccount(body[1]);

		var text = tmplMgr.chat.messages.standart({type: type, acc: acc, channel: channel});

		item = {
			time: body[0],
			syst: 2,
			text: text
		};
	} else if (type == ChatMgr.commandGet.noAccess){
		var text = '*** ' + (wofh.account.email || wofh.platform.noemail ? 'Из-за нарушения правил или ввиду многочисленных жалоб других игроков тебе временно недоступна возможность писать в чат.' : 'Установи и подтверди свою электронную почту в настройках и получишь возможность писать в чат.'),
			syst = 3;
		
		if( body ){
			text = tmplMgr.chat.messages.standart({type: type, channel: channel});
			
			syst = body.syst||syst;
		}
		
		item = {
			time: timeMgr.getNow(),
			syst: syst,
			text: text
		};
	} else if (type == ChatMgr.commandGet.message){
		var time = +body[0];
		
		if(channel.getMessageByTime(time)) return;

		if( body[1] ) {
			if (type == ChatMgr.commandGet.message){
				//обычное сообщение
				item = {
					time: time,
					account: {
						id: +body[1],
						name: body[2],
					},
					text: body[3]
				};
			} else if (type == ChatMgr.commandGet.ban){
				//бан - приходит с логом
				item = {
					time: time,
					syst: 2,
					text: '***&nbsp;У игрока ' +body[1]+ ' заблокирована возможность писать на канале на ' + 5 + ' час.',
				};
			}
		} else {
			//снова бан - приходит с последними сообщениями
			item = {
				time: time,
				syst: 2,
				text: '***&nbsp;У игрока ' +body[3]+ ' заблокирована возможность писать на канале на ' +body[4]+ ' час.'
			};
		}
	} else if( type == ChatMgr.commandGet.channelInfo2 ){
		item = {
			time: timeMgr.getNow(),
			syst: 2,
			text: tmplMgr.chat.messages.standart({type: type, channel: channel})
		};
	}

	if( item ){
		item.channel = channel;
		
		channel.addMessage(item);   
	}
	
	return item;
};

//проверяем, нужно ли создавать комплексный канал
ChatMgr.prototype.checkComplexChannel = function() {
	var have = this.getChannel('');

	if( !have && this.channels.length >= 2 ){
		var channel = new ChatChannel({
			title: 'Всё',
			complex: true,
			type: cnst.chatChannelTypes.all,
			name: ''
		});
		this.channelAll = channel;
		
		this.channels = [channel].concat(this.channels); 
	}
};

//возвращает канал по имени
ChatMgr.prototype.getChannel = function(name){
	name = utils.unescapeHtml(name.toLowerCase());
	
	for (var channel in this.channels) {
		channel = this.channels[channel];
		
		if (channel.name.toLowerCase() == name) 
			return channel;
	}
	
	return false;
};

ChatMgr.prototype.openChannels = function(ignoreReady){
	for (var channel in this.channels){
		channel = this.channels[channel];

		if( !channel.ready || ignoreReady )
			this.openChannel(channel);
	}
};

// открытие канала
ChatMgr.prototype.openChannel = function(channel) {
	if( channel.complex )
		return;
	
	channel.ready = false;
	
	channel.unread = 0;
	
	var acc = wofh.account.isAdmin() ? Account.admin : wofh.account;
	
	var req = {};
	
	req.aa = acc.id;
	req.n = encodeURIComponent(acc.name);
	req.c = encodeURIComponent(channel.name);
	req.s = channel.status;
	
	if( channel.key )
		req.k = channel.key;
	
	this.send(utils.objToUrl(req));
};

ChatMgr.prototype.execChannelCommand = function(command, channelName, params) {
	params = params||[];
	
	channelName = utils.escapeHtmlChat(channelName||'');
	
	this.send(command + channelName + (params.length ? '>' + params.join('>') : ''));
};

// отправка команды
ChatMgr.prototype.send = function(cmd) {
	if( webSocketMgr.isReady() )
		webSocketMgr.sendChat(cmd);
};


ChatMgr.prototype.createChannel = function(name) {
	if( !utils.checkLimits(name, lib.chat.minchannelname, lib.chat.maxchannelname) ) 
		return false;
	
	var channel = new ChatChannel({name: name});
	
	this.channels.push(channel);
	
	this.checkComplexChannel();
	
	this.storedCopy[name] = 1;
	
	servBuffer.temp.chat.channels = this.storedCopy;
	
	servBuffer.apply();
	
	this.openChannel(channel);
	
	return channel;
};

ChatMgr.prototype.delChannel = function(name) {
	var channel = chatMgr.getChannel(name);
	
	if( !channel )
		return;
	
	this.checkComplexChannel();
	
	delete this.storedCopy[name];
	
	servBuffer.temp.chat.channels = this.storedCopy;
	servBuffer.apply();
	
	// Не удаляем канал из списка, если игрок - админ (т.к. возможен повторный вход на канал)
	// Делается так, потому что админ не может использовать команду выхода (n) с канала, т.к. канал "оварварится".
	// Заново получить информецию о канале можно только использовав команду выхода (n)
	if( !channel.isAdminQuit() )
		this.removeChannel(name);
};

ChatMgr.prototype.disableChannel = function(name){
	var channel = chatMgr.getChannel(name);
	
	if( !channel )
		return;
	
	channel.toggleDisable(true);
	
	this.storedCopy[name] = 0;
	
	servBuffer.temp.chat.channels = this.storedCopy;
	
	servBuffer.apply();
};

ChatMgr.prototype.enableChannel = function(name){
	var channel = chatMgr.getChannel(name);
	
	if( !channel )
		return;
	
	channel.toggleDisable(false);
	
	this.storedCopy[name] = 1;
	
	servBuffer.temp.chat.channels = this.storedCopy;
	
	servBuffer.apply();
};

ChatMgr.prototype.removeChannel = function(name){
	for (var i = 0; i < this.channels.length; i++) {
		if ( this.channels[i].name == name ) {
			this.channels.splice(i, 1);
		}
	}
};

ChatMgr.prototype.addAccount = function(channel, accId, accName, key) {
	this.execChannelCommand(ChatMgr.commandSend.addAcc, channel.name, [accId, accName, key]);
};

ChatMgr.prototype.delAccount = function(channel, accId) {
	this.execChannelCommand(ChatMgr.commandSend.delAcc, channel.name, [accId]);
};

ChatMgr.prototype.addModerator = function(channel, accId) {
	this.execChannelCommand(ChatMgr.commandSend.addModer, channel.name, [accId]);
};

ChatMgr.prototype.delModerator = function(channel, accId) {
	this.execChannelCommand(ChatMgr.commandSend.delModer, channel.name, [accId]);
};

ChatMgr.prototype.addAdmin = function(channel, accId) {
	this.execChannelCommand(ChatMgr.commandSend.addAdm, channel.name, [accId]);
};

ChatMgr.prototype.exitChannel = function(channelName) {
	this.execChannelCommand(ChatMgr.commandSend.exit, channelName);
	
	this.delInvite(channelName);
};

//список приглашений
ChatMgr.prototype.getInvites = function(){
	var list = [];
	//из списка доступа исключаем уже подключенные каналы
	for (var channel in this.access) {
		var channelName = this.access[channel];
		
		var channel = this.getChannel(channelName);
		
		if( !channel )
			list.push(channelName);
	}
	
	return list;
};

ChatMgr.prototype.delInvite = function(channelName) {
	channelName = utils.escapeHtmlChat(channelName);
	
	for (var inviteI in this.access){
		if( this.access[inviteI] == channelName ){
			this.access.splice(inviteI, 1);
			
			return;
		}
	}
};

ChatMgr.prototype.tryLoadMessages = function(channel, chat){
	var chat = this.getChat(chat),
		activeTab = this.getChannel(chat.activeTab);
	
	if( activeTab.complex ){
		//проверка всех каналов
		activeTab.time = activeTab.time||0;
		
		//ищем те, у которых меньше всего истории подгружено
		var minTime = 0;
		for(var channel2 in this.channels) {
			channel2 = this.channels[channel2];
			if (channel2.complex == true || channel2.finish == true || channel2.ready != true) continue;
			
			if (typeof(channel2.time) == 'undefined') {
				minTime = 0;
				
				break;
			}

			minTime = Math.max(minTime, channel2.time);
		}
		
		if( activeTab.time == 0 && minTime != 0 ){
			activeTab.time = minTime;
			
			if(!chat.messages.needPrepend()){
				return;
			}
		}
		
		if( activeTab.time - minTime >= this.period && chat.messages.needPrepend() ){
			activeTab.time = minTime;
		}
		
		if( activeTab.time - minTime < this.period ){
			//ищем первый попавшийся минимальный канал
			for (var channel2 in this.channels){ 
				channel2 = this.channels[channel2];
				
				if (!channel2.complex && !this.logChannel && !channel2.finish && channel2.ready && channel2.myStatus != ChatMgr.userStatus.excluded) {
					if ((activeTab.time == 0 && typeof(channel2.time)=='undefined') || (activeTab.time != 0 && activeTab.time - channel2.time < this.period)) {
						this.loadMessages(channel2);
						return;
					}
				}
			}
		}
	} 
	else{
		var activeTabReady = chat.isActiveTabReady(),
			needPrepend = chat.messages.needPrepend(),
			channelsReady = this.allChannelsReady();
		
		if( !channel.finish && !this.logChannel && activeTabReady && needPrepend && channelsReady && channel.myStatus != ChatMgr.userStatus.excluded ){
			chat.messages.scrolledToTop = false;
			
			this.loadMessages(channel);
		}
	}
};

ChatMgr.prototype.getChat = function(){
	return wndMgr.interface.children.chat;
};

ChatMgr.commandGet = {
	time: 'time',//разница дат. ГЕНЕРИРУЕТСЯ НА КЛИЕНТЕ!
	ban: 'ban',//бан. ГЕНЕРИРУЕТСЯ НА КЛИЕНТЕ!
	noAccess: 'noAcc',//нет доступа. ГЕНЕРИРУЕТСЯ НА КЛИЕНТЕ!
	enter: 'enter',//вход на канал. ГЕНЕРИРУЕТСЯ НА КЛИЕНТЕ!

	message: 'm',//новое сообщение
	channelReady: 'r',//окончание загрузки канала (канал за каким то хером сразу при открытии начинает пересылать n сообщений, затем приходит эта комманда, по ней мы узнаем, что спам-атака закончилась. Не спрашивайте, кто эти фикалии мамонта убирать не хочет)
	log: 'l',//лог - история за ~день - legacy!
	deleteMessage: 'e',//удаление сообщения

	channelInfo: 'i',//информация о канале
	channelAddUser: 'u',//добавление участника
	channelAddModer: 'a',//добавление модератора

	channelInfo2: 'd',//тоже информация о канале, но только если игрок зашёл на канал, но на канале не зарегистрирован. Зачем такая рукожопость - не ясно

	access: 'q',//информация о доступе на каналы
	channelAddAdmin: 'y',//смена админа

	inviteNotif: 'w'//уведомление о изменении привелегий на канале
};

ChatMgr.commandSend = {
	message: 'b',//новое сообщение
	deleteMessage: 'h',//удаление сообщения
	ban: 'f',//голос за бан игрока
	log: 'g',//лог - история за ~день
	
	addAcc: 'i',//добавить пользователя
	delAcc: 'j',//исключить пользователя
	addModer: 'k',//добавить права модератора
	delModer: 'l',//убрать права модератора
	
	getAccess: 'm',//глобальный запрос о доступе на каналы
	
	exit: 'n',//выход из канала
	addAdm: 'o',//передать должность админа
};

ChatMgr.userStatus = {
	excluded: -1,
	user: 0,
	moderator: 1,
	admin: 2,
}

ChatMgr.messTimeOffset = 5;


ChatChannel = function(data){
	this.name = data.name||'';
	this.title = data.title||('#'+this.name);
	this.key = data.key;
	this.type = data.type||cnst.chatChannelTypes.other;
	this.status = data.status||wofh.account.chat.status;
	this.complex = data.complex||false;//метаканал собирающий в себе остальные каналы
	this.autoLoad = data.autoLoad||false;//флаг, что канал загружается автоматически
	if (data.color)
		this.color = data.color;
	else
		this.color = utils.calcColor(data.name);
	
	this.mess = [];
	
	if( this.type == cnst.chatChannelTypes.country )
		this.countryId = wofh.country.id;
};


ChatChannel.prototype.addMessage = function(message){
	if( this.getMessagePosByTime(message.time) === false )
		this.mess.push(message);
};

ChatChannel.prototype.removeMessage = function(time){
	var messPos = this.getMessagePosByTime(time);
	
	this.mess.splice(messPos, 1);
};

ChatChannel.prototype.getMessagePosByTime = function(time){
	for (var messPos in this.mess) {
		var mess = this.mess[messPos];
		
		if( mess.time == time )
			return messPos;
	}
	
	return false;
};

ChatChannel.prototype.getMessageByTime = function(time, retPos){
	var pos = this.getMessagePosByTime();
	if(pos === false) return false;
	return this.mess[pos];
}

ChatChannel.prototype.isReady = function() {
	return this.checkProperty(function(channel){return channel.ready});
}

ChatChannel.prototype.checkProperty = function(check) {
	if( this.complex ){
		for (var channel in chatMgr.channels){
			channel = chatMgr.channels[channel];
			
			if( !channel.complex && !check(channel) )
				return false;
		}
		return true;
	} 
	else
		return check(this);
};


ChatChannel.prototype.getMessages = function(noSort){
	if( this.complex ){
		//собираем все сообщения
		var mess = [];
		
		for (var channel in chatMgr.channels) {
			var channel = chatMgr.channels[channel];
			if (channel.complex) continue;
			
			mess = mess.concat(channel.mess);
		}
	}
	else
		var mess = this.mess;
	
	if( !noSort )
		mess.sort(function(a, b){return a.time - b.time;});
	
	return mess;
};

ChatChannel.prototype.getFirstMessage = function(){
	var mess = this.getMessages();
	
	return mess[0];
};

ChatChannel.prototype.getLastMessage = function(opt){
	opt = opt||{};
	
	var mess = this.getMessages();
	
	if( opt.timeOnly ){
		for(var i = mess.length-1; i >= 0; i--){
			if( mess[i].time )
				return mess[i];
		}
	}
	else
		return mess[mess.length - 1];
};

ChatChannel.prototype.getLastMessageTime = function(){
	var mes = this.getLastMessage({timeOnly:true});
	
	if( mes )
		return mes.time;
};

ChatChannel.prototype.searchMessages = function(text){
	var messages = this.getMessages();
	var find = [];
	for (var message in messages){
		message = messages[message];
		if (message.text.toLowerCase().search(text) != -1) {
			find.push(message);
		}
	}
	return find;
};

ChatChannel.prototype.addUser = function(acc){
	this.users[acc.id] = acc;
	
	this.colorifyUser(acc);
	
	this.updMyStatus();
};

ChatChannel.prototype.delUser = function(accId){
	delete this.moderators[accId];
	
	delete this.users[accId];
	
	this.updMyStatus();
};

ChatChannel.prototype.switchModerator = function(accId, toggle){
	if( toggle ){
		var acc = this.users[accId];
		if( acc ){
			delete this.users[accId];
			
			this.moderators[accId] = acc;  
		} 
	}
	else {
		var acc = this.moderators[accId];
		if( acc ){
			delete this.moderators[accId];
			
			this.users[accId] = acc;
		}
	}
	
	this.updMyStatus();
};

ChatChannel.prototype.switchAdmin = function(accIdNew){
	var newAdmin = this.moderators[accIdNew];
	
	if( !newAdmin )
		return;
	
	var oldAdmin = this.admin;

	this.admin = newAdmin;

	delete this.moderators[newAdmin.id];

	this.moderators[oldAdmin.id] = oldAdmin;

	this.updMyStatus();
};

ChatChannel.prototype.colorifyUsers = function(){
	for (var user in this.users){
		user = this.users[user];
		
		this.colorifyUser(user);
	}
};

ChatChannel.prototype.colorifyUser = function(user){
	user.color = utils.calcColor(user.name);
};

ChatChannel.prototype.updMyStatus = function(){
	this.myStatus = wofh.account.isAdmin() ? ChatMgr.userStatus.admin : this.getUserStatus(wofh.account.id);
};

ChatChannel.prototype.getUserStatus = function(accId){
	if (this.type == 1 || this.complex) return ChatMgr.userStatus.user;

	if (this.admin && this.admin.id == accId) return ChatMgr.userStatus.admin;
	if (this.moderators && this.moderators[accId]) return ChatMgr.userStatus.moderator;
	if (this.users && this.users[accId]) return ChatMgr.userStatus.user;

	return ChatMgr.userStatus.excluded;
};

ChatChannel.prototype.getAccByName = function(accName){
	if (this.admin && this.admin.name == accName){
		return this.admin;
	}
	
	for (var acc in this.moderators){
		if (this.moderators[acc].name == accName){   
			return this.moderators[acc];
		}
	}
	
	for (var acc in this.users){
		if (this.users[acc].name == accName){   
			return this.users[acc];
		}
	}
	
	return false;
};

ChatChannel.prototype.isAdminQuit = function(){
	return this.myStatus == ChatMgr.userStatus.admin;
};

ChatChannel.prototype.canClose = function(){
	if (this.myStatus != ChatMgr.userStatus.admin) return false;
	return utils.sizeOf(this.users) + utils.sizeOf(this.moderators) == 0;
};


ChatChannel.prototype.toggleDisable = function(disable){
	this.disabled = disable;
};