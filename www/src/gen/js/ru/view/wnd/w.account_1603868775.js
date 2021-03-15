/**
	Окно аккаунта
*/

wAccount = function(){
	wAccount.superclass.constructor.apply(this, arguments);
};

utils.extend(wAccount, Wnd);

WndMgr.regWnd('account', wAccount);


wAccount.alerts = {
	WEok: '',
	WEalreadyUsed: 'Этот игрок уже приглашён в страну'
};

wAccount.prepareData = function(id){
	return id ? {id: id} : false;
};


wAccount.prototype.calcName = function(){
	return 'account';
};

wAccount.prototype.initWndOptions = function(){
    wAccount.superclass.initWndOptions.apply(this, arguments);
    
	this.options.clipboard = true;
};

wAccount.prototype.calcChildren = function(){
	this.children.view = bAccount_view;
};
// Убираем проверку на конфликтующие окна 
wAccount.prototype.getConflictWnd = wAccount.prototype.getIdentWnd;



bAccount_view = function(){
	this.name = 'view';
	
	bAccount_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bAccount_view, Block);


bAccount_view.prototype.getData = function() {
	var self = this;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			self.countReq = 1;
			
			var opt = {
				full: true,
				alliesIds: self.getAlliesIds()
			};
			
			self.getReqData(function(){
				reqMgr.getAccount(this.parent.data.id, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							if( !resp.account ){
								this.parent.close();
								
								return;
							}
							
							this.data.account = resp.account[this.parent.data.id];
							
							if( this.data.account.country )
								this.data.account.country = wofh.world.getCountry(this.data.account.country.id).extend(this.data.account.country); // Расширяем нестандартный объект страны базовыми данными
							
							var titlePrefix = '';
							
							switch( utils.toInt((this.data.account.towns - 1) / 3) ) {
								case 0: titlePrefix = this.data.account.sex ? 'Хозяин ' : 'Хозяйка '; break;
								case 1: titlePrefix = this.data.account.sex ? 'Правитель ' : 'Правительница '; break;
								case 2: titlePrefix = this.data.account.sex ? 'Повелитель ' : 'Повелительница '; break;
								case 3: titlePrefix = this.data.account.sex ? 'Наместник ' : 'Наместница '; break;
								case 4: titlePrefix = this.data.account.sex ? 'Владыка ' : 'Владычица '; break;
								default: titlePrefix = this.data.account.sex ? 'Властелин ' : 'Властительница '; break;
							}
							
							this.parent.wrp.find('.js-account-header').html(titlePrefix + this.data.account.name);
							this.parent.wrp.find('.js-clipboard-wrp').html(tmplMgr.snipet.clipboard({tag:'p' + this.data.account.id}));
							
							this.prepareAllies(resp);
							
							// Получаем доп. информацию по городам
							this.getTownsData();
							// Получаем информацию по стране (налоги, кредиты и т.п.)
							this.getCountryData();
							
							this.getOtherData();
							
							this.dataReceived();
						}
					);
				}, opt);
			});
		}
	);
};

bAccount_view.prototype.dataReceived = function() {
	if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId); 
		
		bAccount_view.superclass.dataReceived.apply(this, arguments);
	}
};

bAccount_view.prototype.getTmplData = function() {
	return this.data.account;
};

