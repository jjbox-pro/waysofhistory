function Town (data) {
	if( data )
		this.parse(data);
}

utils.extend(Town, BaseItem);


Town.spaceshipErr = {
	ok: 0,
	level: 1,
	units: 2
};

Town.defaultName = 'Новый город';

Town.unknown = '-';

Town.maxCorruption = 0.9;

//стоимость основания n-го города
Town.init = function(){
	Town.initType();
};

Town.getNewTownCost = function(count){
	count = count||utils.sizeOf(wofh.towns);
	
	return utils.toInt(utils.oddFunc(lib.town.colonistsneed, count));
};

Town.hasDefMoment = function(defmoment, time){
	if( defmoment instanceof Object )
		defmoment = defmoment.defmoment;
	
	defmoment = defmoment||0;
	time = time||timeMgr.getNow();
	
	return defmoment > time;
};
//инициализируем массив типов города
Town.initType = function(){
	Town.type = [];

	// Код для блока с городами в окне аккаунта
	for(var i in lib.town.slot.intown){
		var type = {slots: []};
		Town.type[i] = type;

		var terrain = lib.town.slot.intown[i];
		var hill = 0;
		var water = 0;
		var ground = 0;
		for(var j in terrain){
			var slot = terrain[j];
			if(slot[0]==3){
				++water;
			} else if (slot[0]==2){
				++hill;
			} else if (slot[0]===0){
				++ground;
			}
			type.slots[j] = {
				type: slot[0],//тип слота из Build.slotType
				needPay: slot[1] == 0,//нужно ли оплачивать перед использованием
			};
		}
		if (i == 10) {
			hill = 16;
			ground = 0;
		}
		type.hill = hill;
		type.water = water;
		type.ground = ground;
		type.hasBank = water >= 2 && ground !== 0;
	}

	//количество слотов
	Town.slotsCount = lib.town.slot.intown[0].length;
};

Town.genLimitName = function(){
	var limit = lib.town.namelimit[1];
	
	while( true ){
		var name = Town.genName();
		
		if( name.length <= limit )
			break;
	}

	return name;
};

Town.genName = function(){
	var lists = [],
		name = '';
	
	if( utils.random(2) )
		lists.push('Великий , Древний , Старый '.split(', '));
	
	lists.push('Нов, Свет, Добро'.split(', '));
	lists.push('град, бург, город'.split(', '));
	
	for(var list in lists){
		list = lists[list];
		
		name += list[utils.random(list.length)];
	}

	return name;
};


Town.prototype.clone = function(transfer){
	var clone = new Town();
    
	clone.account = this.account;
    
	if( this.slots ){
		clone.slots = this.slots.clone(clone);
		clone.stock = this.stock.clone(clone);
		clone.deposit = this.deposit.clone();   
	}

	if( this.pop )
		clone.pop = utils.clone(this.pop);

    if( this.pos )
		clone.pos = utils.clone(this.pos);

	if( this.bonus ){
		clone.bonus = {};
		clone.bonus.aura = this.bonus.aura;
		clone.bonus.real = utils.clone(this.bonus.real);   
	}

	if( this.specialists )
		clone.specialists = this.specialists.clone();

	utils.copyProperties(clone, this, {noObjects: true});
    
    for(var field in transfer)
        clone[field] = this[field];
    
	return clone;
};

Town.prototype.cloneBase = function(){
	var clone = new Town();

	clone.id = this.id;
	clone.name = this.name;
	clone.account = this.account.cloneBase();
    
    
    
	return clone;
};

Town.prototype.parseArr = function(arr){
	var obj = {};

	obj.id = +arr[0];
	obj.name = arr[1];
	obj.account = arr[2];

	return obj; 
};

Town.prototype.checkUnknown = function(){
	if( this.name == Town.unknown ){
		this.name = 'Неизвестный город';
		this.unknown = true;
	}
};

Town.prototype.updLinks = function(){
	this.account = wofh.world.getAccount(Element.getId(this.account));
};

Town.prototype.checkLvl2 = function(){
	return this.hasOwnProperty('buildings') || this.hasOwnProperty('slots');
};

Town.prototype.checkLvl3 = function(){
	return this.pop;
};

Town.prototype.unpack = function() {
	this.unpackAccount();

	this.unpackBonus();

	this.updPopInc();

	this.unpackTerrain();

	this.unpackArmy();

	this.unpackBudget();

	this.unpackTaxes();

	this.unpackDist();

	if( this.checkLvl2() )
		this.unpackSlots();

	this.unpackWonder();

	this.unpackDeposit();

	if( this.checkLvl2() ){
		this.unpackStock();

		this.unpackBattle();
	}

	this.unpackZones();

	this.unpackPos();

	this.unpackSpecialists();
};

Town.prototype.unpackBattle = function() {
	if (!this.battle) {

		//битвы
		this.battle = {};

		this.updBattle(false);
	}
};

