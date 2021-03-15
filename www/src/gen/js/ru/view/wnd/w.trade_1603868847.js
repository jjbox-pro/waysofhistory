wTrade = function(){
	wTrade.superclass.constructor.apply(this, arguments);
};

utils.extend(wTrade, wMarket);

WndMgr.regWnd('trade', wTrade);


wTrade.largeSum = 5000;

wTrade.prepareData = function(){
	var data = Ability.showTrade() ? {} : false;
	
	return data;
};


wTrade.prototype.calcName = function() {
	return 'trade';
};

wTrade.prototype.calcChildren = function() {
	this.children.marketPanel = bMTrade_panel;
	this.children.marketTabs = bMarket_tabs;
	this.children.sell = tabTradeSell;
	this.children.buy = tabTradeBuy;
};

wTrade.prototype.beforeShowChildren = function() {   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

wTrade.prototype.afterDraw = function() {
	this.showTab();
};


wTrade.prototype.showTab = function(){
	this.showMyActiveTradeOffersCount();
	
	this.tabs.openTab(ls.getLastTradeTab('buy'));
};

wTrade.prototype.showMyActiveTradeOffersCount = function(){
	var offers = wofh.tradeOffers.getTownOffers().getList();
	
	var count = 0;
	for( var offer in offers ){
		if( offers[offer].isAvail() )
			count++;
	}
	
	this.cont.find('.js-activeTradeOffersCount').text(count);
};



bMTrade_panel = function(){
	bMTrade_panel.superclass.constructor.apply(this, arguments);
};

utils.extend(bMTrade_panel, bMarket_panel);

bMTrade_panel.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accLuck] = this.showLuckInfo;
	
	bMTrade_panel.superclass.addNotif.apply(this, arguments);
};

bMTrade_panel.prototype.getTmplData = function(){
	this.data.showLuck = true, 
	this.data.showTradersMove = true;
	
	return this.data;
};

bMTrade_panel.prototype.afterDraw = function(){
	this.showLuckInfo();
	
	bMTrade_panel.superclass.afterDraw.apply(this, arguments);
};


bMTrade_panel.prototype.showLuckInfo = function(){
	//this.wrp.find('.js-trade-luck').html(snip.luck(utils.toInt(wofh.account.getCoinsBought())));
};



/******
 * Вкладка sell
 */

tabTradeSell = function(){
    this.name = 'sell';
	
	tabTradeSell.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTradeSell, Tab);

tabTradeSell.prototype.bindEvent = function(){
    var self = this;
	
	self.wrp
		.on('click', '.js-changeOfferAvailability', function(){
			var $this = $(this);
			
			if( $this.hasClass('-disabled') )
				return false;
			
			if( $this.prop('checked') ){
				$this.prop('checked', !$this.prop('checked'));
				return;
			}
			else{
				wndMgr.addConfirm('Данное предложение будет снято с рынка. Это обдуманное решение?', {okText: 'Да', cancelText: 'Нет'}).onAccept = function(){
					$this.addClass('-disabled');
					
					var offer = wofh.tradeOffers.getElem($this.data('id')).clone();
					
					offer.limit = Trade.removeTradeOfferLimit[(offer.res == Resource.ids.luck ? 'luck' : '') + offer.getStrType()];
					
					contentLoader.start( 
						$this.parent('.availability-wrp'), 
						100, 
						function(){
							reqMgr.setTradeOffer(offer.id, offer.getStrType(), offer.res, offer.cost, offer.limit, offer.distance, offer.ally);
						}.bind(this),
						{icon: ContentLoader.icon.small, callback: function(){$this.removeClass('-disabled');}} 
					);
				};
			}
			
			return false;
		})
		.on('click', '.js-editOffer', function(){
			wndMgr.addWnd(wTradeOffer, $(this).data('id'));
			
			return false;
		})
		.on('click', '.js-delOffer', function(){
			var el = $(this);
			if (el.hasClass('-disabled')) return false;
			
			wndMgr.addConfirm().onAccept = function(){
				el.addClass('-disabled');
				
				reqMgr.delTradeOffer(el.data('id'));
			};

			return false;
		});
};

tabTradeSell.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townTradeOffers] = function(){
		this.clearTimeout(this.notifTimeout);
		
		this.notifTimeout = this.setTimeout(function(){
			this.parent.showMyActiveTradeOffersCount();
			
			this.table.data.list = wofh.tradeOffers.getTownOffers().getSortList().getList();
			this.table.show();
		}, Notif.sDelay);
	};
};

tabTradeSell.prototype.afterDraw = function(){
	this.table = new tblTradeSellOffers(this, this.wrp);
    this.table.toggleSort('cost');
};

tabTradeSell.prototype.afterOpenTab = function(){
	ls.setLastTradeTab(this.name);
};



/******
 * Таблица sell - таблица списка выставленных предложений
 */

tblTradeSellOffers = function() {
    this.tmpl = tmplMgr.trade.tableSellOffers;
    this.data = {};
    this.data.list = wofh.tradeOffers.getTownOffers().getSortList().getList();
    
	tblTradeSellOffers.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblTradeSellOffers, Table);

tblTradeSellOffers.prototype.getSortVal = function(offer, field, exField) {
	if (field == 'availability') return utils.toInt(offer.isAvail());
	if (field == 'res') return offer.res;
	if (field == 'sell') return utils.toInt(offer.sell);
    if (field == 'cost') return offer.cost;
    if (field == 'distance') return offer.distance;
	if( field == 'limit' ) return offer.limit;
	
	if( exField == 'sell' ) return offer.ally; // Учет союза при сортеровке по типу операции
	
    return offer.cost; // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblTradeSellOffers.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.parent.wrp.find('.js-trade-sell-offers').toggleClass('-hidden', showTable);
		
		this.showTable = showTable;
	}
};



/******
 * Вкладка buy
 */

tabTradeBuy = function(){
    this.name = 'buy';
    
	tabTradeBuy.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTradeBuy, Tab);


tabTradeBuy.prototype.getData = function(){
	this.data.pos = 0;

	this.dataReceived();
};

