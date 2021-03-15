wMarket = function(){
	wMarket.superclass.constructor.apply(this, arguments);
};

utils.extend(wMarket, Wnd);


wMarket.inheritors = {
	trade: function(){return wTrade;},
	stream: function(){return wStream;},
	barter: function(){return wBarter;}
};

wMarket.getDisplayInfo = function(){
	var info = {};
	
	if( wofh.town.traders.count > 0 ){
		if( Ability.showTrade() ){
			info.name = ls.getLastTradeWnd('trade')||'trade';
            
			if( info.name == 'barter' && !Trade.isBarterAllowed() )
				info.name = 'trade';
            
			info.title = 'Торговля';
		}
		else if( Trade.isBarterAllowed() ){
			info.name = 'barter';
			
			info.title = 'Бартерный обмен';
		}
	}
	
	return info;
};


wMarket.prototype.show = function(){
	for(var inheritor in wMarket.inheritors){
		inheritor = wMarket.inheritors[inheritor]();
		
		if( !(this instanceof inheritor) ){
			var inheritorWnd = wndMgr.getFirstWndByType(inheritor);
			
			if( inheritorWnd ){
				this.closeInheritorWnd(inheritorWnd);
				
				break;
			}
		}
	}
	
	this.saveLastMarketWnd();
	
	wMarket.superclass.show.apply(this, arguments);
};


wMarket.prototype.afterContSet = function(){
	this.wrp.find('.view-'+this.name).css('min-height', utils.getWindowHeight(-40, 0));
};

wMarket.prototype.afterShow = function(firstShow){
	if( firstShow && !(this instanceof wStream) )
		wTradersMove.autoStart(this);
};

wMarket.prototype.onClose = function(result) {
	if( !result )
		notifMgr.runEvent(Notif.ids.sysCloseDependentWnd);
};


wMarket.prototype.closeInheritorWnd  = function(wnd) {
    this.defPos = this.defaultPos = wnd.cont.offset();
	
	this.saveWndPos(this.defPos);
	
	wnd.close(true);
};

wMarket.prototype.saveLastMarketWnd = function() {
    ls.setLastTradeWnd(this.name);
	
	notifMgr.runEvent(Notif.ids.сhangeMarketType);
};



bMarket_panel = function(){
	this.name = 'panel';
	
	bMarket_panel.superclass.constructor.apply(this, arguments);
};

utils.extend(bMarket_panel, Block);

bMarket_panel.prototype.calcFullName = function(){
	return 'market-' + this.name;
};

bMarket_panel.prototype.calcTmplFolder = function(){
	return tmplMgr.market.panel;
};

bMarket_panel.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townTraders] = 
	this.notif.other[Notif.ids.accTownBonus] = this.showTradersInfo;
};