Town.prototype.unpackBonus = function(){
	//бонусы
	if( this.resources && typeof(this.resources.has) != 'undefined' ){//хз, на что проверять
		this.setBonus();

		this.prepareRealBonus();

		this.unpackAura();
	}
};

Town.prototype.unpackAura = function(resetAura) {
	if ( !this.bonus ) return;

	if( resetAura ){
		var tmpVegas = this.bonus.aura.vegas;
		
		delete this.bonus.aura;
	}

	if( this.bonus.aura instanceof TownAura ) return;

	this.bonus.aura = {};
	
	if( resetAura )
		this.bonus.aura.vegas = tmpVegas;
	else
		this.bonus.aura.vegas = this.resources.lasvegas;

	this.bonus.aura = new TownAura(this.bonus.aura, this);
};

Town.prototype.unpackAccount = function() {
	if( this.account ){
		if( this.account instanceof Account || !wofh.world ) 
			return;
		
		var account = wofh.world.getAccount(this.account);
		
		if( account )
			this.account = account;
	}
};

Town.prototype.unpackTerrain = function() {
	if( this.type != undefined ){
		//местность
		this.terrain = this.type;
		
		delete this.type;   
	}
};

Town.prototype.unpackArmy = function(updArmy) {
	if( updArmy ){
		if( !(this.army instanceof TownArmy) )
			this.army = new TownArmy(updArmy);

		if( updArmy.intown !== undefined )
			this.army.intown = new Army(updArmy.intown);
		if( updArmy.own !== undefined )
			this.army.own = new Army(updArmy.own);
		if( updArmy.freearmy !== undefined )
			this.army.free = new Army(updArmy.freearmy);
		if( updArmy.sum !== undefined )
			this.army.sum = new Army(updArmy.sum);
		if( updArmy.training !== undefined )
			this.army.training = new Army(updArmy.training);
	}

	if( this.army instanceof TownArmy )	return;

	this.army = new TownArmy(this.army);

	this.army.intown = new Army(this.army.intown);
	this.army.own = new Army(this.army.own);
	this.army.free = new Army(this.army.freearmy);
	this.army.sum = new Army(this.army.sum);
	this.army.training = new Army(this.army.training);

	delete this.army.freearmy;
};

Town.prototype.unpackBudget = function(){
	this.budget = this.budget||{};

	this.budgetSum = 0;

	for(var budget in this.budget){
		budget = this.budget[budget];

		if( !(budget instanceof Object) ){
			this.budgetSum += +budget;

			continue;
		}

		for(var subBudget in budget)
			this.budgetSum += budget[subBudget];
	}
};

Town.prototype.unpackTaxes = function(){
	this.taxes = this.taxes||{};
	this.taxes.pop = this.taxes.pop||0;
	this.taxes.prod = this.taxes.prod||0;
	this.taxes.stream = this.taxes.stream||Trade.taxes.stream.def;
	this.taxes.streamSum = utils.calcObjSum(this.taxes.stream);
	this.taxes.deposit = this.taxes.deposit||0;
	this.taxes.sum = this.taxes.pop + this.taxes.prod + this.taxes.streamSum + this.taxes.deposit;
};

Town.prototype.unpackDist = function() {
	if( !this.distance || this.distance instanceof Path )
		return;
    
    var dist = this.distance[0],
        path = [this.distance[1], this.distance[3], this.distance[2]];
    
    this.distance = new Path({air: dist}).parse(path);
};

Town.prototype.unpackSlots = function() {
	if( this.slots instanceof SlotList ) 
		return;
	
	this.work = this.work||{};
	
	if( this.buildings === undefined ) return;
	
	this.slots = new SlotList(this.buildings||{}, this.work.work, this);
	
	this.setWonderEffectTimer();
};

Town.prototype.unpackWonder = function() {
	if (this.wonder instanceof Slot) return;

	if (this.wonder) {
		this.wonder = new Slot(this.wonder.id, Math.min(this.wonder.level, lib.build.maxlevel), lib.build.nobuild, this.wonder.level > lib.build.maxlevel);
	}
};

Town.prototype.unpackDeposit = function() {
	if( this.deposit instanceof Deposit )
		return;

	//местород
	if( this.resources )
		this.deposit = new Deposit(this.resources.deposit);
	else if( this.deposit )
		this.deposit = new Deposit(this.deposit);
};

Town.prototype.unpackStock = function() {
	if( this.stock instanceof Stock )
		return;
	
	if( this.resources && typeof(this.resources.has) != 'undefined' ){        
		//ресурсы (alter требует постройки, чудо света? mult - коррупцию)
		this.resources.foodpriority = this.foodpriority;
		this.resources.usemap = this.usemap;
		this.resources.autoInc = this.work.auto||[];
		this.stock = new Stock(this.resources, this);

		delete this.resources;
		delete this.foodpriority;
		
		if( this.work )
			delete this.work.auto;
	}
};

Town.prototype.unpackPos = function() {
	if (this.pos) return;
	if (this.coordinates) {
		this.pos = utils.splitPosArr(this.coordinates);
		delete this.coordinates;
	}
};

