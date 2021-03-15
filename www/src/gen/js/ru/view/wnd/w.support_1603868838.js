wSupport = function(id, data, parent){
	wSupport.superclass.constructor.apply(this, arguments);
};

utils.extend(wSupport, Wnd);

WndMgr.regWnd('support', wSupport);


wSupport.prepareData = function(id, extData){
	var data = {};
	
	if( extData )
		data.initTicket = extData;
	
	return data;
};


wSupport.prototype.calcName = function(){
	return 'support';
};

wSupport.prototype.calcChildren = function(){
	this.children.consoleErrors = bSupport_consoleErrors;
	
	this.children.private = bSupport_private;
};

wSupport.prototype.bindEvent = function(){
	this.wrp
		.on('click', '.js-ticket', function() {
			wndMgr.addWnd(wTicket, $(this).data('id'));
			
			return false;
		});
};

wSupport.prototype.beforeClose = function(result){
	// Предотвращением закрытие окна с набранным текстом
	if (this.data.canAddTicket){
		wndMgr.addConfirm('Ты действительно хочешь закрыть окно? Учти что всё написанное, но не отправленное или не сохраненное пропадет безвозвратно.').onAccept = function(){
			delete this.data.canAddTicket;
			
			this.close();
		}.bind(this);
		
		return true;
	}
	
	ls.cleanTicketTxtBackup();
};

wSupport.prototype.beforeShowChildren = function(){   
    this.tabs = new Tabs(this.cont, this);
	
	 this.tabs.onOpenTab = function(tab){ 
		tab.updScroll();
	 };
	
	this.tabs.addTabs(this.children);
};

wSupport.prototype.afterDraw = function(){
	this.tabs.openTab('private');
};


wSupport.prototype.notifUpd = function(data){
	if( !data || data.writer == 1 || data.forceUpd || (data.ticketUpdate && (data.status == wTicket.ids.userClose || data.status == wTicket.ids.adminClose)) || data.deleteTicketMessage )
		this.show();
	else if ( data.writer == wofh.account.id ){
		if( data.newTicket ){
			var ticket = {
				id: data.ticket,
				topic: data.topic,
				status: data.status
			};
			
			this.wrp.find('.js-ticketsHeader').removeClass('hidden');
			this.wrp.find('.sup-list').prepend(tmplMgr.support.ticket({ticket:ticket}));
		}
	}
};


wSupport.prototype.initTicket = function(data){
	this.data.initTicket = data;
	
	this.show();
};



bSupport_consoleErrors = function(){
	bSupport_consoleErrors.superclass.constructor.apply(this, arguments);
};

utils.extend(bSupport_consoleErrors, Block);


bSupport_consoleErrors.prototype.calcName = function(){
	return 'consoleErrors';
};

bSupport_consoleErrors.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.sysConsoleError];
};

bSupport_consoleErrors.prototype.canDisplay = function(){
	return ls.getConsoleErrors([]).length > 0;
};

bSupport_consoleErrors.prototype.bindEvent = function(){
	this.wrp.on('click', '.consoleErrors-button', function(){
		wndMgr.addPopupWnd(wConsoleErrors);
	});
};



bSupport_private = function(){
	this.name = 'private';
	this.tabTitle = snip.acc(wofh.account);
	
	bSupport_private.superclass.constructor.apply(this, arguments);
};

utils.extend(bSupport_private, Tab);


bSupport_private.prototype.initOptions = function(){
	this.delegate('initOptions', bSupport_private, arguments);
	
	this.options.hasReqData = true;
};

