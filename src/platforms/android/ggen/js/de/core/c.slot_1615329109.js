function Slot (id, level, pos, active, needPay, actions, town, pop) {
	this.setId(id);
	this.level = level;
	this.pos = pos === undefined ? lib.build.nobuild : pos;
	this.active = active === undefined ? true : active;
	this.needPay = needPay === undefined ? false : needPay;
	this.town = town === undefined 
		? (typeof(wofh) == 'undefined' ? false : this.getTown(wofh.town)) /*старый ИФ*/
		: town;
		
	this.initLists(pop, actions);
};

utils.extend(Slot, Element);


/**
 * константы
 */

Slot.ids = {
	altair: 0,
	obelisk: 8,
    embassy: 13,
	tipi: 18,
    animalFarm: 23,//скотный двор
    weaversHouse: 36,//домТкача
	wall: 38,
    embassyAfro: 111,
	// Чудеса
	paganTemple: 83,
	sacrificialAltar: 11,
	earthDam: 76,
	geoglyph: 56,
	earthMother: 43,
	stonehenge: 94,
	oracle: 97,
	terracotta: 9,
	coliseum: 58,
	machuPicchu: 100,
	garden: 92,
	colossus: 75,
	sphinx: 112,
	pyramid: 73,
	greatLibrary: 60,
	templar: 98,
	sunTzu: 99,
	heConcentrator: 91,
	tsarCannon: 95,
	lasVegas: 107,
	brandenburgGate: 108,
	airport: 30,
	mcc: 29,
	cosmodrome: 77,
	spaceship: 65
};

Slot.actions = {
	0: {name: 'none', title: ''},
	1: {name: 'build', title: 'Bau'},
	500: {name: 'destroy', title: 'Zerstörung'},
	501: {name: 'rebuild', title: 'Umbau '},
	502: {name: 'destroylevel', title: 'Zerstörung'}
};

utils.createIds(Slot.actions, Slot.actionsIds = {});

 
// ошибки при улучшении
Slot.buildErr = {
	ok: 0,
	off: 1,
	max: 2,
	res: 3,
	work: 4,
	money: 5,
	queue: 6,
	wonder: 7,
	maxCount: 8,
	empty: 9,//строение не построено, чтобы его сносить/перестраивать/...
	building: 10,//перестройка невозможно, строение строится
	questBuildDestroy: 11, // Нельзя снести здание, не изучен квест
    disabled: 12, //перестройка невозможна, здание отключено на сервере
	needBonus: 13, //только с бонусом
	swap: 14, //нельзя переместить
};

//закладки типов строений

Slot.tabs = {
	1: {name: 'defence', title: 'Befestigungsgebäude', hint: 'Befestigungsgebäude beschützen die Stadt wegen Landes- und Luftangriffe.'},
	2: {name: 'science', title: 'Wissenschaftliche', hint: 'Wissenschaftliche Gebäude. Wenn Bevölkerung dort verteilt ist, werden Wissen produziert, die man für wissenschaftlichen Erforschungen braucht.'},
	3: {name: 'production', title: 'Produktion und Finanz', hint: 'Produktion- und Finanzgebäude. Wenn Bevölkerung dort verteilt ist, werden Ressourcen bzw. Geld produziert.'},
	4: {name: 'store', title: 'Lager und Handel', hint: 'Lager- und Handelgebäude erhöhen Kapazität von Stadtlagern und Effektivität von Landes- und Wasserhandel.'},
	5: {name: 'culture', title: 'Kultur', hint: 'Kulturgebäude erhöhen Kulturlimit, darum die Stadt mehr Einwohner haben konnte.'},
	6: {name: 'war', title: 'Militär', hint: 'Man kann in Militär-Gebäuden Truppen ausbilden, ihre Effektivität erhöhen, und auch an Kampf teilnehmen usw.'},
	7: {name: 'grown', title: 'Demographische', hint: 'Demographische Gebäude erhöhen Zuwachs von Bevölkerung in der Stadt.'},
	8: {name: 'other', title: 'Besondere', hint: 'Besondere Gebäude. Alle Gebäude hier sind einzigartig und sogar merkwürdig.'},
	10: {name: 'wonder'},
	0: {name: 'all', title: 'Alles anzeigen', hint: 'Alle Gebäude, die man hier bauen kann, anzeigen.'},
};

Slot.location = {
	hill: 3
};

utils.createIds(Slot.tabs, Slot.tabIds = {});

Slot.C_UNGROW_MULT = 0.5;


//здание следующего уровня
Slot.prototype.clone = function() {
	return new Slot(this.id, this.level, this.pos, this.active, this.needPay, this.actions.clone(), this.town, this.pop.clone());
};

Slot.prototype.setId = function(id) {
	this.id = id;
	
	this.build = new Build(id);
};

Slot.prototype.initLists = function(pop, actions) {
	this.pop = pop ? pop : new ResList();
	
	this.actions = actions === undefined ? new EventList() : actions; 
};

Slot.prototype.getId = function() {
	return this.id;
};

Slot.prototype.getLevel = function() {
	return this.level;
};

Slot.prototype.setLevel = function(level) {
	this.level = level;
	
	return this;
};

Slot.prototype.getPos = function() {
	return this.pos;
};

Slot.prototype.getActive = function() {
	return this.active;
};

Slot.prototype.isActive = function() {
	return this.getActive() == true;
};

Slot.prototype.isOff = function() {
	return !(this.isEmpty() || this.isActive() || this.isWonder());
};

Slot.prototype.setActive = function(val) {
	this.active = val;
    
    return this;
};

Slot.prototype.getActions = function() {
	return this.actions;
};

Slot.prototype.setActions = function(actions) {
	this.actions = actions;
};

Slot.prototype.addAction = function(event) {
	if( event )
		this.actions.add(event);
	
	return this;
};

Slot.prototype.haveActions = function() {
	return this.getActions().getLength();
};

Slot.prototype.haveAction = function(type) {
	return this.getActions().getByType(type).getFirst();
};

Slot.prototype.updActions = function() {
	this.setActions(wofh.events.getBldQueue(this));
};

Slot.prototype.isNeedPay = function() {
	return this.needPay;
};

Slot.prototype.setTown = function(town) {
	this.town = town;
	
	return this;
};

Slot.prototype.getTown = function(town) {
	return this.town||town;
};

Slot.prototype.getPop = function() {
	return this.pop;
};