Town.prototype.unpackZones = function(){
	if( this.zones instanceof Zones ) return;

	var zones = {
		all: this.zones,
		water: []
	};

	for (var zone in this.zones) {
		zone = this.zones[zone];
		if (zone < lib.map.waterzonesfrom){
			zones.land = zone;
		} else {
			zones.water.push(zone);
		}
	}

	this.zones = new Zones(zones);
},

Town.prototype.unpackSpecialists = function(){
	if( this.specialists === undefined || this.specialists instanceof SpecialistList )
		return;

	this.specialists = new SpecialistList(this.specialists, false);
};

Town.prototype.getSpecialists = function(){
	return this.specialists||new SpecialistList(false, false);
};

Town.prototype.setWonderEffectTimer = function(){
	// Таймер обнавления страницы (данных) для получения актуальных данных работы Оракула при переходе между буднями и выходными
	if( this.slots.wonderEffect[WonderEffect.ids.oracle] ){
		clearTimeout(wofh.account.oracleTimeOut);

		var timeout = this.slots.getWonder().getOracleTime().limit - timeMgr.getNow();

		if( timeout > 0 ){
			wofh.account.oracleTimeOut = setTimeout(function(){
				appl.reload();
			}, (timeout + 60) * 1000);
		}
	}
};

Town.prototype.setBonus = function(){
	this.bonus = {real: this.bonus||{}};
};

Town.prototype.prepareRealBonus = function(){
	if( !this.bonus )
		this.setBonus();
	
	for (var bonusId in LuckBonus.town) {
		bonusId = LuckBonus.town[bonusId];
		
		if( !this.bonus.real[bonusId] )
			this.bonus.real[bonusId] = {level: 0, time: 0};
	}
};

//сколько времени потребуется, чтобы население достигло предела культуры
Town.prototype.calcPopFillTime = function() {
	var inc = this.getPopInc();

	if ( !inc ) return 0;

	if( inc > 0 ){
		return (this.getCult() - this.getPopHas()) / (inc * timeMgr.invHtS);
	}
	else{
		return Math.abs((this.getPopHas() - lib.town.population.min) / (inc * timeMgr.invHtS));
	}
};



Town.prototype.calcClickerResCount = function(clickerId){
	return Math.max(1, this.getPop().has * lib.town.production.clickerres[clickerId-1][cnst.clickerres.val]);
},

Town.prototype.getClickers = function(posCount){
	if(wofh.account.quests[lib.quest.ability.clickers] == '-') return [];

	var data = {};

	invwk.setSeed(this.id);
	var usedClickers = [];

	for (var i in this.clickers.have) {
		var id = this.clickers.have[i];

		do { 
			var pos = utils.toInt(invwk.rand() * posCount);
		} while (usedClickers[pos])
		usedClickers[pos] = true;


		if (!id) continue;
		var libData = lib.town.production.clickerres[id-1];
		var res = new Resource(libData[cnst.clickerres.res], this.calcClickerResCount(id));


		data[i] = {pos: pos, i: +i, id: id, res: res};
	}

	return data;
};

Town.prototype.getPopIncReal = function() {
    if( !this.pop ) 
		return 0;
    
    return this.pop.incReal||0;
};

Town.prototype.updPopInc = function() {
	if( !this.pop ) 
		return;
	
	this.pop.was = this.pop.has;
    
	this.pop.upd = timeMgr.getNow();
	
	this.pop.incReal = this.calcPopIncReal();
};

Town.prototype.calcPopIncReal = function() {
    var incReal = 0;
    
	if( this.pop.has < this.pop.culture )
		incReal = this.pop.inc;		
	else if( this.pop.has > this.pop.culture )
		incReal = this.calcPopIncRealDrop();
    
    return incReal * timeMgr.DtH;
};

Town.prototype.calcPopIncRealDrop = function() {
	return -Math.max(
				Math.abs(this.pop.inc), 
				Math.max((this.pop.has - this.pop.culture) * lib.town.population.ungrownspeed, lib.town.population.ungrownspeedlimit) * timeMgr.invDtH
			);
};


Town.prototype.getName = function () {
	return this.name;
};

Town.prototype.getGarrisonWithEvents = function() {

	var garrison = this.army.intown.clone();

	if (wofh.gameEvent.has(GameEvent.ids.newYear2Stage)) {
		garrison.addCount(111, 1);
		garrison.addCount(112, 1);
		garrison.addCount(113, 6);
	}
	else if (wofh.gameEvent.has(GameEvent.ids.newYear3Stage)) {
		garrison.addCount(113, 1);
	}

	return garrison;
};
/*
Town.prototype.updStockHas = function(townRaw) {
	//ресурсы (alter требует постройки, чудо света? mult - коррупцию)
	townRaw.resources.foodpriority = townRaw.foodpriority;
	townRaw.resources.usemap = townRaw.usemap;
	townRaw.resources.autoInc = townRaw.bars.auto||[];
	town.stock = new Stock(townRaw.resources, this);
}*/


