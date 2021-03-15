wEconomics = function(){
	wEconomics.superclass.constructor.apply(this, arguments);
	
	this.options.clipboard = {};
};

utils.extend(wEconomics, Wnd);

WndMgr.regWnd('economics', wEconomics);


wEconomics.prepareData = function(tabName){
	var data = {
		tabName: tabName||'rule'
	};
	
    return data;
};


wEconomics.prototype.calcName = function(){
	return 'economics';
};

wEconomics.prototype.calcChildren = function(){
    this.children.strength = bTownStrength;
    
	this.children.rule = tabEconomicsRule;
	this.children.stock = tabEconomicsStock;
	this.children.prod = tabEconomicsProd;
	this.children.pop = tabEconomicsPop;
	if( Account.isKnownMoney() )
		this.children.money = tabEconomicsMoney;
	this.children.info = tabEconomicsInfo;
};

wEconomics.prototype.getTmplData = function(){
    this.calcStatsData();
	
	for (var resource in Resource.getAll()) {
		if (utils.toPercent(Resource.getEffect_(resource)) > 0) {
			this.data.canSubmit = Quest.isAvail(lib.quest.ability.consumption);
			
			break;
		}
	}
		
	return this.data;
};

    wEconomics.prototype.calcStatsData = function(){
        this.data.pop = parseInt(wofh.town.getPop().has);
        
        this.data.efficiency = wofh.town.getWorkEfficiency();
        
        this.data.corruptionData = {
            corruption: wofh.town.getNormalCorruption(),
            punish: wofh.town.getRealBonus(LuckBonus.ids.punish) - 1
        };
        
        this.data.consumption = wofh.town.getStock().calcMaxConsCount();
    };

wEconomics.prototype.bindEvent = function(){
	snip.input1Handler(this.wrp);
};

wEconomics.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accTownBonus] = function(){
		if( this.data.corruptionData.punish != utils.servRound(wofh.town.getRealBonus(LuckBonus.ids.punish) - 1) )
			this.show();
	};
};

wEconomics.prototype.beforeShowChildren = function(){   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.onOpenTab = this.onOpenTab.bind(this);
	
	this.tabs.addTabs(this.children);
};

wEconomics.prototype.afterDraw = function(){
    this.tabs.openTab(this.data.tabName);
	
	this.cont.find('.js-clipboard-wrp').html(snip.clipboardWrp(snip.clipboard({tag:'t' + wofh.town.id})));
};


wEconomics.prototype.onOpenTab = function(tab){
    this.data.tabName = tab.name;
	
    this.cont.find('.economics-stats-block').toggleClass('-hidden', tab == this.children.info);
};



bTownStrength = function(){
	bTownStrength.superclass.constructor.apply(this, arguments);
};

utils.extend(bTownStrength, Block);

bTownStrength.prototype.calcName = function(){
    return 'strength'; 
};

bTownStrength.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.townBuildings);
};

bTownStrength.prototype.canDisplay = function(){
    return wofh.account.isPremium(); 
};



/******
 * Вкладка rule
 */

tabEconomicsRule = function(){
    this.name = 'rule';
	this.tabTitle = 'Управление';
	
	tabEconomicsRule.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsRule, Tab);


tabEconomicsRule.prototype.calcChildren = function(){
    this.children.townRename = bTownRename;
    
    this.children.budget = bEconomics_budget;
};

tabEconomicsRule.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsRule.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'management');
};



bTownRename = function(){
	bTownRename.superclass.constructor.apply(this, arguments);
};

utils.extend(bTownRename, Block);


bTownRename.prototype.calcName = function(){
    return 'townRename';
};

bTownRename.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townName] = this.updName;
};

bTownRename.prototype.canDisplay = function(){
	return Quest.isAvail(lib.quest.ability.townrename);
};

bTownRename.prototype.cacheCont = function(){
    this.$input = this.cont.find('.economics-rule-rename-name');
};

bTownRename.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('submit', '.economics-rule-rename', function(e){
            e.preventDefault();
            
			if( !self.canRename )
				return;
			
			self.setCanRename(false);
			
			var name = $(this).find('.economics-rule-rename-name').val();
			
			var loaderId = contentLoader.start(
				self.wrp, 
				500, 
				function(){
					reqMgr.renameTown(wofh.town.id, name, function(){
						contentLoader.stop(loaderId);
					});
				}
			);
		})
		.on('input', '.economics-rule-rename-name', function(){
			self.setCanRename(self.checkCanRename(this));
		})
		.on('click', '.economics-rule-random-btn', function(){
			$(this)	.closest('.economics-rule-rename')
					.find('.economics-rule-rename-name')
					.val(Town.genLimitName())
					.trigger('input');
		});
};

bTownRename.prototype.afterDraw = function(){
	this.setCanRename(false, true);
};


bTownRename.prototype.updName = function(){
    this.$input.val(wofh.town.getName());
    
    this.setCanRename(false, true);
};

bTownRename.prototype.checkCanRename = function(el){
	return ($(el).length ? $(el).val().trim().length : 0) >= lib.town.namelimit[0] && wofh.account.canMessage();
};

bTownRename.prototype.setCanRename = function(state, force){
	if( this.canRename != state || force ){
		this.canRename = state;
		
		this.cont.find('.economics-rule-rename-btn').toggleClass('-disabled', !state);	
	}
};




bEconomics_budget = function(){
	bEconomics_budget.superclass.constructor.apply(this, arguments);
};

utils.extend(bEconomics_budget, Block);


bEconomics_budget.prototype.calcName = function(){
	return 'budget';
};

bEconomics_budget.prototype.calcTmplFolder = function(){
    return tmplMgr.economics.budget;
};

bEconomics_budget.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townPop] = 
	this.notif.other[Notif.ids.townBuildings] = 
	this.notif.other[Notif.ids.townRes] = this.updNotif;
};