Slot.prototype.clearPop = function() {
	this.pop = new ResList();
};

/**
 * библиотечные методы
 */
 
Slot.prototype.getName = function() {
	return this.isEmpty() ? '' : this.build.getName();
};

Slot.prototype.getDesc = function() {
	return this.build.getDesc();
};

Slot.prototype.getSpeciale = function() {
	return this.build.getSpeciale();
};


Slot.prototype.getType = function() {
	return this.build.getType();
};

Slot.prototype.isAdministration = function(){
	return this.getType() == Build.type.administration;
};

//есть ли конфликт у постройки в принципе
Slot.prototype.getConflicts = function() {
    var list = new List();
    var group = this.build.group;
    if (group) {
        var slots = BuildList.getAll();
        for (var slot in slots.getList()) {
            slot = slots.getElem(slot);
            if (this.isConflictWith(slot)){
                list.addElem(slot)
            }
        }
    }
    
    return list;
};

//есть ли конфликт у постройки среди тех, что находятся в городе
Slot.prototype.getConflictsInTown = function() {
	var conflicts = new SlotList();

	for (var slot in this.town.slots.getList()) {
		slot = this.town.slots.getElem(slot);
		if (slot.getPos() != this.getPos() && slot.isActive() && this.isConflictWith(slot)){
			conflicts.addElem(slot);
		}
	}

	return conflicts;
};
 
/**
 * динамические методы
 */
Slot.prototype.calcFreePop = function(){
    this.freePop =  utils.toInt(this.getMaxPopForTown()) - this.pop.calcSum();
};


//какой уровень даётся квестами
Slot.prototype.getAvailQuestLevel = function(){
    //берем максимальный уровень и вычитаем из него уровни, дающиеся всеми науками
	var freeLevel = lib.build.maxlevel;
	
	var scienceList = ScienceList.getAll();
	for (var science in scienceList.getList()){
		science = scienceList.getElem(science);
		freeLevel -= science.getBuildLevel(this.getId());
	}

	return freeLevel;
};

//какой уровень уже получен квестами
Slot.prototype.getQuestLevel = function(){
    //берем максимальный уровень и вычитаем из него уровни, дающиеся всеми науками
    var researchedLevel = this.getMaxLevel();

	var scienceList = ScienceList.getAll();
	for (var science in scienceList.getList()){
		science = scienceList.getElem(science);
		if (science.isKnown()) {
			researchedLevel -= science.getBuildLevel(this.getId());	
		}
	}

	return researchedLevel;
};

//текущее состояние слота
Slot.prototype.getCurState = function() {
    var town = this.getTown();
    
	return town instanceof Town ? town.getSlot(this.getPos()) : town.slots.getElem(this.getPos());
};

//события постройки-перестройки-разрушения
Slot.prototype.getBldEvent = function(pos) {
	var actions = this.getActions();
	return actions.getLength()? actions.getElem(pos||0): false;
};

Slot.prototype.isEmpty = function() {
	return this.getId() == Build.no;
};

Slot.prototype.setEmpty = function() {
	this.setId(Build.no);
    
    this.setActive(false);
};

Slot.prototype.canImm = function() {
    if( !Ability.luck() )
        return false;
    
	if( wofh.account.isAdmin() )
        return true;
	
	if( this.dispPrepare().getType() == Build.type.wonder || this.dispPrepare().getType() == Build.type.airdef )
        return false;
	
	return true;
};

Slot.prototype.isWorking = function() {
	return wofh.events.getTrainQueue(this).length > 0;
};
 
Slot.prototype.canBuildErr = function() {
	var result = Slot.buildErr.ok;
		
	if (this.isEmpty()) return Slot.buildErr.empty;
	
	if (!this.getActive() && !this.isWonder()) return Slot.buildErr.off;
	
	var slotReady = this.applyEvents().getUp();
	
	if (slotReady.getLevel() > slotReady.getMaxLevel()) return Slot.buildErr.max;
	
	var cost = slotReady.getCost();
	var stock = this.getTown().getStock().getHasNowList();
    
	if (stock.calcIncludeCount(cost, true) < 1) result = Slot.buildErr.res;//не выдаем ответ сразу же, т.к. нужны остальные проверки
	
	if (this.isWorking()) return result||Slot.buildErr.work;
	
	if (!wofh.account.knowsMoney() && this.getPayUp()) return result||Slot.buildErr.money;
	
	if (!wofh.events.isBldQueueOpen(this.getTown())) return result||Slot.buildErr.queue;
	
	if (result == Slot.buildErr.res) {//проверка на бонус
		var bonus = this.getTown(wofh.town).getLuckBonus(LuckBonus.ids.productionPack);
        
		if (this.getTown(wofh.town).pop.incReal >= 0 && bonus.canUpNow()){
			var effect = bonus.getUp().getTypedEffect().joinFood();
			var stock = stock.addList(effect);
			if (stock.calcIncludeCount(cost) >= 1) return Slot.buildErr.needBonus;
		}
	}
	
	return result;
};

Slot.prototype.canRebuildErr = function() {
	if (this.isEmpty()) return Slot.buildErr.empty;
	
	var build = this.getRebuild();
	
    
	if (build.getMaxLevel() == 0) return Slot.buildErr.max;
    
	if (this.getTown(wofh.town).getBuildCount(build.getId()) >= build.getMaxCount()) return Slot.buildErr.maxCount;
    
    if (!build || !build.isEnabled()) return Slot.buildErr.disabled;
	
	var cost = this.applyEvents(true).getRebuildCost();
    if (!cost.isEmpty()) {
        var stock = this.getTown(wofh.town).getStock().getHasNowList();
        if (stock.calcIncludeCount(cost) < 1) return Slot.buildErr.res;
    }
    
	if (this.isWorking()) return Slot.buildErr.work;
	
    
	if (!wofh.events.isBldQueueOpen(this.getTown())) return Slot.buildErr.queue;
	
	if (this.haveActions()) return Slot.buildErr.building;
    
	if (!wofh.account.knowsMoney() && build.getPay()) return Slot.buildErr.money;
	

    
	return Slot.buildErr.ok;
};

Slot.prototype.canDestroyErr = function() {
	//if (Quest.isUnavail(Quest.ids.buildDestroy) && Quest.isUnavail(Quest.ids.popSpread)) return Slot.buildErr.questBuildDestroy;
	if (this.isEmpty()) return Slot.buildErr.empty;
	if (this.isActive() && this.isWonder()) return Slot.buildErr.wonder;
	if (this.isWorking()) return Slot.buildErr.work;
	if (!wofh.events.isBldQueueOpen(this.getTown())) return Slot.buildErr.queue;
	
	return Slot.buildErr.ok;
};

