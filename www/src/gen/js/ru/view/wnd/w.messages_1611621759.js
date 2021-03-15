/**
	Окно переписки
*/

wMessages = function(){
	wMessages.superclass.constructor.apply(this, arguments);
};

utils.extend(wMessages, Wnd);

WndMgr.regWnd('messages', wMessages);


wMessages.prepareData = function(id){
	var data = {};
	
	if( typeof(id) === 'string' ){
		var params = utils.urlToObj(id);
		
		if( params.player ){
			data.defTabName = 'write';
			
			data.player = params.player;
		}
	}
	
    return data;
};


wMessages.prototype.calcName = function(){
    return 'messages';
};

wMessages.prototype.calcChildren = function() {
	this.children = {};
	
	this.children.write = tabMessagesWrite;
	this.children.list = tabMessagesList;
	if( wofh.account.isPremium() )
		this.children.note = tabMessagesNote;
	if( isLSAvail() )
		this.children.contacts = tabMessagesContacts;
};

wMessages.prototype.beforeShowChildren = function() {   
	var self = this;
	
    this.tabs = new Tabs(this.cont);
	this.tabs.onOpenTab = function(){
		delete self.data.text;
	};
	
	this.tabs.addTabs(this.children);
};

wMessages.prototype.afterDraw = function() {
    this.tabs.openTab(this.data.defTabName||'list');
};

wMessages.prototype.moveWnd  = function() {
	// Центрируем окно
	if( !this.centering ){
		this.setAutoPos();
		
		this.centering = true;
	}
};



/******
 * Вкладка write
 */

tabMessagesWrite = function(){
    this.name = 'write';
	this.tabTitle = 'Написать';
	
	tabMessagesWrite.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMessagesWrite, Tab);

tabMessagesWrite.setBackup = function(prop, val){
	var backup = ls.getNewMessageBackup(LS.newMessageBackup);
	
	backup[prop] = val;
	
	ls.setNewMessageBackup(backup);
};

tabMessagesWrite.prototype.getData = function(){
	this.data = {};
	
	this.data.text = ls.getNewMessageBackup(LS.newMessageBackup).text;
	
	if( this.parent.data.player )
		this.data.account = wofh.world.getAccount(this.parent.data.player);
	
    this.dataReceived();
};

tabMessagesWrite.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accMessageBlock];
	
	this.notif.other[Notif.ids.countryPost] = this.showMass;
};

tabMessagesWrite.prototype.bindEvent = function(){
    var self = this;
	
	// Текстовый счетчик
	utils.assignLengthCounter(this.cont.find('.messages-write-text'), lib.message.textmaxlen, this.cont.find('.messages-write-chrCount span'));
	
	this.wrp.on('click', '.icon-contacts-popup', function(){
		var $to = self.cont.find('input[name="to"]');
		
		wndMgr.addWnd(wContacts, {callback: function(contact){
			$to.val(contact.getName()).trigger('input');
		}});
	});
	
	this.wrp
		.on('input', '.messages-write-text', function(){
			var val = $(this).val();
			
			self.parent.data.text = val;
			
			self.setCanSendMessage(!!val, val);
			
			tabMessagesWrite.setBackup('text', $(this).val());
		})
		.on('input', 'input[name="topic"]', function(){
			tabMessagesWrite.setBackup('topic', $(this).val());
		})
		.on('input', '.messages-write-to', function(){
			tabMessagesWrite.setBackup('to', $(this).val());
		})
		.on('change', '.messages-write-mass', function(){
			// Выключаем поле с автором, если создается переписка стране
			$(this).closest('.messages-write-block').find('.messages-write-to').prop('disabled', $(this).prop('checked'));
			$(this).closest('.messages-write-mass-wrp').find('.messages-write-noDiscuss-wrp').html(tmplMgr.messages.write.mass.noDiscuss({show: $(this).prop('checked')}));
		})
		.on('submit', '.messages-write-form', function(){
			if( !self.canSendMessage )
				return false;
			else
				self.setCanSendMessage(false);
			
			var form = $(this),
				data = utils.urlToObj(form.serialize());
			
			reqMgr.sendMessage(data.to, data.topic, data.text, data.mass, data.access, {
				onSuccess: function() {
					self.setCanSendMessage(true);
					
					ls.cleanNewMessageBackup();
					
					utils.clearForm(form, {triggers: ['change'], noDefVal: true});
					
					self.parent.tabs.openTab('list');
				},
				onFail: function(){
					self.setCanSendMessage(true);
				}
			});
			
			return false;
		});
};

tabMessagesWrite.prototype.afterDraw = function(){
	 this.setCanSendMessage(!!this.data.text, this.data.text);
	 
	 this.showMass();
};

tabMessagesWrite.prototype.afterOpenTab = function(){
	this.parent.cont.find('.js-messages-header').text(this.tabTitle);
};


tabMessagesWrite.prototype.setCanSendMessage = function(state, text){
	if( state && text && TextParser.checkCanLinks(text) ) state = false;
	
	if( this.canSendMessage != state ){
		this.canSendMessage = state;
		this.cont.find('.messages-write-btn').toggleClass('-disabled', !state);
	}
};

tabMessagesWrite.prototype.showMass = function(){
	this.cont.find('.messages-write-mass-wrp').html(tmplMgr.messages.write.mass());
};



/******
 * Вкладка list
 */

