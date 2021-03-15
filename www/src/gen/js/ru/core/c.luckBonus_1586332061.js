function LuckBonus(id, levelOrTownOrAcc) {
	this.id = id;
	
	if (levelOrTownOrAcc instanceof Town) {
		if( id == LuckBonus.ids.accountPremium )
			this.setLevel(wofh.account.isPremium());
		else{
			this.town =	levelOrTownOrAcc;
			
			this.setLevel(this.town.bonus.real[id].level);
			
			this.setTime(this.town.bonus.real[id].time);	
		}
	} else if( levelOrTownOrAcc instanceof Account ){
		this.account = levelOrTownOrAcc;
		
		this.setTime(levelOrTownOrAcc.bonus.subscription);
		
		this.setLevel(this.isActive() ? 1 : 0); 
	}
	else
		this.setLevel(levelOrTownOrAcc);
};


LuckBonus.maxLevel = 2;

LuckBonus.townAlarmPeriod = 3 * 24 * 3600;
LuckBonus.prolongTime = 7 * 24 * 3600;
LuckBonus.prolongTimeMomental = 3 * 24 * 3600;

LuckBonus.ids = {
	grown: 0,
	science: 1,
	accountAssist: 2,
	production: 3,
	war: 4,
	culture: 5,
	sciencePack: 6,//наука СРАЗУ
	productionPack: 7,//производство СРАЗУ
	punish: 8,
	traders: 9,
	accountPremium: 10,
	prize: 11,
	building: 12,
	subscription: 13,
	tradeIm: 14,
	accountBonusDrop: 15,
    announce: 16,
    rename: 17,
	swapSlots: 18,
    action: 99,
    
	luckMove: 100,
	luckTrade: 101,
	adminTakesLuck: 105,
	luckFromLink: 108,
	startBonus: 109 
};

LuckBonus.town = [
	LuckBonus.ids.grown,
	LuckBonus.ids.science,
	LuckBonus.ids.production,
	LuckBonus.ids.war,
	LuckBonus.ids.culture,
	LuckBonus.ids.sciencePack,
	LuckBonus.ids.productionPack,
	LuckBonus.ids.traders
];

LuckBonus.subscription = {
	accepted: 1,
	
	list: [
		LuckBonus.ids.grown,
		LuckBonus.ids.science,
		LuckBonus.ids.production,
		LuckBonus.ids.war,
		LuckBonus.ids.culture,
		LuckBonus.ids.traders
	],
	
	isOn: function(){
		return lib.luckbonus.subscription.on;
	},
	
	isActive: function(){
		return LuckBonus.subscription.isOn() && Quest.isActive(lib.luckbonus.subscription.quest);
	},
	
	isAccepted: function(){
		return debug.isAdmin() || LuckBonus.subscription.isOn() && LuckBonus.subscription.accepted == servBuffer.serv.luckSubscription;
	},
	
	setAccepted: function(callback){
		servBuffer.temp.luckSubscription = LuckBonus.subscription.accepted;
		
		servBuffer.apply(callback);
	}
};


LuckBonus.prototype._getLib = function () {
	return lib.luckbonus.town[this.id];
};

LuckBonus.prototype.setLevel = function (level) {
	this.level = level;
};

LuckBonus.prototype.getLevel = function (noActiveCheck) {
	return this.isActive() ? this.level : 0;
};

LuckBonus.prototype.setTime = function(time){
	this.time = time||0;
};

LuckBonus.prototype.getTime = function () {
	return this.time||0;
};

LuckBonus.prototype.isActive = function() {
	if( this.time )
		return this.time > timeMgr.getNow();
	else
		return this.level > 0;
};

LuckBonus.prototype.canUp = function () {
    return this.getLevel() <= LuckBonus.maxLevel;
};

LuckBonus.prototype.getClone = function () {
	var clone = new LuckBonus(this.id, this.town);
	
    return clone;
};