Slot.prototype.canSwapErr = function() {
	if( this.haveActions() ) return Slot.buildErr.building;
	else if( this.isWonder() ) return Slot.buildErr.wonder;
	else if ( this.isWorking() ) return Slot.buildErr.work;
	else if( this.isPerimetrType() || this.isMainType() ) return Slot.buildErr.swap;
	
	var town = this.getTown();
	
	if( !town || town.id != wofh.town.id )
		return Slot.buildErr.swap;
	
	var terrain = Town.type[town.terrain];
	
	if( (this.isHillType() && terrain.hill < 2) || (this.isWaterType() && terrain.water < 2) )
		return Slot.buildErr.swap;
	
	return Slot.buildErr.ok;
};

Slot.prototype.isEnabled = function() {
    return this.build.slot != Build.slotType.no;
};

Slot.prototype.isWater = function() {
    return this.build.slot == Build.slotType.water;
};

Slot.prototype.isMountain = function() {
    return this.build.slot == Build.slotType.mountain;
};

Slot.prototype.isFlat = function() {
    return !(this.isMountain() || this.isWater());
};


Slot.prototype.isWaterType = function() {
    return this.getSlotType() == Build.slotType.water;
};

Slot.prototype.isHillType = function() {
    return this.getSlotType() == Build.slotType.mountain;
};

Slot.prototype.isPerimetrType = function() {
    return this.getSlotType() == Build.slotType.perimetr;
};

Slot.prototype.isMainType = function() {
    return this.getSlotType() == Build.slotType.main;
};
 
//можно ли улучшить
Slot.prototype.canUp = function() {
	return this.getLevel() < lib.build.maxlevel;
};

//здание следующего уровня
Slot.prototype.getUp = function() {
	return this.applyAction(Slot.actionsIds.build);
};


// здание, в которое можно перестроить
Slot.prototype.getNextBuildId = function() {
	if( !this.build.next )
		return Build.no;
	
	return this.build.next[(wofh.account && wofh.account.race) ? wofh.account.race.getId(): 0];
};

Slot.prototype.applyAction = function(action, buildId, noClone) {
	var slot = noClone ? this : this.clone();
	
	switch (action) {
		case Slot.actionsIds.rebuild:
			slot.setId(this.getNextBuildId());
			
			slot.setLevel(1);
			
			//clone.setActive(true); - пока в обсуждении
			
			break;
		case Slot.actionsIds.destroy:
			slot.setEmpty();
			
			slot.setLevel(0);
			
			break;
		case Slot.actionsIds.destroylevel:
            var newLevel = slot.getLevel() - 1;
			
            if( newLevel == 0 )
                slot.setEmpty();
			
            slot.setLevel(newLevel);
			
			break;
		case Slot.actionsIds.build:
			if( slot.isEmpty() ){
				slot.setId(buildId);
                
                slot.setActive(true);
            }
			
			slot.setLevel(slot.getLevel()+1);
			
			break;
	}
	
	return slot;
};

Slot.prototype.getEvent = function() {
	return this.haveActions() ? this.getActions().getFirst(): false;
};

Slot.prototype.applyEvent = function(event, noClone) {
	if( !event )
        event = this.getEvent();
	
	if( !event )
        return noClone ? this : this.slot();
	
	var slot = this.applyAction(event.getAction(), event.getBuildId(), noClone);
	
	slot.actions.list = slot.actions.getList().slice(1);
	
	if ( this.getLevel() == 0 && !this.isWonder() )
		slot.active = true;
	
	return slot;
};


//применяем текущее действие
Slot.prototype.applyEvents = function() {
	var events = this.getActions();
	
	var clone = this.clone();
	
	for (var event in events.getList()) {
		event = events.getElem(event);
		
		clone = clone.applyEvent(event);
	}
	
	clone.clearEvents();
	
	return clone;
};

Slot.prototype.clearEvents = function() {
	this.setActions(new EventList());
	
	return this;
};

Slot.prototype.hasNoEffect = function(opt) {
	opt = opt||{};
	
	return this.isEmpty() /*|| (!opt.ignoreActivity && !this.isActive())*/;
};

//эффект здания с текущим уровнем 
Slot.prototype.getEffect = function(opt) {
	opt = opt||{};
	
	if( this.hasNoEffect() )
		return 0;
	
	var effect = utils.oddFunc(this.build.effect, this.level);
	
	if( this.getType() == Build.type.fake )
		effect = this.calcTotalCost().calcSum(); 
	
	if( this.getType() == Build.type.embassy && !opt.noDiplomacy )
		effect *= utils.oddFunc(lib.mode.diplomacymultiplier, this.level);
	
	if( opt.pureEffect )
		return effect;
	
	// Добавочные эффекты рассы, карты и всякое такое
	switch( this.getType() ){
		case Build.type.defence:
			effect = utils.toInt(effect);
			
			opt.account = opt.account||wofh.account;
			
			if( opt.account.race )
				effect = opt.account.race.getTrapDamage(effect);
			
			break;
			
		case Build.type.production:
			if( !opt.noMapImp && this.isProduceScience() && this.town ){
				effect *= this.town.getMapSciProdEffect();
			}
			break;
	}
	
	return effect;
};

/* 27.08.2020
Slot.prototype.getEffectMapImp = function(effect){
	var effectMapImp = 0;
	
	if( !this.town )
		return effectMapImp;
	
	if( this.isProduceScience() ){
		effectMapImp = (effect||this.getEffect()) - this.getEffect({noMapImp: true});
	}
	
	return effectMapImp;
};
*/

//уровень здания с текущим эффектом 
Slot.prototype.getLevelByEffect = function(effect) {
	var slot = new Slot(this.id, 1);
	
	for( var level = 1; level < lib.build.maxlevel + 1; ){
		if( effect == utils.toInt(slot.getEffect({ignoreActivity: true})) )
			return level;
		
		slot.level = ++level;
	}
	
	return 0;
	
	//var level = utils.oddFuncReverse(this.build.effect, effect);
	//return Math.round(level);
};