Town.prototype.updBattle = function(event) {
	if (event) {
		this.battle.state = event.getState();
		this.battle.secret = event.getSecret();
		this.battle.session = event.getSession();
	}
    else
		this.battle.state = EventCommon.battleState.delete;
};

Town.prototype.hasBattle = function() {
	return this.battle.state != EventCommon.battleState.delete;
};

Town.prototype.getAura = function(){
	return this.bonus.aura;
};

Town.prototype.getSlots = function(){
	return this.slots||new SlotList();
};

Town.prototype.getSlot = function(slot, def){
	return this.getSlots().getElem(slot, def);
};

Town.prototype.getStock = function(){
	return this.stock;
};

// Заменяем текущий склад на склад, который будет после событий постройки (используется для отображения информации, которая будет после событий)
Town.prototype.attachStockWill = function(){
    this.stockOrigin = this.stock;
    
    this.stock = (this.stockWill||this.stock);
    
	return this;
};

// Восстанавливаем оригинальный склад обратно
Town.prototype.detachStockWill = function(){
    this.stock = this.stockOrigin;
    
    delete this.stockOrigin;
    
	return this;
};



Town.prototype.getRes = function(res){
	return this.getStock().getElem(res);
};

Town.prototype.getEconomy = function(mainSlot){
	return this.getSlots().getEconomy(mainSlot);
};


//максимум работников можно устроить в городу
Town.prototype.calcMaxWorkPop = function(realProduce){
	return Math.min(this.getPopHas(), this.getSlots().calcMaxPop({realProduce:realProduce}));
};

Town.prototype.calcWorkPopMult = function() {
	var workPop = 1;

	var boostSlot = this.getSlots().getSlotsByAbility(Build.type.prodBoost).getFirst();

	if ( boostSlot && boostSlot.isActive() ) {
		workPop *= (1+boostSlot.getEffect());
	}

	return workPop;
};

Town.prototype.canTrain = function (unit) {
	if (unit.hasAbility(Unit.ability.high_water) && !this.getType().hasBank) return false;//глубоковдные в речном городе

	return true;
};

Town.prototype.calcMaxUnitCanTrain = function(unit){
	//население
	var maxPop = (this.pop.has - lib.town.population.min) / unit.getPopCost();

	//ресурсы
	var maxRes = this.getStock().getHasList().calcIncludeCount(unit.getCost());

	return utils.toInt(Math.min(maxPop, maxRes));
};

Town.prototype.calcMaxUnitCanRetrain = function(unit){
	//население
	var maxPop = (this.pop.has - lib.town.population.min) / unit.getRebuildPopCost();

	//ресурсы
	var rebuildCost = unit.getRebuildCost();
	var maxRes = rebuildCost.isEmpty()? maxPop : this.getStock().getHasList().calcIncludeCount(unit.getRebuildCost());

	var max = Math.min(maxPop, maxRes);

	return utils.toInt(Math.min(max, this.army.own.getCount(unit)));
};


Town.prototype.calcStrength = function() {
    var slots = this.getSlots().getList(),
        sum = 0;
    
    for(var slot in slots){
        slot = slots[slot];
        
        sum += slot.calcTotalCost().calcSum();
    }
    
    return sum;
};

//распределение населения - список ресурсов, количество - нас
Town.prototype.calcPopOnRes = function() {
	var resList = new ResList();

	var slots = this.getSlots().getProdSlots();

	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);

		var slotPop = slot.getPop();

		for (var resId in slotPop.getList()) {
			var count = slotPop.getCount(resId);

			resList.addRes(+resId, count);
		}
	}

	return resList;
};

//число рабочих фактически занятых производством
Town.prototype.calcBusyWorkers = function() {
	var resList = this.calcPopOnRes();

	return resList.calcSum();
};

Town.prototype.getWorkEfficiency = function (workers) {
	if( workers === undefined )
		workers = this.calcBusyWorkers();

	return workers? Math.pow(workers, lib.town.production.potential[3]) / workers: 1;
};


Town.prototype.getCorruption = function () {
	return Math.min(this.getNormalCorruption() + this.getPunishCorruption(), Town.maxCorruption);
};

Town.prototype.getPersonalAura = function (id) {
	return this.bonus.aura.data.personal ? (this.bonus.aura.data.personal[id] || 0) : 0;
};

Town.prototype.getNormalCorruption = function () {
	var corruption = wofh.account.calcCorruption(),
		court = this.getSlots().getCourt();

	if( court && court.isActive() )
		corruption /= court.getEffect();

	return Math.min(corruption, Town.maxCorruption);
};

//TODO: перенести в аккаунт
Town.prototype.getPunishCorruption = function () {
	return this.getRealBonus(LuckBonus.ids.punish) - 1;
};


Town.prototype.getClimate = function () {
	return this.climate;
};

Town.prototype.climateBonusScience = function () {
	return lib.town.production.climatebonus.knowledge[this.getClimate()];
};

Town.prototype.climateBonusMoney = function () {
	return lib.town.production.climatebonus.money[this.getClimate()];
};

