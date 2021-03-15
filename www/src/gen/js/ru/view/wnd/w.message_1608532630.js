wMessage = function(){
	wMessage.superclass.constructor.apply(this, arguments);
};
				
utils.extend(wMessage, Wnd);

WndMgr.regWnd('message', wMessage);


wMessage.oldestMsgTime = 1;


wMessage.prototype.calcName = function(){
	return 'message';
};

wMessage.prototype.initWndOptions = function(){
    wMessage.superclass.initWndOptions.apply(this, arguments);
    
	this.options.clipboard = true;
};

wMessage.prototype.calcChildren = function(){
	this.children.view = bMessage_view;
};

wMessage.prototype.beforeShowChildren = function(){
	this.checkCleanLastMsgs();
	
	this.setCurLastReadMsgTime(this.getLastReadMsgTime());
	
	this.checkCleanBackup();
};

wMessage.prototype.onClose = function(){
	this.saveLastReadMsgTime();
};

wMessage.prototype.getConflictWnd = wMessage.prototype.getIdentWnd;


wMessage.prototype.setBackupText = function(text){
	var backup = ls.getMessageBackup({});
	
	if(text)
		backup[this.getName()] = text;
	else
		delete backup[this.getName()];
	
	backup.timeout = timeMgr.getNow();
	
	ls.setMessageBackup(backup);
};

wMessage.prototype.getBackupText = function(){
	return ls.getMessageBackup({})[this.getName()]||'';
};

wMessage.prototype.checkCleanBackup = function(){
	var backupTimeout = ls.getMessageBackup({}).timeout||0;
	
	if( backupTimeout + timeMgr.DtS < timeMgr.getNow() )
		ls.cleanMessageBackup();
};

wMessage.prototype.checkCleanLastMsgs = function(){
	var needSave = false,
		messageList = servBuffer.temp.timer.messageList;
	
	for(var thread in messageList){
		// Перевод на новый формат. Удалить примерно через месяц-два 04.02.2019
		if( !(messageList[thread] instanceof Object) ){			
			messageList[thread] = {
				time: messageList[thread],
				wtime: messageList[thread]
			};
			
			needSave = true;
		}
		
		// Если в переписку не заглядывали месяц, данные о последнем непрочитанном сообщения удаляется
		if( messageList[thread].wtime + (timeMgr.monthWeek * timeMgr.WtS) < timeMgr.getNow() ){
			delete messageList[thread];
			
			needSave = true;
		}
	}
	
	if( needSave )
		servBuffer.apply();
};

wMessage.prototype.getLastReadMsgTime = function(){
	return (servBuffer.serv.timer.messageList[this.getName()]||{}).time||wMessage.oldestMsgTime;
};

wMessage.prototype.getCurLastReadMsgTime = function(){
	return this.data.lastReadMsgTime;
};

wMessage.prototype.setCurLastReadMsgTime = function(time){
	this.data.lastReadMsgTime = time;
};

wMessage.prototype.saveLastReadMsgTime = function(){
	if( debug.noAdminSave() || this.data.lastReadMsgTime == this.getLastReadMsgTime() )
		return;
	
	servBuffer.temp.timer.messageList[this.getName()] = {
		time: this.data.lastReadMsgTime, // Время публикации сообщения, которое было последним прочитано
		wtime: timeMgr.getNow() // Время последнего просмотра переписки (watch time)
	};
	
	servBuffer.apply();
};



bMessage_view = function(){
	this.name = 'view';
	
	bMessage_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};
				
utils.extend(bMessage_view, Block);


bMessage_view.loadMsgsType = {
	'old': 0,
	'new': 1
};


