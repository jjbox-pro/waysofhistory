wCountryNew = function(id, data){
	this.name = 'countryNew';
	this.hashName = 'country';
	
	wCountryNew.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryNew, Wnd);

WndMgr.regWnd('country', wCountryNew);


wCountryNew.prepareData = function(){
	return wofh.country ? false : {};
};


wCountryNew.prototype.calcChildren = function(){
	this.children.view = bCountryNew_view;
};
	


bCountryNew_view = function(id, data){
	this.name = 'view';
	
	bCountryNew_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bCountryNew_view, Block);


bCountryNew_view.prototype.getData = function(){
	var self = this;

	this.data.formDisabled = true;

	if (wofh.account.invites.length) {
		var countries = [];

		for (var item in wofh.account.invites) {
			countries.push(wofh.account.invites[item].country);
		}

		var loaderId = contentLoader.start(
			this.parent.wrp.find('.wnd-cont-wrp'),
			0,
			function(){
				//для окна не нужна полная информация, но для CountryJoin нужна
				reqMgr.getCountry(countries, function(resp){
					contentLoader.stop(loaderId);

					self.data.invites = resp.country;

					self.dataReceived();
				});
			} 
		);
	} 
	else
		this.dataReceived();
};

bCountryNew_view.prototype.bindEvent = function(){
	var self = this;

	//ввод
	this.wrp
		.on('input change', '.cNew-input', function(){
			self.name = $(this).val();
			self.data.formDisabled = self.name.length < lib.country.namelimit[0];
			self.cont.find('.cNew-button').toggleClass('-disabled', self.data.formDisabled);
		})
		//создание страны
		.on('submit', '.cNew-form', function(){
			if( self.data.formDisabled )
				return false;

			wndMgr.addConfirm().onAccept = function(){
				reqMgr.createCountry(self.name, self.parent.close.bind(self.parent));
			};

			return false;
		})
		.on('submit', '.cNew-form-def', function(){
			wndMgr.addConfirm().onAccept = function(){
				reqMgr.createCountry('Новая страна', self.parent.close.bind(self.parent));
			};

			return false;
		})
		//присоединение к стране
		.on('click', '.cNew-invite-item', function(event){
			if( utils.checkClick(event, 'a') ) return;

			var countryId = $(this).data('id');

			wndMgr.addWnd(wCountryJoin, countryId);
		});
		
	snip.input1Handler(this.wrp);
};

bCountryNew_view.prototype.afterDraw = function(){
	servBuffer.temp.lastEnter.countryJoin = timeMgr.getNow()+15;

	servBuffer.apply(function(){notifMgr.runEvent(Notif.ids.accInvite);});
};





wCountryJoinSelect = function(id, data){
	this.name = 'countryJoinSelect';
	
	wCountryJoinSelect.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryJoinSelect, Wnd);


wCountryJoinSelect.prototype.calcChildren = function(){
	this.children.view = bCountryJoinSelect_view;
};



bCountryJoinSelect_view = function(id, data){
	this.name = 'view';
	
	bCountryJoinSelect_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bCountryJoinSelect_view, Block);


bCountryJoinSelect_view.prototype.getData = function(){
	var self = this;
	
	if (wofh.account.invites.length) {
		var countries = [];
		
		for (var item in wofh.account.invites) {
			countries.push(wofh.account.invites[item].country);
		}
		
		var loaderId = contentLoader.start(
			this.parent.wrp.find('.wnd-cont-wrp'),
			0,
			function(){
				//для окна не нужна полная информация, но для CountryJoin нужна
				reqMgr.getCountry(countries, function(resp){
					contentLoader.stop(loaderId);
					
					self.data.invites = resp.country;
					
					self.dataReceived();
				});
			} 
		);
	} 
	else
		this.dataReceived();
};

bCountryJoinSelect_view.prototype.bindEvent = function(){
	this.wrp
		.on('click', '.cNew-invite-item', function(){
			var countryId = $(this).data('id');
			
			wndMgr.addWnd(wCountryJoin, countryId);
		});
};

bCountryJoinSelect_view.prototype.afterDraw = function(){
	servBuffer.temp.lastEnter.countryJoin = timeMgr.getNow()+15;
	
	servBuffer.apply(function(){notifMgr.runEvent(Notif.ids.accInvite);});
};





wCountryJoin = function(id, data){
	this.name = 'countryJoin';
	
	wCountryJoin.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryJoin, Wnd);
	

wCountryJoin.prototype.calcChildren = function(){
	this.children.view = bCountryJoin_view;
};



bCountryJoin_view = function(id, data){
	this.name = 'view';
	
	bCountryJoin_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bCountryJoin_view, Block);


bCountryJoin_view.prototype.getData = function(){
	var self = this;
	
	this.data.id = this.parent.id;
	
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'),
		0,
		function(){
			reqMgr.getCountry(self.data.id, function(resp){
				contentLoader.stop(loaderId);
				
				self.data.country = resp.country[self.data.id];
				self.data.head = self.data.country.getAccountByPost(Country.postIds.head);
				
				self.dataReceived();
			}, {full: true});
		} 
	);
};

bCountryJoin_view.prototype.bindEvent = function(){
	var self = this;
		
	this.wrp
		.on('click', '.cJoin-accept', function(){
			var onAccept = function(){
				reqMgr.joinCountry(self.data.country, function(resp){
					set.acc.channelCountry(resp.data.chat.country);
					
					self.closeAllWnd();
				});
			};
			
			if( wofh.country )
				wndMgr.addWnd(wCountryExit, wofh.account).onAccept = onAccept;
			else
				wndMgr.addConfirm(tmplMgr.country.join({country:self.data.country}), {okText: 'Да', cancelText: 'Нет'}).onAccept = onAccept;
		})
		.on('click', '.cJoin-reject', function(){
			wndMgr.addConfirm(tmplMgr.countryJoin.reject({country: self.data.country}), {okText: 'Отвергнуть', cancelText: 'Отложить'}).onClose = function(result){
				if( result )
					reqMgr.rejectInvitation(self.data.country.id, self.closeAllWnd.bind(self));	
				
				self.closeAllWnd();
			};
		});
};

bCountryJoin_view.prototype.afterDraw = function(){
	servBuffer.temp.lastEnter.countryJoin = timeMgr.getNow()+15;
	
	servBuffer.apply(function(){notifMgr.runEvent(Notif.ids.accInvite);});
};


bCountryJoin_view.prototype.closeAllWnd = function(){
	this.parent.close();
	
	var wnd = wndMgr.getFirstWndByType(wCountryNew);
	if (wnd)
		wnd.close();
	
	wnd = wndMgr.getFirstWndByType(wCountryJoinSelect); 
	if (wnd)
		wnd.close();
};