bSupport_private.prototype.getData = function(){
	var self = this;
	
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		100,
		function(){
			self.getReqData(function(){
				reqMgr.getSupportData(function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(resp){
							contentLoader.stop(loaderId);
							
							this.data.canAddTicket = false;
							
							var ticketTxtBackup,
								initTicket = this.parent.data.initTicket;
							
							ticketTxtBackup = ls.getTicketTxtBackup({});
							
							if( initTicket ){
								ticketTxtBackup.topic = initTicket.topic||ticketTxtBackup.topic;

								ticketTxtBackup.text = initTicket.text||ticketTxtBackup.text;
							}
							
							this.data.ticketTxtBackup = ticketTxtBackup;
							
							if( resp ) 
								this.data.list = resp;
							
							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bSupport_private.prototype.addNotif = function(){
	this.notif.other[Notif.ids.support] = this.parent.notifUpd;
};

bSupport_private.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('submit', 'form', function(){
			if( !self.data.canAddTicket )
				return false;

			var form = $(this),
				data = utils.urlToObj(form.serialize());

			reqMgr.supportOpen(data.topic, data.text, function(){
				utils.clearForm(form, {noDefVal: true});
				
				self.data.ticketTxtBackup = {};
				
				ls.cleanTicketTxtBackup();
				
				self.data.canAddTicket = false;
			});

			return false;
		})
		.on('input', '.js-inpTopic, .js-txtaText', function(){
			if( $(this).hasClass('js-inpTopic') )
				self.data.ticketTxtBackup.topic = $(this).val();
			else
				self.data.ticketTxtBackup.text = $(this).val();

			ls.setTicketTxtBackup(self.data.ticketTxtBackup);

			self.checkFields();
		});
};

bSupport_private.prototype.afterDraw = function(){
	snip.input1Handler(this.cont);
	
    utils.assignLengthCounter(this.wrp.find('.js-inpTopic'), lib.ticket.maxtopiclen, this.wrp.find('.js-inpTopicLength'));
	utils.assignLengthCounter(this.wrp.find('.js-txtaText'), lib.ticket.maxtextlen, this.wrp.find('.js-txtaTextLength'));
	
	this.initScroll();
};


bSupport_private.prototype.checkFields = function(){
	if( this.wrp.find('.js-inpTopic').val() && this.wrp.find('.js-txtaText').val() ){
		this.data.canAddTicket = true;
		
		this.wrp.find('.js-addTicket').removeClass('-disabled');
	}
	else{
		this.data.canAddTicket = false;
		
		this.wrp.find('.js-addTicket').addClass('-disabled');
	}

	this.parent.data.canAddTicket = this.data.canAddTicket;
};





/**
	Окно тикета
*/

wTicket = function(){
	this.name = 'ticket';
	this.hashName = 'ticket';
	
	wTicket.superclass.constructor.apply(this, arguments);
};

utils.extend(wTicket, Wnd);

WndMgr.regWnd('ticket', wTicket);


wTicket.ids = {
	userSend: 0,
	adminSend: 1,
	userClose: 2,
	adminClose: 3,
	hold: 4,
};

wTicket.prepareData = function(id){
	if( id )
		return {id: id};
};


wTicket.prototype.calcChildren = function(){
	this.children.view  = bTicket_view;
};



bTicket_view = function(){
	this.name = 'view';
	
	bTicket_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bTicket_view, Block);


bTicket_view.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		// Проверка шаблона
		.on('input', '.sup-templ form textarea', function(){
			$(this).parents('form').toggleClass('-disabled', !$(this).val());
			$(this).siblings('button').toggleClass('-disabled', !$(this).val());
			
			return false;
		})
		// Создание шаблона
		.on('submit', '.sup-templ form', function(){
			if( $(this).hasClass('-disabled') )
				return false;
			
			var form = $(this);
			var data = utils.urlToObj(form.serialize());
			
			reqMgr.supportAddTemplate(data.text, function(resp){
				var template = [{text: data.text, id:resp.data}];
				
				self.wrp.find('.sup-templ ul').append(tmplMgr.ticket.templates(template));
				
				utils.clearForm(form);
			});
			
			return false;
		})
		// Удаление шаблона
		.on('click', '.js-delTemplate', function(){
			reqMgr.supportDelTemplate($(this).data('ttid'), function(){
				$(this).closest('li').first().remove();
			}.bind(this));
			
			return false;
		})
		// Создание сообщения
		.on('submit', '.sup-sendMessage', function(){
			var $form = $(this),
				data = utils.urlToObj($form.serialize());
			
			if( $form.hasClass('-disabled') )
				return false;
			else
				$form.addClass('-disabled');
			
			if( data.text.length ){
				self.data.ticketText = data.text; 
				
				reqMgr.supportWrite(self.data.id, data.text, function(){
					$form.removeClass('-disabled');
					
					if( !debug.isAdmin() )
						utils.clearForm($form);
				});
			}
			
			return false;
		})
		// Удаление сообщения
		.on('click', '.js-delMessage', function(){
			reqMgr.supportDelMessage($(this).data('id'), $(this).data('tmid'));
		
			return false;
		})
		// Закрытие сообщения
		.on('click', '.sup-hold-show', function(){
			self.wrp.find('.sup-hold-wrp').removeClass('-hidden');
			return false;
		})
		.on('click', '.sup-hold', function(){
			reqMgr.supportHold(self.data.id, $(this).data('time'));
			
			self.parent.close();
			
			notifMgr.runEvent(Notif.ids.support);
		})
		// Закрытие сообщения
		.on('click', '.sup-close', function(){
			wndMgr.addConfirm().onAccept = function(){
				reqMgr.supportClose(self.data.id,  function(){
					if( !debug.isAdmin() ){
						self.wrp.find('.sup-reply').remove();
						self.wrp.find('.sup-vote').removeClass('dN');
					}
				});
			};
			
			return false;
		})
		// Использование шаблона
		.on('click', '.sup-useTempl', function(event){
			var textArea = self.wrp.find('.sup-sendMessage textarea');
			textArea.val((event.altKey ? textArea.val() : '') + $(this).html());
			return false;
		})
		//доп. инфа
		.on('submit', '.sup-info', function(){
			var form = $(this);
			
			var loaderId = contentLoader.start( 
				$(this).find('.js-saveSupInfo'), 
				0, 
				function(){
					reqMgr.supportInfo(self.data.id, form.find('textarea').val(), function(){
						contentLoader.stop(loaderId);
					});
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}} 
			);
			
			
			return false;
		})
		//оценка
		.on('mousemove', '.sup-vote .sup-stars', function(event){
			self.calcTicketRate($(this), event);
		})
		.on('mouseout', '.sup-vote .sup-stars', function(){
			$(this).attr('data-rate', 0);
		})
		.on('click', '.sup-vote .sup-stars', function(event){
			if( $(this).hasClass('-disabled') )
				return false;
			else
				$(this).addClass('-disabled');
			
			self.calcTicketRate($(this), event);
			
			reqMgr.supportRate(self.data.id, $(this).attr('data-rate'));
		});
};

bTicket_view.prototype.getData = function(){
	var self = this;
	
	this.loadData(function(){
		self.countReq = 1;
		
		reqMgr.getTicketData(self.parent.data.id, function(resp){
			self.data = resp;
			
			self.data.id = self.parent.data.id;
			self.data.admin = debug.isAdmin();
			self.data.messageLenght = lib.ticket.maxtextlen;
			
			self.data.author = resp.account.id == wofh.account.id;
			
			self.data.messages = resp.message;

			if( debug.isAdmin() )
				self.getTicketTemplates();
			
			self.dataReceived();
		});
	});
};

bTicket_view.prototype.dataReceived = function(){
	if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId);
		
		bTicket_view.superclass.dataReceived.apply(this, arguments);
	}
};

bTicket_view.prototype.addNotif = function(){
	this.notif.other[Notif.ids.support] = this.notifUpd;
};

bTicket_view.prototype.getTicketTemplates = function() {
	var self = this;
	
	this.countReq++;
	
	reqMgr.getTicketTemplates(function(resp){
		self.data.templates = resp;
		
		self.dataReceived();
	});
};

bTicket_view.prototype.afterDraw = function(){
	utils.assignLengthCounter(this.wrp.find('.js-txtaText'), lib.ticket.maxtextlen, this.wrp.find('.js-txtaTextLength'));
	
	this.initScroll();
};

bTicket_view.prototype.afterShow = function(){
	notifMgr.runEvent(Notif.ids.supportTicketRead, {id: this.data.id});
};


bTicket_view.prototype.notifUpd = function(data){
	data = data||{};
	
	if( data.ticket == this.data.id ){
		if( data.newTicketMessage  ){
			var message = {
				id: this.data.id,
				admin: debug.isAdmin(),
				messages: [{
					id: data.message,
					account: data.writer == Account.admin.id ? Account.admin : this.data.account,
					time: timeMgr.getNow(),
					text: data.text.replace(/\n/g, '<br>')
				}]
			};

			this.wrp.find('.sup-ticket ul').append(tmplMgr.ticket.messages(message));
		}
		else if( data.deleteTicketMessage ){
			this.wrp.find('.sup-list li[data-tmid="' + data.message + '"]').remove();

			if( this.wrp.find('.sup-list li').length == 0 )
				this.parent.close();
		}
		else if( data.ticketUpdate && (data.status == wTicket.ids.userClose || data.status == wTicket.ids.adminClose) ){
			if( debug.isAdmin() )
				this.show();
			else if ( data.status == wTicket.ids.userClose && data.rate !== undefined && !debug.isAdmin() )
				this.parent.close();
		}
	}
};


bTicket_view.prototype.loadData = function(callback, opt){
	opt = opt||{};
	
	this.loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		opt.delay||100,
		callback
	);
};