//культура в административном здании
Slot.prototype.getAdminCultEffect = function(effect){
    if( this.hasNoEffect() )
		return 0;
    
	effect = effect === undefined ? this.getEffect() : effect;
	
	return lib.build.administrationculture[0] + lib.build.administrationculture[1] * effect;
};

//экономия в административном здании - в процентах
Slot.prototype.getAdminEconEffect = function() {
	return 1 - 1 / (1 + this.getEffect());
};

//экономия в административном здании - в деньгах
Slot.prototype.getAdminMoneyEffect = function(pay){
	var effect = (pay === undefined ? this.getTown(wofh.town).getSlots().calcPay() : pay) * this.getAdminEconEffect();
    
    return effect;
};

Slot.prototype.getAdminMoneyEffectUp = function(){
	var effect = 0;
    
	if( !this.canUp() )
        return effect;
    
    var state = this.getActive(),
        slotUp = this.getUp();
    
    this.setActive(false);
    
    if( state ){
        var pay = this.getTown(wofh.town).getSlots().calcPay(),
            payUp = pay;

        pay += this.getPay();

        payUp += slotUp.getPay();
    }
    
    effect = this.getUp().getAdminMoneyEffect(payUp) - this.getAdminMoneyEffect(pay);
    
    this.setActive(state);
	
	return effect;
};

Slot.prototype.getProdBoostEffect = function(slot){
    var effect = this.getEffect();
	
	var pop = slot ? slot.getMaxPop() : this.getTown(wofh.town).slots.getPromSlots().calcMaxPop({noPopMult:true});
	
    return utils.toInt(pop * effect);
};

Slot.prototype.getProdBoostEffectUp = function(slot){
	if( !this.canUp() ) return 0;
	
    var effect = this.getEffect(),
		effectUp = this.getUp().getEffect();
	
	var pop = slot ? slot.getMaxPop() : this.getTown(wofh.town).slots.getPromSlots().calcMaxPop({noPopMult:true});
	
    return utils.toInt(pop * (effectUp - effect));
};


//производство по константам
Slot.prototype.getProductres = function(){
	return this.build.getProductres();
};

Slot.prototype.getProductresByType = function(){
	return this.build.getProductresByType();
};

//производство с учётом специфики города
Slot.prototype.getProductresForTown = function(){
	var list = this.getProductres();
	var dep = this.getTown(wofh.town).deposit;
    
    var stock = this.getTown().getStock();
    
	for (var resId in list.getList()) {
		var res = list.getElem(resId);
        
		var resStock = stock.getElem(resId);
		
		if (dep.getRes().hasElem(res)){
			if (res.getId() == Resource.ids.jewels) {
				if (dep.getId() == Deposit.ids.pearls && this.id == 21) {//жемчуг в шахте
					list.setCount(res.getId(), 0);
				}
				if (dep.getId() != Deposit.ids.pearls && this.id == 24) {//алмазы-рубины в промысловом порту
					list.setCount(res.getId(), 0);
				}
			}
		}
		
		if (!resStock.incBase) {
			list.setCount(res.getId(), 0);
		}
		
	}
	list = list.onlyPositive();
	
	return list;
};



Slot.prototype.getWonderData = function(){
	return WonderEffect.getEffects(this.id);
};

Slot.prototype.getWonderRadius = function(){
	return this.build.wonderradius||1;//Для Космического корабля;
};

Slot.prototype.getTrapDamage = function(effect){
	return utils.toInt((effect === undefined ? (wofh.account.race ? this.getEffect() : 1) : effect) /** lib.mode.armydestroyk*/);
};


//науки требуемые для строительства
Slot.prototype.getSciences = function(){
	// Можно проинициализировать здания науками, которые для них требуются на этапе иницализации приложения (но пока лень)
	var listAll = ScienceList.getAll().getList(),
		list = (new ScienceList()).setSorted(true);
	
	for (var sci in listAll) {
		sci = listAll[sci];
		
		if( sci.getBuildLevel(this.getId()) )
			list.addElem(sci);
	}
	
	return list.getSortList('cost', true);
};

Slot.prototype.getRaces = function(){
	return this.build.getRaces();
};

Slot.prototype.hasRace = function(race){
	return this.getRaces().hasRace(race);
};

Slot.prototype.getUngrown = function(){
	if( this.isEmpty() )
		return 0;
	
    var ungrow = Math.max(0, utils.oddFunc(this.build.ungrown, this.level === undefined ? 1 : this.level));
    
    if( this.isActive() || this.isWonder() )
        return ungrow;
    
	return ungrow * Slot.C_UNGROW_MULT;
};

Slot.prototype.hasBuildUngrown = function(){
	var slot = new Slot(this.getId());
	for(var level = 1; level <= lib.build.maxlevel; level++){
		slot.setLevel(level);
		if( slot.getUngrown() > 0 )
			return true;
	}
	
	return false;
};

Slot.prototype.getPay = function(opt){
	opt = opt||{};
	
	var pay = utils.oddFunc(this.build.pay, this.level===undefined ? 1: this.level);
	
    if( !opt.withoutRace && wofh.account && wofh.account.race )
        pay *= wofh.account.race.getBuildPay();
	
	if( opt.useEconomy && this.getTown(wofh.town) )
		pay *= this.getEconomy();
	
	return Math.max(0, pay);
};

    Slot.prototype.getEconomy = function(){
        var mainSlot;
        
        if( this.prevSlot && this.getType() == Build.type.administration )
            mainSlot = this;
        
        return 1 - this.getTown(wofh.town).getEconomy(mainSlot);
    };

Slot.prototype.canPay = function(){
	return this.isActive() || (this.isWonder() && !this.isEmpty());
};

Slot.prototype.hasBuildPay = function(){
	var slot = new Slot(this.getId());
	for(var level = 1; level <= lib.build.maxlevel; level++){
		slot.setLevel(level);
		if( slot.getPay() > 0 )
			return true;
	}
	
	return false;
};

Slot.prototype.getMaxLevel = function(){
	return wofh.account.research ? wofh.account.research.build[this.id] || 0 : 0;
};

Slot.prototype.getMaxCount = function(){
    return this.build.maxcount;
};

Slot.prototype.isWonder = function(){
	return this.getSlotType() == Build.slotType.wonder || this.getId() == Slot.ids.spaceship;
};

Slot.prototype.isCosmodrome = function(){
	return this.getId() == Slot.ids.cosmodrome;
};

Slot.prototype.isSpaceship = function(){
	return this.getId() == Slot.ids.spaceship;
};