LuckBonus.prototype.isForTown = function () {
	return utils.inArray(LuckBonus.town, this.id);
}

LuckBonus.prototype.getUp = function () {
	var bonusUp = new LuckBonus(this.id, this.getLevel()+1);
	bonusUp.town = this.town;
	bonusUp.time = this.isActive() ? this.time : timeMgr.getNow() + LuckBonus.prolongTime;
    return bonusUp; 
};


LuckBonus.prototype.canUpNow = function () {
	return this.canUp() && !this.hasActiveConcurentBonus() && this.canUseNow();
};

LuckBonus.prototype.canUseNow = function () {
	if( this.id == LuckBonus.ids.sciencePack && (wofh.country || utils.sizeOf(wofh.towns) > 1) ){
		return false;
	}
	
	return true;
};

//эффект в процентах
LuckBonus.prototype.getEffect = function () {
	var effects = this._getLib().effect,
		effect = effects[this.getLevel()];
	
	if( utils.inArray(LuckBonus.subscription.list, this.id) && this.town && this.town.hasBonus(LuckBonus.ids.subscription) ){
		// Прибавляем эффект от царь-бонуса
		effect += effects[this.town.getLuckBonus(LuckBonus.ids.subscription).getLevel()];
	}
	
	return effect;
};

LuckBonus.prototype.getMaxEffect = function(){
	var effect = this._getLib().effect;
	
	return effect[effect.length-1];
};

//текущий эффект для города
LuckBonus.prototype.getTownCurEffect = function () {
	return this.town.getRealBonus(this.id);
}

//эффект зависящий от типа - сколько торговцев, ресурсов, военных бонусов
LuckBonus.prototype.getTypedEffect = function () {
	var effect = this.getEffect();
	
	//var mult = this.isMomental() ? effect : (1 + effect) / (this.getTownCurEffect()) - 1;
	var mult = this.isMomental() ? effect : effect / this.getTownCurEffect();
    
    var periodH = this.isMomental() ? lib.luckbonus.packperiod / 3600 : 7 * 24;//период работы бонуса в часах!
	
	switch (this.id){
		case LuckBonus.ids.grown:
			var consumption = this.town.stock.calcGrownEffect();

			var baseVal = this.town.getGrownInc() * consumption / this.getTownCurEffect();
			return baseVal * effect * periodH;
			
			return this.town.getGrownInc() * periodH * mult * consumption;
			break;
		case LuckBonus.ids.culture:
			return ~~(this.town.pop.culture * mult);
		case LuckBonus.ids.traders:
			var baseVal = this.town.calcBaseTraders();
			var curVal = this.town.traders.count;
			return Math.ceil(baseVal * (1 + effect)) - baseVal;
			break;
		case LuckBonus.ids.science:
		case LuckBonus.ids.sciencePack:
			return new Resource(Resource.ids.science, utils.toInt(this.town.getRes(Resource.ids.science).incNC * periodH * mult));
			break;
		case LuckBonus.ids.production:
		case LuckBonus.ids.productionPack:
			var list = new ResList();
			for (var elem in this.town.stock.getList()) {
				elem = this.town.stock.getElem(elem);
				
				if( elem.isScience() )
					continue;
				
				// getResMapBonus - учитываем статический доход от УМ, т.к. на него влияет бонус производства в отличии от статического дохода от ЧС
				var inc = elem.incNC + this.town.getResMapBonus(elem, true);
				
	            inc = utils.toInt(inc * periodH * mult);
				
				if( inc )
					list.addCount(elem.id, inc);
			}
			return list;
			break;
		case LuckBonus.ids.war:
			return effect;
			break;
	}
};

LuckBonus.prototype.hasEffect = function () {
	var effect = this.getTypedEffect();
	
	switch (this.id){
		case LuckBonus.ids.science:
		case LuckBonus.ids.sciencePack:
			return effect.count > 0;
		case LuckBonus.ids.production:
		case LuckBonus.ids.productionPack:
			return !effect.isEmpty();
		default: 
			return effect > 0;
	}
}

