function Stock(data, town) {
	this.elemClass = StockRes;
	if (town){
       	this.town = town;
        this.town.stock = this;
	}
	if (data) {
		this.parse(data);
	}
}

utils.extend(Stock, List);


/*******************
** Базовые методы **
********************/

Stock.prototype.parse = function(resources){
	this.list = {};
	this.max = resources.max;
	this.foodpriority = resources.foodpriority;
	this.lasvegasdec = resources.lasvegasdec;
	this.lasvegasinc = resources.lasvegasinc;
	this.usesmap = resources.usesmap;
	this.mapbonus = utils.parseResString(resources.mapbonus);
    
    this.autoInc = resources.autoInc;//для совместимости с обновлением города
	
	var resHas = utils.parseResString(resources.has);//всего на складе
	var resDec = utils.parseResString(resources.dec);//вероятно спад
	
	var resStreamInc = utils.parseResString(resources.streaminc);//от потоков (приток)
	var resStreamDec = utils.parseResString(resources.streamdec);//от потоков (расход)
	var resStreamFuel = utils.parseResString(resources.streamfuel);//от потоков (расход на ускорение)
	
	var resInc = utils.parseResString(resources.inc);
	var resIncBase = this.calcIncBase();
	var resIncNC = utils.parseResString(resources.incnc); // incnc - no consumption (прирост реса без потребления)
														  // incnl - no luck (без учёта удачи)
	
	var wasTime = timeMgr.getNow();
	for (var resId in lib.resource.data){
		resId = +resId;
		var res = new this.elemClass(resId);
		res.town = this.town;
		
		res.wasTime = wasTime;//время, на которое количество ресурсов является достоверным
		res.was = resHas[resId]||0;//достоверное количество ресурсов
		res.updHas();//текущее количество ресурсов
		res.consBin = (resources.consumption & Math.pow(2, resId)) > 0;
		res.dec = resDec[resId]||0;
		
		res.streaminc = +utils.toFixed(resStreamInc[resId]||0, 3); // Округляем до 3 знака, остальное погрешность
		res.streamdec = +utils.toFixed(-resStreamDec[resId]||0, 3); // Округляем до 3 знака, остальное погрешность
		res.streamfuel = +utils.toFixed(-resStreamFuel[resId]||0, 2); // Округляем до 2 знака, остальное погрешность
		res.stream = +utils.toFixed(res.streaminc + res.streamdec + res.streamfuel, 3); // Округляем до 3 знака, остальное погрешность

		res.incom = resInc[resId]||0;//доход
		res.incBase = resIncBase.getCount(resId);
		res.incNC = resIncNC[resId]||0;
        res.autoInc = utils.inArray(resources.autoInc, resId);
		this.list[resId] = res;
	}
	
	for (var resId in lib.resource.data){
		var res = this.getElem(resId);
		res.update = res.calcUpdate();
	}
	
	this.splitFood();//после update
	
	for (var resId in lib.resource.data){
		var res = this.getElem(resId);
		res.updateHour = res.calcUpdateHour();
	}
	
	this.fixFood();
};