tabTradeBuy.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('change', '.js-trade-buy-resFilter-wrp input', function(){
			self.data.pos = 0;
			self.children.list.show();
		})
		.on('click', '.js-resFilter .js-resb', function(){
			snip.filterResChange($(this));
		})
		.on('click', '.js-costSort', function(){
			self.data.sortField = 'cost';
			self.children.list.show();
		})
		.on('click', '.js-distSort', function(){
			self.data.sortField = 'dist';
			self.children.list.show();
		})
		.on('click', '.js-allySort', function(){
			self.data.sortField = 'ally';
			self.children.list.show();
		})
		.on('change', '.trade-buy-ally', function(){
			self.data.pos = 0;
			self.children.list.show();
		})
		.on('click', '.page-nav-next.-active', function(){
			self.data.pos = self.data.next;
			self.children.list.show();
		})
		.on('click', '.page-nav-prev.-active', function(){
			self.data.pos = self.data.prev;
			self.children.list.show();
		});

		snip.input1Handler(this.cont);
};

tabTradeBuy.prototype.calcChildren = function(){
	this.children.list = bTradeBuy_list;
};

tabTradeBuy.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabTradeBuy.prototype.afterOpenTab = function(){
	ls.setLastTradeTab(this.name);
};



bTradeBuy_list = function(){
	this.name = 'list';

	bTradeBuy_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bTradeBuy_list, Block);


bTradeBuy_list.prototype.allowShow = function(){
	if( this.hasTradeOperations() )
		return false;

	return bTradeBuy_list.superclass.allowShow.apply(this, arguments);
};

