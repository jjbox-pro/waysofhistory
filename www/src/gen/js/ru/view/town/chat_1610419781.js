/**
	Чат
*/

cnst.chatChannelTypes = {
	all: 0, //общий чат, куда стекаются все сообщения со всех каналов
	main: 1, //главный канал - к нему подключены все игроки
	country: 2, // канал страны - если есть страна
	other: 3 //пользовательские каналы
};

cnst.favSmileLimit = 20;

pChat = function(){
	pChat.superclass.constructor.apply(this, arguments);
	
	this.prepareData();
};

utils.extend(pChat, BasePanel);
	
	
	pChat.prototype.calcName = function(){
		return 'chat';
	};
	
	pChat.prototype.calcTmplFolder = function(){
		return tmplMgr.chat;
	};

	pChat.prototype.calcChildren = function(){
		this.children.announce = bChat_announce;
		this.children.channels = bChat_channels;
		this.children.messages = bChat_messages;
		this.children.answer = bChat_answer;
		this.children.smile = bChat_smile;
		this.children.chanInfo = bChat_chanInfo;
		this.children.invites = bChat_invites;
		this.children.btns = bChat_size;
	};
	
	pChat.prototype.addNotif = function(){
		this.notif.show = [{id: Notif.ids.accQuests, params: Quest.ids.bldAltair1}];
		
		this.notif.other[Notif.ids.countryChange] = function(){
			if( wofh.country && chatMgr.channelCountry ){
				// Если страна поменялась, ждем изменения данных страны (wofh.country.id) и изменения данных канала страны (wofh.account.chat.country)
				if( chatMgr.channelCountry.countryId != wofh.country.id && chatMgr.channelCountry.name != wofh.account.chat.country.channel ){
					chatMgr.delCountryChannel();
					
					chatMgr.addCountryChannel();
					
					this.activeTab = this.defTab;
					
					this.onChatReady();
				}
				else if(chatMgr.channelCountry.countryId != wofh.country.id || chatMgr.channelCountry.name != wofh.account.chat.country.channel )
					return;
				else
					chatMgr.channelCountry.title = snip.countryFlag(wofh.country, {flag: 'normal'})+' '+wofh.country.name;
			}
			else if( chatMgr.channelCountry ){
				chatMgr.delCountryChannel();
			}
			else{
				if( !wofh.account.chat.country ) // Если при вступлении в страну данные по каналу страны еще небыли получены
					return;
				
				chatMgr.addCountryChannel();
				
				this.onChatReady();
			}
			
			this.show();
		};
		this.notif.other[Notif.ids.chatStyles] = function(opt){
			opt = opt||{};
			
			this.setStyles();
			
			if( opt.fontSize )
				notifMgr.runEvent(Notif.ids.chatRefreshMsg);
		};
        this.notif.other[Notif.ids.accBonus] = 
		this.notif.other[Notif.ids.chatDisplay] = this.checkDisplay;
	};
	
	pChat.prototype.canDisplay = function(){
		return Ability.chat();
	};
	
	pChat.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.chat-size', function(){
				self.changeSize($(this).data('size'));
			});
			
		this.bindSearchEvent();
	};
	
	pChat.prototype.getTmplData = function(){
		this.size = this.getDefSize();
		
		return {size: this.size};
	};
	
	pChat.prototype.beforeShowChildren = function(){
		this.setStyles();
	};
	
	pChat.prototype.afterDraw = function(){
		this.onChatReady(); // Переименовать функцию!
		
		this.prepareDrag();
		
		this.moveContEnd();
		
		this.checkDisplay();
		
		this.updMessagesSize();
	};
	
	
	pChat.prototype.prepareData = function(){
		//активная вкладка
		this.activeTab = '';
		this.defTab = '';

		this.showInvites = false;//вкладку с инвайтами не показываем

		//загрузка каналов
		this.initChannels();
	};
	
	pChat.prototype.bindSearchEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.chat-searchBtn', function(){
				self.wrp.find('.chat-searchWrp').toggleClass('-hidden');
			})
			.on('click', '.chat-searchSet', function(){
				var val = self.wrp.find('.chat-search').val();
				
				self.search(val.toLowerCase());
			})
			.on('keydown', '.chat-search', function(event){
				if( event.keyCode == 13 ){
					var val = $(this).val();
					
					self.search(val.toLowerCase());	
				}
			});
	};
	
	pChat.prototype.prepareDrag = function(){
		this.cont.draggable({cancel: ".chat-tabs,.chat-messages,.chat-message,.chat-info,.chat-search"});
		
		this.cont.draggable('disable');
	};
	
    pChat.prototype.checkDisplay = function(){
		this.toggleDisplay(!wofh.account.isPremium() || ls.getChatDisplay(true));
	};
    
	pChat.prototype.updMessagesSize = function(){
		//даже после добавления сообщений через нескоторое время размер 
		this.messages.setTimeout(this.messages.goDownEnd, 200);
		this.messages.setTimeout(this.messages.goDownEnd, 500);
		this.messages.setTimeout(this.messages.goDownEnd, 1000);
	};
	
	pChat.prototype.getDefSize = function(){
		return ls.getChatSize() || 'med';
	};
	
	
	pChat.prototype.onChatReady = function(){
		chatMgr.openChannels();
		
		this.selectTab(this.activeTab);
	};
	
	pChat.prototype.resizeTop = function(){
		var sizeWidth = this.wrp.find('.chat-size-wrp').width();
		
		this.wrp.find('.chat-channels').css({'margin-right': sizeWidth+10});
		
		this.children.channels.checkBtns();
	};
	
	pChat.prototype.changeSize = function(size){
		this.size = size;
		
		this.messages.blockScrollEvents();
		
		this.cont.addClass('-state-sizeChanging');
		
		this.cont.attr('data-size', this.size);
		
		if( this.size != 'max' )
			ls.setChatSize(this.size);

		if( device.desktop() )
			this.cont.draggable(this.size == 'max' ? 'enable': 'disable');
		
		this.doResize();
		
		this.setTimeout(this.checkSize, 450);
	};
	
	pChat.prototype.checkSize = function(){
		this.messages.allowScrollEvents();
		
		this.cont.removeClass('-state-sizeChanging');
		
		if( this.size == 'max' || this.size == 'med' )
			notifMgr.runEvent(Notif.ids.chatSize);
		
		this.messages.refreshScrollSize();
		
		wndMgr.doInf('resizeLeft');
	};
	
	pChat.prototype.doResize = function(){
		if( !this.canDisplay() )
			return;
		
		this.answer.updInpPos();
		
		this.startMoveCont(this.calcContPos());
	};
	
	pChat.prototype.setStyles = function(){
		var styles = ls.getChatStyles(tabOptChat.defStyles);
		
		this.cont.find('.chat-styles-wrp').html(tmplMgr.chat.styles({
			bgcolor: styles.bgcolor,
			alpha: styles.alpha,
			fontSize: styles.fontSize
		}));
	};
	
	pChat.prototype.startMoveCont = function(destPos){
		this.move = {
			startTime: timeMgr.getNowMS(),
			startPos: this.cont.position(),
			destPos: destPos,
			topDelay: 0,
			topPeriod: 0.3,
			leftDelay: 0.1,
			leftPeriod: 0.2
		};
		
		this.move.period = Math.max(this.move.topDelay+this.move.topPeriod, this.move.leftDelay+this.move.leftPeriod);
		
		this.cont.css({top: this.move.startPos.top, left: this.move.startPos.left});
		
		this.clearTimeout(this.move.timeoutId);
		
		this.moveCont();
	};
	
	pChat.prototype.moveContEnd = function(){
		if( this.size != 'max' && this.cont )
			this.cont.css(this.calcContPos());
	};
	
