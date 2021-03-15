wTradersMove = function(id, data){
	wTradersMove.superclass.constructor.apply(this, arguments);
	
	delete this.id; // id используется для передачи данных в окно и не должен быть отображен в хеше
};

utils.extend(wTradersMove, Wnd);

WndMgr.regWnd('tradersMove', wTradersMove);


wTradersMove.moveType = {
	sendres: EventCommon.type.trade,
	sendresret: EventCommon.type.market
};

wTradersMove.autoStart = function (parent){
	// Условие для авто открытия окна передвижения торговцев
	if( ls.getTradersMoveAutoStart(true) && !wndMgr.getFirstWndByType(wTradersMove) )
		wndMgr.addWnd(wTradersMove, parent);
};

wTradersMove.prepareData = function(parentWnd){
	var data = {};
	
	data.parentWnd = parentWnd;
	
	return data;
};


wTradersMove.prototype.calcName = function(){
	return 'tradersMove';
};

wTradersMove.prototype.calcChildren = function(){
	this.children.marketPanel = bMTradersMove_panel;
};

wTradersMove.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		// Ускорение перемещений торговцев
        .on('click', '.js-tradersMove-imm', function(){
			if( !self.data.canImmediate )
				return false;
			
			self.setCanImmediate(false);
			
			var loaderId = contentLoader.start(
				$(this).find('.js-immediate'), 
				0, 
				function(){
		            var event = wofh.events.getById($(this).data('event'));
					
					if( !event ){
						contentLoader.stop(loaderId);
						
						this.show();
						
						return;
					}
					
		            if ( wofh.account.getCoinsAll() < event.calcImmediateCost() && !wofh.account.isAdmin() ) {
						contentLoader.stop(loaderId);
						
		                wndMgr.addAlert(tmplMgr.snipet.noCoins());
		            } else {
						reqMgr.eventImm(event, function(){
							contentLoader.stop(loaderId);
						});
		            }
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {left: 8, top: 8}, animationTime: 1000, callback:function(){
					self.setCanImmediate(true);
				}}
			);
			
			
			return false; 
        })
		.on('click', '.js-tradersMove-autoStart', function(){
            ls.setTradersMoveAutoStart($(this).prop('checked'));
        });
};

wTradersMove.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townTradersMove] = this.notifUpd;
	this.notif.other[Notif.ids.townRes] = this.notifUpd;
	this.notif.other[Notif.ids.sysCloseDependentWnd] = this.notifParentClose;
};

wTradersMove.prototype.getData = function(){
	this.getMovings();
	
	this.dataReceived();
};

wTradersMove.prototype.afterContSet = function(){}; // Устанавливаем пустой обработчик

wTradersMove.prototype.afterDraw = function(){
	this.table = new tblTradersMove(this, this.wrp.find('.tradersMove-movings'));
	this.table.toggleSort('time', false);
	
	this.showResIncome();

	this.setCanImmediate(true);
};

wTradersMove.prototype.onDataReceived = function(firstDraw){
	if( firstDraw && this.data.parentWnd ){
		if( !ls.getWndPos(false)[this.data.parentWnd.name] ){
			// Позицианируем с учетом ширины обоих окон
			var commonWidth = this.data.parentWnd.cont.outerWidth() + this.cont.outerWidth(),
				posX = -commonWidth/2,
				left = $(window).width()/2;

			this.data.parentWnd.moveToPos({x: Math.max(left + posX, 0)});
		}
		
		var dependentWndPos = ls.getDependentWndPos(false)[this.data.parentWnd.name + '.' + this.name];

		if( !dependentWndPos ){
			var offset = this.data.parentWnd.cont.offset();

			offset.left += this.data.parentWnd.cont.outerWidth();

			this.moveToPos(offset);
		}
		else
			this.moveToPos(dependentWndPos);
		
		wndMgr.setActiveWnd(this.data.parentWnd);
	}
	else
		wTradersMove.superclass.onDataReceived.apply(this, arguments);
};