bTradeBuy_list.prototype.getData = function(upd){
	if( upd ){
		this.dataReceived();

		return;
	}

	var self = this;

	this.data = this.parent.data;
	
	var loaderId = contentLoader.start( 
		this.parent.wrp, 
		100, 
		function(){
			self.getReqData(function(){
				var reqData = utils.urlToObj(this.parent.wrp.find('form').serialize());

				reqData.n = this.data.pos;

				reqMgr.getTradeOffers(reqData.res, reqData.type, reqData.n, this.data.sortField, reqData.ally, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId, 
						function(){
							contentLoader.stop(loaderId);

							this.setFilter(reqData);

							resp = resp||{};

							if( wofh.country )
								this.data.countryAlly = wofh.tradeAllies.getCountryAlly().id;

							this.data.prev = resp.prev;

							this.data.next = resp.next;

							this.data.type = reqData.type;

							this.data.offers = this.prepareOffers(resp.offers);

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bTradeBuy_list.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townTraders] = function(){
		if( this.hasTradeOperations() || Trade.isBuy(this.data.type) ) return;

		var $offerCountFocused = this.cont.find('.trade-buy-offerCount:focus');

		if( $offerCountFocused.length )
			var $offerFocused = $offerCountFocused.closest('.js-trade-buy-offer');

		this.updList();

		// Восстанавливаем фокус и значение в инпуте
		if( $offerFocused ){
			var textRange = utils.getInputTextRange($offerCountFocused);

			var $newOfferCountFocused = this.cont
											.find('.js-trade-buy-offer[data-pos="'+$offerFocused.data('pos')+'"] .trade-buy-offerCount')
											.val($offerCountFocused.val()).trigger('input')
											.focus();

			utils.setInputTextRange($newOfferCountFocused, textRange);
		}
	};
	this.notif.other[Notif.ids.townFuel] = function(){
		if( this.hasTradeOperations() || Trade.isBuy(this.data.type) ) return;

		this.show();
	};
	// Совершилась свободная (массовая) покупка
	this.notif.other[Notif.ids.townFreeMarket] = function(){
		if( this.freeMarketTimeout )
			this.setFreeMarketTimeout();

		contentLoader.start(
			this.parent.wrp, 
			0, 
			this.setFreeMarketTimeout.bind(this),
			// Долгая анимация. Должна останавливаться по стороннему таймеру.
			{animationTime: timeMgr.HtS * timeMgr.StMS}
		);
	};
	this.notif.other[Notif.ids.townTradersMove] = function(){
		// Если была произведена свободная торговля и произошло передвижение торговцев, продлеваем таймер и ждем следующего передвижения
		if( this.freeMarketTimeout )
			this.setFreeMarketTimeout();
	};
};

bTradeBuy_list.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.trade-buy-buyOffer', function(){
			if( this.tradingOperation || $(this).hasClass('-disabled') ) 
				return;

			var $offer = $(this).closest('.js-trade-buy-offer'),
				count = +$offer.find('.trade-buy-offerCount').val(),
				offer = self.data.offers[$offer.data('pos')];

			count = count||offer.limit;

			// На выпел проверка больше не понадобится 13.02.2019. Инпут сам нормалтзует количество к величине кратной макс. загрузке торговца
			//if( !self.checkFullTradersLoad(offer.res, count) )
			//	return false;

			function makeTrade(){
				self.tradingOperation = true;

				var loaderId = contentLoader.start(
					self.parent.wrp, 
					100, 
					function(){
						self.getReqData(function(){
							reqMgr.makeTrade(
								offer.id, 
								offer.cost, 
								count, 
								{
									onSuccess: function(resp, reqId){
										self.tryProcessResp(
											resp, reqId, 
											function(){
												delete self.tradingOperation;

												self.show();

												wTradersMove.autoStart(self.parent.parent); // Открытие окна передвижения торговцев
											},
											{noChecks: true}
										);
									},
									onFail: function(){
										delete self.tradingOperation;

										contentLoader.stop(loaderId);
									}
								}
							);
						}, {noChecks: true});
					}
				);
			}

			if( offer.cost >= wTrade.largeSum && self.data.type == 'buy' ){
				wndMgr.addConfirm('Цена на товар достаточно высока. Ты уверен в этой сделке?').onAccept = function(){
					makeTrade();
				};
			}
			else
				makeTrade();

			return false;
		})
		.on('input', '.trade-buy-offerCount', function(){
			utils.checkInputInt(this, {max: $(this).data('limit'), min: 0, normalizeBase: $(this).data('res') != Resource.ids.luck ? lib.trade.capacity : 0});

			var resCount = +$(this).val(),
				$offer = $(this).closest('.js-trade-buy-offer');

			$offer.find('.trade-buy-buyOffer').toggleClass('-disabled', !resCount);

			self.setTax($offer, resCount);
		})
		.on('focusout', '.trade-buy-offerCount', function(){
			if( !+$(this).val() )
				self.setTimeout(function(){
					$(this).val($(this).data('limit')).trigger('input');
				}.bind(this), 100);
		});
};

bTradeBuy_list.prototype.afterDraw = function(){
	var self = this;

	this.wrp.find('.js-trade-buy-offer').each(function(){
		self.setTax($(this));
	});

	this.parent.wrp.find('.page-nav-prev').toggleClass('-active', this.data.prev !== undefined);
	this.parent.wrp.find('.page-nav-next').toggleClass('-active', this.data.next !== undefined);

	snip.spinboxHandler(this.cont);
};


bTradeBuy_list.prototype.hasTradeOperations = function(){
	return this.tradingOperation || this.freeMarketTimeout;
};

bTradeBuy_list.prototype.setTax = function($offer, resCount){
	if( !wofh.country )
		return;

	if( resCount === undefined )
		resCount = +$offer.find('.trade-buy-offerCount').val();

	// Расчет налога
	if( resCount ){
		var offer = this.data.offers[$offer.data('pos')];

		if( offer.res == Resource.ids.luck ) return; // МУ не облагаются налогом

		var taxResId = Trade.isBuy(this.data.type) ? Resource.ids.money : offer.res;

		var tax = this.calcTax(taxResId, (offer.cost * 0.001) * resCount, offer.ally, offer.inCountry);

		$offer.find('.trade-buy-buyOffer').attr('data-title', tmplMgr.trade.offerTax({tax:tax, inCountry:offer.inCountry}));
	}
	else
		$offer.find('.trade-buy-buyOffer').removeAttr('data-title');
};

bTradeBuy_list.prototype.calcTax = function(taxResId, cost, ally, inCountry){
	return cost * (1 - (1 - (taxResId == Resource.ids.money ? 0 : wofh.country.taxes.tax.trade * 0.01)) * (inCountry ? 1 : (1 - this.getCountryAllyCustoms(taxResId, ally) * 0.01)));
};

bTradeBuy_list.prototype.getCountryAllyCustoms = function(taxResId, ally){
	ally = wofh.country.taxes.customs_[ally];

	return ally ? ally[taxResId-1] : 0;
};

bTradeBuy_list.prototype.checkFullTradersLoad = function(res, count){
	if( res != Resource.ids.luck && count > 0 && count%lib.trade.capacity ){
		var min = Math.floor(count / lib.trade.capacity) * lib.trade.capacity;

		if(!min) 
			min = lib.trade.capacity;

		wndMgr.addAlert('Нельзя использовать торговцев неполностью. Проведите сделку объемом ' + min + ' или ' + (min + lib.trade.capacity));

		return false;
	}

	return true;
};

bTradeBuy_list.prototype.updList = function(){
	this.data.offers = this.prepareOffers(this.rawOffers);

	this.getData(true);
};

bTradeBuy_list.prototype.setFilter = function(data){
	var filter = ls.getTradeFilter(Trade.getTradeFilter());

	filter.res = data.res;
	filter.type = data.type;
	filter.ally = data.ally;

	ls.setTradeFilter(filter);
};

bTradeBuy_list.prototype.prepareOffers = function(rawOffers){
	this.rawOffers = utils.clone(rawOffers);

	for(var offer in rawOffers){
		var offer = rawOffers[offer];

		if (offer.res == Resource.ids.science) {
			offer.res = Resource.ids.luck;

			offer.count = offer.traders;

			offer.time = offer.time||0; // Для неизвестного города приходит undefined
		}
		else
			offer.count = offer.traders * lib.trade.capacity;


		if( Trade.isBuy(this.data.type) )
			offer.limit = offer.count;
		else if( offer.res == Resource.ids.luck )
			offer.limit = Math.min(utils.toInt(wofh.account.getCoinsBought()), offer.count);
		else{
			offer.limit = Math.min(offer.count, utils.toInt(wofh.town.getRes(offer.res).has / lib.trade.capacity) * lib.trade.capacity);

			var capacity = wofh.town.getFreeTraders() * lib.trade.capacity;

			offer.limit = Math.min(capacity, offer.limit);
		}

		// Город известен
		if( offer.town ){
			if( offer.town.account && offer.town.account.country && offer.town.account.country.id == (wofh.country||{}).id )
				offer.inCountry = true;

			offer.noSpeedUpTime = this.getNoSpeedUpTime(offer, this.data.type);
		}
	}

	return rawOffers;
};

bTradeBuy_list.prototype.getNoSpeedUpTime = function(offer, type){
	if( offer.res != Resource.ids.luck && offer.time ){
		var town = offer.town;

		if( type != 'buy' ){
			town = wofh.town;

			if( !town.isOnFuel() )
				return false;
		}

		var noSpeedUpTime = utils.toInt(offer.path / town.account.race.getTradeSpeed() * timeMgr.HtS);

		// Нивелируем погрешность
		if( Math.abs(noSpeedUpTime - offer.time) > 2 )
			return noSpeedUpTime;
	}

	return false;
};
// При свободной покупке сервер может вернуть несколько событий отправки торговцев.
// Пытаемся дождаться последнего (время ожидания следующего 2.5 сек.) и обновляем предложения.
bTradeBuy_list.prototype.setFreeMarketTimeout = function(){
	this.clearTimeout(this.freeMarketTimeout);

	this.freeMarketTimeout = this.setTimeout(function(){
		delete this.freeMarketTimeout;

		this.show();
	}, 2500);
};



/******
 * Окно создания/редактирования предложения
 */

wTradeOffer = function(id, data){
	this.name = 'tradeOffer';
	this.hashName = 'tradeOffer';
	
	wTradeOffer.superclass.constructor.apply(this, arguments);
	
	this.options.showBack = true;	
};

utils.extend(wTradeOffer, Wnd);

WndMgr.regWnd('tradeOffer', wTradeOffer);


wTradeOffer.prepareData = function(id){
	var data = {},
		params = {id:id};
	
	if( typeof(id) == 'string' )
		params = utils.urlToObj(id);
	
	var	offer = wofh.tradeOffers.getElem(params.id).clone();
	
	data.town = wofh.towns[offer.town||params.town]||wofh.town;
	
	offer.id = offer.id;
	//offer.sell = offer.sell === undefined ? +!(params.buy) : offer.sell;
	offer.res = offer.res||Resource.ids.wood;
	offer.cost = offer.cost||0;
	offer.limit = offer.limit === undefined ? utils.toInt(data.town.getStock().getMax()) : offer.getLimit(data.town);
	
	var lastData = ls.getTradeOfferLastData({distance:lib.trade.distance});
	
	if( lastData.ally && !wofh.tradeAllies.getElem(lastData.ally))
		delete lastData.ally;
	
	if( lastData.distance > lib.trade.distance && !Account.hasAbility(Science.ability.longTrade) )
		lastData.distance = lib.trade.distance;
	
	offer.distance = offer.distance||lastData.distance;
	offer.ally = offer.ally !== undefined ? offer.ally : lastData.ally;
	
	if( offer.sell == 1 || offer.id ){
		// Вычисляем, какие ресурсы будут заблокированы 
		data.disabled = [];
		for(var res in lib.resource.data){
			if( offer.id ){
				if( offer.res != res )
					data.disabled.push(+res);
			}
			else if( !data.town.getRes(res).getHas() ){
				data.disabled.push(+res);
			}
		}
		
		if( offer.res != Resource.ids.luck && offer.limit == Trade.removeTradeOfferLimit.sell )
			offer.limit = utils.toInt(data.town.getStock().getMax());
	}
	
	data.offer = offer;
	
	return data;
};


wTradeOffer.prototype.bindEvent = function(){
	var self = this;
	
	this.cont
		.on('click', '.js-resFilter .js-resb', function(){
			if( self.data.offer.id )
				return false;
			
			var resId = snip.filterResChange($(this)),
				isLuck = resId == Resource.ids.luck;

			self.cont.find('.js-tradePopup-offerLimit-wrp').toggleClass('-hidden', isLuck);
			self.cont.find('.js-tradePopup-offerLuck-wrp').toggleClass('-hidden', !isLuck);
			
			if( isLuck ){
				self.data.luckSlider.enable();
				self.data.limitSlider.disable();
				
				self.data.luckSlider.onCreateSet();
			}
			else{
				self.data.limitSlider.enable();
				self.data.luckSlider.disable();
				
				self.data.limitSlider.onCreateSet(resId);
			}
		})
		.on('change', '.js-operation-type', function(){
			if( self.data.offer.id )
				return false;

			$(this).parent().addClass('-active').siblings().removeClass('-active');

			var buy = $(this).val() == 'buy',
				$offerAlly = self.cont.find('.js-tradePopup-offerAlly');
			
			if( (buy || !self.data.town.traders.reserve) && $offerAlly.val() == lib.tradeally.blackmarket )
				$offerAlly.find(':first').prop('selected', 'selected');
			
			$offerAlly.find('option[value="' + lib.tradeally.blackmarket + '"]').toggleClass('-hidden', buy);
			
			self.resFilterToggleDisabled(self.cont.find('.js-resFilter'), !buy);
		})
		.on('change', '.js-tradePopup-offerAlly', function(){
			if( $(this).val() == lib.tradeally.blackmarket ){
				var operation = self.cont.find('.js-operation-type:checked').val(),
					blackmarketNoTraders = (operation == 'sell' && !self.data.town.traders.reserve); // Если нет торговцев в резерве
					
				self.checkCanSetOffer( !blackmarketNoTraders && operation );
			
				if( blackmarketNoTraders )
					wndMgr.addAlert('Не хватает торговцев');
			}
		})
		.on('submit', '.js-tradePopup-sell-offer', function(){
			if( !self.data.canSetOffer )
				return false;
			
			self.checkCanSetOffer(false, true); // Запрещаем повторное нажатие кнопки
			
			var loaderId = contentLoader.start( 
				self.cont.find('.js-setOffer'), 
				0, 
				function(){
					var reqData = utils.urlToObj($(this).serialize());
					
					reqData.cost *= self.data.costSlider.float.digit;
					
					reqMgr.setTradeOffer(
						self.data.offer.id, 
						reqData.type, 
						reqData.res, 
						reqData.cost, 
						reqData.limit, 
						reqData.distance, 
						reqData.ally, 
						{
							onSuccess: function(){
								contentLoader.stop(loaderId);
								
								if( self.data.offer.id === undefined )
									ls.setTradeOfferLastData({distance:reqData.distance, ally:reqData.ally});
								
								self.close();
							},
							onFail: function(){
								contentLoader.stop(loaderId);
							}
						}, 
						self.data.town);
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){
					self.checkCanSetOffer(true, true);
				}}
			);
			
			return false;
		})
		.on('click', '.js-delOffer', function(){
			var $this = $(this);
			
			if( !self.data.canSetOffer && $this.hasClass('-desabled') )
				return false;
			
			wndMgr.addConfirm().onAccept = function(){
				self.checkCanSetOffer(false, true); // Запрещаем повторное нажатие кнопок
				
				var loaderId = contentLoader.start(
					$this, 
					0, 
					function(){
						reqMgr.delTradeOffer(self.data.offer.id, function(){
							contentLoader.stop(loaderId);
							
							self.close();
						}, self.data.town);
					}.bind(this),
					{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){
						self.checkCanSetOffer(true, true);
					}}
				);
				
			};
			
			return false;
		});
		
	// Слайдер стоимости
	var isLuck = this.data.offer.res == Resource.ids.luck;
	
	this.data.costSlider = snip.iSliderHandler({
		$slider: this.cont.find('.js-tradePopup-offerCost-slider .slider'),
		min: 0,
		isLuck: isLuck,
		maxLimit: isLuck ? lib.trade.maxtradepriceluck : lib.trade.maxtradeprice,
		max: (utils.toInt((this.data.offer.cost + 1000)/1000)) * 1000,
		value: this.data.offer.cost,
		shortStep: 1,
		name: 'cost',
		labelIcon: snip.resBig(Resource.ids.money),
		float: {fixed: 3},
		setValue: function(iSlider, value){
			snip.iSliderHandler.setValue(iSlider, value);
			
			self.checkCanResetOffer();
		},
		create: function(iSlider){
			iSlider.$input.on('iSlider-input-checked', function(){
				self.checkCanResetOffer();
			});
			
			self.cont.on('click', '.js-tradePopup-resFilter .js-resFilter .js-resb', function(){
				if( $(this).is('.disabled') ) 
					return;
				
				var isLuck = $(this).data('res') == Resource.ids.luck;
				
				if( iSlider.isLuck != isLuck ){
					iSlider.isLuck = isLuck;
					iSlider.maxLimit = isLuck ? lib.trade.maxtradepriceluck : lib.trade.maxtradeprice;
					iSlider.max = Math.min(iSlider.max, iSlider.maxLimit);
					
					iSlider.$input.trigger('input');
				}
			});
		}
	});
	
	if( this.data.offer.id ){
		if( isLuck )
			this.initLuckSlider();
		else
			this.initLimitSlider();
	}
	else{
		this.initLimitSlider();
		this.initLuckSlider();
		
		this.data.luckSlider.disable();
	}
	
	// Слайдер расстояния
	snip.iSliderHandler({
		$slider: this.cont.find('.js-tradePopup-offerDist-slider .slider'),
		min: Trade.minDistance,
		maxLimit: Account.hasAbility(Science.ability.longTrade) ? lib.map.size.array : lib.trade.distance,
		value: this.data.offer.distance,
		shortStep: 1,
		name: 'distance',
		labelIcon: snip.ruler()
	});
	
	this.checkCanSetOffer(this.data.offer.id || (this.data.offer.sell === undefined ? false : true));
};