tabMessagesList = function(){
    this.name = 'list';
	this.tabTitle = 'Переписка';
	
	tabMessagesList.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(tabMessagesList, Tab);

tabMessagesList.prototype.getData = function(){
	var self = this;
	
	var loaderId = contentLoader.start( 
        this.parent.wrp.find('.wnd-cont-wrp'),
        20, 
        function(){
			self.getReqData(function(){
				reqMgr.getMessageList(this.pos, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							for (var thread in resp.list){
								thread = resp.list[thread];
								
								thread.player = wofh.account.id == thread.account1.id ? thread.account2: thread.account1;
								
								thread.reply = thread.lastacc != wofh.account.id;
								
								thread.topicLink = $(snip.wrp('', thread.topic));
								thread.topicLink.find('a').each(function(){
									$(this).replaceWith(snip.wrp('', $(this).html()));
								});
								thread.topicLink = thread.topicLink.html();
							}
							
							this.data.messages = resp.list;
							
							if(resp.next)
								this.data.next = resp.first+15;
							
							if(resp.first)
								this.data.prev = resp.first-15;
							
							this.dataReceived();
						}
					);
				});
			});
        } 
    );
};

tabMessagesList.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accMessage];
	
	this.notif.other[Notif.ids.accReadMessage] = this.notifReadMessage;
};

tabMessagesList.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.page-nav-prev, .page-nav-next', function(){
			var pos = $(this).attr('href');
				
			if( pos ){
				self.pos = pos;
				
				self.show();
			}
			
			return false;
		})
		.on('change', '.js-messages-selectAll', function(){
			self.cont.find('.s-tbl-messages.-type-list input').prop('checked', $(this).prop('checked'));
		})
		.on('click', '.js-messages-delSelected', function(){
			var data = utils.urlToObj(self.cont.find('.js-messages-list-form').serialize());
			
			if ( utils.sizeOf(data) == 0 ) return false;
			
			reqMgr.deleteMessages(false, data, function(){
				self.show();
			});
			
			return false;
		})
		.on('click', '.js-messages-readAll', function(){
			reqMgr.readMes(timeMgr.servTime, function(){
				self.show();
			});
			
			return false;
		})
		.on('click', '.js-messages-delAll', function(){
			wndMgr.addConfirm('Ты действительно хочешь удалить все сообщения?').onAccept = function(){
				reqMgr.deleteMessages(timeMgr.servTime, false, function(){
					self.show();
				});
			};
			
			return false;
		});
};

tabMessagesList.prototype.afterDraw = function(){
	if( !debug.isAdmin() ) {
		ls.setMessageTime(timeMgr.getNow());
		
		notifMgr.runEvent(Notif.ids.accMessageNew);
	}
	
	if( this.data.messages ){
        if( this.data.prev === undefined )
			this.wrp.find('.page-nav-prev').removeAttr('href');
        else
            this.wrp.find('.page-nav-prev').attr('href', this.data.prev);
        
        if( this.data.next === undefined )
            this.wrp.find('.page-nav-next').removeAttr('href');
        else
            this.wrp.find('.page-nav-next').attr('href', this.data.next);
    }
	
	this.parent.moveWnd();
};

tabMessagesList.prototype.afterOpenTab = function(){
	this.parent.cont.find('.js-messages-header').text(this.tabTitle);
};


tabMessagesList.prototype.notifReadMessage = function(id){
	for (var thread in this.data.messages){
		thread = this.data.messages[thread];
		
		if( thread.id == id && !thread.isread ){
			this.show();
			
			return;
		}
	}
};



/******
 * Вкладка note
 */

tabMessagesNote = function(){
    this.name = 'note';
	this.tabTitle = 'Блокнот';
	
	tabMessagesNote.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMessagesNote, Tab);

tabMessagesNote.prototype.getData = function(){
	var self = this;
	
	this.data = {};
	
	reqMgr.getMessageNote(function(text){
		self.data.text = text;

		self.dataReceived();
	});
};

tabMessagesNote.prototype.bindEvent = function(){
    var self = this;
	
	// Текстовый счетчик
	utils.assignLengthCounter(this.cont.find('.messages-note-text'), lib.message.notemaxlen, this.cont.find('.messages-note-chrCount span'));
	
	this.wrp
		.on('submit', '.messages-note-form', function(){
			reqMgr.storeMessageNote(self.cont.find('.messages-note-text').val(), function(){
				self.parent.tabs.openTab('list');
			});
			
			return false;
		})
		.on('input', '.messages-note-text', function(){
			var val = $(this).val();
			
			self.parent.data.text = val;
		});
};

tabMessagesNote.prototype.afterOpenTab = function(){
	this.parent.cont.find('.js-messages-header').text(this.tabTitle);
};



/******
 * Вкладка contacts
 */

tabMessagesContacts = function(){
    this.name = 'contacts';
	this.tabTitle = 'Контакты';
	
	tabMessagesContacts.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMessagesContacts, Tab);

tabMessagesContacts.prototype.afterOpenTab = function(){
	this.parent.cont.find('.js-messages-header').text(this.tabTitle);
	
	contacts.show(this.cont, false);
};

tabMessagesContacts.prototype.getHref = function(){
	return hashMgr.getWndHref('contacts');
};

tabMessagesContacts.prototype.isClickable = function(){
	return false;
};