wBarter = function(){
	wBarter.superclass.constructor.apply(this, arguments);
};

utils.extend(wBarter, wMarket);

WndMgr.regWnd('barter', wBarter);


wBarter.prepareData = function(){
	if( Trade.isBarterAllowed() )
		var data = {};
	else{
		var data = false;
		
		if( 'barter' == ls.getLastTradeWnd('barter') )
			hashMgr.showWnd('trade');
	}
	
	return data;
};


wBarter.prototype.calcName = function() {
	return 'barter';
};

wBarter.prototype.calcChildren = function() {
	this.children.marketPanel = bMBarter_panel;
	this.children.marketTabs = bMarket_tabs;
	this.children.sell = tabBarterSell;
	if( Ability.isBarterAvailable() )
		this.children.buy = tabBarterBuy;
};

wBarter.prototype.beforeShowChildren = function() {   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

wBarter.prototype.afterDraw = function() {
	this.showMyActiveBarterOffersCount();
	
    this.showTab();
};


wBarter.prototype.showTab = function(){
	this.showMyActiveBarterOffersCount();
	
	this.tabs.openTab(this.children.buy ? ls.getLastBarterTab('buy') : 'sell');
};

wBarter.prototype.saveLastMarketWnd = function(){
	if( Ability.showTrade() )
		wBarter.superclass.saveLastMarketWnd.apply(this, arguments);
};


wBarter.prototype.showMyActiveBarterOffersCount = function(){
	var offers = wofh.barterOffers.getTownOffers().getList();
	
	var count = 0;
	for( var offer in offers ){
		if( offers[offer].isAvail() )
			count++;
	}
	
	this.cont.find('.js-activeBarterOffersCount').text(count);
};



bMBarter_panel = function(){
	bMBarter_panel.superclass.constructor.apply(this, arguments);
};

utils.extend(bMBarter_panel, bMarket_panel);

bMBarter_panel.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accLuck] = this.showLuckInfo;
	this.notif.other[Notif.ids.townBarter] = this.setMarketBusyTraders;
	
	bMBarter_panel.superclass.addNotif.apply(this, arguments);
};

bMBarter_panel.prototype.getTmplData = function(){
	this.data.showLuck = true, 
	this.data.showBusyTrders = true;
	this.data.showTradersMove = true;
	
	return this.data;
};

bMBarter_panel.prototype.afterDraw = function(){
	this.showLuckInfo();
	
	bMBarter_panel.superclass.afterDraw.apply(this, arguments);
};


bMBarter_panel.prototype.showTradersInfo = function(){
	bMBarter_panel.superclass.showTradersInfo.apply(this, arguments);
	
	this.setMarketBusyTraders();
};


bMBarter_panel.prototype.setMarketBusyTraders = function(){
	var offers = wofh.barterOffers.getTownOffers().getList(),
		marketTraders = 0;
	
	for(var offer in offers){
		offer = offers[offer];
		
		marketTraders += offer.count * Trade.getTradersByRes(offer.count1);
	}
	
	this.wrp.find('.js-marketBusyTraders').text(marketTraders);
};

bMBarter_panel.prototype.showLuckInfo = function(){
	//this.cont.find('.js-barter-luck').html(snip.luck(utils.toInt(wofh.account.getCoinsBought())));
};



/******
 * Вкладка sell
 */

tabBarterSell = function(){
    this.name = 'sell';
	this.data = {};
	
	tabBarterSell.superclass.constructor.apply(this, arguments);
};

utils.extend(tabBarterSell, Tab);