bEconomics_budget.prototype.getTmplData = function(){
	//доступные работники
	this.totalPop = utils.toInt(wofh.town.pop.has);
	//максимум работников на каждый ресурс
	this.budgetMax = wofh.town.slots.calcResPopMax();
	
	var budgetMaxData = this.budgetMax.clone();
	
	this.budgetMax.addRes(-1, this.totalPop);
	//работников может трудоустроить город
	this.maxWorkingPop = this.budgetMax.calcSum();
	//сколько работников работает над каждым ресурсом
	var popOnRes = wofh.town.calcPopOnRes();
	//нераспределенные работники
	this.freePop = this.totalPop - popOnRes.calcSum();
	
	popOnRes.setRes(-1, this.freePop);
	
	this.budget = popOnRes.clone();
	
	this.spreadOrder = {
		list: {},
		count: 0
	};
	
	//прирост ресурсов
	this.budgetResInc = wofh.town.stock.getIncList();
	
	this.budgetResIncInit = this.budgetResInc.clone();
	
	return {
		list: budgetMaxData, 
		maxPop: this.totalPop, 
		slots: wofh.town.getSlots().getProdSlots().getActiveSlots().getArray(), 
		stock: wofh.town.stock
	};
};

bEconomics_budget.prototype.bindEvent = function(){
	var self = this;
	
	self.wrp
		.on('click', '.js-budget-save', function(){
			if( $(this).hasClass('-disabled') )
                return;
            
            self.submit();
            
            self.parent.parent.close();
		})
		.on('change', '.js-budget-autoinc', function(){
            self.enableSubmit();
        });
};

bEconomics_budget.prototype.afterDraw = function(){
	var self = this;
	
	//подключаем слайдеры
	this.wrp.find('.slider').each(function(){
		var $el = $(this),
			id = $el.closest('li').data('id');
		
		snip.sliderHandler($el, {
			min: 0,
			max: self.budgetMax.getCount(id),
			step: 1,
			slide: function( event, ui ) {
				self.onSliderSlide(event, ui, $(this));
			},
			change: function(event, ui) {
				self.onSliderChange(event, ui, $(this));
			},
            stop: function(event, ui) {
				self.onSliderStop(event, ui, $(this));
			}
		});
	});
	
	this.wrp.find('.js-budget-save').addClass('-disabled');
	
	this.showBudget();
	
	this.refreshSliders();
};


bEconomics_budget.prototype.updNotif = function(){
	this.clearTimeout(this.notifTimeoutId);
	
	this.notifTimeoutId = this.setTimeout(this.show, Notif.delay);
};

bEconomics_budget.prototype.enableSubmit = function() {
    this.cont.find('.js-budget-save').removeClass('-disabled');
};

bEconomics_budget.prototype.submit = function(){
    var autoinc = [];
	
    this.cont.find('.budget-sldRow').each(function(){
        var $el = $(this);
		
        if( $el.find('.js-budget-autoinc:checked').length )
            autoinc.push($el.data('id'));
    });
	
    reqMgr.setTownBudget(this.slots, autoinc);
};

bEconomics_budget.prototype.moveSlider = function(id, val) {
	this.budget.setCount(id, val);
	
	if( !this.spreadOrder.list[id] )
		this.spreadOrder.list[id] = --this.spreadOrder.count;
	
	this.spreadBudget(id);
	
	this.refreshSliders();
};


bEconomics_budget.prototype.onSliderSlide = function(event, ui, $slider){
	var resId = +$slider.closest('li').data('id'),
		resCount = ui.value,
		resCurCount = this.budget.getCount(resId),
		shadowMax = this.shadowArea.getCount(resId);

	//отключаем галочку
	//$slider.closest('li').find('.js-budget-autoinc').removeAttr('checked');

	if( resCurCount <= shadowMax ){
		this.moveSlider(resId, Math.min(resCount, shadowMax));

		this.enableSubmit();
	}
};

bEconomics_budget.prototype.onSliderChange = function(event, ui, $slider){
	if( !this.shadowArea )
		return;

	var resId = +$slider.closest('li').data('id'),
		resCount = ui.value,
		shadowMax = this.shadowArea.getCount(resId);

	if( resCount > shadowMax )
		$slider.slider({value: shadowMax});
};

bEconomics_budget.prototype.onSliderStop = function(event, ui, $slider){};

//распределение - вытеснение сверху
bEconomics_budget.prototype.spreadRes = function(slots, freePopPerRes, resId){
	var resSortArr = this.getSortedResArr(this.budgetMax, resId);
	
	for (var slotI = 0; slotI < slots.length; slotI++) {
		var slot = slots[slotI];
		
		slot.freePop = utils.toInt(slot.getMaxPopForTown());
		
		if( slot.pop )
			freePopPerRes.addList(slot.pop);
		
		slot.pop = new ResList(); 
		
		var prodRes = slot.getProductresForTown();
		
		for (var resI in resSortArr) {
			var resIdI = resSortArr[resI].getId();
			
			if( !prodRes.getCount(resIdI) )
				continue;
			
			var popCount = Math.min(slot.freePop, freePopPerRes.getCount(resIdI));
			
			if( !popCount )
				continue;
			
			slot.pop.addCount(resIdI, popCount);
			
			freePopPerRes.addCount(resIdI, -popCount);
			
			slot.freePop -= popCount;
		}
	}
};

bEconomics_budget.prototype.spreadResToMultiProdSlots = function(slots, freePopPerRes, resId){
	var res = freePopPerRes.getElem(resId),
		freePopCount = freePopPerRes.getCount(resId);
	
	for (var slotI = 0; slotI < slots.length; slotI++) {
		var slot = slots[slotI];
		
		var slotResList = slot.getProductresForTown();
		
		if( !slotResList.hasElem(res.getId()) ) 
			continue;
		
		for (var res2 in slotResList.getList()) {
			res2 = slotResList.getElem(res2);
			
			if( res2.getId() == res.getId() )
				continue;
			
			for (var slotI2 = slotI; slotI2 < slots.length; slotI2++) {
				var slot2 = slots[slotI2];
				
				var maxPop = utils.toInt(slot2.getMaxPopForTown());
				
				var busyPop = slot2.pop.calcSum();
				
				if( maxPop == busyPop )
					continue;
				
				if( !slot2.getProductresForTown().hasElem(res2.getId()) )
					continue;
				
				var restPopCount = Math.min(maxPop - busyPop, freePopCount, slot.pop.getCount(res2.getId()));
				
				if( !restPopCount )
					continue;
				
				freePopCount -= restPopCount;
				
				slot.pop.addCount(res2.getId(), -restPopCount);//забрать рабочих со старого места
				
				slot2.pop.addCount(res2.getId(), restPopCount);//поместить рабочих на новое место
				
				slot.pop.addCount(res.getId(), restPopCount);//поместить вытеснителей на старое место
				
				freePopPerRes.addCount(res.getId(), -restPopCount);
                
                slot.calcFreePop();
				
                slot2.calcFreePop();
			}
		}
	}
};