Slot.prototype.isHeConcentrator = function(){
	return this.getId() == Slot.ids.heConcentrator;
};

Slot.prototype.dispPrepare = function(){
	if (this.isFirstInBldQueue()) {
		var event = this.getEvent();
		if (event && event.getAction() == Slot.actionsIds.build && this.getLevel() == 0) {
			var clone = this.applyEvent();
			
			clone.setActions(this.getActions());
			clone.setLevel(0);
			return clone;
		}/*
		if (event && event.getAction() == Slot.actionsIds.rebuild) {
            
			var clone = this.applyEvent();
			clone.setActions(this.getActions());
			clone.setLevel(0);
            
			return clone;
        }*/
	}
	return this.clone();
};

Slot.prototype.dispPrepare2 = function(){
	if ( !this.getActions().isEmpty() ) {
		var event = this.getEvent();
		
		if (event && event.getAction() == Slot.actionsIds.build && this.getLevel() == 0) {
			var clone = this.applyEvent();
			
			clone.setActions(this.getActions());
			clone.setLevel(0);
			
			return clone;
		}
		if (event && event.getAction() == Slot.actionsIds.rebuild) {
			var clone = this.applyEvent();
			
			clone.setActions(this.getActions());
			clone.setLevel(0);
            
			return clone;
        }
		
	}
	
	return this.clone();
};

Slot.prototype.getImgBack = function(){
	return this.isWaterWonder()? 6: this.getSlotType();
}

Slot.prototype.getImgOffset = function(isCorrect, isNewTown) {
	return this.build.getImgOffset(isCorrect, isNewTown);
};

Slot.prototype.getCost = function(){
	var cost = new ResList();
	
	var costRaw = this.build.cost||new ResList();
	
	for (var res in costRaw[0]) {
		var count = utils.toInt(utils.oddFunc([costRaw[0][res], costRaw[1][res], costRaw[2][res], costRaw[3]], this.level));
		
		if (count > 0)
			cost.addRes(+res, count);
	}
	
	return cost;
};

//стоимость строительства текущего уровня постройки с нуля
Slot.prototype.calcTotalCost = function(){
	var cost = this.getCost(),
		clone = this.clone();
	
	for (var level = 1; level < this.getLevel(); level++) {
		clone.level = level;
		
		cost.addList(clone.getCost());
	}
    return cost;
};

Slot.prototype.getReturnedCost = function(){
	//суммируем затраты на все уровни готовой постройки
	var cost = this.calcTotalCost();
	
	//множим
	cost.mult(-lib.build.rebuildreturn);
	
	return cost;
};

//разница на перестройку
Slot.prototype.getRebuildDif = function(){
	// Ресы, которые вернутся при перестройке здания
	var cost = this.getReturnedCost();
	
	//вычитаем из стоимости новой постройки  
	cost.addList(this.getRebuild().getCost());
	
	return cost.round();
};

Slot.prototype.getRebuildCost = function(){
	return this.getRebuildDif().onlyPositive();
};

Slot.prototype.getRebuildIncom = function(){
    var cost = this.getRebuildDif();
    cost.setCount(Resource.ids.food, 0);
	return cost.mult(-1).onlyPositive();
}

Slot.prototype.getSwitchCost = function(){
	return this.getPay({useEconomy: true}) * lib.build.switchcost;
};

Slot.prototype.getTime = function() {
	return utils.oddFunc(this.build.buildtime, Math.max(0, this.getLevel())) * 3600;
};

Slot.prototype.getEventTime = function(event) {
	if (!event) event = this.getActions().getFirst();
	
	if (event.getAction() == Slot.actionsIds.destroy || event.getAction() == Slot.actionsIds.destroylevel) {
		if (this.isEmpty()) return 0;
		
		return this.getTime();
	} else {
		var slotNew = this.applyEvent(event);
		
		if (slotNew.isEmpty()) return 0;
		
		return slotNew.getTime();
	}
};

Slot.prototype.getRebuild = function() {
	var nextId = this.getNextBuildId();
	
	if( nextId == -1 ) return false;
	
	var clone = this.clone();
	clone.setId(nextId);
	clone.level = 1;
    
    if( !clone.isEnabled() ) return false;
	
	return clone;
};

Slot.prototype.canRebuild = function() {
	var slot = this.getRebuild();
	return slot && slot.getMaxLevel() > 0;
};


Slot.prototype.canDestroy = function() {
	var slot = this.getRebuild();
	return slot && slot.getMaxLevel() > 0;
};

//тренировки
Slot.prototype.getTrainUnits = function(checkResearch, checkTown, checkAcc) {
	var army = new Army();
	
	var unitsBuild = lib.builds[this.id].unitstrain;
	for (var unitId in unitsBuild) {
		unitId = unitsBuild[unitId];
		
		var unit = new Unit(unitId);
        //if (!unit.isEnabled()) continue;
		
		var town = this.getTown();
		
        if (town){
            if (checkResearch && !unit.isAvailAcc()) continue;
            if (checkTown && !town.canTrain(unit)) continue;
            if (checkAcc && !unit.hasRace()) continue;
        }
		
		army.addElem(unit);
	}
    
	return army;
};

Slot.prototype.canTrainUnits = function(checkResearch) {
    if(this.isEmpty()) return false;
	return !this.getTrainUnits(false, true, true).isEmpty();
};

Slot.prototype.calcUnitTrainTime = function(unit) {
	return Math.round(unit.getTrainTime() * this.calcTrainEffect(unit));
};


Slot.prototype.calcTrainEffect = function(unit) {
    var time = 1;
    
	var unitId = unit.getId();
	if (unitId != Unit.ids.settler && unitId != Unit.ids.worker){
		time /= this.getEffect({noDiplomacy: true});
	}
	if(unitId == Unit.ids.spy){
		time *= 10;
	}
    
	// эффекты ЧС
	if(!this.town.getSlots().wonderEffect) return time;
	
	var effect = this.town.getSlots().wonderEffect[WonderEffect.ids.train];
    
	if (!effect) return time;
	
	if ( effect.getBuild() && !effect.useBuild(this.getId()) ) return time;
        
	if ( effect.getFilter() !== undefined && !effect.getFilter()(unit) ) return time;
        
	if ( effect.getUnit() !== undefined && !effect.hasEffectUnit(unit.getId()) ) return time;
    
    if (effect.getUnits()) {
        var pass = false;
        for (var unit1 in effect.getUnits()){
            if (effect.getUnits()[unit1] == unit.getId()) {
                pass = true;
                break;
            }
        }
        if (!pass) {
            return time;
        }
    }
    
	time /= effect.getEffect(this.getId());
    
	return time;
};


