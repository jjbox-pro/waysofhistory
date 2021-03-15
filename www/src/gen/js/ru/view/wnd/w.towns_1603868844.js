wTowns = function(){
	wTowns.superclass.constructor.apply(this, arguments);
};


utils.extend(wTowns, Wnd);

WndMgr.regWnd('towns', wTowns);


wTowns.prepareData = function(id){
	var data = wofh.account.isPremium() ? {} : false;
	
	return data;
};


wTowns.prototype.calcName = function(){
	return 'towns';
};

wTowns.prototype.calcChildren = function(){
	this.children.tabMain = tabTownsMain;
    this.children.build = tabTownsBuild;
	this.children.prom = tabTownsProm;
	this.children.trade = tabTownsTrade;
	this.children.army = tabTownsArmy;
};

wTowns.prototype.bindEvent = function(){
	this.wrp
		.on('click', '.js-towns-eventImm', function(){
			var $this = $(this);
			
			if( $this.hasClass('-disabled') )
				return false;
			
			var loaderId = contentLoader.start(
				$this, 
				0, 
				function(){
		            var event = wofh.events.getById($(this).data('event'));
					
					if( event.getType() == EventCommon.type.buildI ){
						reqMgr.buildQueueImm(event.getTown1(), function(){
							contentLoader.stop(loaderId);
						});
					}
					else
						reqMgr.eventImm(event, function(){
							contentLoader.stop(loaderId);
						});
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {left: 28, top: 1}, callback: function(){
					$this.removeClass('-disabled');
				}}
			);
			
        });
};

wTowns.prototype.beforeShowChildren = function() {   
    var self = this;
	
	this.tabs = new Tabs(this.cont);
	
	this.tabs.onOpenTab = function(){
		self.doScroll('scrollTo', 'top', {timeout:0});
	};
	
	this.tabs.addTabs(this.children);
};

wTowns.prototype.afterDraw = function() {
	// Убрать через пару недель после обновления миров 23.11.2018
	if( ls.getLastTownsTab('tabMain') == 'main' )
		ls.setLastTownsTab('tabMain');
	
    this.tabs.openTab(ls.getLastTownsTab('tabMain'));
	
	this.initScroll({scrollbarPosition: 'outside'});
};



wTowns.eventsData = {
	spaceship: {
		cls: 'spaceship',
		out: 'Сборка Космического Корабля'
	},
	train: {
		cls: 'masstrn',
		'in': 'Обучение войск'
	},
	defence: {//подкрепление
		cls: 'def',
		out: 'Исходящее подкрепление',
		'in': 'Входящее подкрепление'
	},
	attack:{
		cls: 'atk',
		out: 'Атака на врага',
		'in': 'Нападение врага',
		spy: 'Разведка'
	},
	armyreturn: {
		cls: 'def',
		'in': 'Возвращение войск'
	},
	maketown: {
		cls: 'maketown',
		out: 'Основание нового города'
	},
	makeres: {
		cls: 'makeres',
		out: 'Колонизация месторождения'
	},
	trade: {//доставка ресурсов
		cls: 'trd',
		out: 'Отправка ресурсов',
		'in': 'Получение ресурсов'
	},
	market: {
		cls: 'mar',
		out: 'Возвращение торговцев'
	},
	stream: {
		cls: 'stream',
		out: 'Начало снабжения города',
		'in': 'Начало снабжения из города'
	},
	makeroad:{
		cls: 'makeroad',
		out: 'Постройка дороги'
	},
	spy:{
		cls: 'spy',
		out: 'Разведка',
	},
	explore:{
		cls: 'spy',
		out: 'Разведка',
	},
	makeimp:{
		cls: 'makeroad',
		out: 'Улучшение местности'
	},
	battle: {
		cls: 'battle',
		'in': 'Битва - защита',
		'out': 'Битва - нападение'
	}
};

// Количество событий для показа разварачиваемой панели
wTowns.eventsExtPanelCount = 3;


/******
 * Вкладка tabMain
 */

tabTownsMain = function(){
    this.name = 'tabMain';
	this.tabTitle = 'Общая';
	
	tabTownsMain.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTownsMain, Tab);

tabTownsMain.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.js-eventsExtPanel', function(){
			$(this).parents('.eventsList').find('.eventsView').toggleClass('-hidden');
		});
};

tabTownsMain.prototype.addNotif = function(){
	this.notif = {
		show:[Notif.ids.event, Notif.ids.townUpd, Notif.ids.townRes]
	};
};