tabBarterSell.prototype.bindEvent = function(){
    var self = this;
	
	self.wrp
		.on('click', '.js-editOffer', function(){
			wndMgr.addWnd(wBarterOffer, $(this).data('id'));
			
			return false;
		})
		.on('click', '.js-editOfferCount', function(){
			var count = $(this).closest('.js-editOffer').find('.barter-sell-offerCount').val(),
				offer = wofh.barterOffers.getElem($(this).data('id')).clone();
			
			reqMgr.setBarterOffer(offer.id, offer.res1, offer.count1, offer.res2, offer.count2, count, offer.distance, offer.ally);
			
			return false;
		})
		.on('click', '.js-changeOfferAvailability', function(){
			if( self.availabilityLoaderId )
				return false;
			
			var $this = $(this),
				changeAvailability = function(offer, count){
					self.availabilityLoaderId = contentLoader.start( 
						$this.parent('.availability-wrp'), 
						300, 
						function() {
							reqMgr.setBarterOffer(offer.id, offer.res1, offer.count1, offer.res2, offer.count2, count, offer.distance, offer.ally, function(){
								contentLoader.stop(self.availabilityLoaderId);
							});
						},
						{icon: ContentLoader.icon.small, callback: function(){
							delete self.availabilityLoaderId;
						}} 
					);
				};
			
			if( $(this).prop('checked') )
				changeAvailability(wofh.barterOffers.getElem($this.data('id')).clone(), 1);
			else{
				wndMgr.addConfirm('Данное предложение будет снято с рынка. Это обдуманное решение?', {okText: 'Да', cancelText: 'Нет'}).onAccept = function(){
					changeAvailability(wofh.barterOffers.getElem($this.data('id')).clone(), 0);
				};
			}
			
			return false;
		})
		.on('click', '.js-delOffer', function(){
			var el = $(this);
			if (el.hasClass('-disabled')) return false;
			
			wndMgr.addConfirm().onAccept = function(){
				el.addClass('-disabled');
				
				reqMgr.delBarterOffer(el.data('id'));
			};

			return false;
		})
		.on('click', '.barter-sell-offerCount-wrp', function(){
			return false;
		})
		.on('focusin', '.barter-sell-offerCount', function(){
			$(this).select();
		})
		.on('input', '.barter-sell-offerCount', function(){
			utils.checkInputInt(this, {min: 0});
			
			var $editCount = $(this).closest('.js-editOffer').find('.js-editOfferCount');
			
			if( $editCount.hasClass('-hidden') )
				$editCount.removeClass('-hidden');
			
			return false;
		});
		
		snip.input1Handler(this.cont);
};

tabBarterSell.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townBarter] = function(){
		this.clearTimeout(this.notifTimeout);
		
		this.notifTimeout = this.setTimeout(function(){
			if( !Trade.isBarterAllowed() ){
				this.parent.close();
				
				return;
			}
			
			this.parent.showMyActiveBarterOffersCount();
			
			this.table.data.list = wofh.barterOffers.getTownOffers().getSortList().getList();
			
			this.table.show();
		}, Notif.sDelay);
	};
};

tabBarterSell.prototype.afterDraw = function(){
    this.table = new tblBarterSellOffers(this, this.wrp);
	
    this.table.toggleSort('res-sell', false);
};

tabBarterSell.prototype.afterOpenTab = function(){
	ls.setLastBarterTab(this.name);
};



/******
 * Таблица sell - таблица списка выставленных предложений
 */

tblBarterSellOffers = function(parent, cont) {
    this.tmpl = tmplMgr.barter.tableSellOffers;
    this.data = {};
    this.data.list = wofh.barterOffers.getTownOffers().getSortList().getList();;
    
	tblBarterSellOffers.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblBarterSellOffers, Table);

tblBarterSellOffers.prototype.getSortVal = function(offer, field) {
    if (field == 'profit') return offer.getProfit();
    if (field == 'distance') return offer.distance;
	if( field == 'res-sell' ) return offer.res1;
	if( field == 'res-buy' ) return offer.res2;
	if( field == 'availability' ) return offer.count;
	
    return offer.count1; // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblBarterSellOffers.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.parent.wrp.find('.js-barter-sell-offers').toggleClass('-hidden', showTable);
		
		this.showTable = showTable;
	}
	
	snip.spinboxHandler(this.cont);
};