Stock.prototype.update = function(resources, work){
	var wasTime = timeMgr.getNow();
    
    if (typeof(resources.mapbonus) != 'undefined') {
		this.mapbonus = utils.parseResString(resources.mapbonus);
    }
    
	if( typeof(resources.lasvegasdec) != 'undefined' ) {
		this.lasvegasdec = resources.lasvegasdec;
	}
	if( typeof(resources.lasvegasinc) != 'undefined' ) {
		this.lasvegasinc = resources.lasvegasinc;
	}
	
	var resHas = typeof(resources.has) != 'undefined' ? utils.parseResString(resources.has) : false;//всего на складе
	var resDec = typeof(resources.dec) != 'undefined' ? utils.parseResString(resources.dec) : false;//потребление
	var resInc = typeof(resources.inc) != 'undefined' ? utils.parseResString(resources.inc) : false;
	var resIncNC = typeof(resources.incnc) != 'undefined' ? utils.parseResString(resources.incnc) : false;//ХЗ
	
	var resStreamInc = typeof(resources.streaminc) != 'undefined' ? utils.parseResString(resources.streaminc) : false;// Округляем до второго знака, остальное погрешность (приток)
	var resStreamDec = typeof(resources.streamdec) != 'undefined' ? utils.parseResString(resources.streamdec) : false;//от потоков (расход)
	var resStreamFuel = typeof(resources.streamfuel) != 'undefined' ? utils.parseResString(resources.streamfuel) : false;//от потоков (расход на ускорение)
	var hasStreamChange;
	
    if (work) {
        this.autoInc = work.auto||[];
    }
    
	for (var resId in lib.resource.data){
		var res = this.getElem(resId);
        
		if(resHas || resInc || resDec){
			res.wasTime = wasTime;//время, на которое количество ресурсов является достоверным
		}
		
        if (resHas) {
            res.was = resHas[resId]||0;//достоверное количество ресурсов
            res.updHas();//текущее количество ресурсов
        }
        
        if (resInc) {
            res.incom = resInc[resId]||0;//доход
        }
        
        if (resIncNC) {
            res.incNC = resIncNC[resId]||0;
        }
        
        if (resDec) {
            res.dec = resDec[resId]||0;
        }
		
		hasStreamChange = false;
		if(resStreamInc !== false){
			res.streaminc = +utils.toFixed(resStreamInc[resId]||0, 3);// Округляем до третьего знака, остальное погрешность

			hasStreamChange = true;
		}
		if(resStreamDec !== false){
			res.streamdec = +utils.toFixed(-resStreamDec[resId]||0, 3);// Округляем до третьего знака, остальное погрешность

			hasStreamChange = true;
		}
		if(resStreamFuel !== false){
			res.streamfuel = +utils.toFixed(-resStreamFuel[resId]||0, 2);// Округляем до второго знака, остальное погрешность

			hasStreamChange = true;
		}
		if( hasStreamChange )
			res.stream = +utils.toFixed(res.streaminc + res.streamdec + res.streamfuel, 3); // Округляем до 3 знака, остальное погрешность
		
        if (this.autoInc) {
            res.autoInc = utils.inArray(this.autoInc, +resId);
        }
        
        if(typeof(resources.consumption) != 'undefined'){
            res.consBin = (resources.consumption & Math.pow(2, resId)) > 0;
        }
        
        
		res.update = res.calcUpdate();
    }
    
	this.splitFood();//после update
	
	for (var resId in lib.resource.data){
		var res = this.getElem(resId);
		res.updateHour = res.calcUpdateHour();
	}
    
    
    if (typeof(resources.max) != 'undefined') {
        this.max = resources.max;
    }
	
	this.fixFood();
};

Stock.prototype.updIncBase = function(){
	var resIncBase = this.calcIncBase();
    
	for (var resId in lib.resource.data){
		var res = this.getElem(resId);
		res.incBase = resIncBase.getCount(resId);
	}
};

Stock.prototype.clone = function(town){
    town = town || this.town;
    
	var clone = Stock.superclass.clone.apply(this);
	
	clone.town = town;
	
	clone.each(function(stockRes){
		stockRes.town = town;
	});
	
	this.cloneFeatures(clone);
	
	return clone;
};

Stock.prototype.cloneFeatures = function(clone){
	clone.max = this.max;
	clone.foodpriority = this.foodpriority;
	clone.lasvegasdec = this.lasvegasdec;
	clone.lasvegasinc = this.lasvegasinc;
	clone.usesmap = this.usesmap;
	clone.mapbonus = this.mapbonus;
};

/***********************
** Доступ к свойствам **
************************/

//ссылка на город
Stock.prototype.getTown = function () {
	return this.town;
};

//вместимость склада
Stock.prototype.getMax = function (res) {
    if( res && res.isFood() )
        return this.max * 6;//количество пищевых ресурсов;
    
	return this.max;
};

//сколько ресурсов роста потратится при расходовании пищи
Stock.prototype.calcFoodSplit = function(count, calcFunc) {
	var topRes = new ResList(false, true);
	for (var i in this.foodpriority){
		var res = this.getElem(this.foodpriority[i]);
		var resCount = res[calcFunc]();
		if (!resCount) continue;
		
		var dif = Math.max(0, Math.min(count, resCount));
		count -= dif;
		topRes.setCount(res, -dif);
		if (count == 0) break;
	}
	
	if (count > 0){
		topRes.addCount(Resource.ids.meat, -count);
	}
	return topRes;
};

//расчет и фиксация спада еды в остальных пищевых ресурсах
Stock.prototype.splitFood = function() {
	var foodCount = this.getElem(Resource.ids.food).dec;
	var foodSpread = this.calcFoodSplit(foodCount, 'getCountForSplitFood');
	
	for (var resId in this.getList()) {
		var res = this.getElem(resId);
		
		res.foodInfluence = foodSpread.getCount(resId);
	}
};