bMessage_view.prototype.getData = function(){
	var self = this;
	
	this.id = this.parent.id;
	
	this.data.backupText = this.parent.getBackupText();
	
	this.data.maxMsgsInPack = 31; // Максимальное количество сообшений, которое может отдать сервер
	
	// Квест на открытие окна выполнен
	reqMgr.questComplete(new Quest(Quest.ids.message));
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		function(){
			self.getReqData(function(){
				reqMgr.getLastReadMessagePos(self.id, self.parent.getCurLastReadMsgTime(), function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							if( !resp ){
								contentLoader.stop(loaderId);
								
								self.parent.close();
								
								return;
							}
							
							// Если грузим самые первые(старые) сообщения, добавляем смещение, 
							// чтобы запросить сообщения на одно раньше чем самое первое(старое), 
							// дабы сервер не вернул параметр next, исключив тем самым лишнюю подзагрузку сообщений при листании вверх.
							// Также самое первое(старое) сообщение, помечается как новое.
							var oldestMsgOffset = self.parent.getCurLastReadMsgTime() == wMessage.oldestMsgTime ? 1 : 0;
							
							self.data.unreadMsgsCount = resp.msgPos - 1 + oldestMsgOffset;
							
							self.data.from = Math.max(0, (self.data.unreadMsgsCount+oldestMsgOffset) - self.data.maxMsgsInPack);
							
							if( self.data.from ){
								self.isEndLoaded = false;
								
								// Позиция последнего непрочитанного сообщения в пачке сообщений, которую отдал сервер
								self.data.lastUnreadMsgPosInPack = self.data.from;
							}
							else
								self.isEndLoaded = true;
							
							// Получаем список сообщений
							self.getDataThread(bMessage_view.loadMsgsType.old, function(resp){
								contentLoader.stop(loaderId);
								
								self.initThread(resp);

								self.dataReceived();
							});
						}
					);
				});
			});
		}
	);
};

bMessage_view.prototype.dataReceived = function(){
	bMessage_view.superclass.dataReceived.apply(this, arguments);
};

bMessage_view.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accMessage] = this.updThreadNotif;
};

bMessage_view.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		// Ответ на сообщение
		.on('submit', 'form', function(){
			if( !self.data.canSend )
				return false;
			
			self.setCanSend(false);
			
			var form = $(this),
				data = utils.urlToObj(form.serialize()),
				$text = form.find('textarea');
			
			self.toggleDisabledText($text, true);
			
			var loaderId = contentLoader.start(
				self.cont.find('.message-write-btn'), 
				0, 
				function(){
					reqMgr.answerMessage(data.text, self.id, function(resp){
						delete self.data.backupText;
						contentLoader.stop(loaderId, !resp.error, resp.error);
					});
				}.bind(this),
				{icon:ContentLoader.icon.short, cssPosition: {left: -55, top: 1}, callback:function(loader){
					self.toggleDisabledText($text, false);
					
					if( loader.success ){
						utils.clearForm(form);
						self.parent.setBackupText('');
						self.cont.find('.mes-chrleft span').text(lib.message.textmaxlen);
					}
					else
						self.setCanSend(true);
				}}
			);
			
			
			return false;
		})
		.on('input', 'textarea[name=text]', function(){
			var val = $(this).val();
			self.data.backupText = val;
			
			self.setCanSend(!!val, val);
			
			self.parent.setBackupText(val);
		})
		//получение подарка от админа server/message/texts.html (16)
		.on('click', '.message-getGift', function(){
			reqMgr.getGift(self.id, $(this).data('days'), $(this).data('key'), self.parent.close.bind(self.parent));
		})
		.on('click', '.message-list-toNewBtn', function(){
			if( !$(this).hasClass('-show') ) 
				return;
			
			if( !self.isEndLoaded )
				self.toEnd = true; 
			
			self.toggleToNewBtn(false);
			self.scrollToNew({scrollInertia: 250});
		});
};

bMessage_view.prototype.afterDraw = function(){
	// Счетчик символов
	var $textarea = this.wrp.find('textarea');
	
	this.setFocusAfterDraw($textarea);
	
	utils.assignLengthCounter($textarea, lib.message.textmaxlen, this.wrp.find('.mes-chrleft span'));
	
	if( this.data.thread.author instanceof Country )
		this.parent.setClipboard({tag:'w' + this.id});
	
	this.parent.setHeaderCont(this.data);
	
	this.setCanSend(!!this.data.backupText, this.data.backupText);
	
	this.initScroll();
	
	notifMgr.runEvent(Notif.ids.accReadMessage, this.id);
};

bMessage_view.prototype.initScroll = function(){
	var firstUnreadMsg = this.findFirstUnreadMsg(this.data.thread.list);
	
	this.addList(this.data.thread.list, bMessage_view.loadMsgsType.old, true);
	
	this.initScrollView();
	
	if( this.isNoScroll() ){
		this.setTotalEnd(true);

		this.markAllMsgsAsRead();
	}
	else if( firstUnreadMsg ){
		if( firstUnreadMsg.onTop )
			this.scrollToOld();
		else
			this.scrollToMsg(firstUnreadMsg);

		// Если загружен не конечный блок с сообщениями
		// последнее сообщением не вмещается в область просмотра скролла, 
		// показываем кнопку с количеством непрочитанных сообщений
		this.toggleToNewBtn(!this.isEndLoaded || !this.$isMsgInView(this.$getLastMsg()));
	}
	else
		this.scrollToNew();
};


