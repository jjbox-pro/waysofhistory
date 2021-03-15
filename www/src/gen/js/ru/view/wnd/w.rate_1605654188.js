/**
	Окно рейтинга игроков
*/

wRate = function(){
	this.name = 'rate';
	this.hashName = 'rate';
	
	wRate.superclass.constructor.apply(this, arguments);
};

utils.extend(wRate, Wnd);

WndMgr.regWnd('rate', wRate);


wRate.prototype.calcChildren = function() {
	this.children.town = tabRateTown;
	this.children.player = tabRatePlayer;
	this.children.country = tabRateCountry;
};

wRate.prototype.beforeShowChildren = function() {   
    this.tabs = new Tabs(this.cont, this);
	
	this.tabs.addTabs(this.children);
};

wRate.prototype.afterDraw = function() {
    this.tabs.openTab('player');
};

wRate.prototype.moveWnd  = function() {
	// Центрируем окно
	if( !this.centering ){
		this.setAutoPos();
		
		this.centering = true;
	}
};





tabRateTown = function(){
    this.name = 'town';
	this.tabTitle = 'Рейтинг городов';
	
	tabRateTown.superclass.constructor.apply(this, arguments);
};

utils.extend(tabRateTown, Tab);


tabRateTown.prototype.getData = function(){
	this.data.filterC = '';
	this.data.search = {};

	this.dataReceived();
};

tabRateTown.prototype.calcChildren = function(){
	this.children.list = bRateTown_list;
};

tabRateTown.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.rate-btn.-type-country', function(){
			delete self.data.friends; // Не работает вместе с фильтром друзей

			var filter = $(this).data('filter');

			if( self.data.filterC == filter )
				delete self.data.filterC;
			else
				self.data.filterC = filter; 

			self.children.list.show();

			return false;
		})
		.on('click', '.rate-btn.-type-friends', function(){
			delete self.data.filterC; // Не работает вместе с фильтрами страны и континента

			self.data.friends = !$(this).hasClass('-active');

			self.children.list.show();

			return false;
		})
		.on('click', '.page-nav-prev, .page-nav-next', function(){
			var pos = $(this).attr('href');

			if( pos ){
				self.unsetSearchParams();

				self.data.noColor = true;

				self.data.pos = pos;

				self.children.list.show();
			}

			return false;
		})
		.on('submit', '.js-rate-town-search', function(e){
            e.preventDefault();
            
			self.setSearchParams(utils.serializeToObject($(this).serialize()));

			self.children.list.show();
		})
		.on('input', '.spinbox', function(){
			utils.checkInputInt(this, {min: 0});
		});

	snip.input1Handler(this.cont);
	snip.spinboxHandler(this.cont);
};

tabRateTown.prototype.afterDraw = function(){
	this.wrp.find('.rate-btn.-type-country').toggleClass('-hidden', !(wofh.country && wofh.account.isPremium()));
};

tabRateTown.prototype.afterOpenTab = function(){
	if( this.wasOpened )
		return;

	this.wasOpened = true;

	this.children.list.show();
};

tabRateTown.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'town');
};


tabRateTown.prototype.setSearchParams = function(params){
	if( params.pos ) this.data.search.pos = params.pos;
};

tabRateTown.prototype.unsetSearchParams = function(){
	this.data.search = {};
};



bRateTown_list = function(){
	bRateTown_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bRateTown_list, Block);


bRateTown_list.prototype.calcName = function(){
	return 'list';
};

bRateTown_list.prototype.getData = function(){
	if( !this.canDisplay() ){
		this.dataReceived();
		
		return;
	}
	
	var self = this;

	this.data = this.parent.data;

	var loaderId = contentLoader.start( 
		this.parent.parent.wrp.find('.wnd-cont-wrp'), 
		50, 
		function(){
			self.getReqData(function(){
				reqMgr.getTownRate(
					this.data.search.pos||this.data.pos, 
					this.data.filterC, 
					this.data.friends,
					function(resp, reqId){
						self.tryProcessResp(
							resp, reqId, 
							function(){
								contentLoader.stop(loaderId);
								
								if( !resp ){
									this.dataReceived();
									
									return;
								}
								
								this.data.prev = resp.prev;

								this.data.next = resp.next;

								this.data.towns = resp.table;

								this.dataReceived();
							}
						);
					}
				);
			});
		}
	);
};

