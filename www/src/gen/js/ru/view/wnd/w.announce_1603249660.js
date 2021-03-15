/**
	Окно объявлений
*/

wAnnounce = function(){
	wAnnounce.superclass.constructor.apply(this, arguments);
};

utils.extend(wAnnounce, Wnd);

WndMgr.regWnd('announce', wAnnounce);


wAnnounce.prepareData = function(){
    var data = {};
	
	return data;
};

wAnnounce.getIconsGroups = function(){
	return [[8, 0, 1], [2, 3, 4], [5, 6, 7], [9, 10, 11], [12, 13, 14], [15, 16, 17]];
};

wAnnounce.prototype.calcName = function(){
	return 'announce';
};

wAnnounce.prototype.getData = function(){
	var announces = utils.clone(wofh.announces);
	
	for(var ann in announces){
		var ann = announces[ann];
		
		ann.player = wofh.world.getAccount(ann.account.id);
		
		delete ann.account;

		ann.text = ann.text;

		ann.del = ann.end < timeMgr.getNow();
		ann.start = ann.start;
		ann.end = ann.end;
		ann.hours = (ann.end-ann.start)/3600;
	}

	this.data.announces = announces||[];

	this.dataReceived();
};

wAnnounce.prototype.addNotif = function(){
	this.notif.other[Notif.ids.wsAnn] = function(annData){
		if( annData.del == true ){
			var annPos = this.getAnnPos(annData.id, annData.account.id);
			var ann = this.data.announces[annPos];
			
			ann.end = annData.end; //timeMgr.getNow();
			ann.del = true;
			
			delete annData.del;
		}
		else if( annData.prolong == true ){
			var annPos = this.getAnnPos(annData.id, annData.account.id);
			var ann = this.data.announces[annPos];
			
			ann.end = annData.end;
			
			delete annData.prolong;
		}
		else{
			var ann = {
				id: annData.id,
				player: annData.account,
				start: annData.start,
				end: annData.end,
				hours: (annData.end-annData.start)/3600,
				
				icon: annData.icon,
				text: annData.text
			};
			
			if(wofh.country)
				ann.country = {
					id: wofh.country.id,
					name: wofh.country.name,
					flag: wofh.country.flag
				};
			
			this.data.announces.splice(0, 0, ann);
			
			this.clearForm();
		}
		
		this.showAnnounce(true);
	};
};

wAnnounce.prototype.bindEvent = function(){
    var self = this;
	
	// Время сокрытия объявлений
	this.data.cutTime = wofh.account.isPremium() ? servBuffer.serv.ann.time : 0;
	
	// Создание объявления
	this.wrp
		.on('submit', 'form[name=typing2]', function(){
			var form = self.wrp.find('form[name=typing2]');
			var data = utils.urlToObj(form.serialize());
			self.publicAnnounce(data);
			return false;
		})
		//удаление объявления
		.on('click', '.ann_del', function(){
			var ann = $(this).parent().parent();
			wndMgr.addConfirm().onAccept = function(){
				self.delAnnounce(ann.data('id'));
			};
		})
		//пролонгирование сообщения
		.on('click', '.ann_prolong', function(){
			var $annTag = $(this).parent().parent();
			
			wndMgr.addConfirm(tmplMgr.announce.prolong({id: $annTag.data('id'), player: $annTag.data('playerid')}), {
				okText: 'Продлить',
				callbacks: {
					afterDraw: function(){
						self.initAnnSlider(this.wrp.find('.ann_prolong_wnd'));
						self.setSliderZone(this.wrp.find('.ann_prolong_wnd'));
					},
					onAccept: function(){
						var $annProlong = this.wrp.find('.ann_prolong_wnd');
						
						self.prolongAnnounce($annProlong.data('id'), $annProlong.data('playerid'));
					}
				}
			});
		})
		//скрыть объявления
		.on('click', '.ann_hide', function(){
		self.hideAnnounce();
	})
		// Перезапустить объявление
		.on('click', '.ann_restart', function(){
		var $ann = $(this).parent().parent();
		self.restartAnnounce($ann.data('id'), $ann.data('playerid'));
	});
	
	if( wofh.account.canMessage() ){
		this.wrp.on('input', '.js-announceForm-wrp textarea', function(){
			var charCount = $(this).val().length;

			if( charCount > lib.announce.textlen ){
				$(this).val( $(this).val().slice(0, lib.announce.textlen - charCount) );
				self.wrp.find('#span2').text(0);
				return false;
			}
			
			self.wrp.find('#span2').text(lib.announce.textlen - charCount);
			
			charCount ? self.setCanPublic(true) : self.setCanPublic(false);
		});
	}
};