bEconomics_budget.prototype.getSortedResArr = function(resList, resId){
	resList = resList.clone();
	
	resList.delRes(-1); 
	
	var arr = resList.getArr(),
		sort;
	
	if( this.spreadOrder.count )
		var spreadOrder = this.spreadOrder; // Приоритет у ресурсов от первого изменённого к воследнему
	else
		resId = resId >= 0 ? resId : false; // Приоретет у ресурса, который изменяется
	
	
	arr.sort(function(a, b){
		if( spreadOrder )
			sort = (spreadOrder.list[a.getId()]||0) + (spreadOrder.list[b.getId()]||0);
		else if( resId !== false )
			sort = (b.getId() == resId) - (a.getId() == resId);
		
		if( !sort )
			sort = a.getCount() - b.getCount();
		
		if( !sort )
			sort = a.getId() - b.getId();
		
		return sort;
	});
	
	return arr;
};

bEconomics_budget.prototype.initSlots = function(clearPop){
	//получаем список производственных слотов
	var slots = wofh.town.getSlots().getProdSlots().getActiveSlots();
	
	slots = slots.clone().getArray();
	
	if( clearPop )
		for(var slot in slots){
			slot = slots[slot];
			
			slot.pop = new ResList();
		}
	
	slots.sort(function(a, b){
		return b.getEfficiency() - a.getEfficiency();
	});
	
	return slots;
};

bEconomics_budget.prototype.spreadBudget0 = function(freePopPerRes, slots, resId){
	//распределение - вытеснение сверху
	this.spreadRes(slots, freePopPerRes, resId);
	
	if( resId != -1 )
		this.spreadResToMultiProdSlots(slots, freePopPerRes, resId);
	
	for(var res in freePopPerRes.getList() ){
		if( +res == resId )
			continue;
		
		this.spreadResToMultiProdSlots(slots, freePopPerRes, res);
	}
	
	return freePopPerRes;
};

bEconomics_budget.prototype.spreadBudget = function(resId){
	var freePopPerRes = this.budget.clone();
	
	freePopPerRes.delRes(-1);
	
	this.slots = this.initSlots(true);
	
	freePopPerRes = this.spreadBudget0(freePopPerRes, this.slots, resId);
	
	if( !freePopPerRes.onlyPositive().isEmpty() ){
		//перераспределяем 
		var count = freePopPerRes.getCount(resId);
		
		for(var slot in this.slots){
			slot = this.slots[slot];
			
			if(!slot.getProductres().hasElem(resId))
				continue;
			
			for (var res in slot.pop.getList()){
				res = slot.pop.getElem(res);
				
				if(res.getId() == resId)
					continue;
				
				var dif = Math.min(count,res.getCount());
				count -= dif;
				freePopPerRes.addCount(resId, -dif);
				freePopPerRes.addCount(res.getId(), dif);
			}
		}
		
		this.budget.addList(freePopPerRes.clone().mult(-1));
		
		//списываем левые ресы
		this.spreadBudget(resId);
	}
	else
		this.calcResIncom();
};

bEconomics_budget.prototype.showBudget = function(){
	this.slots = this.initSlots();
	
	for( var slot in this.slots ){
		slot = this.slots[slot];
		
		slot.freePop = utils.toInt(slot.getMaxPopForTown()) - utils.toInt(slot.pop.calcSum());
	}
	
	this.calcResIncom();
};

bEconomics_budget.prototype.refreshSliders = function(){
	//распред
	for(var i in this.budgetMax.getList()){
		var res = this.budgetMax.getElem(i);
		var pop = this.budget.getCount(i);
		var resInc = this.budgetResInc.getCount(i);
		var resIncTaxed = this.budgetResIncTaxed.getCount(i);
		var resIncInit = this.budgetResIncInit.getCount(i);
		
		var slider = this.cont.find('li[data-id="'+i+'"]');
		
		slider.find('.js-budget-pop').html(pop.toFixed(0));
		
		slider.find('.js-budget-res').html(this.tmpl.resInc({res: res, resInc: resInc, resAlter: resInc-resIncInit, resIncTaxed: resIncTaxed}));
		
		slider.find('.slider').slider('value', +pop.toFixed(0));
	}

	this.showShadowArea();
	
	this.cont.find('.js-budget-popWork').html(this.totalPop - this.calcBusyPop());
	
	this.cont.find('.js-budget-slots').html(this.tmpl.slots({now: this.slots, was: this.initSlots()}));
	
    this.resize();
};

bEconomics_budget.prototype.calcBusyPop = function(budget) {
	if(!budget) budget = this.budget;
	
	var sum = budget.calcSum();
	sum -= budget.getCount(-1);
	
	return sum;
};

//вычисление дохода от распределения населения
bEconomics_budget.prototype.calcResIncom = function(){
	var townClone = wofh.town.clone(),
		slots = townClone.getSlots();
	
	for(var slot in this.slots){
		slot = this.slots[slot];
		
		slots.getElemByPos(slot.getPos()).pop = slot.pop;
	}
	
	this.budgetResInc = townClone.getStock().getIncList();
	
	this.budgetResIncTaxed = townClone.getStock().getIncTaxedList();
};

//свободное население
bEconomics_budget.prototype.calcFreePopOnRes = function(resId){
	var freePop = 0;
	for (var slot in this.slots) {
		slot = this.slots[slot];
		
		if (slot.getProductresForTown().getCount(resId))
			freePop += utils.toInt(slot.getMaxPopForTown()) - slot.pop.calcSum();
	}
	
	return freePop;
};

bEconomics_budget.prototype.calcShadowArea = function (){
	var freePopOnRes = new ResList();
	
	for (var resId in this.budgetMax.getList()) {
		if(resId == -1)
            continue;
        
		var shadow = this.calcShadowMax(resId);
		
		freePopOnRes.setCount(resId, shadow);
	}
    
	return freePopOnRes;
};

bEconomics_budget.prototype.calcShadowMax = function(resId){    
    var count = this.budget.getCount(resId);
    var addPop = 0;
    for (var slot in this.slots){
        slot = this.slots[slot];
        var resList = slot.getProductresForTown();
        if (resList.hasElem(resId)) {
            addPop += slot.freePop;
        }
    }
    count += Math.min(addPop, this.totalPop - this.calcBusyPop());
	return count;
};