bMarket_panel.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-marketTrans', function(){
			// Перенести в отдельное окно
			wndMgr.addSimple(tmplMgr.snipet.marketTrans(), {
				callbacks: {
					calcName: function(){return 'marketTrans';},
					
					bindEvent: function(){
						var wnd = this;
						
						wnd.wrp
							.on('click', '.marketTrans-add', function(){
								wnd.getMarketStoryData();
							})
							.on('change', '.marketTrans-towns', function(){
								wnd.data.town = $(this).val();
								wnd.data.transTime = 0;
								wnd.cont.find('.js-marketTransData').empty();
								wnd.getMarketStoryData();
							});
					},
					getTmplData: function(){
						this.data.transTime = 0;
						this.data.town = 0;
						
						return this.data;
					},
					afterDraw: function(){
						this.getMarketStoryData();
						
						this.initScroll();
					},
					
					getMarketStoryData: function(){
						var wnd = this;
						
						var loaderId = contentLoader.start( 
							this.wrp.find('.view-marketTrans'), 
							50,
							function(){
								reqMgr.getTradeStory(wnd.data.town, wnd.data.transTime, function(resp){
									contentLoader.stop(loaderId);

									wnd.wrp.find('.marketTrans-add').toggleClass('-hidden', !resp.next);

									wnd.data.transTime = Trade.parseTrans(resp);

									wnd.cont.find('.js-marketTransData').append(tmplMgr.snipet.marketTransData({list: resp.list, time: 0}));

									if( !wnd.data.firstDraw ){
										wnd.data.firstDraw = true;
										
										wnd.afterResize(wnd.data.firstDraw);
									}
								});
							}
						);
					}
				}
			});
		})
		.on('click', '.market-traders-addBonus', function(){
			var bonus = wofh.town.getLuckBonus(LuckBonus.ids.traders);

			wBonusTakeNow.show(bonus);

			return false;
		})
		.on('click', '.market-reserve', function(){
			return false;
		})
		.on('input', '.market-reserve-inp', function(){
			utils.checkInputInt(this, {max: lib.trade.maxtradersreserve, min: 0});
			
			$(this).closest('.market-reserve').find('.market-reserve-set').removeClass('-hidden');
		})
		.on('click', '.market-reserve-set', function(){
			var $this = $(this);

			if( $this.hasClass('js-saving') )
				return;
			else
				$this.addClass('js-saving');

			var traders = +$this.closest('.market-reserve').find('.market-reserve-inp').val(),
				loaderId = contentLoader.start(
				$(this), 
				0, 
				function(){
					reqMgr.reserveTraders(wofh.town.id, traders, function(resp){
						contentLoader.stop(loaderId, !resp.error, resp.error);
						
						$this.removeClass('js-saving').addClass('-hidden');
					});
				},
				{icon:ContentLoader.icon.small, cssPosition: {top: 8, left: 8}}
			);

			return false;
		});
		
	if( wofh.account.isPremium() || wofh.account.isAdmin() )
		this.wrp.on('click', '.js-market-traders-block', function(){
			if( $(this).hasClass('-hideTradersInfo') ){
				$(this).removeClass('-hideTradersInfo');

				self.wrp.find('.js-market-tradersInfo-wrp').slideUp(200);
			}
			else{
				$(this).addClass('-hideTradersInfo');

				self.wrp.find('.js-market-tradersInfo-wrp').slideDown(200);
			}
		});
	
	snip.input1Handler(this.cont, {spinbox: {}});
};

bMarket_panel.prototype.afterDraw = function(){
	this.showTradersInfo();
};


bMarket_panel.prototype.showTradersInfo = function(){
	this.wrp.find('.js-market-traders').html(tmplMgr.market.traders());
	this.wrp.find('.js-market-capacity').html(tmplMgr.market.capacity());
	this.wrp.find('.market-reserve-inp').val(wofh.town.traders.reserve);
	this.wrp.find('.js-market-tradersInfo-block').html(tmplMgr.market.tradersInfo(this.data));
};





bMarket_tabs = function(){
	this.name = 'tabs';
	
	bMarket_tabs.superclass.constructor.apply(this, arguments);
};

utils.extend(bMarket_tabs, Block);

bMarket_tabs.prototype.calcFullName = function(){
	return 'market-' + this.name;
};

bMarket_tabs.prototype.calcTmplFolder = function(){
	return tmplMgr.market.tabs;
};

bMarket_tabs.prototype.getTmplData = function(){
	this.data.activeTab = this.parent.name;
	
	return this.data;
};

bMarket_tabs.prototype.addNotif = function(){
	this.notif.other[Notif.ids.countryBarter] = function(countryBarter){
		if( !countryBarter )
			wndMgr.addAlert('В твоей стране было отключено использование бартерной торговли.');
		
		if( this.parent instanceof wBarter ){
			if( Trade.isBarterAllowed() )
				this.parent.show();
			else if( !countryBarter )
				this.parent.close();
		}
		else{
			this.show();
			
			delete this.parent.tabs.activeTab;
			
			this.parent.showTab();
		}
	};
};





wMarketOpt = function(id, data){
	this.name = 'marketOpt';
	this.hashName = 'marketOpt';
	
	wMarketOpt.superclass.constructor.apply(this, arguments);
	
};

utils.extend(wMarketOpt, Wnd);

WndMgr.regWnd('marketOpt', wMarketOpt);

wMarketOpt.prototype.calcChildren = function(){
	this.children = {};
	
	this.children.barter = wMarketOpt_barter;
};

	wMarketOpt_barter = function(parent){
		this.name = 'barter';
		
		wMarketOpt_barter.superclass.constructor.apply(this, arguments);
	};
	
	utils.extend(wMarketOpt_barter, Block);
	
	wMarketOpt_barter.prototype.getData = function(){
		this.data.barterOn = true;
		
		this.dataReceived();
	};
	
	wMarketOpt_barter.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp.on('change', 'input[name="switchbarter"]', function(){});
	};
	