wTradeOffer.prototype.checkCanSetOffer = function(state, isReq){
	if( this.data.canSetOffer != state || isReq ){
		this.data.canSetOffer = state;
		
		// Если запрос, меняем состояния и для кнопки удаления
		this.cont.find('.js-setOffer' + (isReq ? ', .js-delOffer' : '')).toggleClass('-disabled', !state);
	}
};

wTradeOffer.prototype.checkCanResetOffer = function(){
	if( this.data.offer.id )
		this.checkCanSetOffer(true);
};

wTradeOffer.prototype.resFilterToggleDisabled = function($filter, disabled){
	$filter.find('a[data-disabled=1]').toggleClass('disabled', disabled);

	// Выделялка первого по умолчанию
	if ( $filter.find('a.disabled.-active').length ) {
		$filter.find('a:not(.disabled)').first().trigger('click');
	}
};

wTradeOffer.prototype.setInputVal = function($input, val){
	if( $input )
		$input.val(val);

	this.checkCanResetOffer();
};
// Слайдер границы объема 
wTradeOffer.prototype.initLimitSlider = function(){
	var self = this;
	
	this.data.limitSlider = snip.iSliderHandler({
		$slider: this.cont.find('.js-tradePopup-offerLimit-slider .slider'),
		minLimit: 0,
		maxLimit: utils.toInt(self.data.town.getStock().getMax()),
		value: this.data.offer.limit,
		shortStep: 1,
		name: 'limit',
		labelIcon: snip.resBig(self.data.offer.res),
		create: function(iSlider){
			iSlider.limit = iSlider.maxLimit;
			
			iSlider.$mark = iSlider.$slider.find('.js-limit-mark');
			iSlider.$areaOwn = iSlider.$slider.find('.js-limit-areaOwn');
			iSlider.$areaSelected = iSlider.$slider.find('.js-limit-areaSelected');
			iSlider.$selectedTitle = iSlider.$slider.find('.js-limit-selectedTitle');

			iSlider.$limitRes = iSlider.$slider.find('.js-slider-label-icon');
			iSlider.$limitHint = iSlider.$slider.find('.js-limit-hint');
			
			iSlider.$limitSelectedRes = iSlider.$slider.find('.js-limit-selected-res');
			iSlider.$limitSelectedCount = iSlider.$slider.find('.js-limit-selected-count');
			iSlider.$limitSelectedHint = iSlider.$slider.find('.js-limit-selected-hint');
			
			iSlider.operation = self.cont.find('.js-operation-type:checked').val();
			
			iSlider.onCreateSet(self.cont.find('.js-resFilterVal').val(), true);
			iSlider.onCreateBind(iSlider);
		},
		checkMax: function(){}, // Проверка на максимум происходит внутри собственных функций
		getInputHtml: function(iSlider){
			var html = snip.iSliderHandler.getInputHtml(iSlider);
			
			html += ' <span class="js-limit-hint"></span>';
			
			return html;
		},
		getCheckedInputValue: function(iSlider, event){
			utils.checkInputInt(iSlider.$input, {max: iSlider.max, min: iSlider.min, manualInput: !event.isTrigger});

			return iSlider.$input.val();
		},
		setValue: function(iSlider, value) {
			this.setLimit(iSlider, value);
			
			self.setInputVal(this.$input, value);
		},
		setLimit: function(iSlider, value) {
			var diff,
				percent,
				average;

			if (this.operation == 'buy') {
				percent = this.getPercent(this.limit, this.resStockCount, this.scale) + '%';
				diff = value - this.resStockCount;
				average = (this.resStockCount  - this.min) + diff/2;
			} else {
				percent = this.getPercent(this.limit, value) + '%';
				diff = this.resStockCount - value;
				average = value + diff/2;
			}

			this.$areaSelected.css('left', percent);
			
			diff = Math.max(0, diff);

			this.$areaSelected.css('width', this.getPercent(this.limit, diff) + '%');
			this.$selectedTitle.css('left', this.getPercent(this.limit, average) + '%');
			
			this.$selectedTitle.toggleClass('cl-grey', ((!this.operation || this.operation == 'sell') && value > this.resStockCount) || (this.operation == 'buy' && value < this.resStockCount) );
			
			this.$limitSelectedCount.html(utils.formatNum(diff, {int: true, stages: true}));
			
			this.value = value;
		},
		onCreateSet: function(res, isInit) {
			this.res = res;

			this.resStockCount = utils.toInt(this.getOwnRes(res));

			if( this.scale ){
				if( this.operation == 'sell' ){
					this.limit = this.max = this.resStockCount;
					this.min = this.minLimit;
					
					this.value = Math.min(this.value, this.max);
				}
				else{
					var zeroOffset = true; // Флаг указывающий, что необходим 0-ой отступ и ширина для маркеров this.$mark и this.$areaOwn

					this.max = this.maxLimit;
					this.min = this.resStockCount;
					this.limit = this.max - this.min;

					this.value = Math.max(this.value, this.min);
				}

				this.$slider.slider({max: this.max, min: this.min, value: this.value});
			}
			else if( this.max != this.maxLimit || this.min != this.minLimit ){
				this.limit = this.max = this.maxLimit;
				this.min = this.minLimit;

				this.$slider.slider({max: this.max, min: this.min});
			}

			var percent = this.getPercent(this.limit, this.resStockCount, zeroOffset) + '%';

			this.$mark.css('left', percent);
			this.$areaOwn.css('width', percent);

			this.$limitRes.html(snip.resBig(res));
			this.$limitSelectedRes.html(snip.res(res));
			this.$limitHint.html(snip.hint(this.operation == 'buy' ? 'Ресурс будет покупаться, пока на складе его меньше данного количества' : 'Ресурс будет продаваться, пока на складе его больше данного количества'));
			
			if( !isInit )
				this.setValue(this, this.value);
		},
		onCreateBind: function(iSlider) {
			iSlider.$input.on('iSlider-input-checked', function(){
				iSlider.setLimit(iSlider, +iSlider.$input.val());
			});
			
			if( !self.data.offer.id ){
				// Смена операции
				self.cont.on('click', '.js-operation-type', function(){
					iSlider.operation = $(this).val();
					self.checkCanSetOffer(true); 

					if( !self.cont.find('.js-tradePopup-offerLimit-wrp').hasClass('-hidden') )
						iSlider.onCreateSet(iSlider.res);
				});
			}

			// Обработчик клика по лимиту, переключает макс. значение слайдера между количеством реса на складе и максимальной вместимостью склада.
			// Удобно в случае, когда вместимость склада очень большая, а значение нужно выбрать маленькое
			iSlider.$selectedTitle
				// Отменяем таскание слайдера
				.on('mousedown', function(event){
					event.stopPropagation();
				})
				.on('click', function(){
					if( !iSlider.operation )
						return;
					
					if( iSlider.scale )
						delete iSlider.scale;
					else
						iSlider.scale = true;

					iSlider.onCreateSet(iSlider.res);
				});
		},
		getOwnRes: function(res) {
			return self.data.town.getRes(res) ? self.data.town.getRes(res).has : 0;
		},
		getPercent: function(first, second, zero) {
			if( zero || !(first || second) )
				return 0;
			
			return (first > second ? second / first : first / second)  * 100;
		}
	});
};
// Слайдер МУ
wTradeOffer.prototype.initLuckSlider = function(){
	var self = this;
	
	this.data.luckSlider = snip.iSliderHandler({
		$slider: this.cont.find('.js-tradePopup-offerLuck-slider .slider'),
		maxLimit: !this.data.offer.sell ? 5000 : utils.toInt(wofh.account.getCoinsBought()),
		value: this.data.offer.limit,
		shortStep: 1,
		name: 'limit',
		labelIcon: snip.resBig(Resource.ids.luck),
		create: function(iSlider){
			iSlider.onCreateBind(iSlider);
		},
		checkMax: function(){}, // Проверка на максимум происходит внутри собственных функций
		getCheckedInputValue: function(iSlider, event){
			utils.checkInputInt(iSlider.$input, {max: iSlider.max, min: iSlider.min, manualInput: !event.isTrigger});

			return iSlider.$input.val();
		},
		setValue: function(iSlider, value, alreadySettled) {
			this.value = value;
			
			if( !alreadySettled )
				self.setInputVal(this.$input, value);
		},
		onCreateSet: function() {
			this.setValue(this, Math.min(this.value, this.max));

			this.$slider.slider({max: this.max, value: this.value});
		},
		onCreateBind: function(iSlider) {
			iSlider.$input.on('iSlider-input-checked', function(){
				iSlider.setValue(iSlider, +iSlider.$input.val(), true);
			});
			
			if( !self.data.offer.id ){
				// Смена операции
				self.cont.on('click', '.js-operation-type', function(){
					iSlider.max = $(this).val() == 'buy' ? 5000 : utils.toInt(wofh.account.getCoinsBought());

					if( !self.cont.find('.js-tradePopup-offerLuck-wrp').hasClass('-hidden') )
						iSlider.onCreateSet();
				});
			}
		}
	});
};