//установка пищи - выполнять после всех подсчётов
//собирает данные по всем ресам
Stock.prototype.fixFood = function(){
	var resFood = this.getElem(Resource.ids.food);
	resFood.was = 0;
	resFood.has = 0;
	resFood.updateHour = 0;
	
	for (var resId in this.getList()){
		var res = this.getElem(resId);
		
		if(res.isGrown()){
			resFood.was += ~~res.was;
            resFood.has += ~~res.has;
			resFood.updateHour += res.updateHour;
		}
	}
}

//сколько останется пищи на складе после траты списка ресурсов
Stock.prototype.getFoodHasAfterSpend = function(resList){
    var has = this.getElem(Resource.ids.food).has;
	
	for (var resId in resList.getList()){
		var res = resList.getElem(resId);
		
		if(res.isGrown())
			has -= res.getCount(); // Вычитаем ресурсы роста из пищи на складе
	}
    
    return has;
};

/******************************
** Добавление ресов на склад **
*******************************/

Stock.prototype.addCount = function(resId, resCount)/*(res)*/{
	var res = this.elemClass.getObj(resId, resCount);
	
	if( resCount === undefined )
		resCount = res.getCount();
	
	if (res.getId() == Resource.ids.food) {
		var resList = this.calcFoodSplit(-resCount, 'getHas');
		this.addList(resList);
	} else{
		var resStock = this.getElem(res.getId());
		
		resStock.fixHas(resStock.has + resCount);
	}
};

Stock.prototype.addList = function(resList){
	for (var resId in resList.getList()) {
	
		var res = resList.getElem(resId);
		
		if (res.getId() == Resource.ids.food)continue;
		
		this.addCount(res, res.getCount());
	}
	
	var res = resList.getElem(Resource.ids.food);
    if (res) {
        this.addCount(res, res.getCount());
    }
};

/*******************************
** ResList'ы из разных данных **
********************************/

Stock.prototype.getResPropertyList = function (func, opt) {
	opt = opt||{};
	
	var list = new ResList();
	
	for (var resId in this.getList()) {
		var res = this.getElem(resId),
			elem = list.addCount(resId, res[func](opt.param), opt.allowZero);
		
		if( opt.copy )
			utils.copyProperties(elem, res);
	}
	
	return list;
};

Stock.prototype.getIncList = function (noStat) {
	return this.getResPropertyList('calcIncom', {param:noStat});
};

Stock.prototype.getIncTaxedList = function () {
	return this.getResPropertyList('calcTaxedIncom');
};

Stock.prototype.getHasList = function (opt) {
	return this.getResPropertyList('getHas', opt);
};

Stock.prototype.getConsBinList = function () {
	return this.getResPropertyList('getConsBin');
};

Stock.prototype.getAutoIncList = function () {
	return this.getResPropertyList('getAutoInc');
};

/********************
** Пересчёт данных **
*********************/

Stock.prototype.updateIncom = function () {
	for (var res in this.getList()){
		res = this.getElem(res);
		res.updateIncom();
	}
	return this;
}

Stock.prototype.updateDec = function () {
	for (var res in this.getList()){
		res = this.getElem(res);
		res.updateDec();
	}
	return this;
}

Stock.prototype.calcUpdate = function () {
	for (var res in this.getList()){
		res = this.getElem(res);
		res.update = res.calcUpdate();
		res.updateHour = res.calcUpdateHour();
	}
	return this;
}


Stock.prototype.updResHas = function() {
	for (var res in this.getList()){
		res = this.getElem(res);
		
		res.updHas();
	}
    return this;
};

Stock.prototype.updResWas = function(hasStr) {
    var resWas = utils.parseResString(hasStr);//всего на складе
    var now = timeMgr.getNow();
    
	for (var resId in this.getList()){
		var res = this.getElem(resId);
        res.was = resWas[resId] || 0;
        res.wasTime = now;
	}
    this.updResHas();
    
	//this.splitFood();//после update
	this.fixFood();
    
    return this;
};

