function SlotList(slots, pop, town, noSlotLimit) {
    if (typeof(pop) == 'string') pop = this.parsePop();
    
	this.elemClass = Slot;
    this.list = {};
    this.town = town;
	
    if( slots ){
        this.parseSlots(slots, noSlotLimit);
		
        this.setPop(pop);
    }
}

utils.extend(SlotList, List);

SlotList.prototype.parseSlots = function(slotsStr, noSlotLimit) {
	var slotsCount = noSlotLimit ? utils.sizeOf(slotsStr) : Town.slotsCount;

    for (var slotPos = 0; slotPos < slotsCount; ++slotPos) {
        var slotData = slotsStr ? slotsStr[slotPos] : null;

        if( slotData ){
            var slotId = slotData[0];
			
            if( slotId == Slot.actionsIds.destroy ){
                slotId = lib.build.nobuild;
				
                var slotLevel = 0;
                var slotActive = false;
                var slotNeedPay = true;
            }
			else{
                var slotLevel = slotData[1];
                var slotActive = slotData[2];
                var slotNeedPay = false;
            }
        }
		else{
            var slotId = lib.build.nobuild;
            var slotLevel = 0;
            var slotActive = false;
            var slotNeedPay = false;
        }
		
        var slot = new Slot(slotId, slotLevel, slotPos, slotActive, slotNeedPay, new EventList(), this.town);
        
		this.list[slotPos] = slot;
		
        if( slot.isWonder() ){
            //чудо света
            if( !slot.isEmpty() && slot.isActive() )
                this.wonderEffect = WonderEffect.getEffects(slot.getId());
            else
                this.wonderEffect = {};
        }
    };
};

SlotList.prototype.hasTrainings = function(){
    for(var slot in this.getList()){
        slot = this.getElem(slot);
        if (wofh.events.getTrainQueue(slot).length){
            return true;
        }
    }
    return false;
}

SlotList.prototype.calcImmCount = function() {
    return Math.min(timeMgr.getNow() - this.town.bimmetime, lib.town.constructing.buildupimme.max) / lib.town.constructing.buildupimme.period;
}

SlotList.prototype.canBuildUp = function(){
    var err = new ErrorX;
    
    if (wofh.account.isAdmin()) return err;
    
    if (this.calcImmCount() < 1) err.add(ErrorX.ids.WElimit);
    
    if (wofh.account.getCoinsAll() < lib.luckbonus.buildupcost) err.add(ErrorX.ids.WEnoLuck);
    
    return err;
}

SlotList.prototype.calcBuildUpTime = function(){
    return (1 - this.calcImmCount()) * lib.town.constructing.buildupimme.period;
}

SlotList.prototype.parsePop = function(str){
    var arr = {};
    var arrRaw = utils.parseString(str, '^');
    for (var i in arrRaw) {
        var code = +i;
        var val = arrRaw[i];
        
        var slot = ~~(code / 26);
        var res = code%26;
        
        if (!arr[slot]) {
            arr[slot] = {};
        }
        
        arr[slot][res] = val;
         
    }
    return arr;
}

SlotList.prototype.clearPop = function(pop) {
    for (var slot in this.getList()) {
        var slot = this.getElem(slot);
        
		slot.clearPop();
    }
};

SlotList.prototype.setPop = function(pop) {
    this.clearPop();
    
    //распреднас
    for (var slotId in pop) {
        var slotPop = this.getElem(slotId).getPop();

        for (var resId in pop[slotId]) {
            var resCount = pop[slotId][resId];
            slotPop.addRes(resId, resCount);
        }
    }
};

//сколько работников можно отправить на каждый ресурс
SlotList.prototype.calcResPopMax = function() {
	var resList = new ResList(),
		slots = this.getProdSlots();
	
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		
        if( slot.isActive() ){
            var prodRes = slot.getProductresForTown();
			
            resList.addList(prodRes.mult(utils.toInt(slot.getMaxPopForTown())));
        }
	}
	
	return resList;
};

// Сколько работников можно устроить
// realProduce: если true учитываются только те здания, которые реально могут производить рес на данный момент (к примеру если здание требует для производства местород, а он не колонизирован)
SlotList.prototype.calcMaxPop = function(opt) {
	opt = opt||{};
	
    var sum = 0,
		sciSum = 0;
	
	var slots = this.getProdSlots();
	
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		
        if(slot.isActive()){
			if( opt.realProduce && !slot.getProductresForTown().getLength() )
				continue;
			
			if( slot.isProduceScience() )
				sciSum += slot.getEffect();
			else
				sum += slot.getEffect();
        }
	}
	
	if( !opt.noPopMult )
		sum *= this.town.calcWorkPopMult();
	
	sum += sciSum;
	
	return sum;
};