bRateTown_list.prototype.canDisplay = function(){
	return this.parent.wasOpened; // Первый раз показываем список только при открытии вкладки
};

bRateTown_list.prototype.afterDraw = function(){
	var data = this.data,
		$wrp = this.parent.wrp;

	if( data.towns ){
		if( data.prev === undefined )
			$wrp.find('.page-nav-prev').removeAttr('href');
		else
			$wrp.find('.page-nav-prev').attr('href', data.prev);

		if( data.next === undefined )
			$wrp.find('.page-nav-next').removeAttr('href');
		else
			$wrp.find('.page-nav-next').attr('href', data.next);
	}

	$wrp.find('.rate-btn.-type-country').toggleClass('-active', data.filterC == 'conly');

	// Рейтинг друзей
	if( wndMgr.interfaces.town.friends ){
		$wrp
			.find('.rate-btn.-type-friends')
			.toggleClass('-active', !!data.friends);
	}

	data.noColor = false;
};





tabRatePlayer = function(){
    this.name = 'player';
	this.tabTitle = 'Рейтинг игроков';
	
	tabRatePlayer.superclass.constructor.apply(this, arguments);
};

utils.extend(tabRatePlayer, Tab);


tabRatePlayer.subtypeDec = 10;

tabRatePlayer.pointsPlace = 101;


tabRatePlayer.prototype.getData = function(){
	this.data.filterC = '';
	this.data.search = {};

	this.dataReceived();
};

tabRatePlayer.prototype.calcChildren = function(){
	this.children.list = bRatePlayer_list;
};

tabRatePlayer.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.rate-btn.-type-continent, .rate-btn.-type-country', function(){
			delete self.data.friends; // Не работает вместе с фильтром друзей

			var filter = $(this).data('filter');

			if( self.data.filterC == filter )
				delete self.data.filterC;
			else
				self.data.filterC = filter; 

			self.children.list.show();

			return false;
		})
		.on('click', '.rate-btn.-type-friends', function(){
			delete self.data.filterC; // Не работает вместе с фильтрами страны и континента

			self.data.friends = !$(this).hasClass('-active');

			self.children.list.show();

			return false;
		})
		.on('click', '.rate-btn.-type-hide', function(){
			self.unsetSearchParams();

			self.data.show = +$(this).hasClass('-active');

			self.children.list.show();

			return false;
		})
		.on('click', '.js-rate-type', function(){
			self.setType($(this).data('type'));

			self.children.list.show();

			return false;
		})
		.on('click', '.page-nav-prev, .page-nav-next', function(){
			var pos = $(this).attr('href');

			if( pos ){
				self.unsetSearchParams();

				self.data.noColor = true;

				self.data.pos = pos;

				self.children.list.show();
			}

			return false;
		})
		.on('submit', '.js-rate-player-search', function(e){
            e.preventDefault();
            
			self.setSearchParams(utils.serializeToObject($(this).serialize()));
            
			self.children.list.show();
		})
		.on('input', '.spinbox', function(){
			utils.checkInputInt(this, {min: 0});
		});

	snip.input1Handler(this.cont);
	snip.spinboxHandler(this.cont);
};

tabRatePlayer.prototype.afterDraw = function(){
	this.wrp.find('.rate-btn.-type-country').toggleClass('-hidden', !(wofh.country && wofh.account.isPremium()));
};

tabRatePlayer.prototype.afterOpenTab = function(){
	if( this.wasOpened )
		return;

	this.wasOpened = true;

	this.children.list.show();
};

tabRatePlayer.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'player');
};