wTradersMove.prototype.saveWndPos = function(pos){
	this.wasMoved = true;
	
	if( this.data.parentWnd && wndMgr.getFirstWndByType(this.data.parentWnd.constructor) ){
		var dependentWndPos = ls.getDependentWndPos(false);
		
		if (dependentWndPos){
			if(!pos)
				pos = this.cont.offset();
			
			dependentWndPos[this.data.parentWnd.name + '.' + this.name] = pos;
			
			ls.setDependentWndPos(dependentWndPos);
		}
	}
	else
		wTradersMove.superclass.saveWndPos.apply(this, arguments);
};


wTradersMove.prototype.notifUpd = function() {
	this.clearTimeout(this.notifUpdTimeout);
	
	// Небольшая задерка, чтобы не обновлять контент несколько раз
	this.notifUpdTimeout = this.setTimeout(function(){
		this.table.data.list = this.getMovings();
		
		this.table.show();
		
		this.showResIncome();
	}, Notif.sDelay);
};

wTradersMove.prototype.notifParentClose = function(){
	if( !this.wasMoved && this.data.parentWnd )
		this.close();
};


wTradersMove.prototype.showResIncome = function(){
	this.cont.find('.js-resIncome').html(tmplMgr.tradersMove.resIncome({resources: this.data.resources}));
};

wTradersMove.prototype.getMovings = function(){
	this.data.movings = [];
	this.data.resources = new ResList();

	var tradersMove = wofh.events.getTownTradersMoves().sort().getList();
	
	for( var move in tradersMove )
		this.parseMove(tradersMove[move]);
	
	return this.data.movings;
};

wTradersMove.prototype.parseMove = function(rawMove){
	var move = {};
	
	move.id = rawMove.id;
	
	if(rawMove.town1 == wofh.town.id){
		move.dir = 'out';
		move.town = rawMove.town2;
	} else {
		move.dir = 'in';
		move.town = rawMove.town1;
	}
	
	move.type = rawMove.type;
	
	// Торговцы возвращаются
	if( move.type == wTradersMove.moveType.sendresret )
		move.dir = 'in';
	
	//СТАРЬЁ
	if( move.town ){
		move.town = wofh.world.getTown(move.town);
	}
	
	move.time = rawMove.time;

	move.res = rawMove.data.res;
	move.luck = rawMove.calcImmediateCost();
	move.traders = rawMove.data.traders;

	if(move.type == wTradersMove.moveType.sendresret) move.res = [];
	
	this.data.movings.push(move);
	
	//расчёт суммы входящих ресурсов
	if( move.type == wTradersMove.moveType.sendres && move.dir == 'in' ){
		for(var res in move.res){
			this.data.resources.addCount(res, utils.toInt(this.data.resources[res]) + move.res[res]);
		}
		
		move.resThisMoment = this.data.resources.clone();
	}
};

wTradersMove.prototype.setCanImmediate = function(state){
	if( this.data.canImmediate != state ){
		this.data.canImmediate = state;

		this.cont.find('.js-immediate').toggleClass('-disabled', !state);
	}
};

wTradersMove.prototype.getOfferById = function(id){
	var list = this.data.offers;
	for(var index in list){
		if( list[index].id == id )
			return list[index];
	}
};



bMTradersMove_panel = function(){
	bMTradersMove_panel.superclass.constructor.apply(this, arguments);
};

utils.extend(bMTradersMove_panel, bMarket_panel);

bMTradersMove_panel.prototype.getTmplData = function(){
	this.data.showAutoStart = true;
	
	return this.data;
};



tblTradersMove = function(parent, cont) {
    this.tmpl = tmplMgr.tradersMove.tableTradersMove;
    this.data = {};
    this.data.list = parent.data.movings;
    
	tblTradersMove.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblTradersMove, Table);

tblTradersMove.prototype.bind = function() {
    var self = this;
	tblTradersMove.superclass.bind.apply(this, arguments);
};

tblTradersMove.prototype.getSortVal = function(move, field) {
    if( field == 'dir' ) return move.dir;
	if( field == 'traders' ) return move.traders;
	if( field == 'account' ) return move.town.account.name.toLowerCase();
	if( field == 'country' ) return move.country ? move.country.name.toLowerCase() : '';
	if( field == 'time' ) return move.time;
	
    return move.time; // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblTradersMove.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.cont.toggleClass('-hidden', showTable);
		
		this.showTable = showTable;
	}
};