//сколько работников уже работает
SlotList.prototype.calcPop = function() {
    var sum = 0;
	
	var slots = this.getProdSlots();
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		sum += ~~slot.getPop().calcSum();
	}
	
	return sum;
};


SlotList.prototype.clone = function(town){
    town = town || this.town;
    
	var clone = new SlotList().setIgnorePos(this.getIgnorePos());
    
	clone.town = town;
	
    for (var slot in this.getList()) {
        slot = this.getElem(slot).clone();
        slot.town = town;
        clone.addElem(slot);
    }
    
    clone.wonderEffect = this.wonderEffect;
	
    return clone;
};


SlotList.prototype.isEqual = function(slots){
    for (var pos in this.getList()) {
        var slot1 = this.getElem(pos);
        var slot2 = slots.getElem(pos);
        if (slot1.getId() != slot2.getId()) return false;
        if (slot1.getLevel() != slot2.getLevel()) return false;
        if (slot1.getActive() != slot2.getActive()) return false;
    }
	
    return true;
};

SlotList.prototype.getEventAppliedToSlot = function(oldSlots, firstEvent){
	var oldSlotsList = oldSlots.getList(),
		slotsList = this.getList(),
		oldSlot,
		slot;
	
    for(slot in slotsList){
		oldSlot = oldSlotsList[slot];
		slot = slotsList[slot];
		
		if( oldSlot.getLevel() != slot.getLevel() || oldSlot.getId() != slot.getId() ){
			if( firstEvent )
				return true; // Ускоренное событие
			
			firstEvent = oldSlot.getEvent();
			
			return firstEvent ? firstEvent : true;
			
			
//			if( !firstEvent )
//				return true; // Если ид или уровень изменились, но нет событий - переместили домики
//			else{
//				var oldSlotApply = oldSlot.applyEvent(firstEvent);
//				
//				// Если после применения первого события в очереди,
//				// id и уровень совпадают с теми, что вернул сервер,
//				// то оно является актуальным (возвращаем для последующего удаления)
//				if( oldSlotApply.getLevel() == slot.getLevel() && oldSlotApply.getId() == slot.getId() )
//					return firstEvent;
//				else
//					return true; // Актуальное событие было ускорено и уже удалено
//			}
		}
    };
	
    return false;
};



SlotList.prototype.applyEvents = function(){
    for (var slot in this.getList()) {
        slot = this.getElem(slot).applyEvents();
		
        this.addElem(slot);
    }
	
    return this;
};    

SlotList.prototype.updEvents = function () {
    for (var slot in this.getList()) {
        slot = this.getElem(slot).updActions();
    }
	
    return this;
};


SlotList.prototype.addElem = function(elem) {
	if( this.getIgnorePos() )
		SlotList.superclass.addElem.apply(this, arguments);
	else
		this.list[elem.getPos()] = elem; //в списке не по ид, а по позиции
	
	return this;
};

//поиск и фильтрации
SlotList.prototype.getWonder = function() {	
	var wonder = this.getElemRaw(Build.slotGroup.wonder);
	
	if( !wonder )
		wonder = new this.elemClass(Build.no, 0, Build.slotGroup.wonder, false);
	
    return wonder;
};

SlotList.prototype.getMainSlot = function() {
    return this.getElem(Build.slotGroup.main);
};

SlotList.prototype.getPerimeter = function() {
    return this.getElem(Build.slotGroup.perimeter);
};

SlotList.prototype.getCourt = function() {
    return this.getSlotsByAbility(Build.type.corruption).getFirst() || false;
};


SlotList.prototype.getSlotsById = function(buildId) {
	var slots = new SlotList();
    slots.town = this.town;
	for (var slot in this.getList()) {
		slot = this.getElem(slot);
		if (slot.getId() == buildId){
			slots.addElem(slot);
		}
	}
	return slots;
}

SlotList.prototype.getSlotByPos = List.prototype.getElemByPos;

SlotList.prototype.filter = function(condFunc){
	var slots = new SlotList().setIgnorePos(this.getIgnorePos());
	
    slots.town = this.town;
    
	for (var slot in this.getList()) {
		var slot = this.getElem(slot);
		
		if ( condFunc(slot) )
            slots.addElem(slot);
	}
    
	return slots;
};

SlotList.prototype.getSlotsByAbility = function (abil) {
	if (typeof(abil)!='object') abil = [abil];
	
	return this.filter(function(slot){
        return !slot.isEmpty() && utils.inArray(abil, slot.getType());
    });
};

SlotList.prototype.getStoreSlots = function(){
	return this.getSlotsByAbility(Build.type.store);
};