Town.prototype.climateBonusAgriculture = function () {
	return lib.town.production.climatebonus.food[this.getClimate()];
};

Town.prototype.climateBonusProduction = function () {
	return lib.town.production.climatebonus.production[this.getClimate()];
};

//бонус ресурсу от климата
Town.prototype.getResClimateBonus = function (res) {
	if( res.isScience() )
		return this.climateBonusScience();
	else if( res.isMoney() )
		return this.climateBonusMoney();
	else if( res.isAgro() )
		return this.climateBonusAgriculture();
	else if( res.isProd() )
		return this.climateBonusProduction();
};


//бонус ресурсу от наук
Town.prototype.getResScienceBonus = function (res) {
	if( res.isScience() )
		return 1;		
	else if( res.isMoney() )
		return this.getResearchIncome();

	return this.getResearchProduction();
};

//бонус ресурсу от ВГ
Town.prototype.getResSpecBonus = function(res) {
	if( res.isScience() ) {
		var spec = this.getSpecialists().getElem(Specialist.ids.science, false);
		if( spec ) 
			return spec.getEffect();
	}
	if( res.isMoney() ) {
		var spec = this.getSpecialists().getElem(Specialist.ids.money, false);
		if( spec ) 
			return spec.getEffect();
	}
	if( res.isAgro() ) {
		var spec = this.getSpecialists().getElem(Specialist.ids.food, false);
		if( spec ) 
			return spec.getEffect();
	}
	if( res.isProd() ) {
		var spec = this.getSpecialists().getElem(Specialist.ids.production, false);
		if( spec ) 
			return spec.getEffect();
	}

	return 1;
};

Town.prototype.getResearch = function () {
	return wofh.account.research.town;
};

Town.prototype.getResearchIncome = function () {
	return this.getResearch().income * Science.getBonusMult(Science.bonus.income) + 1;
};

Town.prototype.getResearchProduction = function () {
	return this.getResearch().production * Science.getBonusMult(Science.bonus.production) + 1;
};

Town.prototype.getResearchGrown = function () {
	return this.getResearch().grown * Science.getBonusMult(Science.bonus.grown);
};

Town.prototype.getResearchCulture = function () {
	return this.getResearch().culture * Science.getBonusMult(Science.bonus.culture);
};


Town.prototype.getRealBonusLevel = function(bonusId){
	return this.bonus.real[bonusId].level;
};

Town.prototype.getLuckBonus = function(bonusId){
	return new LuckBonus(bonusId, this);
};


//возвращает список бонусов
Town.prototype.getLuckBonusesArr = function(now){
	var list = [];
	
	if( !this.bonus )
		return list;
	
	now = now||timeMgr.getNow();
	
	for(var bonus in this.bonus.real){
		bonus = this.getLuckBonus(+bonus);
		
		if( bonus.getTime() > now )
			list.push(bonus);
	}
	
	return list;
};

//следующий момент, когда бонус окончится
Town.prototype.getNextLuckBonusOver = function(now){
	now = now||timeMgr.getNow();
	
	var selected = false,
		bonusesArr = this.getLuckBonusesArr(now);
	
	for (var bonus in bonusesArr){
		bonus = bonusesArr[bonus];
		
		if( (selected == false || bonus.time < selected.time) && !bonus.isMomental() )
			selected = bonus;
	}
	
	return selected;
};

Town.prototype.getRealBonus = function (bonusId) {
	if ( this.hasBonus(bonusId) ) {
		var bonus = this.getLuckBonus(bonusId);
		return 1 + bonus.getEffect();
	} else {
		return 1;
	}
};

Town.prototype.hasBonus = function (bonusId) {
	return this.bonus && this.bonus.real[bonusId];
};

//бонус от удачи для ресурса
Town.prototype.getResLuckBonus = function (res) {
	if (res.isScience()) {
		var bonusId = LuckBonus.ids.science;
	}
	if (res.isStockable() || res.isMoney()) {
		var bonusId = LuckBonus.ids.production;
	}

	return this.getRealBonus(bonusId);
}


//бонус ресурсу от улучшений на карте
Town.prototype.getResMapBonus = function (res, getInc) {
	if (res.isAgro()) var effect = MapImp.effectType.food;
	else if (res.isProd()) var effect = MapImp.effectType.production;
	else if (res.isScience()) var effect = MapImp.effectType.science;
	else if (res.isMoney()) var effect = MapImp.effectType.money;

	if( getInc )
		return this.getMapBonus(effect, getInc);

	var bonus = 1;

	if (res.getId() == Resource.ids.fish || (res.getId() == Resource.ids.jewels && this.deposit.getId() == Deposit.ids.pearls)) {
		bonus += this.getMapBonus(MapImp.effectType.waterProd);
	}

	return bonus + this.getMapBonus(effect);
};

