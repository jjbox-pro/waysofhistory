/**
	Окно заявки на заказ ресов
*/

wCountryMakeOrder = function(){
	wCountryMakeOrder.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryMakeOrder, Wnd);

WndMgr.regWnd('countryMakeOrder', wCountryMakeOrder);


wCountryMakeOrder.prepareData = function(id, extData){
	var data = {},
		extData = extData||{};
	
	if( extData.slot ){
		data.slot = extData.slot;
		
		if( wofh.account.isPremium() )
			data.slotRebuild = extData.slotRebuild;
	}
   
	return data;
};

wCountryMakeOrder.canUseStock = function(){
	if( wofh.account.isPremium() )
		return ls.getMakeOrderUseStock(false);
	
	return false;
};


wCountryMakeOrder.prototype.calcName = function(){
	return 'countryMakeOrder';
};

wCountryMakeOrder.prototype.getData = function(){
	this.data.towns = wofh.towns;
	this.data.defTown = wofh.town;
	this.data.text = '';
	
	var resList = ResList.getAll(),
		list = resList.getList(),
		allowResList = ResList.getFromResBin(wofh.country.ordersAccess);
	
	for(var res in list){
		res = list[res];
		
		if( !allowResList.getElem(res).getCount() ){
			res.disabled = true;
			res.tooltip = snip.alert() + ' Этот ресурс исключен из системы заказов';
		}
	}
	
	this.data.resList = resList;
	
	if( this.data.slot ){
		this.data.towns = {};
		
		this.data.defTown = this.data.slot.getTown(this.data.defTown);
	}
	
	this.dataReceived();
};

wCountryMakeOrder.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accBonus] = function(){
		var $slotUseStock = this.wrp.find('.js-slotUseStock-toggle');
		
		if( !wofh.account.isPremium() )
			$slotUseStock.prop('checked', false);
		
		$slotUseStock.trigger('change', [true]);
	};
};

wCountryMakeOrder.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('submit', '.js-makeOrder', function(){
			if( !self.data.canMakeOrder ) return false;
			
			var reqData = utils.urlToObj($(this).serialize()),
				resList = new ResList().parseFormObj(reqData).onlyPositive();
			
			var loaderId = contentLoader.start( 
				self.cont, 
				0, 
				function(){
					reqMgr.addCountryOrder(reqData.town, resList, reqData.text, reqData.group, function(){
						contentLoader.stop(loaderId);
						
						self.close();
						
						notifMgr.runEvent(Notif.ids.countryOrders);
						
						if( ls.getAutoShowOrders(true) ){
							var wnd = wndMgr.getFirstWndByType(wCountryOrders);
							
							if( !wnd )
								hashMgr.showWnd('countryOrders', '', {defTab:'my'});
						}
					});
				}
			);
			
			return false;
		})
		.on('change', '.js-autoShowOrders', function(){
			ls.setAutoShowOrders($(this).prop('checked'));
			
			return false;
		})
		.on('click', '.country-makeOrder-reset', function(){
			self.reset();
		})
		.on('change', '.js-slotUseStock-toggle', function(event, init){
			if( !(init || wofh.account.isPremium()) ){
				wndMgr.addWnd(wNoPremium);
				
				$(this).prop('checked', false);
				
				return;
			}
			
			ls.setMakeOrderUseStock($(this).prop('checked'));
		
			self.setSlotCost();
			
			self.checkCanMakeOrder();
		});
	
	snip.resGroupSelectHandler(this.cont, {
		change: function(){
			if( self.data.slot )
				self.checkStockRes(this);
			
			self.checkCanMakeOrder();
			
			self.toggleReset(true);
		}
	});
	
	// Выбиралка иконки из списка
	var selectList = new smplSelectList();
	
	for(var tab in Slot.tabIds){
		selectList.addElem({
			text: snip.buildTabButton(Slot.tabIds[tab]),
			val: Slot.tabIds[tab]
		});
	}
	
	if( this.data.slot ){
		this.wrp.on('input', '.country-makeOrder-slot-nextLvl', function(event){
			utils.checkInputInt(this, {max: lib.build.maxlevel, min: self.data.slot.getLevel()+1, manualInput: !event.isTrigger});
			
			self.setSlotCost();
			
			self.toggleReset(true);
		});
		
		snip.input1Handler(this.cont.find('.country-makeOrder-slot-lvl'), {spinbox: {}});
		
		// По умолчанию выставляем иконку слота
		selectList.setSelected(selectList.getByVal(this.data.slot.getTab()));
	}
	
	snip.smplSelectHandler(this.wrp, selectList);
};