Stock.prototype.calcIncBase = function(){
    var list = new ResList(lib.town.production.resincbase.default);
    
    var terrain = this.town.getType();
    if (terrain.hill == 3) {
        list.addCount(Resource.ids.stone, lib.town.production.resincbase.granite);
    }
    if (terrain.hasBank) {
        list.addCount(Resource.ids.fish, lib.town.production.resincbase.fish.water);
    } else if (terrain.water) {
        list.addCount(Resource.ids.fish, lib.town.production.resincbase.fish.river);
    }
    
    var deposit = this.town.deposit;
    if (!deposit.isEmpty()) {
        list.addList(deposit.getRes());
    }
    
    if (!wofh.account.hasAbility(Science.ability.fish)) list.setCount(Resource.ids.fish, 0);
    if (!wofh.account.hasAbility(Science.ability.cloth)) list.setCount(Resource.ids.cloth, 0);
    
    return list;  
};


/***********
** Разное **
************/

Stock.prototype.calcSpendCount = function(resList) {
	return this.getHasList().calcIncludeCount(resList);
};

Stock.prototype.calcGrownEffect = function(){
    var grown = 1;

    for (var res in this.getList()) {
        res = this.getElem(res);
        if (res.isGrown() && res.consBin) {
            grown += res.getEffect();
        }
    }
    return grown;
};

Stock.prototype.calcCultEffect = function(){			
    var cult = 1;
    
    for (var res in this.getList()) {
        res = this.getElem(res);
        if (res.isCult() && res.consBin) {
            cult += res.getEffect();
        }
    }
    return cult;
};

//вероятный прирост знаний от потребления (книг)
Stock.prototype.calcSciEffect = function(){
    var sci = 0;

    for (var res in this.getList()) {
        res = this.getElem(res);

        if( res.getType() == Resource.types.science && res.consBin )
            sci += res.getEffect();
    }
    
    return 1 + sci;
};


Stock.prototype.calcIncNoCourt = function(){
    var court = this.town.getSlots().getCourt();
	
    if( !court )
        return this.getIncList(true);

    var courtActivity = court.getActive();

	court.setActive(false);
    
    var incList = this.getIncList(true);
    
    court.setActive(courtActivity);
    
    return incList;
};

Stock.prototype.calcIncCourtUp = function(){	
    var court = this.town.getSlots().getCourt();
	
    if( !court )
        return this.getIncList(true);
    
    var courtLevel = court.getLevel();
    
    court.setLevel(courtLevel + 1);
    
    var incList = this.getIncList(true);
    
    court.setLevel(courtLevel);
    
    return incList;
};

//сколько максимально ресурсов может потреблять город
Stock.prototype.calcMaxConsCount = function(){
	return ~~(Math.sqrt(this.getTown().getPopHas() * 0.01)) + 1;
};

Stock.prototype.sortByDefault = function () {
    var clone = new Stock().setSorted(true)
	for (var resId in ResList.sortDefArray) {
        var resId = ResList.sortDefArray[resId];
        if (this.hasElem(resId)) {
            clone.list.push(this.getElem(resId))
        }
	}
    return clone;
}

Stock.prototype.getGroups = function () {
    var clone = {};

    for (var groupId in ResList.groups){
    	var group = ResList.groups[groupId];
    	clone[groupId] = [];
    	for (var res in group) {
    		var res = this.getElem(group[res]);
    		clone[groupId].push(res);
    	}
    }

    return clone;
};

Stock.prototype.getResGroups = function (groupsOrder, allowEmptyGroup) {
    //вычисляем группы
	groupsOrder = groupsOrder||[1,2,3,4];
	
	var groupsData = this.getGroups(),
		resGroups = [],
        group;
	
	if ( !Quest.isAvail(Quest.ids.bldCollector1) )
		groupsData[3] = [];
	
	for (var groupId in groupsOrder){
		groupId = groupsOrder[groupId];
		group = groupsData[groupId];
        
		if( group === undefined )
            continue;
        
		for( var resPos = 0; resPos < group.length; resPos++ ){
			if ( !group[resPos].canShow() ){
				group.splice(resPos, 1);
                
				resPos--;
			}
		}
        
		if( group.length || allowEmptyGroup )
			resGroups.push({id: groupId, list: group});//ФОРМАТ ГРУППЫ: код + список
	}
	
	return resGroups;
};


Stock.prototype.parseFoodpriorityStr = function (foodpriority) {
	this.foodpriority = [];
	
	for (var i = 0; i < foodpriority.length; i++)
		this.foodpriority.push(foodpriority[i]);
};