bMessage_view.prototype.updThreadNotif = function(data){
	if(this.id == data.thread){
		data.account = new Account(data.writer);
		
		if( !this.isBeginLoaded )
			this.data.from++;
		
		this.addMsg(data);
	}
};


bMessage_view.prototype.setFocusAfterDraw = function($textarea){
	$textarea.focus();
};

bMessage_view.prototype.onTotalScrollBack = function(){
	if ( !this.isBeginLoaded )
		this.loadOld();
};

bMessage_view.prototype.whileScrolling = function(){
	this.setTotalEnd(false);
};

bMessage_view.prototype.onScroll = function($scroll){
	if( !this.scrollInited ){
		// При первом update, onScroll срабатывает 2 раза.
		this.setScrollInited();
		
		return;
	}

	var $firstUnreadMsg = this.$getFirstUnreadMsg($scroll);

	if( !$firstUnreadMsg.length )
		return;

	// Последнее новое видимое сообщение в области скролла
	var $lastViewed = this.$getLastViewedMsg($scroll);

	if( !$lastViewed.length ){
		// Если блок с последним непрочитанным сообщением полностью не виден 
		// или его верхний левый угол не ушел за верхнюю границу порта просмотра - листаем вне области непрочитанных сообщений
		if( this.$isMsgUnderView($firstUnreadMsg) )
			return;

		$lastViewed = $firstUnreadMsg;
	}

	this.parent.setCurLastReadMsgTime($lastViewed.data('time'));

	var readMsgsCount = 1;

	if( !$lastViewed.hasClass('-type-firstUnread') ){
		// Считаем количество уже прочитанных сообщений с учетом последнего, непрочитанного, видимого в блоке
		readMsgsCount += $lastViewed.prevUntil('.message-message.-type-firstUnread').filter(function(){
			return $(this).hasClass('-type-marked');
		}).length + 1; 
	}

	// Вычитаем количество уже прочитанных сообщений из новых (от последнего видимого в блоке до первого непрочитанного)
	this.setUnreadMsgsCount(Math.max(0, this.data.unreadMsgsCount - readMsgsCount));

	$firstUnreadMsg.removeClass('-type-firstUnread');

	var $nextFirstUnreadMsg = $lastViewed.nextAll('.message-message.-type-marked').first();

	if( $nextFirstUnreadMsg.length )
		$nextFirstUnreadMsg.addClass('-type-firstUnread'); // Устанавливаем следущее сообщение, после последнего элемента списка, как новое
};

bMessage_view.prototype.onTotalScroll = function(){
	if( this.isEndLoaded || this.toEnd ){
		this.setTotalEnd(true);
		
		if( this.toEnd ){
			this.toEnd = false;
			
			this.isEndLoaded = true;
			
			this.loadEnd();

			return;
		}
	}
	else
		this.loadNew();

	this.parent.setCurLastReadMsgTime(this.$getLastMsg().data('time'));
};


bMessage_view.prototype.toggleDisabledText = function($el, disabled){
	$el.prop('disabled', disabled);
	
	if( !disabled )
		$el.focus();
};

bMessage_view.prototype.getDataThread = function(loadMsgsType, callback){
	if( this.loaderId ) return;
	
	var self = this,
		from = this.data.from;
	
	if( this.isLoadNew(loadMsgsType) )
		from = this.data.lastUnreadMsgPosInPack = this.data.lastUnreadMsgPosInPack - this.data.maxMsgsInPack;
	
	this.loaderId = contentLoader.start(
		this.wrp ? this.wrp.find('.message-list-wrp') : false, 
		0, 
		function(){
			self.getReqData(function(){
				reqMgr.getMessageThread(this.id, from, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							resp.list = resp.list||[];
							
							resp.list.reverse();
							
							if( this.isLoadNew(loadMsgsType) ){
								// Долистали к самым новым
								if( !(from > 0) ){				
									resp.list.splice(0, -from);
									
									// Добавляем к полученному списку сообщения, которые пришли по сокету, пока не была загружена последняя страница с сообщениями
									if( this.data.newUnreadMsgs )
										resp.list = resp.list.concat(this.data.newUnreadMsgs);
									
									this.isEndLoaded = true;
								}
							}
							else{
								if ( resp.next )
									this.data.from += resp.list.length;
								else
									this.isBeginLoaded = true;
							}

							this.setTimeout(function(){this.loaderId = contentLoader.stop(this.loaderId);}, 50);
							
							callback(resp);
						}
					);
				});
			});
		}
	);
};
//инициализация общих данных по потоку
bMessage_view.prototype.initThread = function(thread){
	thread.author = wofh.account.id == thread.account1.id ? thread.account2 : thread.account1;
	
	this.data.thread = thread;
};