Town.prototype.getMapBonus = function (effect, getInc) {
	var mapBonus = 0;

	for (var imp in lib.map.environment) {
		var imp = new MapImp(imp);

		if ( imp.getEffectType() == effect ) {
			if( 
				(!getInc && imp.isEffectGetTypePercent()) ||
				(getInc && !imp.isEffectGetTypePercent()) 
			){
				mapBonus += (this.stock.mapbonus[imp.getId()]||0) * imp.getLuckBonusEffect(this);
			}
		}
	}

	return mapBonus;
};

Town.prototype.getMapSciProdEffect = function(){
	var mapEffect = 1;

	if( this.stock ){
		for(var mapImp in MapImp.effectProd[MapImp.effectType.science]){
			if( this.stock.mapbonus[mapImp] ){
				mapImp = new MapImp(mapImp);

				mapEffect += mapImp.calcEffectProd(this.stock.mapbonus[mapImp.getId()]);
			}
		}
	}

	return mapEffect;
};

Town.prototype.getDeposit = function () {
	return this.deposit;
}

Town.prototype.getWonder = function() {
	return this.wonder||this.getSlots().getWonder();
};

Town.prototype.hasDeposit = function () {
	return !this.deposit.isEmpty();
}

Town.prototype.hasCosmodrome = function () {
	return this.getWonder().isCosmodrome();
};

/* Торговля*/

Town.prototype.calcTraders = function() {
	var traders = 0;

	traders += wofh.account.calcTradersScienceBonus();

	//от строений - культурные
	var slots = this.getSlots().getSlotsByAbility(Build.type.trade);
	for (var slot in slots.getList()) {
		slot = slots.getElem(slot);
		traders += utils.toInt(slot.getEffect());
	}

	return traders;
};

Town.prototype.updateTraders = function () {
	this.traders.count = this.calcTraders();
};

/* Население и культура*/

Town.prototype.getPop = function () {
	return this.pop;
};

Town.prototype.getCult = function () {
	return this.pop.culture;
};

Town.prototype.getPopInc = function () {
	return this.pop.inc;
};

Town.prototype.getPopHas = function () {
	return this.pop.has;
};

Town.prototype.getPopHasNow = function(now) {
    now = now||timeMgr.getNow();
    
	return this.pop.was + (this.pop.incReal * timeMgr.invDtS) * (now - this.pop.upd);
};

Town.prototype.calcPopOverflowTime = function(){
	return (this.pop.culture - this.getPopHasNow()) / this.pop.incReal * timeMgr.DtS;
};

Town.prototype.calcPopFlow = function(timeS){
	return timeS * timeMgr.invDtS * this.pop.incReal;
};

Town.prototype.getGrownInc = function (base) {
	return this.pop.incnc * (base||1);
};

Town.prototype.getPopIncReal = function () {
	return this.pop.incReal;
};

Town.prototype.updCult = function () {
	this.pop.culture = this.calcCult();
};
// calcCult - тоже самое, что и town.pop.culture
Town.prototype.calcCult = function() {
	return utils.toInt(this.calcCultStatic() * this.calcCultMult());
};

Town.prototype.calcCultStatic = function() {
	var cult = 0;
    
	//базовая
	cult += lib.town.population.defaultculture;
	//от наук
	cult += wofh.account.calcCultScienceBonus();
	//от аур
	cult += this.getAura().getCult();
	//от строений - чудеса
	var slot = this.getSlots().getWonder();
    
	if( slot.isActive() ){
		var wonderEffect = WonderEffect.getEffect(slot.getId(), WonderEffect.ids.cult);
        
		if( wonderEffect )
			cult += wonderEffect.getEffect();
	}
	//от строений - культурные
	this.getSlots().getSlotsByAbility(Build.type.culture).each(function(slot){
        if( slot.isActive() )
            cult += slot.getEffect();
    });
    
	//от строений - административные
	this.getSlots().getSlotsByAbility(Build.type.administration).each(function(slot){
        if( slot.isActive() )
            cult += slot.getAdminCultEffect();
    });
    
	return utils.toInt(cult); // Для корректных вычислений убираем остаток т.к. с сервера приходит значение без остатка
};

Town.prototype.calcCultMult = function() {
	var cult = 1;
    
    //потребляемые ресурсы
	cult *= this.getStock().calcCultEffect(); // Не домнажая на потребление получим - town.pop.culturenc
	//раса
	cult *= wofh.account.race.getCultK();
    // ВГ
	cult *= this.getSpecialists().getElem(Specialist.ids.culture).getEffect();
    //улучшение местности
	cult *= 1 + this.getMapBonus(MapImp.effectType.culture);
	//удача
	cult *= this.getRealBonus(LuckBonus.ids.culture);
    
	return cult;
};


Town.prototype.updGrown = function () {
	this.pop.inc = this.calcGrown() * timeMgr.invDtH;
};
// calcGrown - тоже самое, что и town.pop.inc
Town.prototype.calcGrown = function() {
	return this.calcGrownStatic() * this.calcGrownMult() - this.calcUngrown(); // Не домнажая на потребление и не вычитая calcUngrown получим - town.pop.incnc;
};