SlotList.prototype.getProdSlots = function(){
	return this.getSlotsByAbility(Build.type.production);
};

//промышленные слоты - производственные слоты без науки
SlotList.prototype.getPromSlots = function(){
	var prodSlots = this.getSlotsByAbility(Build.type.production),
        prom = new SlotList();
        
    prom.town = this.town;
    
    for (var slot in prodSlots.getList()) {
        slot = prodSlots.getElem(slot);
        
        if( !slot.getProductres().getFirst().isScience() )
            prom.addElem(slot);
    }
    
    return prom;
};

SlotList.prototype.getActiveSlots = function(){
	return this.filter(function(slot){
        return slot.isActive();
    });
};

SlotList.prototype.getConflictSlots = function(slot) {
    var slotList = new SlotList();
    slotList.town = this.town;
    
	for (var slotPos in this.getList()){
		if (slot.isConflictWith(this.getElem(slotPos))) {
			slotList.addElem(this.getElem(slotPos));
		}
	}
	return slotList;
};


SlotList.prototype.getUnpayedSlotCount = function () {
	var count = 0;
	for (var slot in this.getList()) {
		slot = this.getElem(slot);
		if (slot.needPay) count ++;
	}
	return count;
}

SlotList.prototype.calcSlotCost = function () {
    var effect = this.wonderEffect[WonderEffect.ids.slotCost];
    if (effect) {
        return effect.getEffect();
    } else {
        var count = this.getUnpayedSlotCount();
        return lib.town.slot.cost[lib.town.slot.cost.length - count - 1];
    }
};

//calcMoneyDescNoEconomy: function(){

SlotList.prototype.getPay = function () {
    var moneyDesc = wofh.town.getStock().getElem(Resource.ids.money).dec;
    return moneyDesc / (1 - this.getEconomy());
};

//рассчёт стоимости всех построек
SlotList.prototype.calcPay = function () {
    var pay = 0;
    for (var slot in this.getList()) {
        slot = this.getElem(slot);
        if( slot.canPay() ) {
            pay += slot.getPay();        
        }
    }
    return pay;
};

//рассчёт стоимости всех построек
SlotList.prototype.calcPayWithEconomy = function () {
    var pay = 0;
    for (var slot in this.getList()) {
        slot = this.getElem(slot);
        if( slot.canPay() ) {
            pay += slot.getPay({useEconomy: true});        
        }
    }
    return pay;
};

        
SlotList.prototype.getEconomy = function(mainSlot){
    var mainSlot = mainSlot||this.getMainSlot();
    
    if( !mainSlot.isEmpty() && mainSlot.isActive() && mainSlot.getType() == Build.type.administration )
        return mainSlot.getAdminEconEffect();
    else
        return 0;
};

// Если установлено, то элементы будут добавляться по id, а не по позиции
SlotList.prototype.setIgnorePos = function(ignorePos){
    this.ignorePos = ignorePos;
	
	return this;
};

SlotList.prototype.getIgnorePos = function(){
    return this.ignorePos;
};

SlotList.prototype.extractBuildings = function(){
	var buildings = [],
		list = this.getList();
	
	for(var slot in list){
		slot = list[slot];
		
		if( slot.isEmpty() )
			continue;
		
		buildings[slot.getPos()] = [slot.getId(), slot.getLevel(), +slot.isActive()];
	}
	
	return buildings;
};

SlotList.getSorted = function(){
    var list = new SlotList().setSorted(true).setIgnorePos(true);
	
    for (var bldId in Build.tableSort)
        list.addElem(new Slot(Build.tableSort[bldId]));
	
    return list;
};

SlotList.getSortedWonders = function(){
    var list = new SlotList().setSorted(true).setIgnorePos(true);
	
    for (var slot in Build.tableSort){
        slot = new Slot(Build.tableSort[slot]);
		
        if( slot.isWonder() && slot.isEnabled() )
            list.addElem(slot);
    }
	
    return list;
};

SlotList.getReportSortList = function(destroy){
	return new SlotList(destroy, false, false, true).setSorted(true).getList().sort(function(a, b){
		var aVal = a.build.isWonder();
		var bVal = b.build.isWonder();
		if( aVal == bVal ){
			return a.getId() > b.getId() ? 1 : -1;
		}else{
			return aVal < bVal ? 1 : -1;
		}
	});
};

SlotList.getAll = function () {
    var list = new SlotList().setIgnorePos(true),
		slot;
    
	for (var i = 0; i < lib.builds.length; i++) {
		slot = new Slot(i);
		
		if( !slot.isHidden() )
			list.addElem(slot);
    }
	
    return list;
};