bEconomics_budget.prototype.showShadowArea = function(){
	this.shadowArea = this.calcShadowArea();
	
	for (var resId in this.shadowArea.getList()) {
		if(resId == -1) continue;
		
		var shadow = this.shadowArea.getCount(resId);
		var max = this.budgetMax.getCount(resId);
		
		var perc = 1 - (shadow) / max;
		
		var slider = this.cont.find('li[data-id="'+resId+'"]');
        
		slider.find('.js-budget-sldShadow').css({width: perc * 100+'%'});
	}
};



/******
 * Вкладка stock
 */

tabEconomicsStock = function(){
    this.name = 'stock';
	this.tabTitle = 'Экономика';
	
	tabEconomicsStock.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsStock, Tab);

tabEconomicsStock.prototype.getData = function(){
	this.data = {};
	
	this.data.stockResArr = [];
	
	var list = ResList.getAll().sortByDefault().getList();
	
	for (var stockRes in list) {
		var stockRes = wofh.town.getRes(list[stockRes]).clone();

		if ( stockRes.getId() == Resource.ids.food || !stockRes.canShow({allowAllChanges: true}) )
			continue;
		
		/*
		// stockRes.dec - производственные ресурсы
		// stockRes.реfoodInfluence - ресурсы роста
		// stockRes.cons - эффект от растишек
		// stockRes.dec = (-1 * stockRes.dec) + (stockRes.foodInfluence) - stockRes.cons;
		*/
		stockRes.dec = stockRes.updateHour - stockRes.incom - stockRes.stream;
		stockRes.calcEffect = utils.toPercent(Resource.getEffect_(stockRes.getId()));
		stockRes.effectType = Resource.getEffectType(stockRes.getId());

		this.data.stockResArr.push(stockRes);
	}

	this.data.canSubmit = this.parent.data.canSubmit;
	
    this.dataReceived();
};

tabEconomicsStock.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.econ-main-feedItem-sortBtn', function() {
			var el = $(this);
			var wrpEl = el.parent();

			if (el.hasClass('-type-left')){
				var replWrpEl = wrpEl.prev();
				replWrpEl.before(wrpEl);
			} else {
				var replWrpEl = wrpEl.next();
				replWrpEl.after(wrpEl);
			}
		})
		// Проверяем максимально возможное количество ресурсов потребления
		.on('change', 'input:checkbox', function(){
			self.onConsumptionChange();
		})
		.on('submit', function(e){
            self.onSubmit(e);
		});
};

tabEconomicsStock.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townRes];
};

tabEconomicsStock.prototype.afterDraw = function(){
	this.table = new tblEconomicsStock(this, this.cont);
	
	this.table.show();
	
	this.checkConsumptionCount();
};

tabEconomicsStock.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsStock.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'economics');
};


tabEconomicsStock.prototype.onSubmit = function(e){
    e.preventDefault();
    
    this.updCounter = 2;
			
    this.submitFoodPriority();
    this.submitResConsumption();
};

tabEconomicsStock.prototype.onConsumptionChange = function(){
    this.checkConsumptionCount();
};

tabEconomicsStock.prototype.checkConsumptionCount = function(){
	if( this.wrp.find('input:checkbox:checked').length < this.parent.data.consumption )
		this.wrp.find('input:checkbox').not(':checked').removeAttr('disabled', 'disabled');
	else
		this.wrp.find('input:checkbox').not(':checked').attr('disabled', 'disabled');
};

tabEconomicsStock.prototype.submitFoodPriority = function(){
	var self = this;

	var data_old = {};
	var data = [];

	var noUpd = true;
	this.wrp.find('.econ-main-feedItem').each(function(count, el){
		var resId = $(el).data('id');
		
		data_old['r'+(count+1)] = resId;
		data.push(resId);
		if (wofh.town.stock.foodpriority[count] != resId) {
			noUpd = false;
		}
	});

	if (noUpd) {
		self.submitDone();
	} else {
		reqMgr.setFoodPriority(data, function(resp) {
			self.submitDone();
		});
	}
};

tabEconomicsStock.prototype.submitResConsumption = function(){
	var self = this;

	var dataReq = utils.urlToObj(this.cont.serialize(), true);

	var consList = wofh.town.stock.getConsBinList();

	var noUpd = utils.sizeOf(dataReq) == consList.getLength();
    
	if (noUpd) {
		for (var el in dataReq) {
			if (consList.getCount(el.slice(1)) == 0) {
				noUpd = false;
				break;
			}
		}
	}
	
	if (noUpd) {
		self.submitDone();
	} else {
		reqMgr.setResConsumption_form(dataReq, function() {
			self.submitDone();
		});
	}
};

tabEconomicsStock.prototype.submitDone = function (){
	this.updCounter--;
};


tblEconomicsStock = function(parent, cont) {
    this.tmpl = tmplMgr.economics.table.stock;
    
    this.data = {};
    this.data.list = parent.data.stockResArr;
    this.data.canSubmit = parent.data.canSubmit;
    
	tblEconomicsStock.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblEconomicsStock, Table);


tblEconomicsStock.getTableLayout = function(){
	return snip.table;
};





/******
* Вкладка prod
*/

tabEconomicsProd = function(){
    this.name = 'prod';
	this.tabTitle = 'Производство';
	
	tabEconomicsProd.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsProd, Tab);