tabRatePlayer.prototype.setType = function(type){
	this.data.type = type;

	delete this.data.subtype; // При изменении типа чистим subtype для корректной обработки данных
};

tabRatePlayer.prototype.setSearchParams = function(params){
	this.unsetSearchParams();
    
	if( params.player )
        this.data.search.name = params.player;
	if( params.pos )
        this.data.search.pos = params.pos;
	if( params.addr )
        this.data.search.addr = params.addr;
};

tabRatePlayer.prototype.unsetSearchParams = function(){
	this.data.search = {};
};



bRatePlayer_list = function(){
	bRatePlayer_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bRatePlayer_list, Block);


bRatePlayer_list.prototype.calcName = function(){
	return 'list';
};

bRatePlayer_list.prototype.getData = function(){
	if( !this.canDisplay() ){
		this.dataReceived();
		
		return;
	}
	
	var self = this;

	this.data = this.parent.data;

	var loaderId = contentLoader.start( 
		this.parent.parent.wrp.find('.wnd-cont-wrp'), 
		50, 
		function(){
			self.getReqData(function(){
				reqMgr.getPlayerRate(
					this.data.subtype||this.data.type, 
					this.data.search.pos||this.data.pos, 
					this.data.search.name, 
					this.data.search.addr, 
					this.data.filterC, 
					this.data.show, 
					this.data.friends, 
					function(resp, reqId){
						self.tryProcessResp(
							resp, reqId, 
							function(){
								contentLoader.stop(loaderId);

								this.prepareData(resp);

								this.dataReceived();
							}
						);
					}
				);
			});
		}
	);
};

bRatePlayer_list.prototype.canDisplay = function(){
	return this.parent.wasOpened; // Первый раз показываем список только при открытии вкладки
};

bRatePlayer_list.prototype.afterDraw = function(){
	var data = this.data,
		$wrp = this.parent.wrp;

	// Типы рейтингов
	$wrp.find('.js-rate-type').each(function(){
		$(this).toggleClass('-active', $(this).data('type') == data.type);
	});

	if( data.players ){
		if( data.prev === undefined )
			$wrp.find('.page-nav-prev').removeAttr('href');
		else
			$wrp.find('.page-nav-prev').attr('href', data.prev);

		if( data.next === undefined )
			$wrp.find('.page-nav-next').removeAttr('href');
		else
			$wrp.find('.page-nav-next').attr('href', data.next);
	}

	if( wofh.account.isPremium() ){
		// Скрыт ли игрок
		$wrp.find('.rate-btn.-type-hide')
			.toggleClass('-hidden', !data.type || data.type == '0')
			.toggleClass('-active', !!(data.hideme - 1));
	}

	$wrp.find('.rate-btn.-type-continent').toggleClass('-active', data.filterC == 'cont');
	$wrp.find('.rate-btn.-type-country').toggleClass('-active', data.filterC == 'conly');

	// Рейтинг друзей
	if( wndMgr.interfaces.town.friends ){
		$wrp.find('.rate-btn.-type-friends')
			.toggleClass('-hidden', !!data.type)
			.toggleClass('-active', !!data.friends);
	}

	// Вставка данных
	$wrp.find('.rate-alert-wrp').toggleClass('-hidden', data.alrt === undefined);

	if( data.alrt !== undefined )
		$wrp.find('.rate-alert-wrp').html(tmplMgr.rate.player.alert(data));
	else{
		var html = '';

		if( data.type != 0 ){
			var time = Math.max(0, RatePoints.getEarnTimeoutTime());

			if( time )
				html += 'До окончания начисления ' + snip.hintWrp('Очки рейтинга', snip.ratePointIcon(data.type)) + ' — ' + timeMgr.fPeriod(time);
			else
				html += 'Начисление ' + snip.hintWrp('Очки рейтинга', snip.ratePointIcon(data.type)) + ' окончено';
		}

		$wrp.find('.rate-pointsEarnTimeout-wrp').html(html).toggleClass('-visible', data.type == 0);
	}

	data.noColor = false;
};