/******
 * Окно свободной (массовой) покупки/продажи ресов
 */

wTradeFreeMarket = function(id, data){
	wTradeFreeMarket.superclass.constructor.apply(this, arguments);
};

utils.extend(wTradeFreeMarket, Wnd);

WndMgr.regWnd('tradeFreeMarket', wTradeFreeMarket);


wTradeFreeMarket.prepareData = function(id){
	var data = {},
		params = utils.urlToObj(id, true);
	
	if( !params.type )
		return false;
	
	data.type = params.type;
	
	if( params.res ){
		if( params.res == ResList.filter.resType.cult )
			params.res = ResList.groups[ResList.groupType.cult][0];
		else if( params.res == ResList.filter.resType.grown ){
			if( Trade.isSell(data.type) )
				params.res = ResList.groups[ResList.groupType.grown][0];
			else
				params.res = Resource.ids.food;
		}
			
		data.res = params.res;
	}
	
	return data;
};


wTradeFreeMarket.prototype.calcName = function(){
	return 'tradeFreeMarket';
};

wTradeFreeMarket.prototype.initWndOptions = function(){
	wTradeFreeMarket.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showBack = true;
};

wTradeFreeMarket.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accBonus] = function(){
		var $toggles = this.wrp.find('.js-allowSending-toggle, .js-path-toggle');
		
		if( !wofh.account.isPremium() )
			$toggles.prop('checked', false);
		
		$toggles.trigger('change', [true]);
	};
};