tabEconomicsProd.prototype.getData = function(){
	this.data.resArr = [];
	
	// Рассчитать эффекты от зданий
	var buildRes = {};
	
	for(var slot in wofh.town.slots.getList()) {
		slot = wofh.town.slots.getElem(slot);
        
		for (var res in slot.pop.getList()) {
			res = slot.pop.getElem(res);
			if (buildRes[res.id]) {
				buildRes[res.id].pop += res.count;
				buildRes[res.id].efficiency += res.count * slot.getEfficiency();
			} else {
				buildRes[res.id] = {
					pop: res.count,
					efficiency: res.count * slot.getEfficiency()
				};
			}
		}
	}
	
	/* Ресурсы */
	var resource, _temp, total;
	
	for (var resId = 0; resId < Resource.getAll().length; ++resId) {
		if ( ((wofh.town.getRes(resId).incom || 0) == 0) || resId == Resource.ids.food ) continue;

		var	resource = new Resource(resId), _temp = 0, total = 0;

		/* Эффективность труда человека в городе */
		total = wofh.town.getWorkEfficiency();
		
		/* Коррупция */
		_temp = (1 - wofh.town.getCorruption());
		total *= _temp;

		// 2
		/* Эффективность труда с учетом коррупции */
		resource.workCorruptionEfficiency = total;

		// 3
		// Эффект от науки
		resource.scienceEffect = 1;
		if( resId == Resource.ids.science ) {
			var resEffect = 1;
			
			if( wofh.town.getRes(Resource.ids.books).consBin )
				resEffect *= 1 + new Resource(Resource.ids.books).getEffect();
			
			if( resEffect != 1 ){
				resource.scienceEffect = resEffect;
				
				total *= resEffect;
			}
		}
		
		
		
		// 4
		/* Бонусы расы */
		_temp = wofh.account.race.getResK(resource);
		resource.raceBonus = _temp;
		total *= _temp;

		// 5
		/* Базовый прирост */
		_temp = wofh.town.stock.getElem(resId).incBase;
		/* Добавить прирост ресурсов от захваченного месторождения */
		//_temp += this.town.getDeposit().getRes().getCount(resource.getId());
		resource.incBase = _temp;
		total *= _temp;

		// 6
		/* Бонусы климата */
		_temp = wofh.town.getResClimateBonus(resource);
		resource.climateBonus = _temp;
		total *= _temp;

		// 7
		/* Бонус науки */
		_temp = wofh.town.getResScienceBonus(resource);
		resource.scienceBonus = _temp;
		total *= _temp;

		/* Бонус ВГ */
		_temp = wofh.town.getResSpecBonus(resource);
		resource.specBonus = _temp;
		total *= _temp;

		// 8
		/* Бонусы карты */
		_temp = wofh.town.usesmap ? wofh.town.getResMapBonus(resource): 1;
		resource.mapBonus = _temp;
		total *= _temp;
		
		
		// 9
		/* Бонус МУ */
		_temp = wofh.town.getResLuckBonus(resource);
		resource.luckBonus = _temp;
		total *= _temp;


		/* Cумма по всем пром домикам */
		_temp = (buildRes[resId] ? (buildRes[resId].efficiency || 0):0) + Appl.C_EPSILON1000;
		total *= _temp;
		
		if( wofh.town.usesmap ){
			_temp = wofh.town.getResMapBonus(resource, true);
			
			resource.mapBonusInc = _temp;
			
			total += _temp;
		}
		
		// 10
		/* Количество рабочих во всех домиках */
		resource.buildPop = parseInt(buildRes[resId] ? buildRes[resId].pop : 0);

		// 11
		/* Среднее значение эффективности труда во всех домиках */
		resource.averageEfficiency = buildRes[resId] ? buildRes[resId].efficiency / buildRes[resId].pop : 0;

		// 12
		/* итого */
		resource.total = total;

		// 13
		/* Спад */
		var wonder = wofh.town.slots.wonderEffect;
		var wonderEffect = 0;

		var effect = wonder[WonderEffect.ids.res];
		if( effect && effect.getRes() == resId ) {
			wonderEffect += effect.getEffect();
		}   

		if( wofh.town.getAura().hasColossus() ){
			var effect = WonderEffect.getEffect(TownAura.ids.colossus.bld, WonderEffect.ids.resForBuild);

			if (effect && effect.getRes() == resId) {
				var slots = wofh.town.slots.getSlotsById(effect.getBuild());
				for (var slot in slots.getList()){
					slot = slots.getElem(slot);
					if (slot.isActive()){
						wonderEffect += effect.getEffect() * slot.getLevel();
					}
				}
			}
		}

		resource.wonderEffect = wonderEffect;

		this.data.resArr.push(resource);
	}
    
    this.dataReceived();
};

tabEconomicsProd.prototype.bindEvent = function(){};

tabEconomicsProd.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.townRes);
};

tabEconomicsProd.prototype.afterDraw = function(){
	this.table = new tblEconomicsProd(this, this.cont);
	
	this.table.show();
};

tabEconomicsProd.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsProd.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'prod');
};




tblEconomicsProd = function(parent, cont) {
    this.tmpl = tmplMgr.economics.prod.table;
    
	this.data = {};
    this.data.list = parent.data.resArr;
	
    this.prepareFormat();
    
	tblEconomicsProd.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblEconomicsProd, Table);


tblEconomicsProd.getTableLayout = function(){
	return snip.table;
};


tblEconomicsProd.prototype.prepareFormat = function(){
	this.data.roundFunc = utils.toPercent;
	this.data.defVal = 100;
	this.data.dim = '%';
};


/******
* Вкладка pop
*/

tabEconomicsPop = function(){
	tabEconomicsPop.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsPop, Tab);


tabEconomicsPop.getTableLayout = function(){
	return snip.table;
};


tabEconomicsPop.prototype.calcName = function(){
    this.tabTitle = 'Население';
    
    return 'pop';
};