Slot.prototype.calcUnitRetrainTime = function(unit) {
    var unitNext = unit.getNext()
    if (unitNext.hasAbility(Unit.ability.colonize) || unitNext.hasAbility(Unit.ability.getres)) {
        return unitNext.getTrainTime();
    } else {
        var time = unit.getTrainTime();
        var timeNext = unitNext.getTrainTime();

        return Math.max(Math.round((timeNext - time * lib.units.lastunitusing.time) * this.calcTrainEffect(unitNext)), 1);
    }
};

Slot.prototype.calcTrainTime = function(unit, count) {
	if (typeof(count)=='undefined') count = 1;
	return this.calcUnitTrainTime(unit) * count;
};

Slot.prototype.calcRetrainTime = function(unit, count) {
	if (typeof(count)=='undefined') count = 1;
	return this.calcUnitRetrainTime(unit) * count;
};


//проверка, оба ли слота занимают одно место
Slot.prototype.isSameSlot = function(slot){
	return this.getTown().id == slot.getTown().id && this.getPos() == slot.getPos();
};

//тип слота по постройке
Slot.prototype.getSlotTypeByBld = function() {
	return this.build.slot;
};

//тип слота по позиции (если позиции нет - по постройке)
Slot.prototype.getSlotType = function(){
	if( this.getTown() && this.getPos() != lib.build.nobuild ){
		var townTerrain = this.getTown().terrain||1;
		return (Town.type[townTerrain].slots[this.getPos()]||{}).type;
	} 
	else
		return this.getSlotTypeByBld();
};


Slot.prototype.getTerrain = function(){
	return this.build.terrain;
};

Slot.prototype.getAdminCultEffectUp = function() {
	return this.canUp()? this.getUp().getAdminCultEffect() - this.getAdminCultEffect(): 0;
}
Slot.prototype.getEffectUp = function() {
	return this.canUp() ? this.getUp().getEffect() - this.getEffect(): 0;
};
Slot.prototype.getEffectUpInt = function() {
	return this.canUp() ? utils.toInt(this.getUp().getEffect()) - utils.toInt(this.getEffect()) : 0;
};
Slot.prototype.getAdminEconEffectUp = function() {
	return this.canUp() ? this.getUp().getAdminEconEffect() - this.getAdminEconEffect(): 0;
};
Slot.prototype.getTrapDamageUp = function(){
	return this.canUp() ? this.getUp().getTrapDamage() - this.getTrapDamage(): 0;
}
Slot.prototype.getUngrownUp = function(){
	return this.canUp()? this.getUp().getUngrown() - this.getUngrown(): 0;
}
Slot.prototype.getPayUp = function(opt){
	opt = opt||{};
	
	return this.canUp() ? this.getUp().getPay(opt) - this.getPay(opt): 0;
};

Slot.prototype.getTakesProduction = function(resource) {
	return this.build.getTakesProduction(resource);
};

//дополнительные параметры для картинки в городе
Slot.prototype.getImgSubtype = function(){
	if( this.isEmpty() )
		return 1;
	
    //ферма
    if (this.getId() == 6 && this.getTown(wofh.town)) {
        var deposit = this.getTown(wofh.town).getDeposit();
        if (!deposit.isEmpty()) {
            var res = deposit.getRes();
            if (res.hasElem(Resource.ids.wheat)) return 1;
            if (res.hasElem(Resource.ids.mais)) return 2;
            if (res.hasElem(Resource.ids.rice)) return 3;
            if (res.hasElem(Resource.ids.fruit)) return 4;
        }
        return 0;
    }
    
    //строения на холмах
    if (this.getPos() == Slot.location.hill) return 2;
    
    //периметр
    if (this.getSlotType() == Build.slotType.perimetr) return 99;
    
    return 1;
};

Slot.prototype.getLevelPic = function(checkActions){
	if( this.isEmpty() )
		return '0';
	
    var level = this.getLevel(),
		suffix = '',
		levelsNew;
	
    if( checkActions && this.haveActions() ){
        suffix = 'b';
		
        if( this.getEvent().getAction() == Slot.actionsIds.build )
            level++;
    }
	
	levelsNew = this.build._getAddLib().levelsNew;
	
	if( levelsNew )
		return levelsNew[Math.max(0, Math.min(level, lib.build.maxlevel)-1)]+suffix;
	
	return '';
};

Slot.prototype.getPic = function() {
	return '1';
};

Slot.prototype.getMaxPop = function(){
	return this.getEffect();
};


Slot.prototype.getMaxPopForTown = function(){
    if( this.isProduceScience() ){
        return this.getMaxPop();
    } else {
        return this.getMaxPop() * this.getTown(wofh.town).calcWorkPopMult();
    }
};

Slot.prototype.getMaxPopForTownEffectUp = function() {
	return this.canUp() ? this.getUp().getMaxPopForTown() - this.getMaxPopForTown() : 0;
};

Slot.prototype.isProduceScience = function(){
    return this.getProductres().hasElem(Resource.ids.science);
};

Slot.prototype.fillPop = function(){
	this.pop = this.getProductres().mult(this.getMaxPopForTown());;
	
	return this;
};

Slot.prototype.isFirstInBldQueue = function(){
	//if (!this.haveActions()) return false;
	if (!wofh || !wofh.events) return false;
	var events = wofh.events.getBldQueue(false, this.getTown());
	if (!events.getLength()) return false;
	var event = events.getFirst();
	return this.isSameSlot(event.getBuildSlot());
};

Slot.prototype.getEfficiency = function(){
	return this.build.getEfficiency();
};

Slot.prototype.getProductionRes = function(res){
    if( this.isEmpty() || !this.isActive() ) return 0;
    
    var prod = 0;
                
    switch (this.getType()){
        case Build.type.production: 
            //расчёт производственных строений
            var prod = this.getEfficiency() * this.getPop().getCount(res.getId());
            if (prod) {
                var town = this.getTown();

                var resStock = town.getStock().getElem(res.getId());
				
                prod *= wofh.account.race.getResK(res);
				
                prod *= town.getWorkEfficiency();
                prod *= (1 - town.getCorruption());
                prod *= resStock.incBase;

                prod *= town.getResClimateBonus(res);
                prod *= town.getResScienceBonus(res);
                
                prod *= town.getResLuckBonus(res);
                
				prod *= town.getResSpecBonus(res);
				
				prod *= town.getResMapBonus(res);
            }
            break;
    }
    
	
	return prod;
};