wTradeFreeMarket.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-resFilter .js-resb', function(){	
			snip.filterResChange($(this));
		})
		.on('click', '.trade-freeMarket-close', function(){	
			if( $(this).data('traded') )
				hashMgr.showWnd('tradersMove');
			
			self.close();
		})
		.on('change', '.js-allowStock-toggle', function(event, noRecalcStockLimit){
			self.setFilter('stock', $(this).prop('checked'));
		
			if( !$(this).prop('checked') )
				$(this)
						.closest('.tradeFreeMarket-stockOpt-wrp')
						.find('.js-allowSending-toggle')
						.prop('checked', false)
						.trigger('change', [true, true]);
			
			if( !noRecalcStockLimit )
				self.data.resSlider.$input.trigger('input');
		})
		.on('change', '.js-allowSending-toggle', function(event, noCheckPremium, noRecalcStockLimit){
			if( !(noCheckPremium || wofh.account.isPremium()) ){
				wndMgr.addWnd(wNoPremium);
				
				$(this).prop('checked', false);
				
				return;
			}
			
			self.setFilter('sending', $(this).prop('checked'));
			
			if( $(this).prop('checked') )
				$(this)
						.closest('.tradeFreeMarket-stockOpt-wrp')
						.find('.js-allowStock-toggle')
						.prop('checked', true)
						.trigger('change', [true]);
					
			if( !noRecalcStockLimit )
				self.data.resSlider.$input.trigger('input');
		})
		.on('change', '.js-dist-toggle', function(){
			var checked = $(this).prop('checked');
			
			$(this).closest('.tradeFreeMarket-dist-wrp').toggleClass('-disabled', !checked);
			
			self.data.distSlider.$slider
									.slider({disabled: !checked})
									.find('input').attr({disabled: !checked});
			
			self.setFilter('dist', checked);
		})
		.on('change', '.js-path-toggle', function(event, init){
			if( !(init || wofh.account.isPremium()) ){
				wndMgr.addWnd(wNoPremium);
				
				$(this).prop('checked', false);
				
				return;
			}
			
			var checked = $(this).prop('checked');
			
			$(this).closest('.tradeFreeMarket-path-wrp').toggleClass('-disabled', !checked);
			
			self.data.pathSlider.$slider
									.slider({disabled: !checked})
									.find('input').attr({disabled: !checked});
			
			self.setFilter('path', checked);
		})
		.on('submit', '.tradeFreeMarket-form', function(){
			if( !self.data.canFreeMarket )
				return false;
			
			self.setCanMarket(false); // Запрещаем повторное нажатие кнопки
			
			var loaderId = contentLoader.start( 
				self.cont.find('.js-doFreeMarketBtn'), 
				0, 
				function(){
					var reqData = utils.urlToObj($(this).serialize());
					
					reqData.cost *= self.data.costSlider.float.digit;
					
					// Преобразуем еду в тип ресуров роста
					if( reqData.res == Resource.ids.food )
						reqData.res = ResList.filter.resType.grown;
					
					reqMgr.makeTradeFreeMarket(
						reqData.res,
						reqData.count,
						reqData.cost,
						Trade.isSell(self.data.type),
						reqData.maxdist,
						reqData.maxpath,
						reqData.ally,
						{
							onSuccess: function(resp){
								resp.data.res = reqData.res == ResList.filter.resType.grown ? Resource.ids.food : reqData.res;
								resp.data.count = reqData.count;
								resp.data.cost = reqData.cost * self.data.costSlider.float.invDigit;
								resp.data.type = self.data.type;
								resp.data.rest = utils.toInt(resp.data.count - resp.data.traded);

								contentLoader.stop(loaderId, true, false, resp.data);
							},
							onFail: function(){
								contentLoader.stop(loaderId, false, true);
							}
						}
					);
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, successTime:0, callback: function(loader){
					var canMarket = true;
					
					if( loader.success ){
						if( loader.extData.traded )
							notifMgr.runEvent(Notif.ids.townFreeMarket);
						
						self.cont.find('.trade-freeMarket-result-wrp').html(tmplMgr.tradeFreeMarket.result(loader.extData));
						
						canMarket = !!loader.extData.rest;
					}
					
					self.setCanMarket(canMarket);
				}}
			);
			
			return false;
		});
};

