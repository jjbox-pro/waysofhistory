function StockRes(id) {
	this.id = id;
	this.lib = lib.resource.data[id];
}

utils.extend(StockRes, Resource);
/*
StockRes.prototype.clone = function(){
	return StockRes.superclass.clone.apply(this);
}*/

StockRes.prototype.clone = function(){
    //отвязываем город, клонируем, привязываем снова
    var town = this.town;
    delete this.town;
    var clone = StockRes.superclass.clone.apply(this);
    this.town = town;
    clone.town = town;
    return clone;
};

//изменение реса - промежуточное 
//из него вычисляется расход пищи и полное изменение реса
StockRes.prototype.calcUpdate = function(){
	var halfLifeLoss = this.calcHalfLife();
	
	this.cons = this.calcConsumption();
	
	var update = this.incom + (this.stream||0) - (this.dec||0) - this.cons - halfLifeLoss;
	
	if( this.isMoney() )
		update += this.town.budgetSum - this.town.taxes.sum;
	
	return update;
};

//изменение реса - полное
StockRes.prototype.calcUpdateHour = function(){
	return this.update + this.foodInfluence;
};


StockRes.prototype.calcConsumption = function(){
	if (!this.consBin) return 0;
	
	switch(this.getType()){
		case Resource.types.science:
			var effect = this.town.stock.getElem(Resource.ids.science).incNC;
			break;
		case Resource.types.culture:
			var effect = this.town.pop.culturenc;
			break;
		case Resource.types.grown: 
			var effect = this.town.getGrownInc(24);
			break;
	}
	return this.lib.consumption * this.lib.effect * effect * wofh.account.race.getConsumption();
};

//расчёт дохода от производства
StockRes.prototype.calcIncomFromProd = function(){
	var sum = 0;

    //от строений - от населения
	var slots = this.town.getSlots().getProdSlots();
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		
		sum += slot.getProductionRes(this);
	}

	return sum;
};

//расчёт дохода от производства - статичный
StockRes.prototype.calcIncomFromProdStat = function(){
	var sum = 0;
	
    //от строений - статичное
	var slots = this.town.getSlots();
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		
		sum += slot.getProductionResStatic(this);
	}
	
	return sum;
};

//расчёт коэффициента дохода от потребления
StockRes.prototype.calcIncomKFormCons = function(){
    if( this.isScience() )
        return this.town.getStock().calcSciEffect();
	
    return 1;
};

//вычисляем доход
StockRes.prototype.calcIncom = function(noStat){
	var sum = this.calcIncomFromProd();
	
    sum *= this.calcIncomKFormCons();
	
	if( !noStat )
		sum += this.calcIncomFromProdStat();
	
	return sum;
};

//вычисляем доход с учётом налогов
StockRes.prototype.calcTaxedIncom = function(){

	var sum = this.calcIncomFromProd();

    sum *= this.calcIncomKFormCons();

	//***ВСТАВКА

    //бонусный коэффициент
    var bonus = this.town.getResLuckBonus(this);

    //сумма без бонусов и с бонусами
    var sumBeforeBonus = sum / bonus;
    var sumBonus = sum - sumBeforeBonus;
	
	//налоги
	var tax = this.getProdTax();
	sum = sumBeforeBonus * (1 - tax) + sumBonus;

	//***ВСТАВКА

   	sum += this.calcIncomFromProdStat();

	return sum;
};


StockRes.prototype.getProdTax = function(){
	if (wofh.country) {
		return (wofh.country.taxes.tax.prodx[this.id - 1]||0) / 1000;
	} else {
		return 0;
	}
};


StockRes.prototype.updateIncom = function(){
    this.incom = this.calcIncom()
}

StockRes.prototype.calcDec = function(){
	var sum = 0;
	
    if (this.getId() == Resource.ids.money) {
        sum += this.town.getSlots().calcPayWithEconomy()
    }
	
	return sum;
};

StockRes.prototype.updateDec = function(){
    this.dec = this.calcDec();
};

StockRes.prototype.updHas = function(){
	if( !this.isStockable() )
        return this;
    
    this.has = this.getHasNow();
    
    this.checkStockLimit();
    
    return this;
};

StockRes.prototype.fixHas = function(has){
    this.has = has;
    
    this.checkStockLimit();
    
    this.was = this.has;
    
    this.wasTime = timeMgr.getNow();
};

StockRes.prototype.calcTimeUpdate = function(){
    
    if (!this.updateHour) return;

    //сколько ресурса должно быть в обновлении
    if (this.updateHour > 0) {
        var need = utils.toInt(this.has + 1);
    } else {
        var need = utils.toInt(this.has);
    }

    this.upd = (need - utils.toInt(this.was)) / this.updateHour * 3600 + this.wasTime;
};

//пересчитывает 
StockRes.prototype.checkStockLimit = function(){
    if( this.isFood() )
        return this;
    
    this.has = Math.min(this.has, this.town.getStock().getMax());
    this.has = Math.max(this.has, 0);
    
    return this;
};

StockRes.prototype.getCountForSplitFood = function(){
	return this.has + this.update;
};

StockRes.prototype.getHas = function(){
	return this.has;
};


StockRes.prototype.getMax = function(){
	return this.town.stock.max * (this.isFood()? 6: 1);
};

StockRes.prototype.getConsBin = function(){
	return this.consBin;
};

StockRes.prototype.getAutoInc = function(){
	return this.autoInc;
};



StockRes.prototype.calcHalfLife = function(){
	if (this.getId() != Resource.ids.uran || !this.has) return 0;
	return this.has * (1 - Math.pow(2, -1 / lib.resource.halflifetime));
};

//сколько времени потребуется, чтобы наполнить или опустошить склад
StockRes.prototype.calcStockFillTime = function() {
    if( this.updateHour == 0 ) 
		return 0;
    
	return Math.ceil(this.calcTimeTo(this.updateHour > 0 ? this.getMax() : 0));
};

//сколько времени потребуется, чтобы достичь такого числа ресурса
StockRes.prototype.calcTimeTo = function(count) {
    return (count - this.has) / this.updateHour * 3600 ;
};

StockRes.prototype.getHasNow = function() {
    return this.was + (this.updateHour||0) * (timeMgr.getNow() - this.wasTime) / 3600;
};

StockRes.prototype.calcFillPerc = function() {
    var stock = this.town instanceof Town ? this.town.getStock() : this.town.stock; 
	return ~~this.has / stock.getMax() * 100;
};

StockRes.prototype.calcHasH = function(h) {
    var clone = this.clone();
    
    clone.has = clone.has + clone.updateHour * h;
    clone.checkStockLimit();
    return clone;
};

StockRes.prototype.canShow = function(opt) {
	opt = opt||{};
	
    return this.has >= 1 || this.update != 0 || (opt.allowAllChanges && (this.incom || this.dec || this.streamdec || this.streamfuel || this.streaminc));
};

StockRes.prototype.toResource = function() {
    return new Resource(this.getId(), this.getHas());
};

StockRes.prototype.getTown = function(town) {
	return this.town||town;
};