Town.prototype.calcGrownStatic = function() {
	var grown = 0;
    
	//базовая
	grown += lib.town.population.defaultgrown;
	//от наук
	grown += this.getResearchGrown();
	//от строений - рост
	var slot,
        slots = this.getSlots().getSlotsByAbility(Build.type.grown).getList();
    
	for (slot in slots) {
		slot = slots[slot];
        
        if( slot.isActive() )
            grown += slot.getEffect();
	}
    
    grown *= timeMgr.DtH;
    
    // От аур (в день) 
	grown += this.getAura().getGrown();
	// От ЧС (в день)
	slot = this.getSlots().getWonder();
    
	if( slot.isActive() ) {
		var wonderEffect = WonderEffect.getEffect(slot.getId(), WonderEffect.ids.grown);
        
		if( wonderEffect )
			grown += wonderEffect.getEffect();
	}
    
	return grown;
};

Town.prototype.calcGrownMult = function(){
	var grown = 1;

	//раса
	grown *= wofh.account.race.getGrownK();
	//потребляемые ресурсы
	grown *= this.getStock().calcGrownEffect(); // Не домнажая на потребление и не вычитая calcUngrown получим - town.pop.incnc;
	//удача
	grown *= this.getRealBonus(LuckBonus.ids.grown);
	//улучшение местности
	grown *= 1 + this.getMapBonus(MapImp.effectType.grow);
	//месторождение
	grown *= this.deposit.isEmpty() ? 1 : lib.town.population.depositgrown;
	// ВГ
	grown *= this.getSpecialists().getElem(Specialist.ids.grown).getEffect();

	return grown;
};

Town.prototype.calcUngrown = function() {
	return this.calcUngrownFromSlots() + this.calcUngrownFromMapImp();
};
    
    Town.prototype.calcUngrownFromSlots = function(iterator) {
        var ungrown = 0,
            ungrownSum = 0,
            slots = this.getSlots().getList();

        for (var slot in slots) {
            slot = slots[slot];
            
            ungrown = slot.getUngrown();
            
            if( !(ungrown > 0) )
                continue;
            
            ungrownSum += ungrown;
            
            if( iterator )
                iterator(slot, ungrown * timeMgr.DtH);
        }
        
        return ungrownSum * timeMgr.DtH;
    };
    
    Town.prototype.calcUngrownFromMapImp = function(iterator) {
        if( !this.usesmap )
            return 0;
        
        var ungrown = 0,
            ungrownSum = 0,
            mapbonus = this.getStock().mapbonus,
            mapImp;

        for(var impId in mapbonus){
            if( mapbonus[impId] ){
                mapImp = new MapImp(impId);
                
                ungrown = mapImp.calcEffectUngrown(mapbonus[impId]);
                
                if( !(ungrown > 0) )
                    continue;
                
                ungrownSum += ungrown;
                
                if( iterator )
                    iterator(mapImp, ungrown);
            }
        }
        
        return ungrown;
    };
    

Town.prototype.getBuildCount = function (BuildId) {

	if( BuildId === undefined )
		return false;

	var count = 0;

	var slotList = this.slots.getList();
	for(var slot in slotList){
		slot = slotList[slot].applyEvents();
		if( slot.getId() == BuildId ) count++;
	}

	return count;

}


//список построек, которые можно построить в городе
Town.prototype.getAvailBuilds = function (accBuilds, isSciPrognoze) {
	accBuilds = (accBuilds||wofh.account.getAvailBuilds()).getList();

	var townBuilds = new BuildList();
	var slotsApply = this.slots.clone().applyEvents();
	// Список ресов, которые можно производить без необходимости колонизировать местородов.
	// К списку также добавляются ресурсы месторода, если оно колонизировано, и рыбы если есть территориальная возмжность её добычи
	if( isSciPrognoze ){
		var townProdResList = new ResList(lib.town.production.resincbase.default);

		if ( !this.deposit.isEmpty() ) {
			townProdResList.addList(this.deposit.getRes());
		}

		var terrain = this.getType();

		if ( terrain.hasBank )
			townProdResList.addCount(Resource.ids.fish, lib.town.production.resincbase.fish.water);
		else if ( terrain.water )
			townProdResList.addCount(Resource.ids.fish, lib.town.production.resincbase.fish.river);

		townProdResList = townProdResList.getList();
	};

	for (var build in accBuilds){
		build = accBuilds[build];
		build.town = this;

		// Не пускаем производственные строения, которые ничего не смогут произвести
		if( build.getType() == Build.type.production && build.getProductresForTown().getLength() == 0 ){
			if( isSciPrognoze ){
				// Если производственные здания выводятся в списке будущих построек.
				// Проверяем могут ли они производить рес без месторода.
				// Если могут, или если у города присутствует нужный для производства местород, добавляем их в список
				var buildProdResList = build.getProductres().getList(),
					canProdRes = false;
				for( var buildProdRes in buildProdResList ){
					if( townProdResList[buildProdRes] ){
						canProdRes = true;
						break;
					}
				}

				if( !canProdRes ) continue;
			}
			else
				continue;
		}

		//проверка на максимум построек такого типа
		if( build.getMaxCount() == slotsApply.getSlotsById(build.getId()).getLength() )
			continue;
		
		townBuilds.addElem(build);
	}
	
	return townBuilds;
};