wAnnounce.prototype.afterDraw = function(){
	this.showAnnounce();
	
	// Отображение формы нового объявления если не запрещено 
	if( wofh.account.canMessage() ) {
		this.wrp.find('.js-announceForm-wrp').html(tmplMgr.announce.form());
		
		// Слайдер
		var $sliderBlock = this.wrp.find('.ann_sliderblock');
		
		this.initAnnSlider($sliderBlock);
		
		this.setSliderZone($sliderBlock);
	}
	else
		this.wrp.find('.js-announceForm-wrp').html(snip.alertTmpl.blocked.message());
	
	this.initScroll();
};


wAnnounce.prototype.initAnnSlider = function($el){
	var self = this;
	
	snip.sliderHandler($el.find('.slider'), {
		min: 1,
		slide: function(event, ui){
			self.data.minutes = ui.value;
			
			self.showHours($el);
		}
	});
};

wAnnounce.prototype.setSliderZone = function($el){
	var self = this;
	
	var step = lib.announce.minutes;
	var max = Math.floor(lib.announce.maxminutes/step)*step;
	
	this.data.minutes = this.data.minutes || step;
	this.data.minutes = Math.ceil(this.data.minutes/step)*step;
	
	if( this.data.minutes > max ) this.data.minutes = max;
	
	snip.sliderHandler($el.find('.slider'), {
		min: step,
		step: step,
		max: max,
		value: self.data.minutes,
		change: function(event, ui) {
			if( wofh.account.isAdmin() ){
				if (ui.value == $(this).slider('option', 'max')) {
					$(this).slider({max: $(this).slider('option', 'max') * 2});
				}
			}
		}
	});
	
	this.showHours($el);
	
};

wAnnounce.prototype.showHours = function($el){	
	$el.find('.ann_hours').html(timeMgr.fPeriod(this.data.minutes * 60));
	
	this.data.needLuck = utils.toInt(this.data.minutes/(lib.announce.minutes));
	
	$el.find('.ann_totalPrice').html(this.data.needLuck);
};

wAnnounce.prototype.publicAnnounce = function(data){
	var self = this;
	
	if( !this.data.canPublic ) return false;
	
	// Проверяем удачу
	if( !wofh.account.isAdmin() && self.data.needLuck > wofh.account.getCoinsBoughtMoved() ) {
		wndMgr.addAlert(wAnnounce.errors[ErrorX.ids.WEnoLuck].replace('%%needLuck%%', this.data.needLuck));
		return;
	}
	
	if(!runOnce.run('announcePublic')) return;
	
	var loaderId = contentLoader.start( 
		this.wrp.find('.js-public'), 
		0, 
		function(){
			reqMgr.announcePublic(data.icon, this.data.needLuck, data.text, function(resp){
				if(resp.error){
					var alert = wAnnounce.errors[resp.error];
					
					if( resp.error == ErrorX.ids.WEcantLoadTown || resp.error == ErrorX.ids.WEnoLuck )
						alert = wAnnounce.errors[resp.error].replace('%%needLuck%%', resp.luck);
					
					contentLoader.stop(loaderId, false, alert);
				}
				else
					contentLoader.stop(loaderId, true);
			});
		}.bind(this),
		{icon: ContentLoader.icon.short, cssPosition: {right: -55, top: 1}, callback:function(){runOnce.over('announcePublic');}} 
	);
	
};

wAnnounce.prototype.clearForm = function(){
	var form = this.wrp.find('form[name=typing2]');
	
	form.find('[name=icon]:first').attr('checked', 'checked');
	form.find('textarea').val('');
	
	this.setSliderZone(form);
	
	this.setCanPublic(false);
};
	