bTicket_view.prototype.calcTicketRate = function(stars, event){
	var disp = event.clientX + $(document).scrollLeft() - stars.offset().left;
	var starSize = 12;
	var rate = utils.toInt((disp-1)/starSize)+1;
	stars.attr('data-rate', rate);
};





wConsoleErrors = function(){
	wConsoleErrors.superclass.constructor.apply(this, arguments);
};

utils.extend(wConsoleErrors, ConfirmWnd);


wConsoleErrors.prototype.calcName = function(){
	return 'consoleErrors';
};

wConsoleErrors.prototype.modifyCont = function(){
	this.cont.find('.js-popup-ok').removeClass('-type-green').addClass('-type-red');
	this.cont.find('.js-popup-cancel').removeClass('-type-red');
};

wConsoleErrors.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.consoleError-send', function(){
			var $wrp = $(this).closest('.consoleError-wrp'),
				data = {topic: 'Важные данные'},
				wnd = wndMgr.getFirstWndByType(wSupport),
				navigator = wndMgr.window.navigator||{},
				commonInfo = [
					debug.getWorld() + ' ' + timeMgr.fMoment(timeMgr.getNow()) + ' ' + wofh.account.getName(),
					'mobile: ' + (utils.isMobileDevice() ? 'yes' : 'no'),
					'platform: ' + (navigator.platform||'unknown'),
					'userAgent: ' + (navigator.userAgent||'unknown')
				],
				errorInfo = $wrp.find('.consoleError').data('clipboard-text');
				
			if( typeof(errorInfo) == 'object' ){
				data.topic += ' (' + utils.lenLim(errorInfo.msg, {length: 15, noWrp: true}) + ')';
				
				errorInfo = JSON.stringify(errorInfo);
			}
			
			data.text = commonInfo.join('\n') + '\n' + errorInfo;
			
			if( wnd )
				wnd.initTicket(data);
			else
				wndMgr.addWnd(wSupport, '', data);
			
			$wrp.find('.consoleError-del').trigger('click');
			
			self.close();
		})
		.on('click', '.consoleError-del', function(){
			var $wrp = $(this).closest('.consoleError-wrp');
			
			wndMgr.delConsoleError($wrp.find('.consoleError').data('time'));
			
			if( ls.getConsoleErrors([]).length > 0 )
				$wrp.remove();
			else
				self.close();
		})
		.on('click', '.consoleError-detail', function(){
			$(this)
					.closest('.consoleError-wrp')
					.find('.consoleError')
					.removeClass('-type-brief');
			
			$(this).remove();
		});
};

wConsoleErrors.prototype.beforeClose = function(result){
	if( !result )
		return;
	
	var self = this;
	
	wndMgr.addConfirm().onAccept = function(){
		self.close();
		
		ls.cleanConsoleErrors();
		
		notifMgr.runEvent(Notif.ids.sysConsoleError);
	};
	
	return true;
};


wConsoleErrors.prototype.setButtonsText = function(){
	this.data.okText = this.options.okText||'Удалить все';
	this.data.cancelText = this.options.cancelText||'Закрыть';
};

wConsoleErrors.prototype.setDataCont = function(contOrTmpl){
	this.data.cont = tmplMgr.confirm.consoleErrors();
};