Town.prototype.getAssembleSpaceshipErr = function () {
	if (!this.getSlot(Build.slotGroup.wonder).isActive()) return Town.spaceshipErr.level;

	for (var row in lib.spaceship.components){
		row = lib.spaceship.components[row];
		if (this.army.intown.getCount(row.id) < row.count) return Town.spaceshipErr.units
	}

	return Town.spaceshipErr.ok;
};


Town.prototype.getWarBonus = function(){
	var bonus = 1;

	var effect = (this.getSlots().wonderEffect||{})[WonderEffect.ids.warbonus];

	if (effect)
		bonus += effect.getEffect();

	bonus += wofh.account.race.getAttack();

	bonus += (this.getSpecialists().getElem(Specialist.ids.war).getEffect() - 1);

	bonus *= this.getRealBonus(LuckBonus.ids.war);

	return bonus;
};

Town.prototype.calcBaseTraders = function(){
	//от наук
	var traders = wofh.account.research.town.traders||0;

	//от построек
	var slots = this.slots.getSlotsByAbility(Build.type.trade);
	for (var slot in slots.getList()){
		slot = slots.getElem(slot);
		traders += utils.toInt(slot.getEffect());
	}

	//от чудес
	var effect = this.slots.wonderEffect[WonderEffect.ids.traders];
	if (effect) {
		traders += effect.getEffect();
	}

	return traders;
};

Town.prototype.getFreeTraders = function(){
	if( this.traders )
		return this.traders.count - this.traders.busy;

	return 0;
};

Town.prototype.getFreeTradersCapacity = function(){
	return this.getFreeTraders() * lib.trade.capacity;
};

Town.prototype.calcCapacity = function(){
	//база
	var capacity = lib.town.production.defaultstorage;

	//науки
	capacity += wofh.account.science.calcTotalBonus(Science.bonus.store);

	//склады
	var stocks = this.slots.getSlotsByAbility(Build.type.store);
	for (var slot in stocks.getList()){
		slot = stocks.getElem(slot);
		if (slot.isActive()) {
			capacity += slot.getEffect();   
		}
	}

	return capacity;
};

Town.prototype.canBuySlots = function(){
	if(Account.hasAbility(Science.ability.money)){
		var canBuy = 0;
		for(var slot in this.getSlots().getList()){
			if( this.getSlot(slot).needPay ){
				canBuy++;
			}
		}
		return lib.town.slot.cost[lib.town.slot.cost.length - canBuy - 1] <= wofh.account.money.sum;
	}

	return false;
};

//самый добываемый ресурс в городе
Town.prototype.calcFeatureRes = function(list, noSciMult){
	if( list === undefined )
		list = this.getStock().getIncList();

	if( !noSciMult ){
		var sci = list.getElem(Resource.ids.science);
		sci.count *= 4;//у науки коэффициент выше
	}

	return list.getMaxElem();
};

Town.prototype.getType = function(){
	return Town.type[this.terrain];
};

Town.prototype.hasWaterPathOnly = function(){
	if( this.distance instanceof Path )
		return this.distance.hasWaterOnly();
};

Town.prototype.hasWaterPath = function(){
	if( this.distance instanceof Path )
		return this.distance.water || this.distance.deepwater;

	return false;
};

Town.prototype.hasLowWaterPath = function(){
	if( this.distance instanceof Path )
		return this.distance.water;

	return false;
};

Town.prototype.hasDeepWaterPath = function(){
	if( this.distance instanceof Path )
		return this.distance.deepwater;

	return false;
};

Town.prototype.hasRiver = function(){
	return this.getType().water == 1;
};

Town.prototype.hasCoast = function(){
	return this.getType().water > 1;
};

Town.prototype.getLevel = function(level) {
    if( level !== undefined )
        return level;
    
	var townlevels = lib.map.townlevels;

	for(var i = 0; i < townlevels.length; i++){
		if( this.pop.hasall <= utils.toInt(townlevels[i])){
			level = i;
            
			break;
		}
	}

	if( level === undefined )
		level = townlevels.length - 1;

	return level;
};

Town.prototype.isOnFuel = function() {
	if( this.traders )
		return this.traders.fuell || this.traders.fuelw;

	return false;
};

Town.prototype.isCoorCenter = function() {
	return  this.pos && this.pos.o == this.id;
};

Town.prototype.isUndf = function(){
	return this.id == 0;
};


// Класс для упращения работы с wofh.towns
Towns = function(){
	
};

Towns.getArray = function(){
	return utils.objToArr(wofh.towns, function(a,b){return a.id - b.id;});
};

// Класс для зон города
Zones = function(params){
	utils.copy(this, params);
};