Slot.prototype.getProductionResStatic = function(res){
    if( this.isEmpty() || !this.isActive() ) return 0;
    
    var prod = 0;
                
    switch (this.getType()){
        case Build.type.wonder:
			var effect = WonderEffect.getEffect(this.getId(), WonderEffect.ids.res);
			
			if( effect && effect.getRes() == res.getId() ){
				prod = effect.getEffect();
			}
			
			break;
    }
    
    //пристани для колосса
    var effect = this.getTown().getSlots().wonderEffect[WonderEffect.ids.resForBuild];
	
    if( effect && effect.getBuild() == this.getId() && effect.getRes() == res.getId() )
        prod = effect.getEffect() * this.getLevel();
	
	return prod;
};

Slot.prototype.getProductionList = function(townFix){
	var prod = new ResList(false, true);
	
	var productRes = townFix && this.getTown(wofh.town) ? this.getProductresForTown() : this.getProductres(); 
	
	for (var res in productRes.getList()) {
		prod.setRes(res, this.getProductionRes(productRes.getRes(res)));
	}
	
	return prod;
};

Slot.prototype.isWaterWonder = function(){
	return this.getId() == Slot.ids.colossus || this.getId() == Slot.ids.earthDam || this.getId() == Slot.ids.heConcentrator;
};

Slot.prototype.canBuildOnTerrain = function(town){
	if( this.isWonder() && this.getTerrain() != Build.terrain.any ){
		var townTerrain = (town||this.getTown(wofh.town)).getType();
		
		switch( this.getTerrain() ){
			case Build.terrain.hill:
				if (townTerrain.hill <= 1) return false;
				break;
			case Build.terrain.flatWater:
				if (townTerrain.hill > 1) return false;
				if (townTerrain.water < 2) return false;//не река!
				break;
			case Build.terrain.flatNoWater:
				if (townTerrain.hill > 1) return false;
				if (townTerrain.water > 0) return false;
				break;
			case Build.terrain.flatAny:
				if (townTerrain.hill > 1) return false;
				break;
			case Build.terrain.river:
				if (townTerrain.water != 1) return false;
				break;
			case Build.terrain.anyWater:
				if (townTerrain.water == 0) return false;
				break;
		}
	}
	
	return true;
};

Slot.prototype.getAvailBuilds = function(townBuilds){
	var town = this.getTown();
	
	townBuilds = (townBuilds||town.getAvailBuilds()).getList();
    
	var slotBuilds = new BuildList();
	
	for(var build in townBuilds){
		build = townBuilds[build];
		
		if( build.getSlotTypeByBld() != this.getSlotType() ) 
			continue;
        
		if( build.isWonder() && build.getTerrain() != Build.terrain.any ){
			var townTerrain = this.getTown(town).getType();
            
			switch( build.getTerrain() ){
				case Build.terrain.hill:
					if (townTerrain.hill <= 1) continue;
					break;
				case Build.terrain.flatWater:
					if (townTerrain.hill > 1) continue;
					if (townTerrain.water < 2) continue;//не река!
					break;
				case Build.terrain.flatNoWater:
					if (townTerrain.hill > 1) continue;
					if (townTerrain.water > 0) continue;
					break;
				case Build.terrain.flatAny:
					if (townTerrain.hill > 1) continue;
					break;
				case Build.terrain.river:
					if (townTerrain.water != 1) continue;
					break;
				case Build.terrain.anyWater:
					if (townTerrain.water == 0) continue;
					break;
			}
		}
		
		if( build.isHidden() ) continue;
		
		slotBuilds.addElem(build);
	}
	
	return slotBuilds;
};

Slot.prototype.calcFutureBuilds = function(){
	var builds = wofh.account.getFutureBuilds();
	
	//фильтруем его
	builds = wofh.account.getAvailBuilds(builds);
	builds = this.getTown().getAvailBuilds(builds, true);
	builds = this.getAvailBuilds(builds);

	return builds;
};

Slot.prototype.getAvailBuildsInPos = function(){
	var builds = this.getAvailBuilds();
	
	builds.joinList(this.calcFutureBuilds()); // Постройки, доступные при изучении пары наук
	
	return builds;
};

// onlyProdSci - оставляет у здания только те науки, которы открывают возможность производить ресурс
Slot.prototype.isProdSciStudied = function(onlyProdSci){
	var sciList = this.getSciences().getList(),
		prodSciList = [];
	
	for(var sci in sciList){
		sci = sciList[sci];
		
		if( sci.hasAbility(Science.ability.fish) || sci.hasAbility(Science.ability.cloth) ){
			if( !sci.isKnown() && this.getProductres().getLength() )
				prodSciList.push(sci);
		}
	}
	
	if( prodSciList.length ){
		if( onlyProdSci ){
			// Удаляем остольные науки, т.к. без изучения той, что дает производство, здание не выводится
			// Т.е. оставляем только ту науку, которая дает производство реса
			this.needScience = new ScienceList();
			
			for(var sci in prodSciList){
				this.needScience.addElem(prodSciList[sci]);
			}
		}
		
		return false;
	}
	
	return true;
};

Slot.prototype.isConflictWith = function(slot){
	return this.build.group != 0 && this.getId() != slot.getId() && this.build.group == slot.build.group;
};

/**
 * Позиционирование
 */

Slot.prototype._getAddLib = function(){
    return Build.lib[this.getId()];
};

Slot.prototype.getDisp = function(useDNewWnd){
    if (this.getSlotType() == Build.slotType.perimetr) return {x: -170, y: 0};
    
	var disp = [0, 0],
		addLib = this._getAddLib();
    
	// addLib может отсутствовать в случае пустого слота
	if( addLib ){
		disp = useDNewWnd && addLib.dNewWnd ? addLib.dNewWnd : addLib.dNew;
		
		if( disp[0] instanceof Object )
			disp = disp[this.getImgSubtype()];
	}
    
	return {x: disp[0], y: disp[1]};
};

Slot.prototype.getDispArr = function(blinked){
	var addLib = this._getAddLib();
	
	return blinked && addLib.dNewBlink ? addLib.dNewBlink : addLib.dNew;
};