//эффект от улучшения этого бонуса
LuckBonus.prototype.getTypedEffectUp = function () {
	var effect = this.getTypedEffect();
	var effectUp = this.getUp().getTypedEffect();
	
	switch (this.id){
		case LuckBonus.ids.science:
			effectUp.count -= effect.count;
			return effectUp;
		case LuckBonus.ids.production:
			return effectUp.diffList(effect);
		case LuckBonus.ids.productionPack:
		case LuckBonus.ids.sciencePack:
			return effectUp;
		default: 
			return effectUp - effect;
	}
};

LuckBonus.prototype.getEffectUp = function () {
	return this.getUp().getEffect() - this.getEffect();
};

LuckBonus.prototype.getCostUp = function () {
	if (!this.isMomental()) {
		return this.getUp().getCost(true) - this.getCost(true);
	} else {
		//однажды будет известна правильная формула....  (long long ago in a galaxy far far away....)
		if (this.getLevel() == 0) {
			return this.getUp().getCost(); 
		} else if (this.getLevel() == 1) {
			//до окончания 1день, считаем 1день по стоимости следующего уровня и 2 дня по стоимости текущего
			var clone = this.getClone();
			clone.time = timeMgr.getNow() * 2 - clone.time + LuckBonus.prolongTimeMomental;//клон с обратным периодом 
			var result = this.getUp().getCost(true) + clone.getCost(true);
			return result;
		} else {
			//хз как считаем. ввел поправочный коэффициент для предидущей формулы
			//вероятно что то считается по цене первого уровня, но что - не понятно
			var clone = this.getClone();
			clone.time = timeMgr.getNow() * 2 - clone.time + LuckBonus.prolongTimeMomental;
			var result = this.getUp().getCost(true) + clone.getCost(true) * 0.59;
			return result;
		}
	}
};

LuckBonus.prototype.getCost = function (useTime) {
	if (this.id ==LuckBonus.ids.accountPremium) {
		var cost = this.getLevel() ? lib.luckbonus.premiumcost : 0;
	} else if( this.id ==LuckBonus.ids.subscription ){
		var cost = lib.luckbonus.subscription.cost;
	} else {
		var luckLib = this._getLib();
	    var towns = utils.sizeOf(wofh.towns);
	    
	    var cost = Math.ceil(luckLib.cost[this.getLevel()] / towns * (1 + (luckLib.costk * (towns - 1))));
		
		if (useTime && this.isActive()) {
			var period = this.time - timeMgr.getNow();//период который остался
			var delay = this.isMomental()? LuckBonus.prolongTimeMomental: LuckBonus.prolongTime;//общее время бонуса
			
			cost *= period / delay;
		}
	}
	
    return cost;
};

LuckBonus.prototype.isMomental = function(){
	return this.id == LuckBonus.ids.sciencePack || this.id == LuckBonus.ids.productionPack;
};

LuckBonus.prototype.isWeekly = function() {
	return this.id == LuckBonus.ids.grown || this.id == LuckBonus.ids.science || this.id == LuckBonus.ids.production || this.id == LuckBonus.ids.accountPremium;
}

//идентификатор конкурирующего бонуса
LuckBonus.prototype.getConcurentIds = function () {
    if (this.id == LuckBonus.ids.science || this.id == LuckBonus.ids.production) {
    	return [LuckBonus.ids.sciencePack, LuckBonus.ids.productionPack];
    }
    if (this.id == LuckBonus.ids.sciencePack || this.id == LuckBonus.ids.productionPack) {
    	return [LuckBonus.ids.science, LuckBonus.ids.production];
    }
    return [];
};