wAnnounce.prototype.showAnnounce = function(scrollTop){
	// Убираем скрытые сообщения
	var data = [];
	for(var ann in this.data.announces){
		var ann = this.data.announces[ann];
		if( ann.start > this.data.cutTime ) data.push(ann);
	}
	
	this.wrp.find('.ann_hide').html(data.length ? 'Скрыть эти объявления' : 'Показать все скрытые');
	
	// Показываем
	this.wrp.find('.js-announces-wrp').html(tmplMgr.announce.announces(data));
	
	if( scrollTop )
		this.doScroll('scrollTo', 'top');
};

wAnnounce.prototype.restartAnnounce = function(id, playerId){
	var self = this;
	
	var annPos = self.getAnnPos(id, playerId);
	
	var ann = self.data.announces[annPos];

	// Данные формы
	self.wrp.find('[name=icon][value='+ann.icon+']').attr('checked','checked');
	self.wrp.find('textarea').val(ann.text);
	
	self.setSliderZone(self.wrp);
	
	self.wrp.find('.js-announceForm-wrp textarea').trigger('input');
};

wAnnounce.prototype.delAnnounce = function(id){
	var self = this;
	
	reqMgr.announceDel(id);
};

wAnnounce.prototype.getAnnPos = function(id, playerId){
	for(var annPos in this.data.announces){
		var ann = this.data.announces[annPos];
		if(ann.id == id && ann.player.id == playerId){
			return annPos;
		}
	}
};

wAnnounce.prototype.prolongAnnounce = function(id, playerId){
	var self = this;
	
	// Проверяем удачу
	if( !wofh.account.isAdmin() && this.data.needLuck > wofh.account.getCoinsBought() + wofh.account.getCoinsMoved() ) {
		wndMgr.addAlert(wAnnounce.errors[ErrorX.ids.WEnoLuck].replace('%%needLuck%%', this.data.needLuck));
		
		return;
	}
	
	var ann = self.data.announces[self.getAnnPos(id, playerId)];
	
	reqMgr.announceProlong(id, this.data.needLuck, function(resp){
		if(resp.error){
			var alert = wAnnounce.errors[resp.error];
			
			if( resp.error == ErrorX.ids.WEcantLoadTown || resp.error == ErrorX.ids.WEnoLuck )
				alert = wAnnounce.errors[resp.error].replace('%%needLuck%%', resp.luck);
			
			wndMgr.addAlert(alert);
		}
	});
};

wAnnounce.prototype.hideAnnounce = function(){
	var self = this;
	var time = self.wrp.find('.js-announces-wrp > div').length == 0 ? 0 : timeMgr.getNow();
	
	servBuffer.temp.ann.time = time;
	servBuffer.apply();
	
	self.data.cutTime = time;
	
	self.showAnnounce();
};

wAnnounce.prototype.setCanPublic = function(state){
	var self = this;
		
	if( this.data.canPublic != state ){
		this.data.canPublic = state;

		this.wrp.find('.js-public').toggleClass('-disabled', !state);
	}
};

wAnnounce.errors = {};
wAnnounce.errors[ErrorX.ids.WEunknown] = 'Неправильно указаны часы';
wAnnounce.errors[ErrorX.ids.WEnoResources] = 'Нельзя указывать более ' + (lib.announce.maxminutes/60) + ' часов';
wAnnounce.errors[ErrorX.ids.WEnoTraders] = 'Отсутствует текст объявления';
wAnnounce.errors[ErrorX.ids.WEbadAccount] = 'Сначала выполни задания';
wAnnounce.errors[ErrorX.ids.WEcantLoadTown] = 'Нужно %%needLuck%% купленных Монет Удачи';
wAnnounce.errors[ErrorX.ids.WEnoDataInBd] = 'Текст содержит недопустимую ссылку';
wAnnounce.errors[ErrorX.ids.WEbadData2] = 'Недопустимая ссылка в тексте';
wAnnounce.errors[ErrorX.ids.WEnoLuck] = 'Нужно %%needLuck%% купленных Монет Удачи';