wTradeFreeMarket.prototype.afterDraw = function(){
	var self = this;
	
	// Слайдер количества реса
	this.data.resSlider = snip.iSliderHandler({
		$slider: this.cont.find('.tradeFreeMarket-res-slider .slider'),
		maxLimit: wofh.town.stock.getLimit(),
		value: 0,
		step: 100,
		name: 'count',
		labelIcon: snip.resBig(self.data.res),
		maximazeByStock: true,
		int: {
			normalizeBase: lib.trade.capacity
		},
		create: function(iSlider){
			iSlider.resetMax(self.data.res, true);
			
			self.cont.on('click', '.js-resFilter .js-resb', function(){
				if( $(this).is('.disabled') ) return;
				
				self.data.res = $(this).data('res');
				
				iSlider.$slider.find('.js-slider-label-icon').html(snip.resBig(self.data.res));
				
				iSlider.resetMax(self.data.res);
			});
			
			self.checkCanMarket(iSlider);
		},
		change: function(iSlider){
			self.checkCanMarket(iSlider);
			self.checkStockOverflow(iSlider, self.data.res);
		},
		prepareMax: function(iSlider){
			// Первый раз максимизируем по размеру склада
            if( iSlider.maximazeByStock ){
                iSlider.max = Trade.normalizeByTradersCapacity(wofh.town.stock.getMax());

                iSlider.maximazeByStock = false;
            }
            else
                iSlider.max *= 2;
            
            iSlider.max = Math.min(iSlider.maxLimit, iSlider.max);
		},
		getInputHtml: function(iSlider){
			var html = snip.iSliderHandler.getInputHtml(iSlider);
			
			return html = '<span class="tradeFreeMarket-stockOverflow">'+snip.alert('Не хватит текущей вместимости склада')+'</span>' + html;
		},
		setMaxLimit: function(res){
			if( Trade.isSell(self.data.type) )
				this.maxLimit = Math.min(Trade.normalizeByTradersCapacity(wofh.town.getRes(res).getHas()), wofh.town.getFreeTradersCapacity());
			else
				this.maxLimit = wofh.town.stock.getLimit();
		},
		setMax: function(res){
			if( Trade.isSell(self.data.type) )
				this.max = this.maxLimit;
			else{
				this.max = Trade.normalizeByTradersCapacity(wofh.town.stock.getMax() - self.getStockHasResCount(res) - self.getSentResCount(res));

				if( !(this.max > 0) || res == Resource.ids.food )
					this.max = Trade.normalizeByTradersCapacity(wofh.town.stock.getMax());
			}

			this.max = Math.min(this.max, this.maxLimit);
		},
		resetMax: function(res, isInit){
			this.setMaxLimit(res);
			this.setMax(res);

			var val = Math.min(this.$input.val(), this.max);

			if( val == this.max )
				val = Math.max(0, val-lib.trade.capacity);

			this.$input.val(val);

			if( !isInit )
				this.maximazeByStock = true;

			this.$slider.slider('option', {value: val, max: this.max});
		}
	});
	
	// Слайдер стоимости
	this.data.costSlider = snip.iSliderHandler({
		$slider: this.cont.find('.tradeFreeMarket-cost-slider .slider'),
		maxLimit: lib.trade.maxtradeprice,
		max: 1000,
		value: 0,
		shortStep: 1,
		name: 'cost',
		labelIcon: snip.resBig(Resource.ids.money),
		float: {fixed: 3}
	});
	
	// Слайдер расстояния
	this.data.distSlider = snip.iSliderHandler({
		$slider: this.cont.find('.tradeFreeMarket-dist-slider .slider'),
		min: Trade.minDistance,
		maxLimit: Account.hasAbility(Science.ability.longTrade) ? lib.map.size.array : lib.trade.distance,
		value: Trade.minDistance,
		shortStep: 1,
		name: 'maxdist',
		labelIcon: snip.ruler(),
		create: function(iSlider){
			setTimeout(function(){
				iSlider.$slider.closest('.tradeFreeMarket-dist-wrp').find('.js-dist-toggle').trigger('change');
			}, 1);
		}
	});
	
	// Слайдер пути
	this.data.pathSlider = snip.iSliderHandler({
		$slider: this.cont.find('.tradeFreeMarket-path-slider .slider'),
		min: Trade.minPath,
		maxLimit: utils.toInt(lib.trade.speed * 3 * 24), // Максимальный путь равен количеству полей, который может пройти самый быстрый торговец (азиат) за 3 дня
		value: Trade.minPath,
		shortStep: 1,
		name: 'maxpath',
		labelIcon: snip.pathIcon(),
		create: function(iSlider){
			iSlider.$time = iSlider.$slider.find('.tradeFreeMarket-pathTime');
			
			iSlider.$input.on('iSlider-input-checked', function(){
				iSlider.setTime(iSlider, +$(this).val());
			});
			
			setTimeout(function(){
				iSlider.$slider.closest('.tradeFreeMarket-path-wrp').find('.js-path-toggle').trigger('change', [true]);
			}, 1);
		},
		setValue: function(iSlider, value){
			value = snip.iSliderHandler.setValue(iSlider, value);
			
			iSlider.setTime(iSlider, +value);
		},
		setTime: function(iSlider, value){
			iSlider.$time.text(timeMgr.fPeriod((value/lib.trade.speed) * timeMgr.HtS));
		},
		getInputHtml: function(iSlider){
			var html = snip.iSliderHandler.getInputHtml(iSlider);
			
			return html += '<div class="tradeFreeMarket-pathTime-wrp">'+snip.time()+snip.title('', 'Примерное время доставки без учета ускорителей и расовых возможностей', 'tradeFreeMarket-pathTime tooltip-text');
		}
	});
	
	this.wrp.find('.js-allowSending-toggle').trigger('change', [true, true]);
};