bMessage_view.prototype.loadOld = function(){
	var self = this;
	
	self.getDataThread(bMessage_view.loadMsgsType.old, function(data){
		self.addList(data.list, bMessage_view.loadMsgsType.old);
	});
};

bMessage_view.prototype.loadNew = function(){
	var self = this;
	
	self.getDataThread(bMessage_view.loadMsgsType.new, function(data){
		data.list[0].isFirstUnread = true;
		
		self.addList(data.list, bMessage_view.loadMsgsType.new);
	});
};

bMessage_view.prototype.loadEnd = function(){
	var self = this;
	
	this.data.from = 0;
	
	this.isBeginLoaded = false;
	
	this.getDataThread(bMessage_view.loadMsgsType.old, function(data){
		data.list[0].isFirstUnread = true;
		
		self.setList(data.list);
		
		self.scrollToNew();
		
		self.markAllMsgsAsRead();
		
		delete self.data.newUnreadMsgs;
	});
};
// Дополняет выводимый список
bMessage_view.prototype.addList = function(list, loadMsgsType, noScroll){
	var $cont = this.cont.find('.message-list-ul');
	
	var heightBeforeAdd = $cont.height();
	
	if( this.isLoadNew(loadMsgsType) ){
		this.appendList(list, $cont);
		
		noScroll = true;
	}
	else
		this.prependList(list, $cont);
	
	if( !noScroll )
		this.scrollTo($cont.height() - heightBeforeAdd);
};
// Устанавливаем выводимый список
bMessage_view.prototype.setList = function(list, $cont){
	($cont||this.cont.find('.message-list-ul')).html(tmplMgr.message.view.list({list: list}));
};
// Добавляем в конец выводимого списка, новый список 
bMessage_view.prototype.appendList = function(list, $cont){
	($cont||this.cont.find('.message-list-ul')).append(tmplMgr.message.view.list({list: list}));
};
// Добавляем в начало выводимого списка, новый список
bMessage_view.prototype.prependList = function(list, $cont){
	($cont||this.cont.find('.message-list-ul')).prepend(tmplMgr.message.view.list({list: list}));
};
// Дополняет выводимый список одним сообщением
bMessage_view.prototype.addMsg = function(msg){
	var isMyMsg = msg.account.id == wofh.account.id;
	
	if( this.isTotalEnd ){
		// На случай, когда первое непрочитанное оказалось в конце списка
		if( isMyMsg )
			msg.noMark = true;
		
		this.appendMsg(msg);
		
		this.parent.setCurLastReadMsgTime(msg.time);
		
		this.scrollToNew();
		
		return;
	}

	if( this.isEndLoaded ){
		if( isMyMsg )
			msg.noMark = true;
		else{
			if( !this.$getFirstUnreadMsg().length )
				msg.isFirstUnread = true;
			
			this.toggleToNewBtn(true, 1);
		}
		
		this.appendMsg(msg);
		
		if( isMyMsg )
			this.scrollToNew({scrollInertia: 250});
	}
	else{
		if( isMyMsg )
			msg.noMark = true;
		else
			this.toggleToNewBtn(true, 1);
		
		if( !this.data.newUnreadMsgs )
			this.data.newUnreadMsgs = [];
		
		this.data.newUnreadMsgs.push(msg);
	}
};

bMessage_view.prototype.appendMsg = function(msg){
	this.appendList([msg]);
};

bMessage_view.prototype.scrollToMsg = function(msg, opt){
	this.scrollTo(this.cont.find('.message-list .message-message[data-time="'+msg.time+'"]'), opt);
};

bMessage_view.prototype.scrollToOld = function(opt){
	this.scrollTo('5', opt);
};