//вычисляем момент, когда на складе накопится нужное количество ресурсов
//false - не накопится никогда, int когда накопится
Stock.prototype.calcEnoughMoment = function(resList) {
	var maxDelay = 0,
		resStock;
	
	for (var res in resList.getList()) {
		res = resList.getElem(res);
		resStock = this.getElem(res.getId());
		
		if ( (res.isFood() ? this.getFoodHasAfterSpend(resList) : resStock.has) >= res.getCount() )
			continue;
		
		if ( (!res.isFood() && resStock.updateHour <= 0) || res.getCount() > resStock.getMax() )
			return false;
        
		var enoughPeriod = this.calcResEnoughPeriod(res, resStock, resList);
		
		if( !enoughPeriod )
			return false;
		else if( enoughPeriod < 0 )
			continue;
		
        maxDelay = Math.max(maxDelay, enoughPeriod);
	}
	
	return timeMgr.getNow() + maxDelay;
};

Stock.prototype.calcResEnoughPeriod = function(resNeed, resStock, resList){
	if( resNeed.isFood() )
		return this.calcFoodEnoughPeriod(resNeed, resList);
	
	return (resNeed.getCount() - resStock.has) / resStock.updateHour * timeMgr.HtS;
};

Stock.prototype.getOverflow = function(res){
	var resHas = this.getElem(res).getHas();
	
	return wofh.town.stock.getMax() - (resHas + res.getCount());
};

Stock.prototype.isOverflow = function(res){
	return this.getOverflow() > 0;
};