//место в котором должен быть чат
	pChat.prototype.calcContPos = function(){
		var left, top;
		
		if (this.size == 'max') {
			left = ($(document).width() - 800) / 2;
			top = 125;
		} 
		else {
			left = debug.isSimplifiedTown()? ($(document).width() - 514) / 2: 0;
			top = appl.getAvailHeight('body') - (this.size == 'min'? 48 : 180);
		}
		
		return {top: top, left: left};
	};
	
	pChat.prototype.moveCont = function(){
		var move = this.move;
		
		var dif = timeMgr.getNowMS() - move.startTime;
		
		if (dif > move.period) {
			dif = move.period;
			
			this.clearTimeout(move.timeoutId);
			
			this.moveContEnd();
		}
		else
			move.timeoutId = this.setTimeout(this.moveCont.bind(this), 16);
		
		var topDif = Math.min(move.topPeriod, Math.max(0, dif - move.topDelay)),
			leftDif = Math.min(move.leftPeriod, Math.max(0, dif - move.leftDelay));
		
		var newTop = topDif / move.topPeriod * (move.destPos.top - move.startPos.top) + move.startPos.top,
			newLeft = leftDif / move.leftPeriod * (move.destPos.left - move.startPos.left) + move.startPos.left;
		
		this.cont.css({top: newTop, left: newLeft});
	};
	
	pChat.prototype.initChannels = function(){
		//выбираем активный
		this.defTab = wofh.account.chat.channel;
		
		this.activeTab = servBuffer.serv.chat.defTab||this.defTab;
		
		if(this.activeTab == false || !chatMgr.getChannel(this.activeTab)){
			this.activeTab = this.defTab;
		}
	};
	
	pChat.prototype.createChannelObject = function(name) {
		return {
			title: name, 
			name: name, 
			mess: [], 
			color: utils.calcColor(name), 
			type: cnst.chatChannelTypes.other, 
			status: wofh.account.chat.status};
	};
	
	pChat.prototype.createChannel = function(name) {
		this.toggleInvites(false);
		
		var channel = chatMgr.getChannel(name);
		
		if( channel ){
			if( channel.disabled ){
				chatMgr.enableChannel(name);
				
				this.children.channels.show();
			} 
			else
				this.channels.cancelNewTab();
			
			this.selectTab(name);
		} 
		else{
			var result = chatMgr.createChannel(name);
			
			this.channels.refresh();
			
			if( result )
				this.selectTab(name);
		}
		
		this.children.btns.show();
	};
	
	pChat.prototype.removeTab = function(name){
		var channel = chatMgr.getChannel(name);
		
		// Не удаляем канал из списка, если игрок - админ (т.к. возможен повторный вход на канал)
		// Делается так, потому что админ не может использовать команду выхода (n) с канала, т.к. канал "оварварится".
		// Заново получить информецию о канале можно только использовав команду выхода (n)
		if( channel.isAdminQuit() )
			chatMgr.disableChannel(name);
		else
			chatMgr.delChannel(name);
		
		this.activeTab = this.defTab;

		this.channels.refresh();
		
		this.selectTab(this.defTab);
		
		this.children.btns.show();
	};
	
	pChat.prototype.selectTab = function(name){
		this.activeTab = name;
		
		this.clearTimeout(this.tabTO);
		
		// Запоминаем вкладку
		this.tabTO = this.setTimeout(function(){
			servBuffer.temp.chat.defTab = name;
			
			servBuffer.apply();
		}, 1500);
		
		//отключаем все вкладки
		for (var channel in chatMgr.channels)
			chatMgr.channels[channel].active = false;
		
		//включаем нужные
		var channel = chatMgr.getChannel(name);
		
		if( channel.complex ){
			for(var channelIn in chatMgr.channels){
				channelIn = chatMgr.channels[channelIn];
				channelIn.active = true;
				channelIn.unread = 0;
				this.channels.setAlert(channelIn);
			}
		} 
		else{
			channel.active = true;
			channel.unread = 0;
			if(this.channels.wrp){
				this.channels.setAlert(channel);
			}
		}

		//проверяем, можно ли показать пользователей
		this.wrp.find('.view-chat').toggleClass('-showUsers', !channel.complex && channel.type != cnst.chatChannelTypes.main);
		
		//обновляем вид
		if( this.channels.wrp )
			this.channels.selectTab();
		
		this.answer.setChannel(channel);
		
		this.children.chanInfo.show();
		
		this.messages.refresh(!channel.getMessages(true).length);
	};
	
	pChat.prototype.toggleInvites = function(toggle){
		this.showInvites = toggle;
		this.children.invites.show();
		this.children.btns.show();
		this.wrp.find('.chat-messages-wrp, .chat-answer-wrp').toggleClass('-hidden', this.showInvites);
	};

	pChat.prototype.getMess = function(){
		var channel = chatMgr.getChannel(this.activeTab);
		
		return channel.getMessages();
	};
	
	
	
	pChat.prototype.getMessageByTime = function(channel, time, retPos){
		for(var messPos in channel.mess){
			var mess = channel.mess[messPos];
			
			if( mess.time == time )
				return retPos? messPos: mess;
		}
		
		return false;
	};

	pChat.prototype.checkActiveTabProperty = function(check){
		var channel = chatMgr.getChannel(this.activeTab);
		
		if( channel.complex ){
			for (var channel in chatMgr.channels){
				channel = chatMgr.channels[channel];
				
				if( !channel.complex && !check(channel) )
					return false;
			}
			
			return true;
		} 
		else
			return check(channel);
	};

	pChat.prototype.isActiveTabReady = function(){
		return this.checkActiveTabProperty(function(channel){return channel.ready;});
	};

	pChat.prototype.isActiveTabFinished = function(){
		return this.checkActiveTabProperty(function(channel){return channel.finished});
	}

	pChat.prototype.sendReply = function(messText) {
		var channel = chatMgr.getChannel(this.activeTab),
			channelName = channel.complex ? wofh.account.chat.channel : this.activeTab,
			mesItem;
		
		if( wofh.account.chat.status == 0 )
			mesItem = chatMgr.parseMessage(channel, ChatMgr.commandGet.noAccess);
		else{
			if( channel.myStatus == ChatMgr.userStatus.excluded )
				mesItem = chatMgr.parseMessage(channel, ChatMgr.commandGet.noAccess, {syst: 2});
			else
				chatMgr.execChannelCommand(ChatMgr.commandSend.message, channelName, [utils.escapeHtmlChatMess(messText)]);
		}
		
		if( channel.active && mesItem )
			this.messages.append(mesItem);
	};

	pChat.prototype.sendRemove = function(mess) {
		chatMgr.execChannelCommand(ChatMgr.commandSend.deleteMessage, mess.channel.name, [mess.time, mess.account.id, mess.account.name, mess.text]);
	};

	pChat.prototype.sendBan = function(mess) {
		chatMgr.execChannelCommand(ChatMgr.commandSend.ban, mess.channel.name, [mess.account.name, mess.account.id]);
		
		this.addBanMessage(mess);
	};

	pChat.prototype.removeMessage = function(channelName, time) {
		var channel = chatMgr.getChannel(channelName);
		var messPos = this.getMessageByTime(channel, time, true);

		channel.mess.splice(messPos, 1);

		this.cont.find('.chat-messages-item[data-id="'+time+'"]').remove();
	};
	
	pChat.prototype.addBanMessage = function(mess) {
		var channel = chatMgr.getChannel(mess.channel.name),
			item = {
				time: timeMgr.getNow(),
				syst: 2,
				text: '***&nbsp;Принят голос за блокировку игрока ' + mess.account.name+ ' на этом канале',
				channel: mess.channel,
			};
		
		channel.addMessage(item);
		
		notifMgr.runEvent(Notif.ids.chatMessageAdd, item);
	};
	
	pChat.prototype.postTo = function(name){
		if( this.size == 'min' )
			return;
		
		this.answer.postTo(name);
	};
	
	pChat.prototype.search = function(text){
		var channel = chatMgr.getChannel(this.activeTab);

		if (this.findText != text) {
			this.findText = text;
			this.find = channel.searchMessages(text);
			this.findI = -1;
		}
		
		this.findNext();
	};
	
	pChat.prototype.findNext = function(){
		this.findI = (this.findI+1) % this.find.length;
		
		var message = this.find[this.findI];
		
		if( !message )
			return;
		
		var $message = this.wrp.find('.chat-messages-item[data-id='+message.time+']');
		
		this.children.messages.showBlock($message.parent());
		
		this.wrp.find('.chat-messages-item').removeClass('-finded');
		$message.addClass('-finded');
		
		this.children.messages.doScroll('scrollTo', $message, {scrollInertia:0, timeout:0});
	};
	
	/*
	pChat.optDef = {
		fontSize: 10,
		fontSize: 10,
		fontSize: 10,
	}
	*/
	
	//объявления

	bChat_announce = function(parent){
		bChat_announce.superclass.constructor.apply(this, arguments);
		
		this.options.resizeParent = false;
	};
		
		utils.extend(bChat_announce, Block);
		
		
		bChat_announce.prototype.calcName = function(){
			return 'announce';
		};
		
		bChat_announce.prototype.calcChildren = function(){
			this.children = {
				message: bChat_announce_message
			};
		};
		
		bChat_announce.prototype.addNotif = function(){
			this.notif.other[Notif.ids.wsAnn] = function(ann){
				if( !ann.prolong && !ann.del )
					this.showNewAnnounce(ann);
			};
		};
		
		bChat_announce.prototype.bindEvent = function(){
			this.runCycle();
		};
		
		
		bChat_announce.prototype.runCycle = function(){
			this.clearTimeout(this.data.annTimeoutId);
			
			this.data.annTimeoutId = this.setTimeout(function(){
				this.showAnnounce();
				
				this.runCycle();
			}, 30000);
		};
		
		bChat_announce.prototype.stopCycle = function(){
			this.clearTimeout(this.data.annTimeoutId);
		};
		
		bChat_announce.prototype.showNewAnnounce = function(ann){
			this.data.newAnn = ann;
			
			this.runCycle();
			
			this.showAnnounce();
		};
		
		bChat_announce.prototype.showAnnounce = function(){
			var self = this;
			
			this.wrp.animate({opacity: 0}, 300, function(){
				self.message.show();
				
				self.wrp.animate({opacity: 1}, 300);
			});
		};
		
		bChat_announce.prototype.getReadyList = function(){
			var annReady = [];
			
			for(var ann in wofh.announces){
				ann = wofh.announces[ann];
				
				if( ann.end > timeMgr.getNow() ){
					if(!wofh.account.isPremium() || ann.start > servBuffer.serv.ann.time)
						annReady.push(ann);
				}
			}
			return annReady;
		};
		
		bChat_announce.prototype.pullNewAnnounce = function(){
			var ann = false;
			
			if( this.data.newAnn ){
				ann = this.data.newAnn;
				
				delete this.data.newAnn;
			}
			
			return ann;
		};
		
		bChat_announce.prototype.getRandom = function(){
			var ann = this.pullNewAnnounce();
			
			if( ann )
				return ann;
			
			var list = this.getReadyList();
			
			if( list.length )
				ann = list[utils.toInt(Math.random() * list.length)];
			else
				this.stopCycle();
			
			return ann;
		};
		
		bChat_announce.prototype.getContHeight = function(){
			var height = 0;
			
			if( this.message.wrp )
				height = this.message.wrp.height();
			
			return height;
		};
		
		
		bChat_announce_message = function(parent){
			bChat_announce_message.superclass.constructor.apply(this, arguments);
		};
			
			utils.extend(bChat_announce_message, Block);
			
			
			bChat_announce_message.prototype.calcName = function(){
				return 'message';
			};
			
			bChat_announce_message.prototype.getTmplData = function(){
				var data = this.parent.getRandom();
				
				return data;
			};
			

	//вкладки с каналами

	bChat_channels = function(parent){
		this.name = 'channels';
		bChat_channels.superclass.constructor.apply(this, arguments);
	};
		
		utils.extend(bChat_channels, Block);
		
		
		bChat_channels.prototype.getData = function(){
			this.data.minTabWidth = 100;
			this.data.maxTabCount = 100;

			this.dataReceived();
		}

		bChat_channels.prototype.getTmplData = function(){
			var list = utils.cloneFS(chatMgr.channels);
			
			if (list.length < this.data.maxTabCount) {
				list.push({'new': true});
			}
			return {list: list};
		};
		
		bChat_channels.prototype.bindEvent = function(){
			var self = this;

			// Используется cont вместо wrp, т.к. при рефреше каждый раз вызывается bindEvent, что добавляет фантомные обработчики, что ведет к многократной обработке событий
			// Либо нужно вызывать bindEvent единажды, либо не цеплять обработчики к wrp или использовать конструкцию off

			//щёлк по табу
			this.wrp
				.on('click', '.chat-tabs-item-link', function(){
					var item = self.getTabParent(this);
					
					if( item.hasClass('-new') ){
						//режим создания вкладки
						item.addClass('-edit');
						item.find('.chat-tabs-new-name').focus();
						self.resizeTabs();
						self.setTabFullVisible(item);
						self.checkNewTab();
					}
					else if( item.hasClass('-invite') ){
						self.parent.toggleInvites(true);
						self.parent.channels.selectTab();
					}
					else{
						//переключение вкладок
						self.parent.toggleInvites(false);
						self.parent.selectTab(item.data('name').toString());
						// При переключении вкладок их ширина может изменяться если установлен флаг 
						self.checkBtns();
					}
				})
				//отмена режима создания новой вкладки
				.on('click', '.chat-microBtn.-type-cancel', function(){
					self.cancelNewTab();

					return false;
				})
				//создание новой вкладки
				.on('submit', '.chat-tabs-new', function(){
					if( !self.canNewTab )
						return false;
					
					var name = $(this).find('.chat-tabs-new-name').val();
					
					name = utils.htmlToText(name);
					
					self.parent.createChannel(name);
					
					return false;
				})
				.on('input', '.chat-tabs-new-name', function(){
					self.checkNewTab();
				})
				//закрытие вкладки
				.on('click', '.chat-tabs-item-del', function(){
					var item = self.getTabParent(this),
						name = item.data('name').toString();

					self.exitChannel(chatMgr.getChannel(name));

					return false;
				})
				//скролл вкладок
				.on('click', '.chat-channels-left', function(){
					self.scroll(-1);
				})
				.on('click', '.chat-channels-right', function(){
					self.scroll(1);
				});
		};

		bChat_channels.prototype.afterDraw = function(){
			this.initLeftTab();
			this.checkBtns();
			this.selectTab();
			this.parent.resizeTop();
		};
		
		bChat_channels.prototype.exitChannel = function(channel){
			var self = this;
			
			if ( channel.isAdminQuit() ){
				if( channel.canClose() ){
					wndMgr.addConfirm('Ты хочешь покинуть <b>'+ channel.name +'</b>?').onAccept = function() {
						self.closeTab(channel.name);
					};
				}
				else
					wndMgr.addAlert('Повелитель не может покинуть чат пока в нем есть участники.');
			} 
			else{
				wndMgr.addConfirm('Ты действительно хочешь закрыть вкладку <b>'+ channel.name +'</b>?').onAccept = function() {
					chatMgr.exitChannel(channel.name);
					
					self.closeTab(channel.name);
				};	
			}
		};
		
		//закрываем вкладку
		bChat_channels.prototype.closeTab = function(name){
			this.parent.removeTab(name);
			this.selectTab(this.defTab);
			this.checkBtns();
		};

		bChat_channels.prototype.getTabParent = function(elem){
			return $(elem).parents('.chat-tabs-item');
		};

		bChat_channels.prototype.cancelNewTab = function(){
			if( this.wrp )
				var item = this.wrp.find('.chat-tabs-item.-new');
			
			item.removeClass('-edit');
			
			item.find('.chat-tabs-new-name').val(this.defTab);
			
			this.resizeTabs();
		};

		bChat_channels.prototype.refresh = function(){
			var leftTabName = this.leftTab.data('name');

			this.show();

			this.leftTab = this.getTabEl(leftTabName);
			this.cont.find('.chat-tabs').css({left: this.scrollPos});
			this.selectTab();
			this.checkBtns();
		};

		bChat_channels.prototype.initLeftTab = function(){
			this.leftTab = this.cont.find('.chat-tabs-item').first();
		};

		bChat_channels.prototype.selectTab = function(){
			this.wrp.find('.chat-tabs-item').removeClass('-active');
			if (this.parent.showInvites){
				var activeTab = this.wrp.find('.chat-tabs-item.-invite');	
			} else {
				var activeTab = this.getTabEl(this.parent.activeTab);	
			}
			
			if( !activeTab.length ) return;
			
			activeTab.addClass('-active');
			this.setTabFullVisible(activeTab);
		};

		bChat_channels.prototype.getTabEl = function(name){
			var $item = $();
			
			this.wrp.find('.chat-tabs-item').each(function(){
				if( $(this).data('name') == name ){
					$item = $(this);
					
					return false;
				}
			});
			
			return $item;
			
//			return this.wrp.find('.chat-tabs-item[data-name="'+name+'"]');
		};

		bChat_channels.prototype.setAlert = function(channel){
			this.getTabEl(channel.name).toggleClass('-blink', channel.unread>0);
		}

		bChat_channels.prototype.resizeTabs = function(){
			var tabs = this.wrp.find('.chat-tabs-item');

			//доступная ширина
			var availWidth = this.wrp.find('.chat-tabs-wrp').width();

			//фактическая ширина по вкладкам
			var factWidth = 0;
			var tabWidths = [];
			var maxWidth = 0;

			tabs.each(function(i){
				var tab = $(this);
				tab.width('');
				var width = tab.width();
				factWidth += width;
				if (tab.is('.-new')) {
					tabWidths[i] = 0;
				} else {
					tabWidths[i] = width;
					if (tab.find('.chat-flag').length) {
						tabWidths[i] += 3;
					}
					maxWidth = Math.max(maxWidth, width);
				}
			});

			//режим отображения вкладок
			this.wrp.find('.chat-tabs').toggleClass('-short', factWidth > availWidth);

			//уменьшаем ширины вкладок
			while (factWidth > availWidth && maxWidth > this.data.minTabWidth) {
				maxWidth -= 1;
				for (var tab in tabWidths) {
					var width = tabWidths[tab];
					if (width > maxWidth) {
						factWidth -= width - maxWidth;
						tabWidths[tab] = maxWidth;
					}
				}
			}

			//записываем
			tabs.each(function(i){
				if($(this).is('.-new')) return;
				$(this).width(tabWidths[i]);
			});
		};

		bChat_channels.prototype.setTabFullVisible = function(el){
			var wrp = this.wrp.find('.chat-tabs-wrp');
			var left = el.position().left;
			var width = el.width();

			if (left+width > -this.scrollPos + wrp.width()) {
				this.scroll(1);
				this.setTabFullVisible(el);
			}
		};

		bChat_channels.prototype.scroll = function(val){
			var tabs = this.wrp.find('.chat-tabs');

			var nextTab = val > 0 ? this.leftTab.next() : this.leftTab.prev();
			
			if( nextTab ){
				this.leftTab = nextTab;
				
				this.scrollPos = -nextTab.position().left;
				
				tabs.css({left: this.scrollPos});
			}

			this.checkBtns();
		};
		
		bChat_channels.prototype.checkBtns = function(noCheckTabWidth){
			var wrp = this.wrp.find('.chat-tabs-wrp'),
				tabs = this.wrp.find('.chat-tabs');
			
			this.scrollPos = tabs.position().left;

			this.wrp.find('.chat-channels-left').toggleClass('-disabled', this.scrollPos == 0);
			
			if( tabs.width() > wrp.width() )
				tabs.addClass('-type-short'); 
			
			this.wrp.find('.chat-channels-right').toggleClass('-disabled', tabs.width() + this.scrollPos < wrp.width());
		};
		
		bChat_channels.prototype.checkNewTab = function(){
			var name = this.wrp.find('.chat-tabs-new-name').val();
			
			try{
				this.canNewTab = name.length >= lib.chat.minchannelname && name.length <= lib.chat.maxchannelname && decodeURIComponent(name).indexOf('>') == -1;
			}
			catch(e){
				this.canNewTab = false;
			}
			
			this.wrp.find('.chat-microBtn-wrp').toggleClass('-disabled', !this.canNewTab);
		};

	//сообщения

	bChat_messages = function(parent){
		this.name = 'messages';
		
		bChat_messages.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bChat_messages, Block);
		
		
		bChat_messages.prototype.addNotif = function(){
			this.notif.other[Notif.ids.chatMessageAdd] = function(message){
				var activeTab = chatMgr.getChannel(this.parent.activeTab);
				
				if( (activeTab == message.channel && message.channel.ready) || activeTab.complex )
					this.append(message);
			};
			this.notif.other[Notif.ids.chatChannelLog] = function(channel){
				this.tryRefreshTopBlock();
			};
			this.notif.other[Notif.ids.chatChannelReady] = function(channel){
				var	firstMsg = channel.getFirstMessage();
				
				if( firstMsg && firstMsg.time )
					channel.time = firstMsg.time;
				
				if( chatMgr.getChannel(this.parent.activeTab) == channel )
					this.refresh(!channel.getMessages(true).length);
			};
			this.notif.other[Notif.ids.chatMessageDel] = function(time){
				this.wrp.find('.chat-messages-item[data-id="'+time+'"]').remove();
			};
			this.notif.other[Notif.ids.chatRefreshMsg] = function(){
				this.refresh();

				this.parent.children.answer.updInpPos();
			};
			this.notif.other[Notif.ids.chatScroll] = function(func){
				this[func]();
			};
		};
		
		bChat_messages.prototype.bindEvent = function(){
			var self = this;
			
			//префикс - кому сообщение адресовано
			this.wrp
				.on('click', '.chat-messages-name', function(){
					self.parent.postTo(this.innerHTML);
				})
				//удаление сообщения
				.on('click', '.chat-messages-but.-del', function(){
					var itemEl = $(this).parents('.chat-messages-item').first();
					var channel = chatMgr.getChannel(itemEl.data('channel'));
					var mess = self.parent.getMessageByTime(channel, itemEl.data('id'));
					
					wndMgr.addConfirm('Удалить сообщение «'+mess.text+'»?').onAccept = function() {
						self.parent.sendRemove(mess);
					};
				})
				//баня
				.on('click', '.chat-messages-but.-ban', function(){
					var itemEl = $(this).parents('.chat-messages-item').first();
					var channel = chatMgr.getChannel(itemEl.data('channel'));
					var mess = self.parent.getMessageByTime(channel, itemEl.data('id'));

					wndMgr.addConfirm(tmplMgr.snipet.chat.ban({accName:mess.account.name})).onAccept = function() {
						self.parent.sendBan(mess);
					};
				});
		};
		
		bChat_messages.prototype.getData = function(){
			this.blockSize = 50;
			
			this.dataReceived();
		};
		
		bChat_messages.prototype.afterDraw = function(){
			this.initScroll({
				cls: '.chat-messages-wrp2',
				callbacks: {
					onTotalScrollBack: function(){
						notifMgr.runEvent(Notif.ids.chatScroll, 'onTotalScrollBack');
					},
					onTotalScroll: function(){
						notifMgr.runEvent(Notif.ids.chatScroll, 'onTotalScroll');
					},
					onScroll: function(){
						notifMgr.runEvent(Notif.ids.chatScroll, 'onScroll');
					}
				},
				advanced: {updateOnContentResize: false},
				noUpdateOnContentResize: true
			});
			
			this.clear();
			
			this.refreshScrollSize();
		};
		
		
		bChat_messages.prototype.onTotalScrollBack = function(){
			if( this.ignoreScrollEvents )
				return;
			
			this.scrolledToTop = true;
			
			if( this.parent.size != 'min' )
				this.tryRefreshTopBlock();
			
			this.checkBtns();
			
			console.warn('onTotalScrollBack');
		};
		
		bChat_messages.prototype.onTotalScroll = function(){
			if( this.ignoreScrollEvents )
				return;
			
			this.scrolledToBottom = true;
			
			this.checkBtns();
			
			console.warn('onTotalScroll');
		};
		
		bChat_messages.prototype.onScroll = function(){
			if( this.ignoreScrollEvents )
				return;
			
			if( this.totalScroll ){//указание на то, что нужно скролить до конца, при этом почему то не всегда onTotalScroll срабатывает
				this.totalScroll = false;
				
				this.scrolledToBottom = true;
			}
			else{
				this.scrolledToTop = false;
				
				this.scrolledToBottom = false;
			}
			
			this.checkBlocks();
			
			this.checkBtns();
			
			console.warn('onScroll');
		};
		
		
		bChat_messages.prototype.refreshScroll = function(bottom){
			this.updScroll();
			
			if( this.scrolledToBottom )
				this.goDownEnd();
			else
				this.scrollToBottomOffset(bottom);
			
			this.checkBtns();
		};
		
		bChat_messages.prototype.refreshScrollSize = function(){
			this.updScrollSize();
			
			this.updScroll();
		
			if( this.parent.size == 'min' || this.scrolledToBottom ) 
				this.goDownEnd();
		};
		
		bChat_messages.prototype.updScrollSize = function(){
			if( this.$scroll )
				this.wrp.find('#chat-messages').css('min-height', this.$getScrollWrp().get(0).clientHeight + 1);
		};
		
		bChat_messages.prototype.shiftScrollFromTop = function(checkTop){
			if( checkTop ){
				if( !this.isScrollOnTop() )
					return;
				
				this.scrolledToTop = false;
			}
			
			this.doScroll('scrollTo', 1);
		};
		
		bChat_messages.prototype.blockScrollEvents = function(){
			this.ignoreScrollEvents = true;
		};
		
		bChat_messages.prototype.allowScrollEvents = function(){
			this.ignoreScrollEvents = false;
		};
		
		
		bChat_messages.prototype.clear = function() {
			if( this.wrp )
				this.wrp.find('#chat-messages').empty();
			
			this.updScroll();
			
			this.scrolledToTop = false;
			this.scrolledToBottom = true;
			
			delete this.messTop;
			delete this.blockTop;
			delete this.blockBottom;
		};
		
		bChat_messages.prototype.refresh = function(scrollToTop) {
			if( !this.wrp )
				return;
			
			this.clear();
			
			if( scrollToTop )
				this.scrolledToTop = true;
			
			this.tryRefreshTopBlock();
		};

		bChat_messages.prototype.tryRefreshTopBlock = function(){
			if( !this.wrp )
				return;
			
			var mess = this.parent.getMess(),
				pos0 = mess.length,
				pos0Offset = 0;
			
			//последнее отображённое сообщение
			if( this.messTop ){
				pos0 = +this.getMesPosByTime(this.messTop.time, mess);
				
				pos0Offset = 1; // Учет отсчета с 0-я
			}
			
			var pos1 = pos0;//первое отображенное

			if( !this.blockTop || this.getBlockSize(this.blockTop) >= this.blockSize )
				pos1 -= this.blockSize;
			else
				pos1 -= this.blockSize - this.getBlockSize(this.blockTop);
			
			pos1 = Math.max(0, pos1);
			
			var channel = chatMgr.getChannel(this.parent.activeTab);
			
			//вкостыленный костыль - извините
			// За сутки могут загрузиться много сообщений. 
			// Разбиваются на на части и подгружаются по мере скролла вверх
			if ( pos1 != pos0 ){
				this.clearTimeout(this.shiftScrollFromTopTO);
				
				if( !channel.finish )
					this.shiftScrollFromTop(true); // Смещаем на 1 пиксель скролл сверху, чтобы вручную не смещать скролл к последнему месту вставки сообщений (работает для системного скролла)
				
				this.refreshTopBlock({
					mess: mess,
					startPos: pos0,
					finishPos: pos1,
					startOffset: pos0Offset,
					bottom: this.getScrollBottomOffset()
				});
			}
			else{
				if( this.scrolledToTop ){
					this.clearTimeout(this.shiftScrollFromTopTO);
					
					// Смещаем на 1 пиксель скролл сверху для возможности далее подгружать лог
					// Добавлена задержка, чтобы скролл не колбасило
					if( !channel.finish )
						this.shiftScrollFromTopTO = this.setTimeout(this.shiftScrollFromTop, 500);
				}
				
				chatMgr.tryLoadMessages(channel, this.parent);
			}
		};
		
		bChat_messages.prototype.refreshTopBlock = function(opt){
			opt = opt||{};
			
			var mess = opt.mess||this.parent.getMess(),
				startPos = opt.startPos,
				finishPos = opt.finishPos,
				startOffset = opt.startOffset,
				prevDate = startPos >= 0 ? timeMgr.fMomentDate(mess[startPos+(startOffset||0)-1].time) : timeMgr.fMomentDate(timeMgr.getNow());
			
			startPos = Math.min(startPos, mess.length-1);
			
			for(var itemId = startPos; itemId >= finishPos; itemId--){
				var item = mess[itemId],
					newDate = timeMgr.fMomentDate(item.time);
				
				if( prevDate != newDate ){
					var item2 = {text: prevDate, time: item.time-1, syst: 1};
					
					this.add(item2, true, true);
				}
				
				prevDate = newDate;
				
				this.add(item, true, true);
			}
			
			this.refreshScroll(opt.bottom);
		};
		
		
		bChat_messages.prototype.getMesPosByTime = function(time, mess){
			mess = mess||this.parent.getMess();
			
			for (var pos in mess){
				if( mess[pos].time == time )
					return pos;
			}
			
			return 0;
		};
		
		bChat_messages.prototype.getLastMessage = function() {
			return this.wrp.find('#chat-messages').find('li:last');
		};
		
		bChat_messages.prototype.add = function(item, toTop, noUpdScroll, noMessTop) {
			if( this.messTop && this.messTop.time == item.time )
				return;
			
			// Запоминаем верхнее сообщение (не учитываем разделитель по дням - item.syst == 1)
			if ( !noMessTop && (toTop || !this.messTop) && item.syst != 1 )
				this.messTop = item;
			
			var activeTab = chatMgr.getChannel(this.parent.activeTab);
			
			//подготовка данных
			if( item.syst )
				var data = item;
			else{
				var data = {
					time: item.time,
					//timeS: timeMgr.prepareHHMM(timeMgr.correctDate(item.time * 1000)),
					account: item.account,
					text: TextParser.showSmiles(item.text),
					color: activeTab.complex? item.channel.color: utils.calcColor(item.account.name),
					channel: item.channel.name
				};
			}
			
			//отображение
			var el = $(this.tmpl.item(data));

			var list = this.wrp.find('#chat-messages');
			var blocks = list.find('.chat-messages-block');
			
			if( blocks.length == 0 )
				var block = this.addBlock();
			else{
				var block = toTop ? this.blockTop : this.blockBottom;
				
				if( this.getBlockSize(block) >= this.blockSize )
					block = this.addBlock(toTop);
			}

			this.addChild(block, el, toTop);
			
			if( !noUpdScroll ) this.updScroll();
			
			var nameEl = el.find('.chat-messages-name');
			var textEl = el.find('.chat-messages-time,.chat-messages-butWrp');
			
			if (textEl.length && nameEl.length){
				textEl.css('top', nameEl.position().top+nameEl.height() -textEl.height());
			}
			
			if (!noUpdScroll && this.scrolledToBottom) {
				this.goDownEnd();
			}

			return el;
		};
		
		bChat_messages.prototype.getBlockSize = function(block){
			return block.children().length;
		};
		
		//добавляет блок наверх или вниз списка, отдаёт этот блок
		bChat_messages.prototype.addBlock = function(toTop){
			var list = this.wrp.find('#chat-messages');
			var block = $(this.tmpl.block());

			this.addChild(list, block, toTop);

			//вычисляем крайние блоки
			var blocks = list.find('.chat-messages-block');
			this.blockTop = blocks.eq(0);
			this.blockBottom = blocks.eq(blocks.length-1);

			return block;
		};
		
		//добавление любого элемента внутрь другого элемента
		bChat_messages.prototype.addChild = function(parent, child, toTop){
			if (toTop)
				parent.prepend(child);
			else
				parent.append(child);
		};

		bChat_messages.prototype.append = function(item){
			this.add(item, false);
		};
		
		//требуется ли прогрузить сообщения
		bChat_messages.prototype.needPrepend = function(){
			if( !this.wrp )
				return false;
			
			return this.scrolledToTop || this.wrp.find('#chat-messages').height() < this.wrp.find('.chat-messages-wrp2').height();
		};
		
		bChat_messages.prototype.checkBlocks = function(){
			var self = this,
				$blocks = this.wrp.find('.chat-messages-block'),
				maxIndex = $blocks.length - 1;
			
			$blocks.each(function(index){
				var $this = $(this);
				
				// Пересчитываем высоту первого блока, т.к. она может изменяться из-за вставки сообщений
				if( index == maxIndex )
					self.showBlock($this);
				
				if( !self.isBlockInView($this) )
					self.hideBlock($this);
				else
					self.showBlock($this);
			});
		};
		
		bChat_messages.prototype.hideBlock = function($block){
			$block.css({height: $block.height()}).addClass('-type-hidden');

//			Более правильное но более сложное решение с удалением сообщений внутри блока (требует перепила других кусков кода)
//			if( $block.data('messages') )
//				return;
//			
//			$block.css({height: $block.height()});
//			
//			var $messages = $block.find('.chat-messages-item');
//			
//			$block.data('messages', $messages);
//			
//			$messages.detach();
		};
		
		bChat_messages.prototype.showBlock = function($block){
			$block.removeClass('-type-hidden').css({height: ''});
			
//			if( !$block.data('messages') )
//				return;
//			
//			var $messages = $block.data('messages');
//			
//			$block
//				.css({height: ''})
//				.append($messages)
//				.removeData();
		};
		
		bChat_messages.prototype.goDownEnd = function(){
			if( !this.cont )
				return;
			
			this.totalScroll = true;
			
			this.doScroll('scrollTo', this.getScrollDir(), {scrollInertia:0, timeout:0});
			
			this.checkBtns();
		};
		
		
		bChat_messages.prototype.makeResize = function(){
			this.updScroll();
			
			this.setTimeout(this.updScrollSize, 450);
		};
		
		bChat_messages.prototype.doScroll = function(method, val, opt){
			this[method](val, opt);
		};
		
		bChat_messages.prototype.scrollTo = function(val, opt){
			if( this.$scroll )
				this.$scroll.scrollTo(val, opt);
		};
		
		
		bChat_messages.prototype.getScrollDir = function(){
			return 'bottom';
		};

		bChat_messages.prototype.getScrollBottomOffset = function(){};

		bChat_messages.prototype.scrollToBottomOffset = function(){};

		bChat_messages.prototype.isScrollOnTop = function(){
			return this.$scroll && this.$scroll.isScrollOnTop();
		};
		
		bChat_messages.prototype.checkBtns = function(){
			this.wrp.find('.__scrollBarButton[data-dir="up"]').toggleClass('-hidden', this.scrolledToTop);
			this.wrp.find('.__scrollBarButton[data-dir="down"]').toggleClass('-hidden', this.scrolledToBottom);
		};
		
		bChat_messages.prototype.isBlockInView = function($block){
			if( this.$scroll )
				return this.$scroll.isBlockInView($block);
		};
	
	
	
	//форма с ответом

	bChat_answer = function(parent){
		this.name = 'answer';
		bChat_answer.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bChat_answer, Block);
		
		
		bChat_answer.prototype.bindEvent = function(){
			var self = this;
			
			this.wrp
				.on('keydown', function(e){
				//удаление меток
				if (e.keyCode == 8) {
					var range = getSelection().getRangeAt(0)
					if (range.startOffset == 0 && range.endOffset == 0) {
						self.wrp.find('.js-chat-postLabel').last().remove();
						self.changePostTo()
						return false;
					}
				}
				//пост
				if (e.keyCode == 13) {
					self.postMessage();
					return false;
				}
			})
				.on('paste', '.chat-answ-text', function(e){
					e.preventDefault();
					var text = (e.originalEvent || e).clipboardData.getData('text/plain');
					if (!text) text = (e.originalEvent || e).clipboardData.getData('text/html');

					text = TextParser.hideSmiles(text);
					//text = text.replace(/\r/g, ' ').replace(/\n/g, ' '); 
					//text = $(text).text();
					text = text.replace(/<\/li>/g, ' ').replace(/<\/?[^>]+>/g, '');
					if (text) {
						text = JSON.stringify(text);

						text = text.slice(1,-1);
						text = text.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\\"/g, '"');
						document.execCommand('insertText', false, text);
						$(this).focus();
					}
				})
				.on('focus', '.chat-answ-text', function(e){
					self.wrp.find('.chat-answ-wrp').addClass('-focus');
				})
				.on('blur', '.chat-answ-text', function(e){
					self.wrp.find('.chat-answ-wrp').removeClass('-focus');
				})
				//пост
				.on('submit', '.chat-message', function(){
					self.postMessage();
					
					return false;
				})
				//смайлы
				.on('click', '.chat-answ-smile', function(){
					self.parent.smile.togglePanel(true);
					return false;
				});
		};

		bChat_answer.prototype.postMessage = function(){
			this.parent.messages.goDownEnd();
			
			var $answ = this.wrp.find('.chat-answ'),
				$answText = $answ.find('.chat-answ-text');
			
			this.parent.sendReply($('<div>'+TextParser.hideSmiles($answ.html())+'</div>').text().trim());
			
			$answText.html('');
			
			this.wrp.find('.js-chat-postLabel').remove();
			
			return $answText;
		};

		bChat_answer.prototype.setChannel = function(channel){
			if(!this.wrp) return;
			var wrp = this.wrp.find('.chat-answ-wrp');
			var chan = this.wrp.find('.chat-answ-channel');
			if (channel.type == cnst.chatChannelTypes.country){
				var chanTitle = snip.countryFlag(wofh.country, {flag: 'normal'});
			} else if (channel.complex){
				var chanTitle = chatMgr.channelWorld.title;
			} else {
				var chanTitle = channel.title;
			}
			chan.html(chanTitle);
			//utils.chClass(chan, '-color-', channel.color);
			this.updInpPos();
		};

		bChat_answer.prototype.afterDraw = function(){
			var channel = chatMgr.getChannel(this.parent.activeTab);
			
			this.setChannel(channel);
		};

		bChat_answer.prototype.updInpPos = function(){
            utils.getElemSize(this.wrp.find('.chat-message'), {getSize: function($cont){
                $cont.find('.chat-answ').css({left: $cont.find('.chat-answ-channel').outerWidth(true)});
                
                $cont.find('.chat-send').height($cont.find('.chat-answ-wrp').height() + 2);
            }});
		};

		bChat_answer.prototype.addText = function(text){
			var inp = this.wrp.find('.chat-answ-text');

			var el = $(TextParser.showSmiles(text))[0];

			if (getSelection().rangeCount){
				var range = getSelection().getRangeAt(0);
			} else {
				var range = false;
			}

			if (!range || (range.commonAncestorContainer != inp[0] && range.commonAncestorContainer .parentNode != inp[0])) {
				range = document.createRange();


				range.setStart(inp[0], inp[0].childNodes.length);
				range.setEnd(inp[0], inp[0].childNodes.length);
				//getSelection().addRange(range);
				/*
				range.selectNode(el);
				getSelection().collapseToEnd();*/
			}


			range.deleteContents();
			range.insertNode(el);
			if (getSelection().rangeCount) {
				getSelection().collapseToEnd();
				getSelection().removeAllRanges();
			}

			range = document.createRange();
			range.selectNode(el);
			getSelection().addRange(range);
			getSelection().collapseToEnd();
		}

		bChat_answer.prototype.postTo = function(name){
			var inp = this.wrp.find('.chat-answ');
			
			this.setPostLabel(name, inp);
			
			inp.find('.chat-answ-text').focus();
		};
		
		bChat_answer.prototype.setPostLabel = function(name, inp){
			var range = document.createRange();

			getSelection().removeAllRanges();
			getSelection().addRange(range);
			range.setStart(inp[0], 0);
			range.setEnd(inp[0], 0);
			
			range.insertNode($('<span class="chat-postLabel js-chat-postLabel">'+name+':&nbsp;</span>')[0]);
			
			var range = document.createRange();
			range.setStart(inp[0], inp[0].childNodes.length);
			range.setEnd(inp[0], inp[0].childNodes.length);
			getSelection().removeAllRanges();
			getSelection().addRange(range);
			
			this.changePostTo();
		};
		
		bChat_answer.prototype.changePostTo = function(){
			var wrpEl = this.wrp.find('.chat-answ');
			var textEl = this.wrp.find('.chat-answ-text');
			var width = wrpEl.width();
			wrpEl.find('.js-chat-postLabel').each(function(){
				width -= $(this).width();
			});
			
			textEl.width(Math.max(50, width));
		};

	//смайликов окно

	bChat_smile = function(parent){
		this.name = 'smile';
		bChat_smile.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bChat_smile, Block);

		
		bChat_smile.prototype.getTmplData = function(){
			return {list: TextParser.smiles};
		};

		bChat_smile.prototype.bindEvent = function(){
			var self = this;
			
			//вкладки
			this.wrp
				.on('click', '.chat-smilePan-but', function(){
				self.selectTab($(this))
			})
				//закрытие панели
				.on('click', '.backClick', function(){
				self.togglePanel(false)
			})
				//выбор смайла
				.on('click', '.chat-smilePan-smile', function(){
				var el = $(this).find('img');
				var symb = TextParser.getSymbByEl(el);
				
				self.addToFav(el.data('id'));
				self.parent.answer.addText(symb);
				self.togglePanel(false);
			});
		};

		bChat_smile.prototype.afterDraw = function(){
			this.selectTab(this.wrp.find('.chat-smilePan-but[data-type="'+(ls.getFavSmiles()? 'star': 'emo')+'"]'));
		};

		bChat_smile.prototype.addToFav = function(id){
			var str = ls.getFavSmiles();

			//убираем смайл из списка
			str = str? str.replace(id+',',''): '';
			//вставляем его первым
			str = id+','+str;

			//убираем смайлы сверх лимита
			var arr = str.split(',');
			arr.length = cnst.favSmileLimit;
			str = arr.join(',')

			ls.setFavSmiles(str);
		}

		bChat_smile.prototype.selectTab = function(tab){
			this.wrp.find('.chat-smilePan-but').removeClass('-active');
			tab.addClass('-active');

			//фильтр
			var group = tab.data('type');
			utils.chClass(this.wrp.find('.chat-smilePan-list'), '-group-', group);

			this.wrp.find('.chat-smilePan-list').empty();
			if (group == 'star') {
				var fav = ls.getFavSmiles();
				if (fav) {
					fav = fav.split(',');

					for (var code in fav){
						code = fav[code];
						var group = TextParser.getSmileGroup(code);
						if(!group) continue
						var smile = TextParser.smiles[group][code];
						this.wrp.find('.chat-smilePan-list').append(this.tmpl.item({smile: smile, code: code, group: group}));
					}
				}
			} else {
				for (var code in TextParser.smiles[group]){;
					var smile = TextParser.smiles[group][code];
					this.wrp.find('.chat-smilePan-list').append(this.tmpl.item({smile: smile, code: code, group: group}));
				}
			}

		};

		bChat_smile.prototype.togglePanel = function(show){
			this.wrp.find('.chat-smileWrp').toggleClass('-hidden', !show);
		};

	//информация  о каналье

	bChat_chanInfo = function(parent){
		bChat_chanInfo.superclass.constructor.apply(this, arguments);
        
		this.expanded = false;//раскрыта ли форма добавления игрока
	};
		
		utils.extend(bChat_chanInfo, Block);
		
        
        bChat_chanInfo.prototype.calcName = function(){
			return 'chanInfo';
		};
        
		bChat_chanInfo.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.chatSize];
		};
		
		bChat_chanInfo.prototype.calcChildren = function(){
			this.children.list = bChat_chanInfoList;
            this.children.invite = bChat_chanInfoInvite;
		};

		bChat_chanInfo.prototype.canDisplay = function(){
			var channel = chatMgr.getChannel(this.parent.activeTab);
			
			return this.parent.size == 'max' && !channel.complex && channel.type != cnst.chatChannelTypes.main;
		};


		bChat_chanInfoList = function(parent){
			this.name = 'list';
			bChat_chanInfoList.superclass.constructor.apply(this, arguments);
			this.chat = this.parent.parent;
			
			this.expanded = false;//раскрыта ли форма добавления игрока
		};
        
			utils.extend(bChat_chanInfoList, Block);

			bChat_chanInfoList.prototype.addNotif = function(){
				this.notif.show = [Notif.ids.chatChannelInfo];
			};

			bChat_chanInfoList.prototype.getTmplData = function(){
				var channel = chatMgr.getChannel(this.chat.activeTab);
				
				return {channel: channel};
			};

			bChat_chanInfoList.prototype.bindEvent = function(){
				var self = this;

				//открываем плашку с дополнительной информацией
				this.wrp
					.on('click', '.chat-info-user-link', function(event){
						var channel = chatMgr.getChannel(self.chat.activeTab);
						
						if( channel.type == cnst.chatChannelTypes.country ){
							self.parent.parent.postTo(this.querySelector('span').innerHTML);
							
							return;
						}
						
						var id = $(this).data('id'),
							status = $(this).data('status'),
							top = utils.getPosFromEvent(event).y - self.wrp.offset().top;
						
						self.showInfo(id, status, top);
					})
					//закрываем плашку
					.on('click', '.chat-info-actions-close', function(){
						self.hideInfo();
					})
					//добавляем модератора-админа
					.on('click', '.chat-info-action.-type-up', function(){
						var channel = chatMgr.getChannel(self.chat.activeTab);

						if (channel.getUserStatus(self.selAccId) == ChatMgr.userStatus.moderator) {
							chatMgr.addAdmin(channel, self.selAccId);
						} else {
							chatMgr.addModerator(channel, self.selAccId);	
						}
					})
					//убираем модератора
					.on('click', '.chat-info-action.-type-down', function(){
						var channel = chatMgr.getChannel(self.chat.activeTab);

						chatMgr.delModerator(channel, self.selAccId);
					})
					//убираем игрока с канала
					.on('click', '.chat-info-action.-type-exit', function(){
						var channel = chatMgr.getChannel(self.chat.activeTab);

						chatMgr.delAccount(channel, self.selAccId);
					})
					// Выйти из канала
					.on('click', '.chat-info-action.-type-quit', function(){
						var channel = chatMgr.getChannel(self.chat.activeTab);

						self.parent.parent.channels.exitChannel(channel);
					});
			};

			bChat_chanInfoList.prototype.showInfo = function(accId, status, top){
				this.selAccId = accId;

				var $wrp = this.wrp.find('.chat-info-actionsWrp');
				var data = {acc: wofh.world.getAccount(accId), status: status, channel: chatMgr.getChannel(this.chat.activeTab)};

				var $block = $(tmplMgr.chat.chanInfo.list.actions(data));
				$wrp.html($block);
				$block.css({top: Math.max(0, top - $block.height()/2)});
			};

			bChat_chanInfoList.prototype.hideInfo = function(){
				var $wrp = this.wrp.find('.chat-info-actionsWrp');
				
				$wrp.html('');
			};

			bChat_chanInfoList.prototype.afterDraw = function(){
				var scroll = this.wrp.find('.chat-info-usersList');
				
				if( !scroll.length )
					return;
				
				scroll.height(390 - scroll.position().top);
				
				this.initScroll({cls: '.chat-info-usersList'});
			};
			
			

		bChat_chanInfoInvite = function(parent){
			bChat_chanInfoInvite.superclass.constructor.apply(this, arguments);
			
			this.chat = this.parent.parent;

			this.expanded = false;//раскрыта ли форма добавления игрока
		};

			utils.extend(bChat_chanInfoInvite, Block);
			
			
			bChat_chanInfoInvite.prototype.calcName = function(){
				return 'invite';
			};
			
			bChat_chanInfoInvite.prototype.addNotif = function(){
				this.notif.other[Notif.ids.chatChannelInfo] = function(){
					//если блок показан, то ничего не делаем, если не показан - показываем
					if( !this.canShow )
						this.show();
				};
			};

			bChat_chanInfoInvite.prototype.getTmplData = function(){
				var channel = chatMgr.getChannel(this.chat.activeTab);
				
				this.canShow = channel.myStatus >= ChatMgr.userStatus.moderator && channel.type != cnst.chatChannelTypes.country;
				
				return {canShow: this.canShow};
			};

			bChat_chanInfoInvite.prototype.afterDraw = function(){
				this.expanded = false;
			};

			bChat_chanInfoInvite.prototype.bindEvent = function(){
				var self = this;

				//изменение инпута
				this.wrp
					.on('change keyup', '.chat-info-invite-name', function(event){
						if (event.keyCode == 13) return;
						self.showResult(false, '');
					})
					//закрытие по крестику
					.on('click', '.chat-info-invite-close', function(){
						self.toggle(false);
					})
					//отправка
					.on('submit', '.chat-info-invite', function(){
						var $form = $(this);
						if (!self.expanded) {
							self.toggle(true);
						} else {
							var channel = chatMgr.getChannel(self.chat.activeTab);
							var accName = $form.find('.chat-info-invite-name').val();
                            
							if (!Account.checkNameLimits(accName))
                                return false;
                            
							var acc = channel.getAccByName(accName);
							if (acc) {
								self.showResult(false, snip.acc(acc) + ' уже есть в этом чате');
								return false;
							}

							reqMgr.getPlayerIdByName(accName, function(resp){
								self.showResult(resp.id != 0, resp.id != 0 ? 'Игрок приглашен': 'Игрок с таким именем не найден');
								if (resp.id != 0) {
									chatMgr.addAccount(channel, resp.id, resp.chat.name, resp.chat.invitekey);
								}
							});
						}

						return false;
					});
			};

			bChat_chanInfoInvite.prototype.toggle = function(toggle){
				this.expanded = toggle;
				
				this.wrp.find('.chat-info-invite').toggleClass('-expanded', toggle);
				
				if (this.expanded) {
					this.wrp.find('.chat-info-invite-name').focus();
				} else {
					this.wrp.find('.chat-info-invite-name').val('');
					this.wrp.find('.chat-info-invite-alert').html('');
				}
			};

			bChat_chanInfoInvite.prototype.showResult = function(result, text){
				this.wrp
					.find('.chat-info-invite-alert')
					.html(text)
					.toggleClass('-type-ok', result);

				this.clearTimeout(this.autoTogTO);
				
				if( result ) {
					this.wrp.find('.chat-info-invite-name').val('');
					
					this.autoTogTO = this.setTimeout(function(){this.toggle(false);}, 3000);
				}
			};
			
			
	bChat_invites = function(parent){
		this.name = 'invites';
		bChat_invites.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bChat_invites, Block);

		bChat_invites.prototype.getTmplData = function(){
			var data = {};
			data.show = this.parent.showInvites;
			data.list = chatMgr.getInvites();

			return data;
		};

		bChat_invites.prototype.bindEvent = function(){
			var self = this;

			//принять
			this.wrp
				.on('click', '.chat-invites-accept', function(){
					var name = $(this).parents('.chat-invites-item').data('name').toString();
					self.parent.createChannel(name);
					
					self.parent.toggleInvites(false);
				})
				//отказаться
				.on('click', '.chat-invites-reject', function(){
					var name = $(this).parents('.chat-invites-item').data('name').toString(),
						channel = chatMgr.getChannel(name);
					
					if( channel && channel.isAdminQuit() )
						chatMgr.delInvite(name);
					else
						chatMgr.exitChannel(name);

					if( chatMgr.getInvites().length )
						self.show();
					else{
						self.parent.toggleInvites(false);
						self.parent.selectTab(self.parent.defTab);
						self.parent.channels.show();
					}
				});
		};

	bChat_size = function(parent){
		this.name = 'size';
		bChat_size.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bChat_size, Block);

		bChat_size.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.chatAccess];
		};

		bChat_size.prototype.getTmplData = function(){
			var data = {};
			data.invite = chatMgr.getInvites().length > 0;
			
			data.inviteExt = this.parent.showInvites;
			
			return data;
		};

		bChat_size.prototype.afterDraw = function(){
			this.parent.resizeTop();
		};

		bChat_size.prototype.bindEvent = function(){
			var self = this;

			this.wrp.on('click', '.chat-inviteBtn', function(){
				self.parent.toggleInvites(true);
				self.parent.resizeTop();
			});
		};
		
		
		
		
		
wDiscord = function(){
	this.name = 'discord';
	this.hashName = 'discord';
	
	wDiscord.superclass.constructor.apply(this, arguments);
};

utils.extend(wDiscord, Wnd);

WndMgr.regWnd('discord', wDiscord);