/******
 * Вкладка buy
 */

tabBarterBuy = function(){
    this.name = 'buy';
    
	tabBarterBuy.superclass.constructor.apply(this, arguments);
};

utils.extend(tabBarterBuy, Tab);


tabBarterBuy.prototype.getData = function(){
	this.data.pos = 0;

	this.data.excluded = this.getExcludedRes();

	this.dataReceived();
};

tabBarterBuy.prototype.calcChildren = function(){
	this.children.list = bBarterBuy_list;
};

tabBarterBuy.prototype.bindEvent = function(){
	var self = this;

	self.wrp
		.on('change', '.js-resFilterVal[name="s"]', function(){
			self.cont.find('.js-tradeBarter-s').attr('data-res', $(this).val());
		})
		.on('change', '.js-resFilterVal[name="b"]', function(){
			self.cont.find('.js-tradeBarter-b').attr('data-res', $(this).val());
		})
		.on('change', '.js-barter-buy-resFilter-wrp input', function(e, notChange){
			if( notChange )
				return;

			self.data.pos = 0;
			self.children.list.show();
		})
		.on('click', '.resFilter a', function(){
			var btn = $(this),
				filter = btn.closest('.js-resFilter-block'),
				res = btn.data('res');

			if( res > -1 && res < 100 ){
				var otherFilter = filter.siblings('.js-resFilter-block');

				if (otherFilter.find('.resb.-active').data('res') == res && !otherFilter.find('.resExt.-active').length ){
					var activeBtns = filter.find('.resb.-active');

					if (activeBtns.length > 1){
						var otherResId = -1;
					} else {
						var otherResId = activeBtns.data('res');
						if (otherResId == undefined) {
							otherResId = -1;
						}	
					}

					var otherRes =otherFilter.find('a[data-res="'+otherResId+'"]');

					snip.filterResChange(otherRes, true);
				}
			}

			snip.filterResChange($(this));
		})
		.on('click', '.js-profitSort', function(){
			delete self.data.bydist;
			self.children.list.show();
		})
		.on('click', '.js-distSort', function(){
			self.data.bydist = 1;
			self.children.list.show();
		})
		.on('click', '.page-nav-next.-active', function(){
			self.data.pos = self.data.next;
			self.children.list.show();
		})
		.on('click', '.page-nav-prev.-active', function(){
			self.data.pos = self.data.prev;
			self.children.list.show();
		})
		.on('submit', '.js-barter-buy', function(){
			return false;
		});

		snip.input1Handler(this.cont);
};

tabBarterBuy.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabBarterBuy.prototype.afterOpenTab = function(){
	ls.setLastBarterTab(this.name);
};


tabBarterBuy.prototype.getExcludedRes = function() {
	var excluded = [];

	for(var resId in lib.resource.data){
		var res = new Resource(resId);

		if( res.getNoBarter() )
			excluded.push(+resId);
	}

	return excluded;
};



bBarterBuy_list = function(){
	this.name = 'list';

	bBarterBuy_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bBarterBuy_list, Block);