// Функция расчета времени, которое ноебходимо, чтобы накопить нужное количество реса на складе
// Возвращаемые параметры: 
// numver - время в секундах;
// false - накопить не удастся; 
// -1 - копить не нужно, ресурсов достаточно.
Stock.prototype.calcFoodEnoughPeriod = function(foodNeed, resList){
	resList = resList||new ResList();
	foodNeed = foodNeed.clone();
	
	var foodAvail = 0, // Количество доступных ресурсов роста на складе для учата в пищу
		isFoodEnough = false, // Хватит ли доступных ресурсов роста для требуемого количества пищи
		stockMax = this.getMax(),
		hasGrownResFixed = false, // Есть ли в списке ресурсы роста с фиксированным количестовм
		grownResList = this.getHasList({copy: true, allowZero: true}).getStockable().getGrown().filter(function(grownRes){
			if( isFoodEnough )
				return;
			
			foodAvail += Math.max(0, grownRes.getCount() - resList.getElem(grownRes).getCount());
			
			if( foodAvail >= foodNeed.getCount() )
				isFoodEnough = true;
			else if( grownRes.updateHour ){
				// Сперва заполняется фиксированное количество (если оно есть) и уже следом ресурс роста будет довать приток/отток к пище
				grownRes.countFixed = Math.max(0, resList.getElem(grownRes).getCount() - grownRes.getCount());

				if( grownRes.countFixed ){
					if( grownRes.updateHour > 0 && (grownRes.countFixed + grownRes.getCount() < stockMax) ){
						hasGrownResFixed = true;
						
						grownRes.enoughPeriodFixed = grownRes.countFixed / grownRes.updateHour;
					}
					else
						return;
				}

				return true;
			}
		});
		
	if( isFoodEnough )
		return -1;
	
	// Расчитываем остаток пищи, который необходимо накопить
	foodNeed.addCount(-foodAvail);
	
	var grownResEnoughFixedPeriodSum = 0;
	
	if( hasGrownResFixed ){
		if( grownResList.getLength() > 1 ){
			var grownResFixedList = grownResList.clone(true).filter(function(grownRes){
					return grownRes.countFixed > 0;
				}).sort(function(a, b){
					return (b.countFixed / b.updateHour) - (a.countFixed / a.updateHour);
				}),
				grownResRawList = grownResList.getList();
			
			while( grownResFixedList.getLength() ){
				var grownResFixed = grownResFixedList.popElem(),
					enoughFixedPeriod = grownResFixed.countFixed / grownResFixed.updateHour,
					foodFlow = 0;

				for(var grownRes in grownResRawList){
					grownRes = grownResRawList[grownRes];

					if( grownRes._isFull || grownRes._isEmpty )
						continue;
					
					var grownResFlow = grownRes.updateHour * enoughFixedPeriod,
						grownResBecome = grownRes.getCount() + grownResFlow; // Сколько реса стало
						
					if( grownResBecome > stockMax ){
						grownResFlow -= grownResBecome - stockMax;
						
						grownRes._isFull = true;
					}
					else if( grownResBecome < 0 ){
						grownResFlow = -grownRes.getCount();

						grownRes._isEmpty = true;
					}

					grownRes.addCount(grownResFlow);
					
					if( grownRes.countFixed > 0 ){
						if( grownRes.getId() == grownResFixed.getId() )
							grownRes.countFixed = 0;
						else
							grownResFixedList.getElem(grownRes).countFixed -= grownResFlow;
					}
					else
						foodFlow += grownResFlow;
				}
				
				if( foodFlow >= foodNeed.getCount() )
					return (grownResEnoughFixedPeriodSum + (foodNeed.getCount() / (foodFlow / enoughFixedPeriod))) * timeMgr.HtS;
				
				grownResEnoughFixedPeriodSum += enoughFixedPeriod;
				
				foodNeed.addCount(-foodFlow);
			}
			
			grownResList.filter(function(grownRes){
				return !(grownRes._isFull || grownRes._isEmpty);
			});
		}
		else
			foodNeed.addCount(grownResList.getFirst().countFixed);
	}
	
	if( !grownResList.getLength() )
		return false;
	
	// Сортируем список изменяющихся ресурсов роста по мере достижения ими предела на складе или 0-я
	grownResList.sort(function(a, b){
		var aReachLimitPeriod = a.updateHour > 0
									? ((stockMax - a.getCount()) / a.updateHour)
									: (a.getCount() / -a.updateHour),
			bReachLimitPeriod = b.updateHour > 0
									? ((stockMax - b.getCount()) / b.updateHour)
									: (b.getCount() / -b.updateHour);

		return bReachLimitPeriod - aReachLimitPeriod;
	});

	var grownResLimitPeriodSum = 0;

	grownResList = grownResList.getList();

	while( grownResList.length ){
		// Начинаем перебор с ресурса, который быстрее всех достигнит лимита [0, stockMax]
		var grownResFirstLimit = grownResList.pop();

		// Расчитываем время за которое ресурс достигнит лимита
		var reachLimitPeriod = grownResFirstLimit.updateHour > 0
									? ((stockMax - grownResFirstLimit.getCount()) / grownResFirstLimit.updateHour)
									: (grownResFirstLimit.getCount() / -grownResFirstLimit.updateHour),
			// Расчитывае количество пищи, на которое измениться пища на складе,
			// за время необходимое ресурсу, чтобы достичь лимита
			foodFlow = grownResFirstLimit.updateHour > 0
							? stockMax - grownResFirstLimit.getCount()
							: -grownResFirstLimit.getCount();

		for(var grownRes in grownResList){
			grownRes = grownResList[grownRes];
			
			var grownResFlow = grownRes.updateHour * reachLimitPeriod;
			
			grownRes.addCount(grownResFlow);

			foodFlow += grownResFlow;
		}

		// Если набрали необходимое количество, рассчитываем время, которое для этого было необходимо
		if( foodFlow >= foodNeed.getCount() )
			return (grownResEnoughFixedPeriodSum + grownResLimitPeriodSum + (foodNeed.getCount() / (foodFlow / reachLimitPeriod))) * timeMgr.HtS;

		grownResLimitPeriodSum += reachLimitPeriod;

		foodNeed.addCount(-foodFlow);
	}
	
	return false;
};

Stock.prototype.extractData = function(){
	var data = {
		list: {},
		town: this.town.id
	};
	
	this.cloneFeatures(data);
	
	var list = this.getList();
	
	for(var stockRes in list){
		stockRes = list[stockRes];
		
		stockRes = utils.copyProperties({}, stockRes);
		
		stockRes.town = stockRes.town.id;
		
		data.list[stockRes.id] = stockRes;
	}
	
	return data;
};

Stock.prototype.getLimit = function(){
	var limit = 0,
		slotList = SlotList.getAll().getStoreSlots().getList();
	
	// От строений
	for(var slot in slotList){
		slot = slotList[slot];
		
		if( !slot.getRaces().hasRace(wofh.account.race) )
			continue;
		
		slot.setLevel(lib.build.maxlevel);
		
		var maxEffect = slot.getMaxCount() * slot.getEffect();
		
		if( maxEffect > limit )
			limit = maxEffect;
	}
	
	// От наук
	limit += ScienceList.getAll().calcBonusStoreSum();
	
	// Минимальный объем склада
	limit += Stock.min;
	
	return limit;
};

Stock.min = 200;