bAccount_view.prototype.bindEvent = function(){
    var self = this;
	
    this.wrp
		.on('click', '.mapButton.-type-sendmoney', function() {
            var sum = Math.max(0, utils.toInt(wofh.account.money.sum - (wofh.account.money.reserve||0)));
			
			wndMgr.addConfirm(tmplMgr.account.sendMoney({account: self.data.account, sum: sum}), {
				callbacks: {
					bindEvent: function(){
						this.wrp.on('input', '.account-sendMoney', function(event){
							utils.checkInputInt(this, {max: sum, min: sum ? 1 : sum, manualInput: !event.isTrigger});
						});
						
						snip.input1Handler(this.wrp, {spinbox: {}});
					},
					afterDraw: function(){
						this.toggleAccept(!sum);
					},
					onAccept: function(){
						var val = +this.wrp.find('.account-sendMoney').val();

						if( !val || val > sum ) return false;

						reqMgr.sendMoney(val, self.data.account.id);
					}
				}
			});
        })
		// Обработчик кнопки "Включить в союз"
		.on('click', '.mapButton.-type-ally', function(){
			wndMgr.addConfirm(tmplMgr.account.allys(self.data.allies)).onAccept = function(){
				var allyId = this.cont.find('#joinAlly select').val(),
					member = self.data.account.id;

				reqMgr.addTradeAllyMember(allyId, member, function(){
					for(var ally in self.data.allies)
						if(self.data.allies[ally].id == allyId)
							self.data.allies.splice(ally, 1);
					
					if( !self.data.allies.length )
						self.cont.find('.mapButton.-type-ally').remove();
				});
			};
		})
		.on('click', '.acc-showFullText', function(){
			$(this).parent().removeClass('-type-showAll');
		});
	
	
	if( wofh.country && wofh.account.isHead() ){
		this.wrp
			.on('click', '.mapButton.-type-dipUninv', function() {
				if( wofh.country.invited[self.data.account.id] )
					wndMgr.addConfirm().onAccept = function(){
						reqMgr.uninvite(self.data.account.id, function(){self.parent.close();});
					};
				else
					wndMgr.addWnd(wCountryExit, self.data.account).onAccept = function(){
						reqMgr.exclude(self.data.account.id, function(){self.parent.close();}, self.data.account);
					};

				return false;
			})
			.on('click', '.mapButton.-type-dipInv', function() {
				wndMgr.addConfirm().onAccept = function(){
					reqMgr.invite(self.data.account.id, function(){self.parent.close();});
				};
				
				return false;
			});
	}
	
	if( wofh.account.bonus && wofh.account.isPremium() ){
		this.wrp.on('click', '.mapButton.-type-note', function() {
			var reqReady = function(){
				if( self.note !== undefined ){
					wndMgr.addSimple(tmplMgr.account.note({text:self.note}), {
						header: 'Заметки о '+self.data.account.name,
						callbacks: {
							calcName: function(){return 'accNote';},
							
							bindEvent: function(){
								var wnd = this;
								
								this.wrp
									.on('submit', '.js-account-saveNote', function(){
										self.note = $(this).find('textarea').val();
										
										reqMgr.storeAccountNote(self.data.account.id, self.note, function(){
											wnd.close();
										});
										
										return false;
									})
									.on('click', '.but_close', function(){
										wnd.close();
									});
							}
						}
					});
				}
			};
			
			if( self.note === undefined )
				reqMgr.getAccountNote(self.data.account.id, function(resp){
					self.note = resp.text;
					
					reqReady();
				});
			else
				reqReady();
			
			return false;
		});
	}
};

bAccount_view.prototype.afterDraw = function(){
	this.checkAboutHeight();
	
	this.initScroll({scrollbarPosition: 'outside'});
};


bAccount_view.prototype.getAlliesIds = function() {
	var alliesIds = [];
	
	if( !wofh.tradeAllies ) return;
	
	for(var ally in wofh.tradeAllies.getList()) {
		ally = wofh.tradeAllies.getElem(ally);
		
		if (ally.my)
			alliesIds.push(ally.id);	
	}
	
	if( alliesIds.length )
		return alliesIds;
};

bAccount_view.prototype.prepareAllies = function(resp) {
	var self = this;
	
	resp = resp.tradeallyinfo;
	
	var allies = [];
	for(var allyId in resp){
		var ally = resp[allyId],
			addAlly = true;

		for(var i = 0; i < ally.members.length; i++){
			if( 
				ally.members[i] == self.data.account.id || 
				(self.data.account.country && TradeAlly.getIdByGid(ally.members[i]) == self.data.account.country.id) 
			){
				addAlly = false;
				
				break;
			}
		}
		
		if( addAlly )
			allies.push({id: allyId, name: ally.name});
	}
	
	if( allies.length )
		self.data.account.showAllyBtn = true;
	
	self.data.allies = allies;
};

bAccount_view.prototype.getTownsData = function() {
	var self = this;
	
	this.data.account.townslist = this.data.account.townslist||[];
	
	if( !this.data.account.townslist.length )
		return false;
		
	this.data.account.firstTownId = this.data.account.townslist[0];
	
	++this.countReq;
	
	this.getReqData(function(){
		reqMgr.getTown(this.data.account.townslist, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					var townsList = [];
					// Получаем уровни городов
					var townlevels = lib.map.townlevels;
					
					for(var townId in resp.town){
						var town = resp.town[townId];

						for(var i = 0; i < townlevels.length; i++){
							if( town.pop.hasall <= utils.toInt(townlevels[i])){
								town.level = i;
								
								break;
							}
						}

						if( town.level === undefined )
                            town.level = townlevels.length - 1;

						if( town.deposit && town.deposit.isUndefined() )
							town.deposit.climate = town.climate;

						townsList.push(town);
					}
					// Для правильной сортировки в FireFox
					townsList.sort(function(a, b){
						return a.id - b.id;
					});
					
					this.data.account.townslist = townsList;
					
					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};

bAccount_view.prototype.getCountryData = function() {
	if( !(
			wofh.account.isHead() && 
			wofh.account.id != this.data.account.id &&
			(this.data.account.country && this.data.account.country.id == wofh.country.id)
		) ) {
		return;
	}
	
	++this.countReq;
	
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getMyCountryData(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					utils.copyProperties(this.data.account, resp.country.accounts[this.data.account.id], {noObjects: true});
					
					this.data.account.unpackMoney();
					
					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};

bAccount_view.prototype.getOtherData = function(){};

bAccount_view.prototype.checkAboutHeight = function(){
	var $about = this.wrp.find('.account-text');
	
	if( $about.height() > 170 )
		$about.closest('.account-text-wrp').addClass('-type-showAll');
};