tabEconomicsPop.prototype.getData = function(){
    this.getPopData(); // Рост населения
    
    this.getCultData(); // Культура
    
    this.data.town = wofh.town;
	
	this.prepareFormat();
	
    this.dataReceived();
};

    tabEconomicsPop.prototype.getPopData = function(){
        var data = this.data,
        town = wofh.town,
        stockResList = town.stock.getList(),
        slotList = town.getSlots().getList(),
        slot, stockRes, level, effect, wonderEffect, tempResult = [], combine = function(slotObj){ // Обьеденяем эффкт от аруы и ЧС в одну сущность
            if( slotObj.id != slot.getId() )
                return true;
            
            slotObj.effect += effect;
            
            return false;
        };
        
        /** Базовый и от наук **/
        
        var popInc = lib.town.population.defaultgrown * timeMgr.DtH,
            sciPopInc = town.getResearchGrown() * timeMgr.DtH,
            ungrown = 0;

        data.grownUpBase = popInc;
        data.grownUpScience = sciPopInc;

        popInc += sciPopInc;

        /** От зданий и аур ЧС**/

        popInc += town.getAura().getGrown(function(slot, effect){
            tempResult.push({id: slot.getId(), name: slot.getName(), level: 0, effect: effect});
        });

        for(slot in slotList) {
            slot = slotList[slot];
            level = slot.getLevel();

            if( !(level > 0) || !slot.isActive() )
                continue;

            if ( slot.isWonder() ) {
                wonderEffect = WonderEffect.getEffect(slot.getId(), WonderEffect.ids.grown);

                if ( !wonderEffect )
                    continue;

                effect = wonderEffect.getEffect();

                if( !tempResult.every(combine)){
                    popInc += effect;

                    continue;
                }

                level = 0; // Не отображаем у ЧС уровень
            }
            else if( slot.getType() == Build.type.grown )
                effect = slot.getEffect() * timeMgr.DtH;
            else
                continue;

            tempResult.push({id: slot.getId(), name: slot.getName(), level: level, effect: effect});

            popInc += effect;
        }

        data.grownUpBuilds = tempResult.length > 0 ? tempResult : null;

        data.grownUpSum = popInc;


        /*** Спад ***/

        // Спад от зданий
        tempResult = [];

        ungrown += town.calcUngrownFromSlots(function(slot, effect){
            tempResult.push({id: slot.getId(), name: slot.getName(), level: slot.getLevel(), effect: effect});
        });
        data.grownDownBuilds = tempResult.length > 0 ? tempResult : null;

        // Спад от улучшений местности
        tempResult = [];

        ungrown += town.calcUngrownFromMapImp(function(mapImp, effect){
            mapImp.effectUngrown = effect;

            tempResult.push(mapImp);
        });
        data.grownDownImps = tempResult.length > 0 ? tempResult : null;


        data.grownDownSum = ungrown;

        data.growReal = town.getPopIncReal();


        /** Потребление ресов **/

        data.grownConsSum = 0;
        data.grownConsRes = [];
        for (stockRes in stockResList) {
            stockRes = stockResList[stockRes];

            if( stockRes.consBin && stockRes.isGrown() ){
                data.grownConsSum += stockRes.getEffect();

                data.grownConsRes.push(stockRes);
            }
        }


        /** Итого по росту **/

        data.grownRace = wofh.account.race.getGrownK();
        data.grownSpec = town.getSpecialists().getElem(Specialist.ids.grown).getEffect();
        data.grownDeposit = !town.deposit.isEmpty() ? lib.town.population.depositgrown : 1;
        data.grownMap = 1 + town.getMapBonus(MapImp.effectType.grow);
        data.grownLuck = town.getRealBonus(LuckBonus.ids.grown);

        data.grownSum = (data.grownUpSum * data.grownRace * (data.grownConsSum + 1) * data.grownSpec * data.grownDeposit * data.grownMap * data.grownLuck) - data.grownDownSum;
    };
    
    tabEconomicsPop.prototype.getCultData = function(){
        var data = this.data,
            town = wofh.town,
            stockResList = town.stock.getList(),
            slotList = town.getSlots().getList(),
            slot, stockRes, level, effect, wonderEffect, tempResult = [], combine = function(slotObj){ // Обьеденяем эффкт от аруы и ЧС в одну сущность
                if( slotObj.id != slot.getId() )
                    return true;

                slotObj.effect += effect;

                return false;
            };
            
        /** Базовая и от наук **/
    
        var culture = lib.town.population.defaultculture,
            sciCulture = town.getResearchCulture();

        data.cultBase = culture;
        data.cultScience = sciCulture;

        culture += sciCulture;


        /** От зданий и аур ЧС**/

        tempResult = [];

        culture += town.getAura().getCult(function(slot, effect){
            tempResult.push({id: slot.getId(), name: slot.getName(), level: 0, effect: effect});
        });

        for(slot in slotList) {
            slot = slotList[slot];
            level = slot.getLevel();

            if( !(level > 0) || !slot.isActive() )
                continue;

            if ( slot.isWonder() ) {
                wonderEffect = WonderEffect.getEffect(slot.getId(), WonderEffect.ids.cult);

                if ( !wonderEffect )
                    continue;

                effect = wonderEffect.getEffect();

                if( !tempResult.every(combine)){
                    culture += effect;

                    continue;
                }

                level = 0; // Не отображаем у ЧС уровень
            }
            else if( slot.getType() == Build.type.culture )
                effect = slot.getEffect();
            else if( slot.getType() == Build.type.administration )
                effect = lib.build.administrationculture[0] + lib.build.administrationculture[1] * slot.getEffect();
            else
                continue;

            tempResult.push({id: slot.getId(), name: slot.getName(), level: level, effect: effect});

            culture += effect;
        }

        data.cultBuild = tempResult.length > 0 ? tempResult : null ;

        data.cultUpSum = utils.toInt(culture);


        /** Потребление ресов **/

        data.cultConsSum = 0;
        data.cultConsRes = [];
        for (stockRes in stockResList) {
            stockRes = stockResList[stockRes];

            if( stockRes.consBin && stockRes.isCult() ){
                data.cultConsSum += stockRes.getEffect();

                data.cultConsRes.push(stockRes);
            }
        }


        /** Итого по культуре **/

        data.cultRace = wofh.account.race.getCultK();
        data.cultSpec = town.getSpecialists().getElem(Specialist.ids.culture).getEffect();
        data.cultMap = 1 + town.getMapBonus(MapImp.effectType.culture);
        data.cultLuck = town.getRealBonus(LuckBonus.ids.culture);

        data.cultSum = utils.toInt(data.cultUpSum * data.cultRace * (data.cultConsSum + 1) * data.cultSpec * data.cultMap * data.cultLuck);
    };
    

tabEconomicsPop.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.townRes);
	this.notif.show.push(Notif.ids.townPop);
	this.notif.show.push(Notif.ids.global);
};

tabEconomicsPop.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabEconomicsPop.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsPop.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'pop');
};


tabEconomicsPop.prototype.prepareFormat = function(){
	this.data.roundFunc = utils.toPercent;
	this.data.defVal = 100;
	this.data.dim = '%';
};



/******
* Вкладка money
*/

tabEconomicsMoney = function(){
    this.name = 'money';
	this.tabTitle = 'Бюджет';
	
	tabEconomicsMoney.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsMoney, Tab);

