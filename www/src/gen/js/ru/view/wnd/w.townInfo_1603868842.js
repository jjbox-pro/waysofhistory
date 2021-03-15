wTownInfo = function(id, data){
	wTownInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(wTownInfo, Wnd);

WndMgr.regWnd('townInfo', wTownInfo);


wTownInfo.prepareData = function(id){
	return +id == id && id != '' ? {townId: +id} : false;
};


wTownInfo.prototype.calcName = function(){
	return 'townInfo';
};

wTownInfo.prototype.initWndOptions = function(){
	wTownInfo.superclass.initWndOptions.apply(this, arguments);
    
    this.options.clipboard = true;
};

wTownInfo.prototype.calcChildren = function(){
	this.children.view = bTownInfo_view;
};

wTownInfo.prototype.bindEvent = function(){
    var self = this;
	
	if( debug.isAdmin() ){
		this.wrp
			.on('click', '.js-townInfo-clearTownName', function() {
				wndMgr.addConfirm().onAccept = function() {
					reqMgr.renameTown(self.data.townId, Town.defaultName, function(){
						self.children.view.show();
					});
				};
			});
	}
};

wTownInfo.prototype.getConflictWnd = wTownInfo.prototype.getIdentWnd;



bTownInfo_view = function(){
	this.name = 'view';
	
	bTownInfo_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bTownInfo_view, Block);


bTownInfo_view.prototype.getData = function(){
	var self = this;
	
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		function(){
			self.getReqData(function(){
				reqMgr.getTown(this.parent.data.townId, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							if( !resp.town ){
								this.showUnknownTown();

								return;
							}

							var town = resp.town[this.parent.data.townId];

							town.account = town.account|| new Account(Account.barbarian);
							this.data.account = town.account;

							if( this.data.account && this.data.account.country )
								this.data.country = this.data.account.country;

							if( !town.pos ){
								this.showUnknownTown(town);

								return;
							}

							this.data.deposit = town.deposit;

							this.data.coor = {};
							this.data.coor.o = town.pos.o;
							this.data.coor.x = town.pos.x;
							this.data.coor.y = town.pos.y;

							this.data.coor = Trade.movePointToMap(this.data.coor);

							this.data.climate = town.climate;

							// Информация о не варворском городе
							if( town.id ){
								this.parent.setClipboard({tag:'t' + town.id});
								this.parent.setHeaderCont({town:town});

								if( town.wonder )
									this.data.wonder = town.wonder;
							}

							// Путь
							this.data.distance = town.distance;

							this.data.distance.min = this.data.distance.calcMinDist();

							// Определяем какие кнопки показывать
							this.data.show = {};

							this.data.show.enter = (wofh.account.isAdmin() && !this.data.account.getSpecial()) || (this.data.account.id == wofh.account.id);

							this.data.show.army = ((!wofh.town.army.own.isEmpty() && town.id != wofh.town.id) || Account.hasAbility(Science.ability.tactics)) && Quest.isAvail(lib.quest.ability.sendarmy) && !Town.hasDefMoment(town.army);

							this.data.show.onMap = true;

							if	(	
									(Trade.calcDistance(this.data.coor, wofh.town.pos) < lib.trade.distance || Account.hasAbility(Science.ability.longTrade)) 
									&&
									(this.data.distance.land || this.data.distance.water || this.data.distance.deepwater || Trade.hasAirWay(town, wofh.town))
								){
									this.data.show.resSend = wofh.town.traders.count > 0;
									this.data.show.resStream = !this.data.account.isBarbarian() && Account.hasAbility(Science.ability.money); // Не варвар
							}

							// Информация по слотам
							this.data.slots = Town.type[town.type];

							this.data.town = town;

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bTownInfo_view.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		// Админка
		.on('click', '.js-adminArmyHistory', function() {
			if( self.data.town )
				wndMgr.addWnd(wAdminTownInfo, self.data.town.id);
			
			return false;
		})
		// Атаки на город
		.on('click', '.js-attacks', function() {
			var loaderId = contentLoader.start( 
				$(this), 
				0, 
				function(){
					if( self.data.town ){
						reqMgr.getTownAttacks(self.data.town.id, function(resp){
							contentLoader.stop(loaderId);
							
							wndMgr.addSimple(tmplMgr.snipet.townAttacks(Army.parseAttacks(resp)), {
								callbacks: {
									calcName: function(){return 'townAttacks';},
									
									afterDraw: function(){
										this.initScroll();
									}
								}
							});
						});
					}
				},
				{icon: ContentLoader.icon.small, cssPosition: {right: -15, top: 2}} 
			);
			
			return false;
		});
};

bTownInfo_view.prototype.afterDraw = function(){
	this.initScroll();
};


bTownInfo_view.prototype.showUnknownTown = function(townData){
	this.parent.setHeaderCont({unknownTown: true});
	
	this.data.town = townData;
	
	this.data.show = {};

	this.data.unknownTown = true;

	this.dataReceived();
};