wTradeFreeMarket.prototype.checkCanMarket = function(iSlider){
	this.setCanMarket(!!(+iSlider.$input.val()));
};

wTradeFreeMarket.prototype.checkStockOverflow = function(iSlider, res){
	if( Trade.isSell(this.data.type) || res == Resource.ids.food ) return;
	
	var overflowRes = utils.toInt(iSlider.$input.val()) + Trade.normalizeByTradersCapacity(this.getStockHasResCount(res) + this.getSentResCount(res)),
		isOverflow = overflowRes > Trade.normalizeByTradersCapacity(wofh.town.getStock().getMax());
	
	iSlider.$slider.toggleClass('-type-stockOverflow', isOverflow);
};

wTradeFreeMarket.prototype.getStockHasResCount = function(res){
	var stockHasResCount = 0;
	
	if( Trade.getFreeMarketFilterProp('stock') )
		stockHasResCount = wofh.town.getRes(res).getHas();
	
	return stockHasResCount;
};

wTradeFreeMarket.prototype.getSentResCount = function(res){
	var sentResCount = 0;
	
	if( Trade.getFreeMarketFilterProp('sending') ){
		var list = wofh.events.getTownTradersMoves(wofh.town).getList();

		// Количество реса, которое несут торговцы в город
		for( var tradersMove in list ){
			tradersMove = list[tradersMove];

			if( tradersMove.isIncom() )
				sentResCount += (new ResList(tradersMove.data.res)).getCount(res);
		}
	}
	
	return sentResCount;
};

wTradeFreeMarket.prototype.setCanMarket = function(state){
	if( this.data.canFreeMarket != state ){
		this.data.canFreeMarket = state;
		
		// Если запрос, меняем состояния и для кнопки удаления
		this.wrp.find('.js-doFreeMarketBtn').toggleClass('-disabled', !state);
	}
};

wTradeFreeMarket.prototype.showResult = function(data){
	
};

wTradeFreeMarket.prototype.setFilter = function(prop, value){
	var filter = ls.getFreeMarketFilter(Trade.getFreeMarketFilter());
			
	filter[prop] = value;

	ls.setFreeMarketFilter(filter);
};