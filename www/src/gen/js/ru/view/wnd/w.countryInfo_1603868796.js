wCountryInfo = function(){
	wCountryInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryInfo, Wnd);

WndMgr.regWnd('countryInfo', wCountryInfo);


wCountryInfo.prepareData = function(id){
	return id ? {id: id} : false;
};


wCountryInfo.prototype.calcName = function(){
	return 'countryInfo';
};

wCountryInfo.prototype.initWndOptions = function(){
    wCountryInfo.superclass.initWndOptions.apply(this, arguments);
    
	this.options.clipboard = true;
};

wCountryInfo.prototype.calcChildren = function(){
	this.children.view = bCountryInfo_view;
};

wCountryInfo.prototype.updCountryInfo = function(country){
	this.wrp.find('.js-clipboard-wrp').html(tmplMgr.snipet.clipboard({tag:'c' + country.id}));
	this.wrp.find('.countryInfo_title').html(country.name);
};


// Убираем проверку на конфликтующие окна
wCountryInfo.prototype.getConflictWnd = wCountryInfo.prototype.getIdentWnd;



bCountryInfo_view = function(){
	this.name = 'view';
	
	bCountryInfo_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bCountryInfo_view, Block);


bCountryInfo_view.prototype.getData = function(){
	var self = this;
	
	this.countReq = 1;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.view-countryInfo'), 
		0,
		function(){
			var opt = {
				full: true,
				alliesIds: self.getAlliesIds()
			};
			
			self.getReqData(function(){
				reqMgr.getCountry(this.parent.data.id, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							if( !resp || !resp.country || !resp.country[this.parent.data.id] ){
								this.parent.close();
								
								return;
							}
							else
								this.data.country = resp.country[this.parent.data.id];

							this.parent.updCountryInfo(this.data.country);

							// Сортируем аккаунты страны по количеству населения
							this.data.country.accountsList = this.data.country.getSortedAccounts();

							//считаем сумму городов и населения
							this.data.country.pop = 0;
							this.data.country.towns = 0;
							for(var acc in this.data.country.accountsList){
								acc = this.data.country.accountsList[acc];
								this.data.country.towns += acc.towns;
								this.data.country.pop += acc.pop;
							}

							if( wofh.account.isAdmin() )
								this.getCountryHead();

							// Подготавливаем данны о странах союзниках и врагах
							var relations = this.data.country.relations;

							for(var countryId in relations)
								relations[countryId] = {relation:relations[countryId], country: wofh.world.getCountry(countryId)};

							this.prepareAllies(resp);

							this.dataReceived();
						}
					);
				}, opt);
			});
		}
	);
};

bCountryInfo_view.prototype.dataReceived = function(){
	if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId);
		
		bCountryInfo_view.superclass.dataReceived.apply(this, arguments);
	}
};

bCountryInfo_view.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.countryChange];
};

bCountryInfo_view.prototype.bindEvent = function(){
    var self = this;
	
	// Обработчик кнопки "Включить в союз"
	this.wrp.on('click', '.mapButton.-type-ally', function(){
		wndMgr.addConfirm(tmplMgr.countryInfo.allys(self.data.allies)).onAccept = function(){
			var allyId = this.cont.find('#joinAlly select').val(),
				member = BaseAccOrCountry.countryK + (+self.data.country.id);

			reqMgr.addTradeAllyMember(allyId, member, function(){
				for(var ally in self.data.allies)
					if(self.data.allies[ally].id == allyId)
						self.data.allies.splice(ally, 1);

				if(!self.data.allies.length)
					self.wrp.find('.mapButton.-type-ally').remove();
			});
		};
	});
	
	if( wofh.country && wofh.account.isHead() ){
		this.wrp.on('click', '.setdiplomacy', function() {
			self.loaderId = contentLoader.start( 
				self.wrp.find('.view-countryInfo'), 
				0, 
				function(){
					reqMgr.countrySetDiplomacy(self.data.country.id, $(this).data('diplomacy'));
				}.bind(this)
			);
			
			return false;
		});	
	}
};

bCountryInfo_view.prototype.afterDraw = function(){
	this.initScroll();
};

bCountryInfo_view.prototype.initScroll = function(){
	var self = this;
	
	this.wrp.find('.js-scroll-wrp').each(function(){
		var scrollbarPosition = 'inside';
		
		if( $(this).hasClass('js-outside-scroll') )
			scrollbarPosition = 'outside';
		
		bCountryInfo_view.superclass.initScroll.call(self, {scrollbarPosition: scrollbarPosition});
	});
};


bCountryInfo_view.prototype.getCountryHead = function(){
	var accId = this.data.country.getAccountByPost(Country.postIds.head).id;
	
	this.countReq++;
	
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getAccount(accId, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					this.data.head = resp.account[accId];
					
					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};

bCountryInfo_view.prototype.getAlliesIds = function() {
	var alliesIds = [];
	
	var alliesIds = [];
	
	for (var ally in wofh.tradeAllies.getList()) {
		ally = wofh.tradeAllies.getElem(ally);
		
		if (ally.my)
			alliesIds.push(ally.id);	
	}
	
	if( alliesIds.length )
		return alliesIds;
};

bCountryInfo_view.prototype.prepareAllies = function(resp) {
	var self = this;
	
	resp = resp.tradeallyinfo;
	
	var allies = [];
	for(var allianceId in resp){
		var ally = resp[allianceId],
			addAlly = true;
		
		for(var i = 0; i < ally.members.length; i++){
			if( ally.members[i]>BaseAccOrCountry.countryK && ally.members[i]%BaseAccOrCountry.countryK == self.data.country.id ){
				addAlly = false;
				
				break;
			}
		}

		if( addAlly )
			allies.push({id: allianceId, name: ally.name});
	}
	
	if( allies.length )
		self.data.country.showAllyBtn = true;
	
	self.data.allies = allies;
};