tabEconomicsMoney.prototype.getData = function(){
	var data = this.data = {},
        town = wofh.town,
        /* Доходы */
        work = town.calcBusyWorkers(),
        money = work * town.calcPopOnRes().getCount(Resource.ids.money) * (town.getRes(Resource.ids.money).incom || 0),
        bank = 1,
        slot,
        level,
        on,
        id,
        effect,
        slotList = town.getSlots().getList();

	for (slot in slotList) {
		slot = slotList[slot];
		level = slot.getLevel();
		on = slot.isActive();
		if (level > 0 && on) {
			if (slot.getType() == Build.type.production && slot.getTakesProduction(0) == Resource.ids.money) {
				bank += slot.getEffect();
			}
		}
	}

	money = 0;
	money /= bank;

	data.money = utils.toInt(money);
	
	
	// Изменить, чтобы не было ссылки на m, если возникнет проблема
	// var sGet = $.extend({}, {m: m}).m;
	var sGet = money;

	var tempResult = [];
	
	for (slot in slotList) {
		slot = slotList[slot];
        
		level = slot.getLevel();
		on = slot.isActive();
		id = slot.getId();

		if (!level > 0 || !on) continue;

		if ( id == Slot.ids.colossus ) {
			sGet += town.slots.wonderEffect[WonderEffect.ids.res].getEffect();
			tempResult.push({
				id: id,
				name: slot.getName(),
				level: level,
				effect: town.slots.wonderEffect[WonderEffect.ids.res].getEffect().toFixed(1)
			});
		}
		if (slot.getType() == Build.type.production && slot.getProductresForTown().hasElem(Resource.ids.money)) {
			effect = slot.getProductionRes(new Resource(Resource.ids.money));
			sGet += effect;
			tempResult.push({
				id: id,
				name: slot.getName(),
				level: level,
				effect: effect.toFixed(1)
			});
		}

		if (town.getAura().hasColossus()){
			var effect = town.getAura().getColossusEffect();

			if(effect.getBuild() == id){
				effect = effect.getEffect() * level;
				sGet += effect;
				tempResult.push({
					id: id,
					name: slot.getName(),
					level: level,
					effect: effect.toFixed(1)
				});
			}
		}
	}
	
	
	effect = town.stock.lasvegasinc||0;
	if ( effect ){
		sGet += effect;
		
		tempResult.push({
			id: Slot.ids.lasVegas,
			name: new Slot(Slot.ids.lasVegas).getName(),
			
			effect: effect.toFixed(1)
		});
	}
	
	data.buildEssectsInc = tempResult.length > 0 ? tempResult : null;

	/* Потоки */
	data.streaminc = town.getRes(Resource.ids.money).streaminc || 0;
	if ( data.streaminc > 0 ) {
		sGet += data.streaminc;
		data.streaminc = utils.formatNum(data.streaminc, {fixed:1});
	} else {
		data.streaminc = 0;
	}
	
	if( town.usesmap ){
		data.mapBonusInc = town.getResMapBonus(town.getRes(Resource.ids.money), true);
		
		sGet += data.mapBonusInc;
	}
	
	data.sGet = sGet.toFixed(1);

	/* Расходы */
	data.economy = town.getEconomy();
	
	var sPay = 0;
	
	/* Потоки */
	data.streamdec = town.getRes(Resource.ids.money).streamdec || 0;
	if ( data.streamdec < 0 ) {
		sPay -= data.streamdec;
		data.streamdec = utils.formatNum(-data.streamdec, {fixed:1});
	} else {
		data.streamdec = 0;
	}

	/* Лас-Вегас */
	data.lasVegas = {
		id: Slot.ids.lasVegas,
		effect: 0
	};
	
	effect = town.stock.lasvegasdec||0;
	
	if( effect && Account.isKnownMoney() ) {
		effect = town.stock.lasvegasdec||0;
		sPay += effect;
		
		data.lasVegas.effect = effect.toFixed(1);
	}

	tempResult = [];
	for (slot in town.getSlots().getList()) {
		slot = town.getSlot(slot);
		level = slot.getLevel(),
		on = slot.isActive();

		if (!level > 0 || (!slot.isWonder() && !on)) continue;
		
		effect = slot.getPay() * (1 - data.economy);
		
		if (effect <= 0) continue;
		sPay += effect;

		if (effect < 1) continue;

		tempResult.push({
			id: slot.getId(),
			name: slot.getName(),
			level: level,
			effect: effect.toFixed(1)
		});
	}

	data.buildEssectsCons = tempResult.length > 0 ? tempResult : null;
	data.sPay = sPay.toFixed(1);
	data.dGetPay = (sGet - sPay).toFixed(1);
	
    this.dataReceived();
};

tabEconomicsMoney.prototype.bindEvent = function(){
    
};

tabEconomicsMoney.prototype.addNotif = function(){
	//this.notif.show.push(Notif.ids.townRes);
};

tabEconomicsMoney.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabEconomicsMoney.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsMoney.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'money');
};



/******
* Вкладка info
*/

tabEconomicsInfo = function(){
	this.tabTitle = 'Информаториум';
	
	tabEconomicsInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsInfo, Tab);


tabEconomicsInfo.prototype.calcName = function(){
	return 'info';
};

tabEconomicsInfo.prototype.initOptions = function(){
	tabEconomicsInfo.superclass.initOptions.apply(this, arguments);
	
	this.options.hasReqData = true;
};

tabEconomicsInfo.prototype.getData = function(){
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getInfoReportTime(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					this.data.repTimeList = resp||{};
					
					this.data.towns = [];
					
					for(var town in wofh.towns){
						this.data.towns.push(wofh.towns[town]);
					}
					
					this.data.towns.sort(function(a, b){
						return a.id - b.id;
					});
					
					this.data.townInfo = {};
					this.data.townInfo.growCult = {text:'Прирост и культура', paramType: 0};
					this.data.townInfo.build = {text:'Строения в городе', paramType: 1};
					this.data.townInfo.prod = {text:'Производство', paramType: 2};
					this.data.townInfo.cons = {text:'Потребление', paramType: 3};
					this.data.townInfo.garrison = {text:'Гарнизон', paramType: 4};
					this.data.townInfo.army = {text:'Армия города'+' — ', paramType: 5, subParam: {paramType: 6, parent: 'army'}};
					this.data.townInfo.attacks = {text:'Атаки на город', paramType: 7};
					
					this.data.needPremium = lib.mode.winmode != 0 && !wofh.account.isPremium();
					
					this.data.comment = utils.clone(ls.getEconomicsInfoComment(tabEconomicsInfo.defComment));
					
					this.dataReceived();
				}
			);
		});
	});
};