tabTownsMain.prototype.afterOpenTab = function(){
	ls.setLastTownsTab(this.name);
};



/******
 * Вкладка build
 */

tabTownsBuild = function(){
    this.name = 'build';
	this.tabTitle = 'Строения';
	
	tabTownsBuild.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTownsBuild, Tab);

tabTownsBuild.prototype.bindEvent = function(){
    var self = this;
	
	// Пунктир очередь-.-.-.-.-список
	this.wrp
		.on('mouseenter', '.js-build-block', function(){
		var townWrap = $(this).parents('li').first(),
			disp = townWrap.offset();

		
		var queue = $(this).find('.build-arrow'),
			start = queue.offset();
			
		start.top += queue.height()-2;
		start.left += queue.width()/2;
		
		
		var slotPos = +$(this).find('.slot-view').first().data('pos'),
			slot = townWrap.find('.slot-list li').eq(slotPos),
			finish = slot.offset();
		
		finish.left += slot.width()/2;
		
		
		var dottedLine = $('<div class="dotted-line"></div>');
		
		dottedLine.offset({
			top: start.top - disp.top,
			left: Math.min(start.left, finish.left) - disp.left
		});
		dottedLine.width(Math.abs(start.left - finish.left));
		
		dottedLine.addClass($(this).attr('class').split(' ').shift());
		if( start.left < finish.left ){
			dottedLine.addClass('-right');
		}
		townWrap.append(dottedLine);
	})
		.on('mouseleave', '.js-build-block', function(){
			self.cont.find('.dotted-line').remove();
		})
		.on('click', '.js-build-event', function(){
			var $this = $(this);
			
			if( $this.hasClass('-disabled') )
				return false;
			
			var loaderId,
				_start_loader = function(){
				loaderId = contentLoader.start(
					$this, 
					0, 
					function(){
						$this.parents('.js-build-block').find('.js-build-even').addClass('-disabled');
					}.bind(this),
					{icon: ContentLoader.icon.small, cssPosition: {left: 8, top: 8}, callback: function(){
						$this.parents('.js-build-block').find('.js-build-even').removeClass('-disabled');
					}}
				);
			
			};
			
			if( $this.hasClass('js-type-imm') ){
				var err = wofh.town.slots.canBuildUp();
			
				if ( err.isOk() ) {
					_start_loader();
					
					reqMgr.buildQueueImm($this.data('town'), function(){
						contentLoader.stop(loaderId);
					});
				}
				else
					wndMgr.addAlert(tmplMgr.bldqueue.alert.immediate());
			}
			else{
				var town = $this.data('town'),
					eventPos = $this.data('pos');
				
				wndMgr.addConfirm(tmplMgr.bldqueue.alert.cancel({event: wofh.events.getById($this.data('event'))})).onAccept = function(){
					_start_loader();
					
					reqMgr.buildQueueCancel(eventPos, town, function(){
						contentLoader.stop(loaderId);
					});
				};
			}
			
            
		});
};

tabTownsBuild.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townUpd, Notif.ids.townBuildQueue];
};


tabTownsBuild.prototype.afterOpenTab = function(){
	ls.setLastTownsTab(this.name);
};



/******
 * Вкладка prom
 */

tabTownsProm = function(){
    this.name = 'prom';
	this.tabTitle = 'Промышленность';
	
	tabTownsProm.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTownsProm, Tab);

tabTownsProm.prototype.bindEvent = function(){
    var self = this;
	
	// Потребление
	this.wrp
		.on('change', '.stock-res-cons', function(){
			var $stock = $(this).closest('.js-stock-block');
			
			self.checkConsumption($stock);
			
			$stock.find('.js-setConsumption').removeClass('-hidden');
		})
		.on('submit', '.js-stock-block', function(){
			if( !runOnce.run('resConsumption') ) 
				return false;
			
			var $setConsumption = $(this).find('.js-setConsumption').addClass('-disabled');
			var loaderId = contentLoader.start( 
				$setConsumption, 
				0,
				function(){
					reqMgr.setResConsumption_form(utils.urlToObj($(this).serialize()), function(){
						contentLoader.stop(loaderId);
					}, $(this).data('town'));
				}.bind(this),
				{
					icon: ContentLoader.icon.short, 
					cssPosition: {right: -55, top: 1}, 
					callback:function(){
						runOnce.over('resConsumption');
						
						$setConsumption.removeClass('-disabled');
					}
				} 
			);

			
			return false;
		})
		.on('click', '.js-show-court', function(){
			var town = wofh.towns[$(this).data('town')],
				court = town.getSlots().getSlotsByAbility(Build.type.corruption).getFirst();
			
			if( court )
				hashMgr.showWnd('slot', court.getPos()+'&town='+town.id);
		})
		.on('mouseenter', '.js-show-court', function(event){
			var town = wofh.towns[$(this).data('town')],
				court = town.getSlots().getSlotsByAbility(Build.type.corruption).getFirst();
				
			if ( court )
				tooltipMgr.show(tmplMgr.towns.block.corruption.court({town: town, court: court}), utils.getPosFromEvent(event));
		})
		.on('mouseleave', '.js-show-court', function(){
			tooltipMgr.hide();
		});
};