bRatePlayer_list.prototype.prepareData = function(resp){
	this.data.subtype = utils.toInt(this.data.subtype||this.data.type); // В subtype могут входить рейтинги отсортированные по ОР (12, 13, 14, 15)

	this.data.type = this.data.subtype%tabRatePlayer.subtypeDec;

	this.data.isSubtype = this.data.subtype != this.data.type;
	
	this.data.hideme = resp.hideme;
	
	this.data.alrt = resp.alrt;
	
	this.data.prev = resp.prev;
	
	this.data.next = resp.next;
	
	for( var row in resp.table ){
		row = resp.table[row];

		row.points = row.points||0;
	}
	
	if( resp.table && resp.table.length == 1 && !resp.table[0].pos )
		this.data.player = resp.table[0];
	else{
		delete this.data.player;

		this.data.players = resp.table;
	}
};





tabRateCountry = function(){
    this.name = 'country';
	this.tabTitle = 'Рейтинг стран';
	
	tabRateCountry.superclass.constructor.apply(this, arguments);
};

utils.extend(tabRateCountry, Tab);


tabRateCountry.prototype.getData = function(){
	this.data.search = {};

	this.dataReceived();
};

tabRateCountry.prototype.calcChildren = function(){
	this.children.list = bRateCountry_list;
};

tabRateCountry.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.page-nav-prev, .page-nav-next', function(){
			var pos = $(this).attr('href');

			if( pos ){
				self.unsetSearchParams();

				self.data.noColor = true;

				self.data.pos = pos;

				self.children.list.show();
			}

			return false;
		})
		.on('submit', '.js-rate-country-search', function(e){
            e.preventDefault();
            
			self.setSearchParams(utils.serializeToObject($(this).serialize()));

			self.children.list.show();
		})
		.on('input', '.spinbox', function(){
			utils.checkInputInt(this, {min: 0});
		});

		snip.input1Handler(this.cont);
		snip.spinboxHandler(this.cont);
};

tabRateCountry.prototype.afterOpenTab = function(){
	if( this.wasOpened )
		return;

	this.wasOpened = true;

	this.children.list.show();
};

tabRateCountry.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'country');
};


tabRateCountry.prototype.setSearchParams = function(params){
	if( params.pos ) this.data.search.pos = params.pos;
};

tabRateCountry.prototype.unsetSearchParams = function(){
	this.data.search = {};
};



bRateCountry_list = function(){
	bRateCountry_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bRateCountry_list, Block);


bRateCountry_list.prototype.calcName = function(){
	return 'list';
};

bRateCountry_list.prototype.getData = function(){
	if( !this.canDisplay() ){
		this.dataReceived();
		
		return;
	}
	
	var self = this;

	this.data = this.parent.data;

	var loaderId = contentLoader.start( 
		this.parent.parent.wrp.find('.wnd-cont-wrp'), 
		50, 
		function(){
			self.getReqData(function(){
				reqMgr.getCountryRate(this.data.search.pos||this.data.pos, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId, 
						function(){
							contentLoader.stop(loaderId);
							
							if( !resp ){
								this.dataReceived();
								
								return;
							}
							
							this.data.prev = resp.prev;

							this.data.next = resp.next;

							this.data.countries = resp.table;

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bRateCountry_list.prototype.canDisplay = function(){
	return this.parent.wasOpened; // Первый раз показываем список только при открытии вкладки
};

bRateCountry_list.prototype.afterDraw = function(){
	var data = this.data,
		$wrp = this.parent.wrp;

	if( data.countries ){
		if( data.prev === undefined )
			$wrp.find('.page-nav-prev').removeAttr('href');
		else
			$wrp.find('.page-nav-prev').attr('href', data.prev);

		if( data.next === undefined )
			$wrp.find('.page-nav-next').removeAttr('href');
		else
			$wrp.find('.page-nav-next').attr('href', data.next);
	}

	data.noColor = false;
};