bBarterBuy_list.prototype.getData = function(){
	var self = this;

	this.data = this.parent.data;

	var loaderId = contentLoader.start( 
		this.parent.wrp, 
		0, 
		function(){
			self.getReqData(function(){
				var reqData = utils.urlToObj(this.parent.cont.serialize());
				
				reqData.n = this.data.pos;
				reqData.bydist = this.data.bydist;
				
				if( reqData.s == Resource.ids.luck ) reqData.s = Resource.ids.science;
				if( reqData.b == Resource.ids.luck ) reqData.b = Resource.ids.science;
				
				reqMgr.getBarterOffers(reqData.s, reqData.b, reqData.n, reqData.bydist, reqData.onlycountry, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId, 
						function(){
							contentLoader.stop(loaderId);

							this.setFilter(reqData);
							
							resp.offers = resp.offers||[];

							for(var offer in resp.offers){
								offer = resp.offers[offer];

								if( offer.res1 == Resource.ids.science ) offer.res1 = Resource.ids.luck;
								if( offer.res2 == Resource.ids.science ) offer.res2 = Resource.ids.luck;

								// Город известен
								if( offer.town ){
									if( offer.town.account && offer.town.account.country && offer.town.account.country.id == (wofh.country||{}).id )
										offer.inCountry = true;
								}

								offer.profit = Math.round(offer.sum1 / offer.sum2 * 100);
							}	

							this.data.offers = resp.offers;

							this.data.next = resp.next;

							this.data.prev = resp.prev;

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bBarterBuy_list.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.js-barter-buy-offerMaxQuantity', function(){
			var $offer = $(this).closest('.js-barter-buy-offer'),
				offer = self.data.offers[$offer.data('pos')];

			$offer.find('.barter-buy-offerQuantity').val(self.calcMaxQuantity(offer));
		})
		.on('input', '.barter-buy-offerQuantity', function(event){
			var offer = self.data.offers[$(this).closest('.js-barter-buy-offer').data('pos')];

			utils.checkInputInt(this, {max: self.calcMaxQuantity(offer), min: 1, manualInput: !event.isTrigger});
		})
		.on('click', '.barter-buy-buyOffer', function(){
			var $offer = $(this).closest('.js-barter-buy-offer'),
				offer = self.data.offers[$offer.data('pos')],
				quantity = +$offer.find('.barter-buy-offerQuantity').val();

			var loaderId = contentLoader.start(
				self.parent.wrp, 
				100, 
				function(){
					self.getReqData(function(){
						reqMgr.makeBarter(
							offer.id, 
							quantity, 
							{
								onSuccess: function(resp, reqId){
									self.tryProcessResp(
										resp, reqId, 
										function(){
											self.show();
											
											wTradersMove.autoStart(self.parent.parent); // Открытие окна передвижения торговцев
										},
										{noChecks: true}
									);
								},
								onFail: function(){
									contentLoader.stop(loaderId);
								}
							}
						);
					}, {noChecks: true});
				}
			);

			return false;
		});
};

bBarterBuy_list.prototype.afterDraw = function(){
	this.parent.wrp.find('.page-nav-prev').toggleClass('-active', this.data.prev !== undefined);
	this.parent.wrp.find('.page-nav-next').toggleClass('-active', this.data.next !== undefined);

	snip.spinboxHandler(this.cont);
};


bBarterBuy_list.prototype.setFilter = function(data){
	var filter = ls.getBarterFilter(Trade.getBarterFilter());
	
	filter.s = data.s == Resource.ids.science ? Resource.ids.luck : data.s;
	filter.b = data.b == Resource.ids.science ? Resource.ids.luck : data.b;	
	
	filter.onlycountry = data.onlycountry;

	ls.setBarterFilter(filter);
};

bBarterBuy_list.prototype.calcMaxQuantity = function(offer){
	var freeTradersCapacity = wofh.town.getFreeTraders() * lib.trade.capacity;
	
	return Math.min(offer.quantity, utils.toInt(freeTradersCapacity / offer.sum2)||1);
};



/******
 * Окно создания/редактирования предложения
 */

wBarterOffer = function(){
	this.name = 'barterOffer';
	this.hashName = 'barterOffer';
	
	wBarterOffer.superclass.constructor.apply(this, arguments);
	
	this.options.showBack = true;
};

utils.extend(wBarterOffer, Wnd);

WndMgr.regWnd('barterOffer', wBarterOffer);


wBarterOffer.prepareData = function(id){
	var data = {
		isBarterAvailable: Ability.isBarterAvailable()
	},
		params = {id:id};
		
	if( typeof(id) == 'string' )
		params = utils.urlToObj(id);
	
	var offer = wofh.barterOffers.getElem(params.id).clone();
	
	if( !data.isBarterAvailable && !offer.id )
		return false;
	
	data.town = wofh.towns[offer.town||params.town]||wofh.town;
	
	data.minResVal = 0;
	
	offer.res1 = offer.res1||Resource.ids.wood;
	offer.res2 = offer.res2||Resource.ids.fruit;
	offer.count1 = offer.count1||data.minResVal;
	offer.count2 = offer.count2||data.minResVal;
	offer.count = offer.count||1;
	
	var lastData = ls.getBarterOfferLastData({distance:lib.trade.distance});
	
	if( lastData.distance > lib.trade.distance && !Account.hasAbility(Science.ability.longTrade) )
		lastData.distance = lib.trade.distance;
	
	offer.distance = offer.distance||lastData.distance;
	offer.ally = offer.ally;
	
	// Вычисляем, какие ресурсы будут заблокированы
	data.disabledSell = [];
	for(var res in lib.resource.data){
		if( res == Resource.ids.luck && wofh.account.getCoinsBoughtMoved() )
			continue;
		
		if( !wofh.town.getRes(res).getHas() || (offer.id && offer.res1 != res) )
			data.disabledSell.push(+res);
	}
	
	if( offer.id ){
		data.disabledBuy = [];
		
		for(var res in lib.resource.data){
			if( offer.res2 != res )
				data.disabledBuy.push(+res);
		}
	}
	
	data.excluded = [];
	for(var resId in lib.resource.data){
		var res = new Resource(resId);
		if( res.getNoBarter() )
			data.excluded.push(+resId);
	}
	
	data.offer = offer;
	
	return data;
};


wBarterOffer.prototype.bindEvent = function(){
	var self = this;
	
	this.cont
		.on('change', 'input[name="onlycountry"]', function(){
			if( self.data.offer.id )
				self.checkCanSetOffer();
		})
        .on('click', '.js-resFilter a', function(){
			if( self.data.offer.id )
				return false;
			
			snip.filterResChange($(this));
		})
		.on('submit', '.js-barterPopup-sell-offer', function(){
			if( !self.data.canSetOffer )
				return false;
			
			self.checkCanSetOffer(true, true); // Запрещаем повторное нажатие кнопки
			
			var loaderId = contentLoader.start( 
				self.cont.find('.js-setOffer'), 
				0, 
				function(){
					var reqData = utils.urlToObj($(this).serialize());
					
					if( wofh.country && reqData.onlycountry )
						reqData.ally = wofh.tradeAllies.getCountryAlly();
					
					reqMgr.setBarterOffer(
						self.data.offer.id, 
						reqData.res1, 
						reqData.count1, 
						reqData.res2, 
						reqData.count2, 
						reqData.count, 
						reqData.distance, 
						reqData.ally, 
						{
							onSuccess: function(){
								contentLoader.stop(loaderId);
								
								if( self.data.offer.id === undefined )
									ls.setBarterOfferLastData({distance:reqData.distance});
								
								self.close();
							},
							onFail: function(){
								contentLoader.stop(loaderId);
							}
						}, 
						self.data.town);
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){
					self.checkCanSetOffer(false, true);
				}}
			);
			
			return false;
		})
		.on('click', '.js-delOffer', function(){
			var $this = $(this);
			
			if( !self.data.canSetOffer && $this.hasClass('-desabled') )
				return false;
			
			wndMgr.addConfirm().onAccept = function(){
				self.checkCanSetOffer(true, true); // Запрещаем повторное нажатие кнопок
				
				var loaderId = contentLoader.start(
					$this, 
					0, 
					function() {
						reqMgr.delBarterOffer(self.data.offer.id, function(){
							contentLoader.stop(loaderId);
							
							self.close();
						}, self.data.town);
					},
					{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){
						self.checkCanSetOffer(false, true);
					}}
				);
				
				
			};
			
			return false;
		});
	
	// Слайдер продаваемого ресурса
	snip.iSliderHandler({
		$slider: this.cont.find('.js-barterPopup-slider-wrp.js-sell-count .slider'),
		min: this.data.minResVal,
		maxLimit: wofh.town.stock.getLimit(),
		max: (utils.toInt((this.data.offer.count1 + lib.trade.capacity)/lib.trade.capacity)) * lib.trade.capacity,
		value: this.data.offer.count1,
		name: 'count1',
		shortStep: 1,
		labelIcon: snip.resBig(self.data.offer.res1),
		create: function(iSlider){
			iSlider.$input.on('iSlider-input-checked', function(){
				self.checkCanSetOffer();
			});
			
			self.cont.on('click', '.js-barterPopup-resFilter-sell .js-resFilter a', function(){
				if($(this).is('.disabled')) return;
				
				iSlider.$slider.find('.js-slider-label-icon').html(snip.resBig($(this).data('res')));
			});
		},
		slide: function(){
			self.checkCanSetOffer();
		}
	});
	
	// Слайдер покупаемого ресурса
	snip.iSliderHandler({
		$slider: this.cont.find('.js-barterPopup-slider-wrp.js-buy-count .slider'),
		min: this.data.minResVal,
		maxLimit: wofh.town.stock.getLimit(),
		max: (utils.toInt((this.data.offer.count2 + lib.trade.capacity)/lib.trade.capacity)) * lib.trade.capacity,
		value: this.data.offer.count2,
		name: 'count2',
		shortStep: 1,
		labelIcon: snip.resBig(self.data.offer.res2),
		create: function(iSlider){
			iSlider.$input.on('iSlider-input-checked', function(){
				self.checkCanSetOffer();
			});
			
			self.cont.on('click', '.js-barterPopup-resFilter-buy .js-resFilter a', function(){
				if($(this).is('.disabled')) return;
				
				iSlider.$slider.find('.js-slider-label-icon').html(snip.resBig($(this).data('res')));
			});
		},
		slide: function(){
			self.checkCanSetOffer();
		}
	});
	
	// Слайдер количества предложений
	snip.iSliderHandler({
		$slider: this.cont.find('.js-barterPopup-offerCount-slider .slider'),
		maxLimit: 10000,
		max: (utils.toInt((this.data.offer.count + 10)/10)) * 10,
		value: this.data.offer.count,
		step: 1,
		name: 'count',
		create: function(iSlider){
			if( self.data.offer.id ){
				iSlider.$input.on('iSlider-input-checked', function(){
					self.checkCanSetOffer();
				});
			}
		},
		slide: function(){
			if( self.data.offer.id )
				self.checkCanSetOffer();
		}
	});
	
	// Слайдер расстояния
	snip.iSliderHandler({
		$slider: this.cont.find('.js-barterPopup-offerDist-slider .slider'),
		min: Trade.minDistance,
		maxLimit: Account.hasAbility(Science.ability.longTrade) ? lib.map.size.array : lib.trade.distance,
		value: this.data.offer.distance,
		shortStep: 1,
		name: 'distance',
		labelIcon: snip.ruler(),
		create: function(iSlider){
			if( self.data.offer.id ){
				iSlider.$input.on('iSlider-input-checked', function(){
					self.checkCanSetOffer();
				});
			}
		},
		slide: function(){
			if( self.data.offer.id )
				self.checkCanSetOffer();
		}
	});
	
	this.checkCanSetOffer(true);
};


wBarterOffer.prototype.checkCanSetOffer = function(unset, isReq){
	if( unset || !this.data.isBarterAvailable || !(+this.cont.find('input[name="count2"]').val()) || !(+this.cont.find('input[name="count1"]').val()) )
		this.data.canSetOffer = false;
	else
		this.data.canSetOffer = true;

	this.cont.find('.js-setOffer' + (isReq ? ', .js-delOffer' : '')).toggleClass('-disabled', !this.data.canSetOffer);
};