bMessage_view.prototype.scrollToNew = function(opt){
	this.scrollTo('bottom', opt);
};


bMessage_view.prototype.toggleToNewBtn = function(toggle, addCount){
	if( toggle )
		this.setUnreadMsgsCount(this.data.unreadMsgsCount+(addCount||0));
	else
		this.data.unreadMsgsCount = 0;
	
	this.cont.find('.message-list-toNewBtn').toggleClass('-show', toggle);
};

bMessage_view.prototype.setUnreadMsgsCount = function(count){
	this.data.unreadMsgsCount = count;
	
	this.cont.find('.message-list-unreadMsgsCount').text(count);
};

bMessage_view.prototype.$getLastMsg = function(){
	return this.cont.find('.message-list-ul .message-message:last-child');
};

bMessage_view.prototype.$getFirstUnreadMsg = function($cont){
	$cont = $cont||this.cont.find('.message-list-ul');
	
	return $cont.find('.message-message.-type-firstUnread');
};

bMessage_view.prototype.setTotalEnd = function(state){
	this.isTotalEnd = state;
	
	if( state )
		this.toggleToNewBtn(false);
};

bMessage_view.prototype.markAllMsgsAsRead = function(){
	this.setTimeout(function(){
		this.$getFirstUnreadMsg().removeClass('-type-firstUnread');
		
		this.parent.setCurLastReadMsgTime(this.$getLastMsg().data('time')||wMessage.oldestMsgTime);
	}, 1);
};

bMessage_view.prototype.findFirstUnreadMsg = function(list){
	var onTop = true,
		firstUnreadMsg = false;
	
	for(var msg in list){
		msg = list[msg];
		
		if( !firstUnreadMsg && msg.time > this.parent.getCurLastReadMsgTime() ){
			msg.isFirstUnread = true;
			msg.onTop = onTop;
			
			firstUnreadMsg = msg;
		}
		
		onTop = false;
	}
	
	return firstUnreadMsg;
};

bMessage_view.prototype.isLoadNew = function(loadMsgsType){
	return loadMsgsType == bMessage_view.loadMsgsType.new;
};

bMessage_view.prototype.setCanSend = function(state, text){
	if( state && text && TextParser.checkCanLinks(text) ) state = false;
	
	if( this.data.canSend != state ){
		this.data.canSend = state;
		
		this.cont.find('.message-write-btn').toggleClass('-disabled', !state);
	}
};


utils.overrideMethod(bMessage_view, 'initScroll', function __method__(){
    __method__.origin.apply(this, arguments);

    this.setScrollInited(true);

    this.$scroll.$scrollArea.trigger('scroll');
});

utils.overrideMethod(bMessage_view, 'onScroll', function __method__($getScrollArea){
    this.whileScrolling();
    
    __method__.origin.call(this, $getScrollArea);
});


bMessage_view.prototype.updScroll = function(){};

bMessage_view.prototype.doScroll = function(method, val, opt){
    this[method](val, opt);
};


bMessage_view.prototype.initScrollView = function(){
    var self = this;

    this.$scroll = IScroll.add(this.wrp.find('.js-scroll-wrp'), {
        callbacks: {
            onTotalScrollBack: function(){
                self.onTotalScrollBack();
            },
            whileScrolling: function(){
                self.whileScrolling();
            },
            onScroll: function(){
                self.onScroll($(this));
            },
            onTotalScroll: function(){
                self.onTotalScroll();
            }
        }
    });
};

bMessage_view.prototype.setScrollInited = function(onInit){
    if( onInit )
        this.scrollInited = true;
};

bMessage_view.prototype.scrollTo = function(val, opt){
    if( this.$scroll )
        this.$scroll.scrollTo(val, opt);
};

bMessage_view.prototype.$getLastViewedMsg = function($scroll){
    var self = this;

    return $scroll.find('.message-message.-type-firstUnread~.message-message.-type-marked').filter(function(){
        return self.$scroll.isBlockInView($(this));
    }).last();
};

bMessage_view.prototype.$isMsgUnderView = function($msg){
    return !(this.$scroll.isBlockOverTop($msg) || this.$isMsgInView($msg));
};

bMessage_view.prototype.$isMsgInView = function($msg){
    return this.$scroll.isBlockInView($msg);
};

bMessage_view.prototype.isNoScroll = function(){
    return !this.$scroll.hasScroll();
};