tabEconomicsInfo.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('submit', '.js-collectData', function(){
			if( $(this).hasClass('-disabled') )
				return false;
			
			var types,
				town = 0,
				infoType = $(this).data('type');
			
			if( infoType == tabEconomicsInfo.types.town ){
				var town = self.data.towns[$(this).data('index')],
					formData = $(this).serialize(),
					typesList = formData ? utils.urlToObj(formData) : false;
					
				types = 0;
				for(var type in typesList)
					types |= 1 << typesList[type];
				
				tabEconomicsInfo.setTownsCollectedTypesToLS(town.id, types);
			}
			
			var commentText = tabEconomicsInfo.getCommentText(infoType, {townId: (town||{}).id, comment: self.data.comment});
			
			reqMgr.genInfoReport(town, types, commentText, function(resp){
				// Сохраняем комментарий для нужного города/акка в локалку
				tabEconomicsInfo.setCommentText(commentText, infoType, {townId: (town||{}).id, setToLs: true});
				
				self.setInfoCollected(town, timeMgr.getNow() + lib.account.inforeportperiod, resp.data);
			});
			
			return false;
		})
		.on('click', '.js-econ-info-townInfo-paramTowns', function(){
			if( self.data.needPremium )
				return;
			
			var $towns = $(this).closest('.econ-info-towns-block'),
				$paramBlock = $(this).closest('.econ-info-townInfo-param-block'),
				$param = $paramBlock.find('.js-econ-info-townInfo-param'),
				checked = !$param.prop('checked');
			
			$towns
				.find('.js-econ-info-townInfo-param[data-paramtype="'+$param.data('paramtype')+'"]')
				.prop('checked', checked)
				.trigger('change');
			
			
			$param = $paramBlock.find('.js-econ-info-townInfo-subParam');
			
			if( $param.length ){
				if( $param.data('parent') == 'army' && checked ){
					$towns
						.find('.js-econ-info-townInfo-subParam[data-paramtype="'+$param.data('paramtype')+'"]')
						.prop('checked', $param.prop('checked'));
				}
			}
		})
		.on('change', '.js-econ-info-townInfo-param', function(){
			self.checkCanCollect($(this).closest('form.js-collectData'));
			
			return false;
		})
		.on('click', '.js-econ-info-buyPremium', function(){
			wndMgr.addWnd(wNoPremium);
			
			return false;
		})
		.on('click', '.econ-info-comment', function(){
			var $commentWrp = $(this).closest('.econ-info-comment-wrp'),
				type = $commentWrp.data('type');
			
			if( type == tabEconomicsInfo.types.town )
				var town = $commentWrp.data('town');
			
			var commentText = tabEconomicsInfo.getCommentText(type, {townId: town, comment: self.data.comment});
			
			wndMgr.addTextEdit(commentText, {
				header: 'Комментарий к отчету',
				data:{maxlength: lib.account.maxinforeporttext},
				callbacks: {
					onEdit: function(newCommentText){
						tabEconomicsInfo.setCommentText(newCommentText, type, {townId: town, comment: self.data.comment});
						
						$commentWrp.html(tmplMgr.economics.info.comment({text: newCommentText}));
					}
				}
			});
			
			return false;
		});
};

tabEconomicsInfo.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accBonus];
};

tabEconomicsInfo.prototype.afterDraw = function(){
	this.setInfoCollected(false, (this.data.repTimeList[0]||0) + lib.account.inforeportperiod);
	
	for(var town in this.data.towns){
		town = this.data.towns[town];
		
		this.setInfoCollected(town, (this.data.repTimeList[town.id]||0) + lib.account.inforeportperiod);
	}
	
	if( this.data.needPremium ){
		this.cont.find('input').prop('disabled', true);
		this.cont.find('.econ-info-townInfo').addClass('cl-grey');
	}
	
	this.initScroll({scrollbarPosition: 'outside'});
};

tabEconomicsInfo.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabEconomicsInfo.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'info');
};


tabEconomicsInfo.prototype.setInfoCollected = function(town, repTime, repLink){
	if( town ){
		var $parent = this.cont.find('.econ-info-town-block[data-town='+town.id+']'),
			repTmpl = tmplMgr.economics.info.town.repLink;
		
		$parent.find('.econ-info-town-cont').toggleClass('-noCollect', repTime > timeMgr.getNow());
	}
	else{
		var $parent = this.cont.find('.econ-info-acc-block'),
			repTmpl = tmplMgr.economics.info.acc.repLink;
	}
	
	$parent.find('.econ-info-collectBtn-wrp').html(tmplMgr.economics.info.collectBtn({time:repTime, town:town, needPremium:this.data.needPremium}));
	
	if( town )
		this.checkCanCollect($parent.find('form.js-collectData'));
	
	if( repLink )
		$parent.find('.econ-info-repLink-wrp').html(repTmpl({repId:repLink.id, repCode:repLink.code}));
};



tabEconomicsInfo.prototype.checkCanCollect = function($form){
	var params = !$form.find('.js-econ-info-townInfo-param:checked').length;

	$form.toggleClass('-disabled', params);
	$form.find('button').toggleClass('-disabled', params);
};



tabEconomicsInfo.setCommentText = function(text, type, opt){
	opt = opt||{};
	opt.comment = opt.comment||ls.getEconomicsInfoComment(tabEconomicsInfo.defComment);
	
	if( opt.townId )
		opt.comment[type][opt.townId] = text;
	else
		opt.comment[type] = text;
	
	if( opt.setToLs && text )
		ls.setEconomicsInfoComment(opt.comment);
};

tabEconomicsInfo.getCommentText = function(type, opt){
	opt = opt||{};
	opt.comment = opt.comment||ls.getEconomicsInfoComment(tabEconomicsInfo.defComment);
	
	if( opt.townId )
		return opt.comment[type][opt.townId];
	else
		return opt.comment[type];
};

tabEconomicsInfo.setTownsCollectedTypesToLS = function(townId, types){
	var townsCollectedTypes = ls.getTownsCollectedTypes({});
	
	townsCollectedTypes[townId] = types;
	
	ls.setTownsCollectedTypes(townsCollectedTypes);
};

tabEconomicsInfo.isTownCollectedType = function(townId, paramType, defIsTrue){
	var collectedTypes = ls.getTownsCollectedTypes({})[townId]||0;
	
	if( defIsTrue && !collectedTypes )
		return true;
	
	return collectedTypes & (1<<paramType);
};

tabEconomicsInfo.types = {
	acc: 0,
	town: 1
};

tabEconomicsInfo.defComment = {};
tabEconomicsInfo.defComment[tabEconomicsInfo.types.acc];
tabEconomicsInfo.defComment[tabEconomicsInfo.types.town] = {};