LuckBonus.prototype.getMomentalBonus = function () {
	var bonusId;
    if (this.id == LuckBonus.ids.science) {
    	bonusId = LuckBonus.ids.sciencePack;
    }
    if (this.id == LuckBonus.ids.production) {
    	bonusId = LuckBonus.ids.productionPack;
    }

	if (typeof(bonusId) != 'undefined') {
		return new LuckBonus(bonusId, this.town);
	}
	return false;
};

LuckBonus.prototype.getConcurentBonus = function () {
	switch(this.id){
		case LuckBonus.ids.science: return new LuckBonus(LuckBonus.ids.sciencePack, this.town);
		case LuckBonus.ids.production: return new LuckBonus(LuckBonus.ids.productionPack, this.town);
		case LuckBonus.ids.sciencePack: return new LuckBonus(LuckBonus.ids.science, this.town);
		case LuckBonus.ids.productionPack: return new LuckBonus(LuckBonus.ids.production, this.town);
	}
	
    return false;
};

LuckBonus.prototype.hasActiveConcurentBonus = function () {
	var concurIds = this.getConcurentIds();

	for (var id in concurIds) {
		id = concurIds[id];
		if (new LuckBonus(id, this.town||this.getLevel()).isActive()) {
			return true;
		}
	}

	return false;
};

//время, когда бонус разблокируется
LuckBonus.prototype.getUnbreakTime = function () {
	var concurIds = this.getConcurentIds();
	var time = 0;

	for (var id in concurIds) {
		id = concurIds[id];
		var bonus = new LuckBonus(id, this.town||this.getLevel());
		if (bonus.isActive()){
			time = Math.max(time, bonus.time);
		}
	}

	return time;
};

LuckBonus.getDefBonuses = function(bonusPack, onlyForTown){
	var bonuses = {},
		bonusId;
	
	bonusId = LuckBonus.ids.grown;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Население'
	};
	
	bonusId = bonusPack == LuckBonus.ids.productionPack ? LuckBonus.ids.productionPack : LuckBonus.ids.production;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Производство'
	};
	
	bonusId = LuckBonus.ids.traders;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Торговцы'
	};
	
	bonusId = LuckBonus.ids.culture;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Культура'
	};
	
	bonusId = bonusPack == LuckBonus.ids.sciencePack ? LuckBonus.ids.sciencePack : LuckBonus.ids.science;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Знания'
	};
	
	bonusId = LuckBonus.ids.war;
	bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Бонус Войны'
	};
	
	if( !onlyForTown ){
		bonusId = LuckBonus.ids.accountPremium;
		bonuses[bonusId] = {
		bonus: new LuckBonus(bonusId, 1),
		name: 'Царь аккаунт',
		name0: 'Царь',
		name1: 'аккаунт'
	};
	}
	
	return bonuses;
};

LuckBonus.getUsableBonuses = function(bonusPack){
	var usableBonuses = {};
	var bonuses = LuckBonus.getDefBonuses(bonusPack);
	
	for(var bonus in bonuses){
		var luckBonus = bonuses[bonus];
		
		if( bonus == LuckBonus.ids.accountPremium ){
			if( !wofh.account.isPremium() )
				usableBonuses[bonus] = luckBonus;
			
			continue;
		}
		
		for(var town in wofh.towns){
			town = wofh.towns[town];
			
			var townBonusReal = town.getLuckBonus(+bonus);
			var townBonus = town.getLuckBonus(+bonus);
			if( townBonus.getLevel() == 0 )
				townBonus.setLevel(1);
			
			if( (townBonusReal.isActive() || townBonus.getUp().hasEffect()) && townBonus.canUp() && (!townBonus.isMomental() || townBonus.canUpNow()) ){
				if( !luckBonus.towns ){
					luckBonus.towns = [];
					usableBonuses[bonus] = luckBonus;
				}
				
				luckBonus.towns.push(town);
			}
		}
		
		if( luckBonus.towns ){
			luckBonus.towns.sort(function(a, b){
				return a.id < b.id ? -1 : 1;
			});
		}
	}
	
	return usableBonuses;
};