Slot.prototype.getLevelDisp = function(){
	var addLib = this._getAddLib();
	return {x: addLib.tdNew[0], y: addLib.tdNew[1]};
};

Slot.prototype.getLevelRelDisp = function(useDNewWnd){
    var disp = this.getDisp(useDNewWnd);
    var levelDisp = this.getLevelDisp();
	return {x: levelDisp.x - disp.x, y: levelDisp.y - disp.y};
};


//отображаем ли слот
Slot.prototype.canShow = function(){
    if( this.isNeedPay() && !wofh.account.knowsMoney() ) 
		return false;
    
	if( !this.isEmpty() || this.haveAction(EventCommon.type.buildI) || !this.getAvailBuilds().isEmpty() ){
		if( !Quest.isDone(Quest.ids.bldHouse1) )
			return this.pos == 11;
		else if( !Quest.isDone(Quest.ids.bldHouse3) )
			return utils.inArray([9, 10, 11], this.pos);
		
		return true;
	}
	
    if( this.isEmpty() && Quest.isUnavail(Quest.ids.bldAltair1) ){
        if( this.getAvailBuilds().isEmpty() && !this.haveAction(EventCommon.type.buildI) )
            return false;
    }
	
    switch( this.getSlotType() ){
        case Build.slotType.normal:
            return Quest.isAvail(Quest.ids.bldHouse1);
        case Build.slotType.mountain: 
        case Build.slotType.water: 
			return Quest.isAvail(Quest.ids.sciSelect);
        case Build.slotType.main: 
            return Quest.isAvail(Quest.ids.bldAltair1);
        case Build.slotType.perimetr: 
            return Quest.isAvail(Quest.ids.bldMoat1) || !this.getAvailBuilds().isEmpty() || this.getLevel();
        case Build.slotType.wonder: 
            return !this.getAvailBuilds().isEmpty();
    }
    
	return true;
};

Slot.prototype.isEmptySlotHighlighted = function(){
    if(this.isNeedPay()){
        return servBuffer.temp.seenSlotBuy==0;
    }
    
    switch (this.getSlotType()){
        case Build.slotType.main: 
            return !Quest.isDone(Quest.ids.bldAltair2);
        case Build.slotType.water: 
            if (ScienceList.getAll().filter(function(science){
                    return science.isKnown()
                }) < 10) return true;//изучнных наук < 10
            if (this.town.getSlots().filter(function(slot){
                    return slot.getSlotType() == Build.slotType.water && !slot.isEmpty()
                }).isEmpty()) return true; //нет застроенных водных слотов 
            return false;
        case Build.slotType.normal:
            return !Quest.isDone(Quest.ids.bldCollector1);
        case Build.slotType.mountain: 
            return !Quest.isDone(Quest.ids.bldPetroglyph1);
        case Build.slotType.perimetr: 
            return !Quest.isDone(Quest.ids.bldMoat1);
        case Build.slotType.wonder: 
            return this.getAvailBuilds().getLength() <= 2;
    }
};

Slot.prototype.getOracleTime = function(){
	var limit = timeMgr.getDayOfWeek() + (lib.main.timeOffset/timeMgr.DtS);
	
	if( limit > timeMgr.workDays && limit < timeMgr.weekDays ){
		var ongoing = true;
		
		limit = (timeMgr.weekDays - limit) * timeMgr.DtS;
	}
	else
		limit = (timeMgr.workDays - limit) * timeMgr.DtS; 
	
	limit += timeMgr.getNow();
	
	return {limit: limit, ongoing: ongoing};
};

//альтернативные постройки (для разных рас)
Slot.prototype.getAlternatePack = function() {
    for (var pack in Build.alternates) {
        pack = Build.alternates[pack];
        for (var bldId in pack) {
            bldId = pack[bldId];
            if (bldId == this.getId()) return pack;
        }
    }
    return false;
}

//альтернативные постройки (для разных рас)
Slot.prototype.getAlternate = function() {
    if( this.hasRace(wofh.account.race) ) 
		return this;
    
    var pack = this.getAlternatePack();
    if (!pack) return this;
    
    for (var bldId in pack) {
        var bld = new Slot(pack[bldId], this.getLevel());
		
        if( bld.hasRace(wofh.account.race) ) 
			return bld;
    }
    return false;
};
 
//возвращает вкладку для строения. Для ЧС используются параметры, для обычной постройки параметры не нужны
Slot.prototype.getTab = function(forSlotBld, type, effect) {
	if (typeof(type) == 'undefined') {
		type = this.getType();
	}

	switch(type) {
		case Build.type.wonder:
			return Slot.tabIds.wonder;
		case Build.type.fake:
		case Build.type.hide:
		case Build.type.embassy:
		case Build.type.administration:
		case Build.type.corruption:
		case Build.type.ecology:
			return Slot.tabIds.other;
		case Build.type.store:
		case Build.type.trade:
		case Build.type.watertradespeed:
		case Build.type.tradespeed:
			return Slot.tabIds.store;
		case Build.type.production:
            if (this.getType() == Build.type.wonder) {
                if( effect.getRes() == Resource.ids.science )
					return Slot.tabIds.science;
            } else {
                if( this.getProductres().hasElem(Resource.ids.science) )
					return Slot.tabIds.science;
            }
			return Slot.tabIds.production;
		case Build.type.prodBoost:
			return Slot.tabIds.production;
		case Build.type.train:
		case Build.type.waterarmyspeed:
		case Build.type.airarmyspeed:
			return Slot.tabIds.war;
		case Build.type.grown:
			return Slot.tabIds.grown;
		case Build.type.culture:
			return Slot.tabIds.culture;
		case Build.type.defence:
			return Slot.tabIds.defence;
		case Build.type.airdef:
			return forSlotBld? Slot.tabIds.war: Slot.tabIds.defence;
	}
};

//возвращает ВСЕ вкладки в которых можно увидеть слот (для ЧС и обычных)
Slot.prototype.getTabs = function() {
    if (this.getType() == Build.type.wonder) {
        var list = [];
        var wonderEffects = WonderEffect.getEffects(this.getId());
        for (var effect in wonderEffects) {
            list.push(this.getTab(true, WonderEffect.group[effect], wonderEffects[effect]));
        }
    } else {
        var list = [this.getTab(true)];
    }
    
    return list
}

Slot.prototype.isHidden = function(){
	return this.build.isHidden();
};