wCountryMakeOrder.prototype.afterDraw = function(){
	if( this.data.slot )
		this.setSlotCost();
	
    this.checkCanMakeOrder();
};




wCountryMakeOrder.prototype.checkCanMakeOrder = function() {
    var state = !!this.cont.find('.resSelect-res-input').filter(function(){
		return !!utils.toInt($(this).val());
	}).length;
	
	if( state != this.data.canMakeOrder ){
		this.data.canMakeOrder = state;
		
		this.cont.find('.country-makeOrder-makeOrderBtn').toggleClass('-disabled', !state);
	}
};

wCountryMakeOrder.prototype.checkStock = function(){
	var self = this;
	
	this.wrp.find('.resSelect-res-input').each(function(){
		self.checkStockRes(this);
	});
};

wCountryMakeOrder.prototype.checkStockRes = function($elem) {
    var $res = $($elem).closest('.resSelect-res'),
		$resInput = $res.find('.resSelect-res-input'),
		res = new Resource($res.data('id')),
		stockResHas = utils.toInt(this.data.defTown.getRes(res.getId()).getHas());
	
	if( stockResHas + utils.toInt($resInput.val()) > this.data.defTown.getStock().getMax(res) ){
		$res.find('.resSelect-res-alert-wrp').html(snip.wrp('country-makeOrder-stockAlert', snip.alert('Объем заказа возможно превышает текущий объем хранилищ в городе')));
		$resInput.addClass('-warn');
	}
	else{
		$res.find('.resSelect-res-alert-wrp').html('');
		$resInput.removeClass('-warn');
	}
};

wCountryMakeOrder.prototype.setSlotCost = function() {
    var slot = this.data.slot.clone(),
		fromLvl = +slot.getLevel()+1,
		nextLvl = +this.wrp.find('.country-makeOrder-slot-nextLvl').val(),
		resList = new ResList();
	
	if( nextLvl - fromLvl ){
		for(var lvl = fromLvl; lvl <= nextLvl; lvl++){
			slot.setLevel(lvl);
			
			resList.addList(slot.getCost());
		}
	}
	else{
		slot.setLevel(fromLvl);
		
		resList = slot.getCost();
	}
	
	this.wrp.find('.country-makeOrder-slotCost-wrp').html(snip.resBigList(resList));
	
	if( this.data.slotRebuild )
		resList.addList(this.data.slotRebuild.getReturnedCost());
	
	if( wCountryMakeOrder.canUseStock() )
		resList.diffList(slot.getTown(wofh.town).stock.getHasList());
	
	// Приводим список к положительным целым числам
	resList.each(function(elem){
		if( elem.getCount() < 0 )
			elem.setCount(0);
		
		elem.ceil();
	});
	
	this.wrp.find('.resGroupSelect-group').each(function(){
		$(this).removeClass('-type-empty');
		
		$(this).find('.resSelect-res').each(function(){
			var $this = $(this),
				res = resList.getElem($(this).data('id'));

			$this.removeClass('-hidden');

			if( res.getCount() ){
				$this.addClass('-type-limit');

				if( !$this.hasClass('-disabled') ){
					$this.find('.resSelect-res-input')
						.data('limit', res.getCount())
						.val(res.getCount());

					$this.find('.resSelect-res-limit-wrp').html(snip.resSelect.res.limit({limit:res.getCount()}));
				}
			}
			else{
				$this
					.removeClass('-type-limit')
					.addClass('-hidden')
					.find('.resSelect-res-input')
					.data('limit', 0)
					.val(0);
			}

			$this.toggleClass('-hidden', !res.getCount());
		});
		
		if( !$(this).height() )
			$(this).addClass('-type-empty');
	});
	
	this.checkStock();
	
	this.wrp.find('.country-makeOrder-text').text(tmplMgr.countryMakeOrder.slotText({slot:slot, fromLvl:fromLvl, nextLvl:nextLvl}));
};

wCountryMakeOrder.prototype.reset = function() {
    if( this.data.slot )
		this.wrp.find('.country-makeOrder-slot-nextLvl').val(Math.min(this.data.slot.getLevel()+1, lib.build.maxlevel)).trigger('input');
	else
		this.wrp.find('.resSelect-res-input').val('');
	
	this.checkCanMakeOrder();
	
	this.toggleReset(false);
};

wCountryMakeOrder.prototype.toggleReset = function(toggle){
	this.wrp.find('.country-makeOrder-reset').toggleClass('-hidden', !toggle);
};