tabTownsProm.prototype.afterDraw = function(){
	var self = this;
	
	this.wrp.find('.js-stock-block').each(function(){
		self.checkConsumption($(this));
	});
};

tabTownsProm.prototype.addNotif = function(){
	this.notif = {
		show:[Notif.ids.townUpd, Notif.ids.townRes]
	};
};

tabTownsProm.prototype.afterOpenTab = function(){
	ls.setLastTownsTab(this.name);
};



tabTownsProm.prototype.checkConsumption = function($stock){
	var town = wofh.towns[$stock.parents('.js-town').data('town')],
		consumption = town.getStock().calcMaxConsCount();
	
	$stock.find('input:not(:checked)').attr('disabled', consumption <= $stock.find('input:checked').size());
};



/******
 * Вкладка trade
 */

tabTownsTrade = function(){
    this.name = 'trade';
	this.tabTitle = 'Торговля';
	
	tabTownsTrade.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTownsTrade, Tab);

tabTownsTrade.prototype.bindEvent = function(){
    var self = this;
	
	self.wrp
		.on('input', '.js-traders-reserve', function(){
			utils.checkInputInt(this, {min: 0});
			
			$(this).parent().find('.js-set-traders-reserve').removeClass('-hidden');
		})
		.on('click', '.js-set-traders-reserve', function(){
			var $this = $(this);
			
			if( $this.hasClass('-disabled') )
				return false;
			
			$this.addClass('-disabled');
			
			var loaderId = contentLoader.start(
				$this, 
				0, 
				function(){
					reqMgr.reserveTraders($(this).data('town'), +$(this).siblings('.js-traders-reserve').val(), function(){
		                contentLoader.stop(loaderId, true);
						
						$this.addClass('-hidden');
		            });
				}.bind(this),
				{icon:ContentLoader.icon.short, cssPosition: {right: -55, top: 1}, callback: function(){
					$this.removeClass('-disabled');
				}}
			);
			
			
			return false;
		})
		.on('click', '.js-market-showPanel', function(){
			$(this).parents('.market-block').toggleClass('-brief');
			
			return false;
		});
};

tabTownsTrade.prototype.addNotif = function(){
	this.notif.show =	[
							Notif.ids.townStream, 
							Notif.ids.townTradersMove, 
							Notif.ids.townBarter, 
							Notif.ids.townTradeOffers, 
							Notif.ids.townStreamMarketOffer,
							Notif.ids.countryBarter,
						];
};

tabTownsTrade.prototype.afterOpenTab = function(){
	ls.setLastTownsTab(this.name);
};



tabTownsTrade.showOffersCount = 4;
tabTownsTrade.streamCount = 6;
tabTownsTrade.showEventCount = 2;



/******
 * Вкладка army
 */

tabTownsArmy = function(){
    this.name = 'army';
	this.tabTitle = 'Армия';
	
	tabTownsArmy.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTownsArmy, Tab);

tabTownsArmy.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp.on('click', '.js-train-takeaway', function(){
		var townId = $(this).data('town');
		wndMgr.addConfirm(tmplMgr.train.work.takeawayAlert({})).onAccept = function(){
			reqMgr.trainTakeAway(townId);
		};
	});
};

tabTownsArmy.prototype.addNotif = function(){
	this.notif = {
		show:[Notif.ids.townUpd, Notif.ids.eventArmy, Notif.ids.townAttacks, Notif.ids.townTrain]
	};
};

tabTownsArmy.prototype.afterOpenTab = function(){
	ls.setLastTownsTab(this.name);
};