function Unit(id, count) {
	this.id = this.parseId(id);
	this.count = count||0;
	
	if( this.id >= 0 ){
		// Если условие выполняется то юнит является шаблонным 
		if( 
				this.id >= Unit.ids.tmplStart && this.id <= Unit.ids.tmplEnd || 
				this.id & Unit.ids.tmplPriorOffset ||
				this.id & Unit.ids.tmplFirstNegOffset ||
				this.id & Unit.ids.tmplSecondNegOffset
		){
			return new UnitTmpl(this.id, this.count);
		}
		else if ( this.id == Unit.ids.fort )
			return new UnitFort(this.id, count);
		else if ( this.id == Unit.ids.any )
			return new UnitAny(this.id, count);
		else
			this.data = lib.units.list[this.id]||{};
	}
	else if( this.id < 0 )
		this.data = {};
}

utils.extend(Unit, Element);

/**
 * базовые методы
 */

Unit.prototype.parseId = function(id) {
	var unitId = +id;
	
	if( isNaN(unitId) ){
		if( id == Unit.tagCodes.fort )
			unitId = Unit.ids.fort;
		else if( id == Unit.tagCodes.any )
			unitId = Unit.ids.any;
		else
			unitId = Unit.getIdFromCode(id);
	}
	
	return unitId;
};

Unit.prototype.stringify = function() {
	return this.id;
};

Unit.prototype.getId = function(){
	return this.id;
};

Unit.prototype.getImgId = function(){
	return this._getAddLib().imgId||this.getId();
};

Unit.prototype.toArmy = function() {
    var army = new Army();
    
    army.addElem(this);
    
	return army;
};

Unit.prototype.isEmpty = function(){
    return this.getId() == Unit.no || this.getId() == -1;
};

Unit.prototype.isKK = function(){
    return this.hasTag(Unit.tags.spaceship);
};

Unit.prototype.getCode = function(){
    return this.data.code ? this.data.code : Unit.getCode(this.getId());
};

/**
 * библиотечные методы
 */

Unit.prototype.getDamage = function(){
	return this.data.damage;
};

Unit.prototype.getAirDamage = function() {
	return this.data.airdamage||0;
};

Unit.prototype.getWaterDamage = function() {
	return this.data.shipdamage||0;
};

Unit.prototype.getHealth = function() {
	return this.data.health||0;
};

Unit.prototype.isEnabled = function() {
	return this.getHealth() && this.getEra() < Unit.erasLength;
};

Unit.prototype.getSpeed = function() {
	return this.data.speed;
};

Unit.prototype.calcMoveTime = function(dist) {
	return (dist||0)/this.getSpeed();
};

Unit.prototype.getType = function() {
	return this.data.type;
};

Unit.prototype.getBuildDamage = function() {
	return this.data.builddamage;
};

Unit.prototype.getDamage = function() {
	return this.data.damage;
};

Unit.prototype.getCapacity = function() {
	return this.data.capacity;
};

Unit.prototype.getRacebin = function() {
	return this.data.racebin;
};

Unit.prototype.getGroup = function() {
	return this.data.group;
};

Unit.prototype.getPopCost = function() {
	return this.data.popcost;
};

Unit.prototype.getBattleCost = function() {
	return this.data.battlecost;
};

Unit.prototype.getPay = function() {
	var resList = new ResList();
	
	var payArr = this.data.pay;
	for (var i in payArr){
		resList.addCount(payArr[i][0], payArr[i][1]);
	}
	
	return resList;
};

Unit.prototype.getCost = function() {
	var resList = new ResList(this.data.cost);
	return resList.onlyPositive();
};

Unit.prototype.getTrainTime = function() {
	return this.data.traintime;
};


//удалить или сделать внутренним!
Unit.prototype.getAbility = function() {
	return this.data.ability;
};

Unit.prototype.getAbilitiesArr = function() {
	return utils.dec2arr(this.getAbility())
};

Unit.prototype.getTags = function() {
	return this.data.tags;
};

Unit.prototype.getNextId = function() {
	return this.data.next;
};

Unit.prototype.getGroundDamage = function() {
	return this.data.grounddamage;
};

Unit.prototype.getNext = function() {
	return new Unit(this.getNextId());
};

Unit.prototype.isPeaceful = function() {
	return this.hasAbility(Unit.ability.no_attack);
};

Unit.prototype.isNoFight = function() {
	return this.hasAbility(Unit.ability.noFight);
};

Unit.prototype.isTransport = function() {
	return this.hasAbility(Unit.ability.transport);
};

Unit.prototype.isLand = function(excludePeaceful) {
	return !(this.hasTag(Unit.tags.aircraft) || this.hasTag(Unit.tags.ship) || (excludePeaceful && this.isPeaceful()));
};

Unit.prototype.isFleet = function() {
	return this.hasTag(Unit.tags.ship);
};

Unit.prototype.isAir = function() {
	return this.hasTag(Unit.tags.aircraft);
};

Unit.prototype.isFort = function() {
	return false;
};

Unit.prototype.isAny = function() {
	return false;
};

Unit.prototype.isSpy = function() {
	return this.getId() == Unit.ids.spy;
};

/**
 * динамические методы
 */

Unit.prototype.getRebuildCost = function() {
    var next = this.getNext();
    /*var nextCost = new ResList();
    if( !next.isEmpty() )
        nextCost = next.getCost();*/
    var nextCost = next.getCost();
    
    if (next.hasAbility(Unit.ability.colonize) || next.hasAbility(Unit.ability.getres)) {
        return nextCost;
    } else {
        var cost = this.getCost().mult(lib.units.lastunitusing.cost).toInt();
        return nextCost.diffList(cost).onlyPositive();
    }
};

Unit.prototype.getRebuildPopCost = function() {
	var cost = this.getPopCost() * lib.units.lastunitusing.pop;
    return Math.max(this.getNext().getPopCost() - cost, 0);
};

Unit.prototype.hasAbility = function(ability) {
	return (this.getAbility() & ability) > 0;
};

Unit.prototype.hasTag = function(tag) {
	return (this.getTags() & tag) > 0;
};

Unit.prototype.getEvasion = function() {
	return 1 - Math.min(lib.war.evasion / this.getSpeed(), 1);
};

Unit.prototype.hasRace = function(raceId) {
	if (typeof(raceId)=='undefined') raceId = wofh.account.race.id;
	return this.isRaceBinCorrect(1 << raceId);
}

Unit.prototype.isRaceUnique = function(){
    return this.getRaces().getList().length <= 2;
}

Unit.prototype.isRaceBinCorrect = function(raceBin) {
	return (this.getRacebin() & raceBin) > 0;
};

Unit.prototype.getRaces = function() {
	//TODO : сделать инициализацию классов - автоматом добавлять обертку для кэширования данных
	if (this.races) return this.races;
	
	var racebin = this.getRacebin();
	this.races = new Races(racebin);
	
	return this.races;
};

Unit.prototype.hasAbilities = function(){
    return this.data.ability != 0;
}

Unit.prototype.getSciences = function() {
    var unitSciences = new ScienceList();
	var allSciences = ScienceList.getAll();
    for (var science in allSciences.getList()){
        science = allSciences.getElem(science);
        if (science.getUnits().hasElem(this)) {
            unitSciences.addElem(science);
        }
    }
    return unitSciences;
};

//сколько может увезти человек ТОЛЬКО ДЛЯ КОРАБЛЕЙ!
Unit.prototype.calcCariage = function() {
	return this.getPopCost() * lib.war.transportpopcount;
};

Unit.prototype.getCountryPayment = function(name, country) {
	country = country||wofh.country;
	
	if( !country ) return 0;
	
	switch(name){
		case Unit.countryPayments.train.name:
			return this.getCountryTrainPayment(country);
	}
	
	return 0;
};

Unit.prototype.getCountryTrainPayment = function(country) {
	country = country||wofh.country;
	
	if( !country ) return 0;
	
	var countryTrainPaymants = (country.taxes.budget.army||{}).train||{};
	
	return countryTrainPaymants[this.getId()]||0;
};


/**
 * доп данные
 */

Unit.prototype.getAnimaton = function() {
    return this._getAddLib().animation;
};

Unit.prototype.getAnimatonK = function() {
    return this._getAddLib().animationk;
};

Unit.prototype.getHoliday = function() {
    return this._getAddLib().holiday;
};

Unit.prototype.getDesc = function() {
    return this._getAddLib().desc;
};

Unit.prototype.getName = function() {
    return this._getAddLib().name;
};

Unit.prototype.getEra = function() {
    return this._getAddLib().era;
};

Unit.prototype.getTactic = function() {
    return this._getAddLib().tactic;
};

Unit.prototype.getTagsCodes = function() {
    if( this.isTemplate() ){
		return this.getCode();
	}
	else{
		return Unit.getTagsCodes(this.getTags());
	}
};

// Методы шаблонного юнита
Unit.prototype.isTemplate = function() {
    return false;
};

Unit.prototype.changeTmplPriority = function() {
	this.id ^= Unit.ids.tmplPriorOffset;
};

Unit.prototype.setTmplPriority = function() {
	if( !this.isTemplate() ) return;
	
	this.id |= Unit.ids.tmplPriorOffset;
};

Unit.prototype.getTmplPriority = function() {
	if( !this.isTemplate() ) return;
	
	return this.getId() & Unit.ids.tmplPriorOffset ? Unit.tmplPriority.or : Unit.tmplPriority.and;
};

Unit.prototype.isTmplEqualPriority = function() {
	if( !this.isTemplate() ) return;
	
	return this.getTmplPriority() == Unit.tmplPriority.and;
};

Unit.prototype.getTmplFirstTag = function() {
	
	if( this.isTemplate() && this.data.firstTag === undefined ){
		var code = this.getCode();
		this.data.firstTag = Unit.getTagByCode(code[0]);
	}
	
	return this.data.firstTag;
};

Unit.prototype.getTmplSecondTag = function() {
	if( this.isTemplate() && this.data.secondTag === undefined ){
		var code = this.getCode();
		this.data.secondTag = code[0] != code[1] ? Unit.getTagByCode(code[1]) : undefined;
	}
	
	return this.data.secondTag;
};

Unit.prototype.isTmplFirstTagNeg = function() {
	return this.id & Unit.ids.tmplFirstNegOffset ? true : false;
};

Unit.prototype.isTmplSecondTagNeg = function() {
	return this.id & Unit.ids.tmplSecondNegOffset ? true : false;
};

Unit.prototype.changeTmplFirstTagNeg = function() {
	if( !this.isTemplate() ) return;
	
	this.id ^= Unit.ids.tmplFirstNegOffset;
	
	if( !this.getTmplSecondTag() )
		this.changeTmplSecondTagNeg();
};

Unit.prototype.changeTmplSecondTagNeg = function() {
	if( !this.isTemplate() ) return;
	
	this.id ^= Unit.ids.tmplSecondNegOffset;
};

Unit.prototype.setTmplFirstTagNeg = function() {
	if( !this.isTemplate() ) return;
	
	this.id |= Unit.ids.tmplFirstNegOffset;
	
	if( !this.getTmplSecondTag() )
		this.setTmplSecondTagNeg();
};

Unit.prototype.setTmplSecondTagNeg = function() {
	if( !this.isTemplate() ) return;
	
	this.id |= Unit.ids.tmplSecondNegOffset;
};

Unit.prototype.swapTmplTags = function(ignoreNeg) {
	if( this.getTmplSecondTag() ){
		var code = this.getCode();
		var count = 1;
		
		if( this.isTmplSecondTagNeg() )
			count += ignoreNeg ? Unit.ids.tmplSecondNegLimit : Unit.ids.tmplFirstNegLimit;
		if( this.isTmplFirstTagNeg() )
			count += ignoreNeg ? Unit.ids.tmplFirstNegLimit : Unit.ids.tmplSecondNegLimit;

		if( this.getTmplPriority() )
			count += Unit.ids.tmplPriorLimit;
		
		var tmpUnit = new Unit(code[1] + code[0], count);
		
		this.id = tmpUnit.getId();
		this.data = tmpUnit.data;
	}
};


//альтернативные постройки (для разных рас)
Unit.prototype.getAlternatePack = function() {
    for (var pack in Unit.alternates) {
        pack = Unit.alternates[pack];
        for (var item in pack) {
            item = pack[item];
            if (item == this.getId()) return pack;
        }
    }
    return false;
}

//альтернативные постройки (для разных рас)
Unit.prototype.getAlternate = function() {
    if (this.getRaces().hasRace(wofh.account.race)) return this;
    
    var pack = this.getAlternatePack();
    if (!pack) return this;
    
    for (var item in pack) {
        var unit = new Unit(pack[item]);
        if (unit.getRaces().hasRace(wofh.account.race)) return unit;
    }
    return false;
};

//список постройки, которые юнита могут тренировать
Unit.prototype.getTrainingSlots = function(){
	var slotsAll = BuildList.getAll();
	var slots = new CountList()
	
	for (var slot in slotsAll.getList()){
		slot = slotsAll.getElem(slot)
        if (slot.isEnabled() && slot.getTrainUnits().hasElem(this)) {
            slots.addElem(slot);
        }
    }
    
    return slots;
}

//доступность для аккаунта
Unit.prototype.isAvailAcc = function(){
    return Unit.isAvailAcc(this.id);
};

Unit.prototype.isArmyTypeOf = function(type){
	if( type == Army.types.mix )
		return true;
	else if( type & Army.types.water )
		return this.isFleet();
	else if( type & Army.types.air )
		return this.isAir();
	else if( type & Army.types.land )
		return this.isLand();
	
	return false;
};

/**
 * статические методы
 */

// получение названия юнита
Unit.getName = function(id) {
	return lib.units.list[id].name;
};

Unit.getTypeName = function(type) {
	switch (type) {
		case Unit.type.no: return 'Нет';
		case Unit.type.trooper: return 'Пехота';
		case Unit.type.horseman: return 'Конница';
		case Unit.type.tech: return 'Техника';
		case Unit.type.boat: return 'Корабль';
		case Unit.type.air: return 'Авиация';
		case Unit.type.space: return 'Компонент КК';
	}
	return '';
};

Unit.getGroupNameW = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Атака';
		case Unit.group.reserve: return 'Резерв';
		case Unit.group.distance: return 'Подводная атака';
	}
	return '';
};

Unit.getGroupName = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Атака';
		case Unit.group.reserve: return 'Резерв';
		case Unit.group.distance: return 'Стрелки';
		case Unit.group.torear: return 'Обход';
		case Unit.group.flank: return 'Фланг';
	}
	return '';
};

Unit.getAbilityCount = function() {
	return utils.sizeOf(Unit.ability) - 1;
};

Unit.getAbilityName = function(ability) {
	switch (ability) {
		case 0: return 'Нет';
		case 1: return 'Мастер нападения';
		case 2: return 'Мастер обороны';
		case 3: return 'Основатель';
		case 4: return 'Строитель';
		case 5: return 'Разрушитель';
		case 6: return 'Робкий';
		case 7: return 'Головорез';
		case 9: return 'Массовый урон';
		case 10: return 'Команда грабежа (воины)';
		case 11: return 'Разведка';
		case 12: return 'Транспорт';
		case 13: return 'Глубинные бомбы';
		case 14: return 'Команда грабежа (ополченцы)';
		case 15: return 'Профессионал';
		case 16: return 'Преодоление стен';
		case 17: return 'Мелководный';
		case 18: return 'Глубоководный';
		case 19: return 'Малый радиус обороны';
		case 20: return 'Средний радиус обороны';
		case 21: return 'Большой радиус обороны';
		case 22: return 'Миротворец';
		case 23: return 'Ядерная атака';
		case 24: return 'Разносторонний';
	}
	return '';
};



Unit.getCode = function(id){
	id = id & Unit.ids.tmplPriorOffset ? id ^ Unit.ids.tmplPriorOffset : id;
	id = id & Unit.ids.tmplFirstNegOffset ? id ^ Unit.ids.tmplFirstNegOffset : id;
	id = id & Unit.ids.tmplSecondNegOffset ? id ^ Unit.ids.tmplSecondNegOffset : id;
	
	return utils.intToChar(id, 2);
};

Unit.getIdFromCode = function(code){
	return utils.charToInt(code);
};

Unit.getTagName = function(tag, neg) {
	var name = '';
	
	switch (tag) {
		case Unit.tags.no: name = 'Нет'; break;
		case Unit.tags.organic: name = 'Живой'; break;
		case Unit.tags.shooter: name = 'Стрелок'; break;
		case Unit.tags.technics: name = 'Техника'; break;
		case Unit.tags.big: name = 'Гигант'; break;
		case Unit.tags.mounted: name = 'Кавалерия'; break;
		case Unit.tags.shielded: name = 'Щитоносец'; break;
		case Unit.tags.siege: name = 'Осадная техника'; break;
		case Unit.tags.armored: name = 'Бронированный'; break;
		case Unit.tags.fueled: name = 'С топливом'; break;
		case Unit.tags.spaceship: name = 'Компонент космического корабля'; break;
		case Unit.tags.aircraft: name = 'Авиация'; break;
		case Unit.tags.ship: name = 'Флот'; break;
		case Unit.tags.trooper: name = 'Пехота'; break;
		case Unit.tags.heavyarmored: name = 'Тяжелобронированный'; break;
	}
	
	if( neg && tag != Unit.tags.no ){
		name = 'Не ' + utils.downFirstLetter(name);
	}
	
	return name;
	
};

Unit.isTacticsTag = function(tag) {
	switch (tag) {
		case Unit.tags.organic: return true;
		case Unit.tags.shooter: return true;
		case Unit.tags.technics: return true;
		case Unit.tags.big: return true;
		case Unit.tags.mounted: return true;
		case Unit.tags.shielded: return true;
		case Unit.tags.siege: return true;
		case Unit.tags.armored: return true;
		case Unit.tags.fueled: return true;
		case Unit.tags.heavyarmored: return true;
	}
	return false;	
};

Unit.isAvailAcc = function(unitId){
    return !wofh.account.noAcc && wofh.account.research.units[unitId];
};

Unit.getTagCode = function(tag) {
	var tagKey;
	for(var key in Unit.tags){
		if( Unit.tags[key] == tag ){
			tagKey = key;
			break;
		}
	}
	return Unit.tagCodes[tagKey];
};

Unit.getTagsCodes = function(tags) {
	var tagCodes = [];
	for(var key in Unit.tags){
		if( Unit.tags[key] & tags ){
			tagCodes.push(Unit.tagCodes[key]);
		}
	}
	return tagCodes.join('');
};

Unit.getTagByCode = function(code) {
	var tagKey;
	for(var key in Unit.tagCodes){
		if( Unit.tagCodes[key] == code ){
			tagKey = key;
			break;
		}
	}
	return Unit.tags[tagKey];
};

Unit.getObj = function (objOrId, nullOrCount) {
	if (typeof(objOrId) === 'object') return objOrId;
	else return new Unit(objOrId, nullOrCount);
};



/**
 * константы
 */
 
Unit.no = lib.units.nounit;

Unit.ids = {
	settler: 43,
	worker: 56,
	spy: 35,
	tmplStart: 135,
	tmplEnd: 486,
	tmplPriorOffset: 1 << 10,
	tmplFirstNegOffset: 1 << 11,
	tmplSecondNegOffset: 1 << 12,
	tmplPriorLimit: 100,
	tmplFirstNegLimit: 200,
	tmplSecondNegLimit: 400,
	fort: 1 << 16, // Представляет собой юнит-защитное сооружение
	any: (1 << 16) + 1, // Представляет собой шаблон всех войск
};
 
Unit.type = {
	no: -1,
	trooper: 0,
	horseman: 1,
	tech: 2,
	boat: 3,
	air: 4,
	space: 5,
};



Unit.tagCodes = {
	organic: 'f',
	shooter: 'g',
	technics: 'h',
	big: 'i',
	mounted: 'j',
	shielded: 'k',
	siege: 'l',
	armored: 'm',
	fueled: 'n',
	heavyarmored: 's',
	fort: '#',
	any: '@'
};

Unit.tags = {
	no: 0,
	organic: 1 << 0,
	shooter: 1 << 1,
	technics: 1 << 2,
	big: 1 << 3,
	mounted: 1 << 4,
	shielded: 1 << 5,
	siege: 1 << 6,
	armored: 1 << 7,
	heavyarmored: 1 << 13,
	fueled: 1 << 8,
	spaceship: 1 << 9,
	aircraft: 1 << 10,
	ship: 1 << 11,
	trooper: 1 << 12
};

Unit.tmplPriority = {
	and: 0,
	or: 1
};

 
Unit.ability = {
	no: 0,
	attack: 1,
	defence: 1 << 1,
	colonize: 1 << 2,
	getres: 1 << 3,
	destroy: 1 << 4,
	noFight: 1 << 5,//не вступает в 3d бой
	kill: 1 << 6,
	damage3round: 1 << 8,
	grab1: 1 << 9,
	spy: 1 << 10,
	transport: 1 << 11,
	submines: 1 << 12,
	grab2: 1 << 13,
	pro: 1 << 14,
	lower_def: 1 << 15,
	low_water: 1 << 16,
	high_water: 1 << 17,
	air_radius1: 1 << 18,
	air_radius2: 1 << 19,
	air_radius3: 1 << 20,
	no_attack: 1 << 21,
	nuclear_attack: 1 << 22,
	any_group: 1 << 23
}

Unit.group = {
	attack: 0,
	reserve: 1,
	distance: 2,
	torear: 3,
	flank: 4,
}

//тактика юнита
//фона на иконке юнита 
Unit.tactic = {
	melee: 0, //красный
	range: 1, //желтый
	cavalry: 2, //синий 
	technic: 3, //розовый,
	mechanic: 4, //боевые машины - коричневый
	noncombat: 5, //серый
	fleet: 6, //голубой, синий, черный
	air: 7, //белый
	space: 8, //компоненты КК
	special: 9,//праздничные и т.п. юниты
};

Unit.erasLength = 9;

//Unit.fleetId = 200;

Unit.alternates = [
    [1, 8],//пращник
    [57, 96],//ополченец
    [29, 20, 80],//арбалетчик
];

Unit.countryPayments = {
	train: {name: 'train', text: 'Выплата страны на обучение: '}
};

//дополнительная информация по юнитам
Unit.lib = [{
	// Воин
	animation: 6,
	animationk: 10,
	desc: "Кровожаден и страшен, как пещерный таракан. Он живет только в бою. И везде, где он — бой. Тяга к убийству неодолима. Руки его по колено в крови.",
	name: "Воин",
	era: 0,
	tactic: 0,
}, {
	// Пращник
	animation: 9,
	animationk: 10,
	desc: "В прошлом — уличные мальчишки, бившие соседские окна. Сегодня — воины, развившие свои хулиганские навыки в ранг искусства. Отряды пращников-ветеранов наводят ужас на врага, метко расстреливая кувшины с брагой.",
	name: "Пращник",
	era: 0,
	tactic: 1,
}, {
	// Копейщик
	animation: 20,
	animationk: 10,
	desc: "Не каждый мужчина с копьем — копейщик! Но каждый копейщик — настоящий мужчина! Надежное плечо для доброй селянки, верный защитник малых детишек, ужас любого врага.",
	name: "Копейщик",
	era: 1,
	tactic: 0,
}, {
	// Топорщик
	animation: 23,
	animationk: 10,
	desc: "Когда-то милых и душевных лесничих орда обезумевших белок застала врасплох в уединенных жилищах. Страшный катаклизм превратил этих веселых и незлобивых людей в беспощадных воинов.",
	name: "Топорщик",
	era: 2,
	tactic: 0,
}, {
	// Пикинер
	animation: 40,
	animationk: 10,
	desc: "Настоящий боевой «энтомолог».<br>Пики востры. Руки крепки. Нервы — стальные канаты.",
	name: "Пикинер",
	era: 3,
	tactic: 0,
}, {
	// Бомбарда
	animation: 62,
	animationk: 10,
	desc: "Кому из мальчишек ни приятно, когда с громким звуком из трубки вылетает посланная им в цель металлическая штуковина? Особенно если эта штуковина — увесистое ядро, и ты уже не мальчишка, а усатый здоровенный детина с веселой редкозубой улыбкой?",
	name: "Бомбарда",
	era: 4,
	tactic: 4,
}, {
	// Бомбардирский корабль
	animation: -1,
	animationk: 10,
	desc: "Экипаж бомбардирского корабля сплошь состоит из людей, любящих не столько поплавать в море, сколько устроить большой &quot;БУМ&quot;. А &quot;большой БУМ&quot; в их понимании — пострелять на спор по шпилям зданий из мощных пушек.",
	name: "Бомбардирский корабль",
	era: 4,
	tactic: 6,
}, {
	// Пароход
	animation: -1,
	animationk: 10,
	desc: "Пришло время забыть про эти ненадежные паруса! Забыть про эти воняющие смолой канаты! Сила пара! Вот следующий шаг в будущее! Сделай же его и ты!",
	name: "Пароход",
	era: 5,
	tactic: 6,
}, {
	// Метатель дротиков
	animation: 9,
	animationk: 10,
	desc: "Мечет. Причем единственный из метателей, кто мечет безо всяких вспомогательных инструментов, взял да и метнул. И в этом им нет равных. Эти воины сентиментальны и жалеют забивать рыбу и зверьё, поэтому совершенно бесполезны для рыбной ловли и охоты. Зато пригвоздить к дереву за рукав крутого вояку или уколоть в круп его коня — это любимое занятие.",
	name: "Метатель дротиков",
	era: 0,
	tactic: 1,
}, {
	// Трирема
	animation: -1,
	animationk: 10,
	desc: "Вы любите ходить по морям? Вам нравится грести? Тогда трирема — Ваш выбор! Огромный выбор весел, удобные скамьи, новые знакомства и масса ярких впечатлений. Продвижение по службе от раба до вольнонаемного гребца. И все это под звуки битвы и стоны врагов! Занятие для настоящих мужчин! С нами Вы увидите весь мир!",
	name: "Трирема",
	era: 2,
	tactic: 6,
}, {
	// Ладья
	animation: -1,
	animationk: 10,
	desc: "Из-за участка суши естественного происхождения, окружённого со всех сторон водой и постоянно возвышающегося над водой, даже в период наибольшего прилива, на линию, соединяющую точки с максимальной поверхностной скоростью течения реки, на большое открытое пространство, характерно колеблющееся в результате переноса в толще воды кинетической энергии гравитационной природы, в сочетании с влияющими на него также и внешними факторами, используя энергию перемещающихся больших воздушных масс и первый закон Архимеда, меняют свои географические координаты, покрытые этнической графикой гребные суда, не имеющие киля, выдолбленные из единого ствола дерева, специфической аэродинамической формы.",
	name: "Ладья",
	era: 3,
	tactic: 6,
}, {
	// Боевой слон
	animation: -1,
	animationk: 10,
	desc: "Огромная зверюга с вконец испорченным характером. Регулярно вытаптывает посевы, обгладывает кусты и распугивает домашних животных. Единственный плюс — иногда его можно выгнать и заставить делать то же самое на ферме соседа.<br>Да и добивать умирающего врага приятно, а на боевом слоне еще и безопасно.",
	name: "Боевой слон",
	era: 3,
	tactic: 3,
}, {
	// Дубинщик
	animation: 6,
	animationk: 10,
	desc: "Появление дубинщиков как рода войск неразрывно связано с теорией эволюции. Когда обезьяна впервые взяла в руки палку... и стукнула ей по лбу собрата — вот тогда-то и зародились славные боевые традиции этих отважных воинов.",
	name: "Дубинщик",
	era: 0,
	tactic: 0,
}, {
	// Всадник
	animation: 15,
	animationk: 10,
	desc: "Мало кто видит этих лихих ребят отдыхающими у костров или весело задирающих юбки симпатичным селянкам. Они живут свободой. Не держит их дом и быт. Вечный зов ветра и грохота копыт набатом зовет их в поход. И постель им попона боевого коня.",
	name: "Всадник",
	era: 1,
	tactic: 2,
}, {
	// Бронеавтомобиль
	animation: 81,
	animationk: 10,
	desc: "Задорно позвякивая стальными болтами, в клубах едкого желтого дыма, на удивление простому люду являет себя чудо инженерной мысли — Бронированный автомобиль. Это замечательное многофункциональное устройство готово удовлетворить практически любые потребности обывателей. И врага на скаку остановит и крепкую избушку зажжет. А особо расторопные личности так и норовят взгромоздиться на него с ногами и, под восхищенные крики толпы, указывать направления на новые горизонты.",
	name: "Бронеавтомобиль",
	era: 6,
	tactic: 1,
}, {
	// Драгун
	animation: 68,
	animationk: 10,
	desc: "Лихой рубака и на скаку стреляка. Как-то посадили этакого молодца на коня, вот и вышло, то, что вышло. Отменно экипирован, нагл и дерзок, хотя предпочитает постоять в резерве. Зато регулярно посылаем полководцами… на самые опасные участки битвы. При входе в город сражает всех дам насмерть своим неотразимым видом, отчего население города стремительно падает.",
	name: "Драгун",
	era: 4,
	tactic: 1,
}, {
	// Колесница
	animation: 18,
	animationk: 10,
	desc: "Боевые телеги устрашающе скрипят, даже находясь в резерве. Крайне опасны в бою слетевшие с их осей тяжеленные колеса.",
	name: "Колесница",
	era: 1,
	tactic: 2,
}, {
	// Автоматчик
	animation: 71,
	animationk: 10,
	desc: "Сей чудесный человек без вопросов повысит содержание железа в вашем организме до требуемого смертельного уровня.",
	name: "Автоматчик",
	era: 6,
	tactic: 0,
}, {
	// Пулеметчик
	animation: 73,
	animationk: 10,
	desc: "Все настоящие пулеметчики одиноки. Ибо страшны. Ибо слепнут они рано от блеска солнца на отполированных стволах своих пулеметов. Ибо глуховаты они от громоподобного грохота своих пулеметов. Ибо руки их изуродованы ожогами от раскалённого пара своих пулеметов. Ибо вонючи они и грязны от сажи пороха своих пулеметов. Но они счастливы. Ибо это их пулеметы. Ибо в них, в пулеметах, их жизнь и суть.",
	name: "Пулеметчик",
	era: 5,
	tactic: 1,
}, {
	// Лёгкий танк
	animation: 87,
	animationk: 10,
	desc: "Что может быть лучше в праздник как ни пропахший соляркой огромный танк, обнаруженный по утру в собственном огороде? Этот матово отблескивающий в лучах рассветного солнца ствол, приветливо торчащий из ветхого курятника, моментально поднимет ваше настроение. Остается только собрать компанию лучших друзей, загрузить в утробу этого лязгающего чудовища крепленый провиант и можно с озорным гиканьем отправляться на веселый пикник в соседнюю деревню.",
	name: "Лёгкий танк",
	era: 6,
	tactic: 2,
}, {
	// Метатель бола
	animation: 9,
	animationk: 10,
	desc: "Ловким движением руки жертва превращается в спелёнутую куклу, становясь безопаснее неразумного младенца.",
	name: "Метатель бола",
	era: 2,
	tactic: 1,
}, {
	// Дивизионная пушка
	animation: 82,
	animationk: 10,
	desc: "Большое колесо, шум мотора, запах топлива, Очень Секретный План, но что же главное? Главное успевать подавать снаряды!",
	name: "Дивизионная пушка",
	era: 6,
	tactic: 3,
}, {
	// Пехотинец
	animation: 72,
	animationk: 10,
	desc: "Всегда и во все времена — пехота основа любой армии. Тяжела служба в пехоте. В постоянных маршах истаптывает она горы сапог. Получив свои законные 100 &quot;боевых&quot;, пехотинец готов в штыковую и под танк, а если закусит, то не промажет и по самолету, но милей всего ему в родном окопе. И горе врагу, штурмующему обороняющегося пехотинца.",
	name: "Солдат",
	era: 5,
	tactic: 0,
}, {
	// Длинный лук
	animation: 43,
	animationk: 10,
	desc: "Очень простые парни с очень непростыми луками. Собираясь по вечерам у походного костра, они часами сравнивают предметы своей гордости. Громко шумят. Смотрят на всех других свысока, чувствуя свою избранность. И неудивительно, ибо только крепкие и сильные руки могут совладать с по-настоящему длинным луком.",
	name: "Длинный лук",
	era: 3,
	tactic: 1,
}, {
	// Кирасир
	animation: 34,
	animationk: 10,
	desc: "Its a good day to die.",
	name: "Кирасир",
	era: 4,
	tactic: 2,
}, {
	// Мушкетер
	animation: 61,
	animationk: 10,
	desc: "Усатые смехачи. В непростое военное время с удовольствием любящие пыхнуть крепким черным порохом и метко посылающие свои железные шарики из длинных и крепких, на зависть другим, мушкетов в строй бледных лицом противников.<br>Эти лихие парни любят вино, женщин, честную дуэль и не переносят осечек.",
	name: "Мушкетер",
	era: 4,
	tactic: 1,
}, {
	// Егерь
	animation: 74,
	animationk: 10,
	desc: "Идут в егеря охотники из тех, что могут попасть в глаз даже белке. Но всё же предпочитают глазные яблоки коней и их всадников. Тут виновата генетическая память — в стародавние времена много лесных невест утащили на аркане степные кочевники и голубоглазые блондинки урождаются теперь даже в жаркой пустыне. Хлопцы они основательные и не любят брать нахрапом. Им бы все бочком, сторонкой, да из засад, откуда аккуратно выцеливают егеря свои жертвы. Не один эскадрон вражеской кавалерии лёг под их меткими пулями.",
	name: "Егерь",
	era: 5,
	tactic: 1,
}, {
	// Кавалерист
	animation: 70,
	animationk: 10,
	desc: "Зачастую умение накручивать ус служило определяющим критерием для принятия в кавалерийский отряд. Но храбрости, отваги и остроумия у этих ребят было хоть отбавляй. Нападая с тыла, они вносили смуту, как в ряды врага, так и в стайки вражьих гулящих девок, что отнимало у противника остатки разума и волю к победе.",
	name: "Кавалерист",
	era: 5,
	tactic: 2,
}, {
	// Алебардщик
	animation: 40,
	animationk: 10,
	desc: "Алебардщиков в войска набирают из мирных фермеров, которые острыми крючьями на длинных жердях стаскивают голодных медвежат с плодово-ягодных деревьев в своих садах. И тоскуя по мирной жизни, они продолжают это нехитрое занятие при первой же возможности, не делая различий между дикими зверенышами и трогательными в своей беззащитности всадниками.",
	name: "Алебардщик",
	era: 4,
	tactic: 0,
}, {
	// Арбалетчик
	animation: 25,
	animationk: 10,
	desc: "Коль с мечом ты не в ладах, ну а с луком ты мазила, арбалетчик тебя звать, в этом есть вся твоя сила. Агрессивный, беспринципный ну и вообще очень неприятный тип.",
	name: "Арбалетчик",
	era: 2,
	tactic: 1,
}, {
	// Гренадер
	animation: 60,
	animationk: 10,
	desc: "Отборные корма, лучший табак и усы! Да, усы! Только самым выносливым, мощным духом и телом под силу носить тяжеленые чугунные шары с порохом и пышные, богато украшенные лентами, усы.",
	name: "Гренадер",
	era: 4,
	tactic: 1,
}, {
	// Современный танк
	animation: 88,
	animationk: 10,
	desc: "Что может быть современнее современного танка? Толстая броня, грозное орудие, совершенная система управления огнём, комплексы защиты от огня и ругани противника. И довершают всю эту мощь самый наисовременнейшее оборудование: кондиционер, минибар и микроволновая печь, заботливо расположенные конструкторами в прямой доступности всех членов экипажа этой технологически совершенной машины.",
	name: "Современный танк",
	era: 8,
	tactic: 2,
}, {
	// Рыцарь
	animation: 34,
	animationk: 10,
	desc: "Рыцари:<br>а) Благородны, но надменны<br>б) Чистоплотны, но вонючи<br>в) Смертоносны, но боязливы<br>Эти рыцари — такие рыцари...",
	name: "Рыцарь",
	era: 3,
	tactic: 2,
}, {
	// Самурай
	animation: 33,
	animationk: 10,
	desc: "Вам когда-нибудь пронзали живот катаной? Нет? Вам повезло, обычно это смертельно, а в исполнении самурая еще и эффектно!",
	name: "Самурай",
	era: 3,
	tactic: 0,
}, {
	// Галера
	animation: -1,
	animationk: 10,
	desc: "Настоящий моряк умеет качественно делать два дела. Он умеет грести, ну и, конечно, он умеет не грести. А еще он может взбаламутить все море. Вот только грести ему для этого придется несколько дольше обычного.",
	name: "Галера",
	era: 1,
	tactic: 6,
}, {
	// Разведчик
	animation: 31,
	animationk: 10,
	desc: "Интересно, что происходит за высоким забором у соседа? Хочешь точно оценить свои шансы в войне? Просто любишь совать нос в чужие дела? Со всем этим поможет разведчик! Разведчик — выбор профессионалов.",
	name: "Разведчик",
	era: 3,
	tactic: 5,
}, {
	// Лучник
	animation: 7,
	animationk: 10,
	desc: "Количество лучников прямо пропорционально количеству одноглазых белок в округе. ",
	name: "Лучник",
	era: 1,
	tactic: 1,
}, {
	// Мечник
	animation: 23,
	animationk: 10,
	desc: "Что может быть ужасней небритых мужиков с острыми ржавыми железками в крепких руках...",
	name: "Мечник",
	era: 2,
	tactic: 0,
}, {
	// Пушка
	animation: 63,
	animationk: 10,
	desc: "«Мы бабахнули из пушки — разлетелись вражьи тушки!» — поётся в народной пушкарской песне. Рождённый ползать летать не может? Ещё как может, если придать ему ускорение ядром, выпущенным из этой устрашающей трубы на колёсиках! Правда, летает он после этого обычно не целиком, а частями.",
	name: "Пушка",
	era: 4,
	tactic: 4,
}, {
	// Мортира
	animation: 62,
	animationk: 10,
	desc: "«Нету стен в твоей квартире — благодарен будь мортире!» — поётся в народной мортирщицкой песне. Ещё в детском саду присматривают военачальники обуянных жаждой разрушения ребятишек. Кто ненавидит, когда другие дети строят домики и замки из кубиков? Кто немедленно кидается ломать и крушить чужие постройки? Таким детям — прямая дорога в мортирщики. Там они вовсю будут ломать уже настоящие домики, с наслаждением паля из приземистой широкодульной дурынды.",
	name: "Мортира",
	era: 4,
	tactic: 4,
}, {
	// Гвардеец
	animation: 69,
	animationk: 10,
	desc: "В гвардию отбирают только самых достойных. В списке требований:<br>- игра в карты;<br>- употребление спиртных напитков;<br>- завышенная самооценка.<br>Поэтому озверевшие от вина и безделья гвардейцы так рвутся в бой, сметая на своём пути как врагов, так и союзников.",
	name: "Гвардеец",
	era: 4,
	tactic: 0,
}, {
	// Катапульта
	animation: 8,
	animationk: 10,
	desc: "«Напоказывал нам дуль ты — так встречай же катапульты!» — поётся в царской народной песне. Утомившись от созерцания демонстрируемых наглым противником дуль, фиг, кукишей, шишей и прочих затейливых фигур, составляемых как из пальцев рук, так и из других частей тела, оскорблённый до глубины души царь обычно отдаёт приказ мудрецам «поднажать с этими, как их... какапульками». И вот, в один прекрасный день, к городу не в меру остроумного соперника неожиданно подкатывает строй забавных конструкций из брёвнышек, верёвочек и воловьих жил. После чего на крыши домов обрушивается удивительный, но крайне неприятный ливень камня и щебня крупной, средней и мелкой фраций также содержащих в различных пропорциях аморфные разновидности двуокиси кремния, серу, сульфиды, сульфаты, слоистые силикаты , магнетит, гидроокислы железа, апатит, нефелин, фосфорит, галоидные соединения, цеолиты, асбест, графит, уголь, горючие сланцы и т.п.",
	name: "Катапульта",
	era: 2,
	tactic: 4,
}, {
	// Рутта
	animation: 26,
	animationk: 10,
	desc: '<span class="-adobe-font">Чем больше озадачивает это имя тенсионной ротора. Врашение плеча тенсионный создаетвозмоножсть построить сильнои движущей силои. С запуском вращающейся конструкции, поверните его начальной упргой поверхности крепления с вращающимся рыбы сушки полетела в направлении воздушного кольца, чтобы обратить вспять смерть.</span>',
	name: "Рутта",
	era: 3,
	tactic: 1,
}, {
	// Поселенец
	animation: 19,
	animationk: 8,
	desc: "Тяжела ноша основателя нового города. Долгие и изматывающие тренировки, лишения и тягости долгого пути. И всё во имя великой цели. Выжить! Ведь только пара десятков счастливчиков из сотен останутся в живых, став основой нового населенного пункта.",
	name: "Поселенец",
	era: 1,
	tactic: 5,
}, {
	// Моргенштерн
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Моргенштерн",
	era: 3,
	tactic: 0,
}, {
	// Онагр
	animation: 8,
	animationk: 10,
	desc: "«Мы онагра зарядили — город в щебень превратили!» — поётся в народной онагристской песне. Однажды для театральной постановки «Доктора Айболита» понадобились, в качестве шумового оформления, крики различных животных. Кто-то из животных имелся в живом виде, кого-то удачно изображали актёры, а вот для онагра пришлось построить специальное устройство. После премьеры выяснилось, что оно не только издаёт звук, похожий на крик онагра, но ещё и может метать большие камни на приличное расстояние. Искусственного онагра немедленно забрали в армию, размножили в достаточном количестве, и теперь специально обученные онагристы готовы онагрировать до основания любой город.",
	name: "Онагр",
	era: 2,
	tactic: 4,
}, {
	// Требушет
	animation: 8,
	animationk: 10,
	desc: "«Убегает враг в клозет, наш увидев требушет!» — поётся в народной требушетской песне. И в самом деле, трудно не оконфузиться от страха при виде рядов этих жутковатых устройств, подходящих к твоему городу, дабы превратить его в развалины. Остаётся только спрятаться в клозете (желательно подземном) и лелеять надежду, что требушетчики, по своему обыкновению, накануне, как следует отмечали предстоящую осаду.",
	name: "Требушет",
	era: 3,
	tactic: 4,
}, {
	// Гранатометчик
	animation: 78,
	animationk: 10,
	desc: "",
	name: "Гранатометчик",
	era: 8,
	tactic: 0,
}, {
	// Лодка
	animation: -1,
	animationk: 10,
	desc: "Лодка состоит из мощного киля, деревянных рёбер — шпангоутов и досок на этих рёбрах. Бравый экипаж лодки состоит из трёх человек, не считая многофункциональной собаки. На протяжении долгого пути собака скрашивает быт команды заунывными песнями на киле. Во время боя собака играет роль «вороньего клюва» — её, привязанную за хвост крепкой пеньковой веревкой, перекидывают на вражеский корабль, а затем экипаж сражается на тяжёлых дубовых вёслах. Как правило, после боя собаку необходимо менять — но их столько нерезаных, что не жалко.",
	name: "Лодка",
	era: 0,
	tactic: 6,
}, {
	// Каноэ
	animation: -1,
	animationk: 10,
	desc: "Возьмите лодку, замените собаку на крокодила, и перед вами — каноэ. Использовать крокодила значительно проблематичнее, поэтому экипаж каноэ не только брав, но и быстр да проворен. А если, вдобавок, украсить крокодила перьями, то ему можно поклоняться, не прерывая пути, что положительно сказывается не только на ходовых качествах боевого каноэ, но и на урожае будущего года.",
	name: "Каноэ",
	era: 0,
	tactic: 6,
}, {
	// Пехотинец
	animation: 77,
	animationk: 10,
	desc: "Сбрасывать бомбы на голову врага весело. Но гораздо веселее сбрасывать им на голову небритых, мускулистых и чуток взбодренных алкоголем красавцев-парней, каждый из которых способен перевернуть горы и местные веселые кабаки.",
	name: "Пехотинец",
	era: 8,
	tactic: 0,
}, {
	// Конный лучник
	animation: 15,
	animationk: 10,
	desc: "Бесшабашные и веселые дядьки. С утра угрюмы и злы. Что и понятно. Тяжка их доля. Суровы будни. Да и кони... Хотя кони еще ничего.",
	name: "Конный лучник",
	era: 1,
	tactic: 1,
}, {
	// Конный арбалетчик
	animation: 15,
	animationk: 10,
	desc: "Ветераны, уважаемые в воинском сословии.<br>Девиз этих славных малых прост: приехал, увидел, подстрелил. Вы на их месте были бы ничуть не лучше. Ведь что может быть более увлекательным, чем наводить прицел любимого арбалета на какого-нибудь безмятежно торчащего из-за укрытия олуха и медленно спускать курок?",
	name: "Конный арбалетчик",
	era: 2,
	tactic: 1,
}, {
	// Каравелла
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Каравелла",
	era: 3,
	tactic: 6,
}, {
	// Фрегат
	animation: -1,
	animationk: 10,
	desc: "Экипаж этих судов сплошь состоит из отъявленных пропойц, которых пытаются отучить от алкоголизма службой на флоте. Однако, невзирая на все перевоспитательские потуги командования, эти моряки с неутомимым энтузиазмом вовсю пропивают казенные пушечные ядра. Поэтому пушки им приходится заряжать чем попало – то вчерашней солянкой, то дохлыми крысами и чайками, то не пришедшими в себя товарищами по недавней пьянке, ну и прочим подручным материалом. Естественно, что обитатели и защитники обстреливаемого города, не выдержав такой оскорбительной бомбёжки, надолго теряют самообладание и волю к победе, становясь легкой добычей для озверелых с похмелья моряков.",
	name: "Фрегат",
	era: 4,
	tactic: 6,
}, {
	// Галеон
	animation: -1,
	animationk: 10,
	desc: "Бассейн для утренней разминки? Теннисный корт к вечеру? Дружеская партия в гольф? И все это под легкую морскую качку? Да не вопрос! С семью палубами и водоизмещением до 2 тысяч тонн возможно и не такое! Позвольте представить, его совершенство — Галеон!",
	name: "Галеон",
	era: 4,
	tactic: 6,
}, {
	// Рабочий
	animation: 14,
	animationk: 8,
	desc: "Рабочие нужны для колонизации месторождений и строительства дорог. Для их обучения требуется много людей и еще больше времени. Ибо только лучшим из лучших, надежнейшим из надежных могут соплеменники доверить драгоценные, украшенные затейливыми узорами фамильные лопаты. Со слезами на глазах провожают их на трудовой подвиг. Все знают — после колонизации месторождения рабочий никогда не возвращается.",
	name: "Рабочий",
	era: 0,
	tactic: 5,
}, {
	// Ополченец
	animation: 17,
	animationk: 10,
	desc: "Особенно они страшны толпой, ибо звереют от густого запаха чеснока и домашней бражки приносимого любым легким ветерком от соседского плеча.<br>Ну а вилы в их опытных руках — штука универсальная. Ими можно чесать спину жене, вспарывать брюхо захватчикам и даже кидать перепрелое сено.",
	name: "Ополченец",
	era: 1,
	tactic: 0,
}, {
	// Реактивная артиллерия
	animation: 90,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Реактивная артиллерия",
	era: 8,
	tactic: 3,
}, {
	// Мотопехота
	animation: 86,
	animationk: 10,
	desc: "Минули времена, когда каждый воин должен был находиться в идеальной физической форме. Такое чудесное изобретение, как автомобиль, позволило солдатам сменить аромат портянок и стоптанных ног на благоухание соляры и разогретых жарким боем бронепластин. Новые кресла с подогревом и встроенные в них подлокотники, подголовники и подстаканники вывели сражения на куда более комфортабельный уровень.",
	name: "Боевая машина пехоты",
	era: 8,
	tactic: 1,
}, {
	// КК Двигатель
	animation: -1,
	animationk: 10,
	desc: "Двигает космический корабль. А для чего же еще его придумывали лучшие инженеры мира? Напридумывали огромную такую прибамбасину с кучей трубок, непонятных штучек и еще более непонятных дрючек. Но задачу свою исполняет на ять — третья космическая скорость для него плевое дело.",
	name: "КК Двигатель",
	era: 7,
	tactic: 8,
}, {
	// КК Рубка
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "КК Рубка",
	era: 7,
	tactic: 8,
}, {
	// КК Обшивка
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "КК Обшивка",
	era: 7,
	tactic: 8,
}, {
	// КК Топливный бак
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "КК Топливный бак",
	era: 7,
	tactic: 8,
}, {
	// КК Солнечная батарея
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "КК Солнечная батарея",
	era: 7,
	tactic: 8,
}, {
	// КК Модуль обеспечения
	animation: -1,
	animationk: 10,
	desc: "Хотите горячий душ, совмещенный с интеллектуальным джакузи, светомузыкой, вместительным туалетом, интернетом и объемным 64 канальным звуком? И всё это на космическом корабле в ледяной пустоте космического вакуума? Теперь это возможно! Новый! Особый! Модуль Обеспечения! *Действует ограниченная гарантия на дополнительные опции.",
	name: "КК Модуль обеспечения",
	era: 7,
	tactic: 8,
}, {
	// Миноносец
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Броненосец",
	era: 6,
	tactic: 6,
}, {
	// Эсминец
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Эсминец",
	era: 7,
	tactic: 6,
}, {
	// Транспортный корабль
	animation: -1,
	animationk: 10,
	desc: "Что действительно поражает, так это брюхо этой посудины, создается впечатление, что оно бездонно! И непривередливо: войска, товары, пассажиры — проглотит всех.<br>Вместимость — поражает! Стоимость — поражает! Сроки — поражают! Поражательный корабль!",
	name: "Транспортный корабль",
	era: 7,
	tactic: 6,
}, {
	// Дредноут
	animation: -1,
	animationk: 10,
	desc: "Огромная, ужасающая мощью громыхалка. Лениво идет позади своры миноносок и нет ничего, что могло помешать бы ему шарахнуть по городу из главного калибра. Ну если только еще один такой же бронированный симпотяшка.",
	name: "Дредноут",
	era: 6,
	tactic: 6,
}, {
	// Подводная лодка
	animation: -1,
	animationk: 10,
	desc: "Тревога! Полный вперёд! Самый полный! 1..2..3. Лодка..Внимание помпам! Самый полный вперёд! Всему составу. Произвести посадку на борт! Живо к двигателям! Система приведена в боевую готовность. Лодка..Самый полный вперёд!",
	name: "Подводная лодка",
	era: 6,
	tactic: 6,
}, {
	// Линкор
	animation: -1,
	animationk: 10,
	desc: "Когда этот монстр выходит в море, винты начинают дрожать даже у Дредноутов!<br>Доподлинно не известно, кому пришла в голову идея создать этого монстра морей, но равных по огневой мощи ему нет.",
	name: "Линкор",
	era: 8,
	tactic: 6,
}, {
	// Атомная подводная лодка
	animation: -1,
	animationk: 10,
	desc: "Гордо сияя полураспадом во тьме реакторного отсека, плывёт стальное чудище топить вражьи судишки.",
	name: "Атомная подводная лодка",
	era: 7,
	tactic: 6,
}, {
	// Крейсер
	animation: -1,
	animationk: 10,
	desc: "Красавец Крейсер уверенно рассекает просторы мирового океана. Бодрая команда путешествует по схеме «все включено». И пушки, и торпеды, и чуткие приборы наведения огня. А в свободное от вахты время моряки могут развлечь друг друга шарадами при помощи флажковый азбуки, бегом наперегонки в водолазных костюмах и пантомимами в костюмах хим. защиты.",
	name: "Крейсер",
	era: 7,
	tactic: 6,
}, {
	// Дирижабль
	animation: -1,
	animationk: 10,
	desc: "Они пришли. Мы верили в это и, о Боги, как мы этого боялись. Они здесь. Не знаю к добру ли, ко злу ли, но они здесь. Это выше нашего понимания. Это просто случилось. Огромные. Боги, какие огромные! Обманчиво молчаливые. Птицы сидят на них. Я вижу шумная стая пролетела у самого белого его бока. Вот он проснулся. Он распахнул свое чрево. Там горит огонь! Он прекрасен… Мы всегда верили, что не одиноки. Сегодня, возможно, мы пожалеем, что это так.",
	name: "Дирижабль",
	era: 5,
	tactic: 7,
}, {
	// Собака-робот
	animation: 76,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Робопёс",
	era: 8,
	tactic: 2,
}, {
	// Снайпер
	animation: 79,
	animationk: 10,
	desc: "На плацу эти амазонки с безмерным кокетством могут продемонстрировать обтягивающие белые колготки и игривые камуфляжные сарафанчики. А на фронте они старательно выискивают в оптические прицелы своих гулящих на чужбине мужей... Чтобы не дать неверным супругам возможность и дальше улучшать вражью демографию. Однако, несмотря на аккуратные и чистые прицелы, эти дамы, в порывах слепой ревности, нередко принимают воинов врага за своих беглых муженьков.",
	name: "Снайпер",
	era: 8,
	tactic: 0,
}, {
	// Джонка
	animation: -1,
	animationk: 10,
	desc: "Лёгкое и быстрое судно для хождения по неглубокой воде. Отличное изобретение для того чтобы научить плавать бестолкового пловца в глубокой воде. Правда, бестолковых пловцов на джонках обычно много, поэтому джонка ни за что не станет плавать в глубоких водах даже в спокойную погоду.",
	name: "Джонка",
	era: 1,
	tactic: 6,
}, {
	// Легионер
	animation: 24,
	animationk: 10,
	desc: "Вы думаете, стены вашего города высоки и крепки, а армия многочисленна и отважна? Вполне возможно и так. Но учтите, что если рано утром под стенами вашего города грозной черепахой выстроятся эти красавцы, знайте пришло время озаботиться местом на ближайшем кладбище или начать подбирать себе рабский ошейник хорошо гармонирующий с цветом глаз и волос...",
	name: "Легионер",
	era: 2,
	tactic: 0,
}, {
	// Воин-ягуар
	animation: 27,
	animationk: 10,
	desc: "Непролазные джунгли, полчища москитов, вечная сырость, ядовитые твари. Так почему же вы наивно полагаете, что в таких условиях могут выжить добрые и сострадательные люди?",
	name: "Воин-ягуар",
	era: 2,
	tactic: 0,
}, {
	// Чо-ко-ну
	animation: 25,
	animationk: 10,
	desc: "Не всем хватает терпения натягивать целыми днями тетиву тугого лука и, при этом, бить вражину без промаха. Самых ленивых да бесполезных одевают в красивый кожаный доспех да вручают скорострельную поделку скромных азиатских инженеров. Казалось бы, обычный арбалет, правда, теперь не нужно после каждого выстрела натягивать тетиву, уныло крутя барашик. К тому же при зарядке обоймы с маленькими ядовитыми стрелками играет приятная музыка, сверкают яркие камушки, а в жаркий день еще и наливается прохладительный напиток.",
	name: "Чо-ко-ну",
	era: 2,
	tactic: 1,
}, {
	// Мотоциклист
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Мотоциклист",
	era: 6,
	tactic: 2,
}, {
	// Легкий истребитель
	animation: -1,
	animationk: 10,
	desc: "Простенький, из фанеры и ткани, с открытой всем небесным ветрам кабиной, он первый в мире крутанул мертвую петлю, открыл для всех фигуры высшего пилотажа и смелый прием воздушного боя — таран. Ведь на первых легких истребителях не было даже пулемета и пилот сбивал врага только мощью своего сурового взгляда, не забывая погрозить кулаком и пальнуть, задорно похохатывая, из револьвера в белый свет как в копеечку.",
	name: "Легкий истребитель",
	era: 6,
	tactic: 7,
}, {
	// Легкий бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Легкий бомбардировщик",
	era: 6,
	tactic: 7,
}, {
	// Пикировщик
	animation: -1,
	animationk: 10,
	desc: "В ряды экипажа пикировщиков набирают только самых смелых, профессиональных пилотов с качественно лужеными глотками. Ибо не каждый может спикировать над городом так низко, что обшивкой самолета снести флюгер городской ратуши, а задорным улюлюканьем из распахнутого иллюминатора сквасить молоко вражьих коров и оставить заиками жирных окраинных петухов в обнимку с бледным бургомистром.",
	name: "Пикировщик",
	era: 6,
	tactic: 7,
}, {
	// Аэростат
	animation: -1,
	animationk: 10,
	desc: "В яркий и радостный день Тень накрыла город. Люди в смятении поднимали лица к небу, пытаясь увидеть источник своего беспокойства. В клубах пара, поскрипывая на смоленых кантах, мерно покачиваясь лучах восходящего солнца — красавец аэростат уверенно и успокаивающе плыл над городом. И замолкали плачущие младенцы. Облегченно выдыхали напуганные, было, жители. Город теперь под защитой наполненного горячим воздухом гигантского тряпичного мешка.",
	name: "Аэростат",
	era: 4,
	tactic: 7,
}, {
	// Зенитное орудие
	animation: 83,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Зенитное орудие",
	era: 7,
	tactic: 3,
}, {
	// Тачанка ПВО
	animation: 80,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Тачанка ПВО",
	era: 5,
	tactic: 4,
}, {
	// Танк-ягуар
	animation: 89,
	animationk: 10,
	desc: "Века тренировок сотворили из воинов-ягуаров настоящих машин-убийц, а научно-технический прогресс дал им танк. Достойный ответ бледнолицым захватчикам.",
	name: "Танк-ягуар",
	era: 7,
	tactic: 2,
}, {
	// Истребитель
	animation: -1,
	animationk: 10,
	desc: "Винтомоторная авиация достигла своего пика. Небо его обитель. Он последняя надежда в борьбе с терзающими округу бомбардировщиками. Стрелять по птицам из рогатки — это уже старомодно! Последний писк моды — догнать и протаранить цель на большой скорости.",
	name: "Истребитель",
	era: 7,
	tactic: 7,
}, {
	// Бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Мы летим, ковыляя во мгле,<br>Мы ползём на последнем крыле,<br>Бак пробит, хвост горит и машина летит<br>На честном слове и на одном крыле.",
	name: "Бомбардировщик",
	era: 7,
	tactic: 7,
}, {
	// Штурмовик
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Штурмовик",
	era: 7,
	tactic: 7,
}, {
	// Двухместная колесница
	animation: 91,
	animationk: 10,
	desc: "Вы любите скорость, ветер в лицо, но не любите управлять транспортом? Двухместная колесница — ваш выбор! Это эргономичное, лишенное амортизаторов изобретение поможет вам исполнить свою заветную мечту — въехать с диким криком и тучей пыли в толпу врагов, попутно размахивая чем-нибудь угрожающим! Не беспокойтесь за управление — погонщик направит вас куда надо! А подпрыгивающая на камнях колесница создает эффект ненавязчивого лечебного вибромассажа. Одна проблема — туча пыли и тряска затрудняет обзор, отчего часто страдают даже мирные жители города оказавшегося на пути.",
	name: "Двухместная колесница",
	era: 1,
	tactic: 2,
}, {
	// НГ 2020
	imgId: '93_',
	animation: -1,
	animationk: 10,
	desc: "Komunikado inter la landoj perdiĝis, kaj tiuj, kiuj postvivis el la antaŭaj miliardoj batalis mortigan batalon pro ekzisto. Ne estas evidenteco de ĉi tiuj jarmiloj, sed la rezultoj estas evidentaj. Kaj la homaro estas regata de frenezo. Ili mortigas ĉiujn fremdulojn, tio donas al ili plezuron, kaj ili mem estas strangaj unu al la alia.",
	name: "Скользкий Крыс",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// Реактивный истребитель
	animation: -1,
	animationk: 10,
	desc: "Лётчикам этих машин мало догнать врага — обязательно надо ещё и перегнать! И показать вражине язык в знак торжества научно-технического прогресса.",
	name: "Реактивный истребитель",
	era: 8,
	tactic: 7,
}, {
	// Реактивный бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Делаю я левый разворот...<br>Я теперь палач, а не пилот.<br>Нагибаюсь над прицелом, и ракеты мчатся к цели!<br>Впереди еще один заход.",
	name: "Реактивный бомбардировщик",
	era: 8,
	tactic: 7,
}, {
	// Импи
	animation: 84,
	animationk: 10,
	desc: "Дикие, очень дикие люди. Создаются путём централизованного вооружения просто диких людей, копьём, щитом, пятнистой шкурой и объяснением что как держать и чем куда тыкать.",
	name: "Импи",
	era: 1,
	tactic: 0,
}, {
	// Мамлюк
	animation: -1,
	animationk: 10,
	desc: "Грозный опасность! Дикий верблюда оседлать! Железный палка огонь! Вкусный врага голова отрезай, носить, женщина убегай, ха-ха! Из таких простейших апофегм и сентенций состоит все непродолжительное мое суетное жизнеобретание на скорбной земле предков и в чужеземных далях.",
	name: "Мамлюк",
	era: 4,
	tactic: 2,
}, {
	//Папмрусная лодка
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Папирусная лодка",
	era: 0,
	tactic: 6,
}, {
	// Латник
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Латник",
	era: 3,
	tactic: 0,
}, {
	// Минометчик
	animation: -1,
	animationk: 10,
	desc: "Молчаливый и неприметный человек с «шайтан-трубой» заставляет задуматься о смысле жизни и бесконечности космоса даже сидящих за крепкой броней суровых танкистов.",
	name: "Минометчик",
	era: 6,
	tactic: 0,
}, {
	//Конный пехотинец
	animation: 92,
	animationk: 10,
	desc: "",
	name: "Тяжелый танк",
	era: 7,
	tactic: 2,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Бронетранспортер",
	era: 7,
	tactic: 1,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Реактивный миномет",
	era: 7,
	tactic: 3,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Огнеметчик",
	era: 7,
	tactic: 0,
}, {
	// ЗРПК
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "ЗРПК",
	era: 8,
	tactic: 4,
}, {
	// Обезьяна
	animation: -1,
	animationk: 10,
	desc: "А-а-ук! У-у-ук! И-и-ик! Э-э-эк!",
	name: "Гораций В.",
	era: 0,
	tactic: 0,
	holiday: true
}, {
	// НГ - 2017 петух
	animation: -1,
	animationk: 10,
	desc: "Местом происшествия является площадь городского типа. Конфликтная ситуация произошла при значительном скоплении людей, находящихся в состоянии отдыха.<br>Как показали свидетели, Потерпевший направлялся на своем движущем средстве в сопровождении юной гражданки неустановленной личности к выходу с территории площади. Дорогу ему преградил мужчина пенсионного возраста в странном головном уборе. Он начал требовать от Потерпевшего чего-то в агрессивной форме.<br>На что получил явный отказ. После чего пенсионер вступил в пререкания с потерпевшим с использованием рук в виде кулаков, чем привел Потерпевшего в волнительное состояние головы.<br>Потерпевший возбудил себя психически и, сильно размахнувшись, ударил тяжелым тупым предметом, хорошо известным свидетелям как лом декоративный или &quot;жезл&quot; (см.рис.7-55/14), который оказался в его руке и, как установили позднее дознавательные мероприятия, являлся неким &quot;атрибутом власти&quot; по словам самого потерпевшего, в лоб мужчины, чем поверг его на землю в пылевое покрытие площади.<br>Как показали свидетели, убитый пенсионер не вызвал у спутницы Потерпевшего негативных эмоций, она даже проявила признаки веселости. Потерпевший же несколько взволновался, но они продолжили свой путь в сторону своего предыдущего движения.<br>На выезде Потерпевшего с площади города, свидетели показали слышимость громкого звонкого звука наподобие музыкальной мелодии. Далее показания свидетелей разнятся. Одна часть свидетельствующих граждан показала, что со стороны верха на голову Потерпевшего приземлилась некая особь явно дикого мира, ярких окрасок и с крыльями. После послышался звук, охарактеризованный свидетелями как сухой, громкий и восклик Потерпевшего. После чего потерпевший выпал из своего транспортного средства, которое принадлежало ему на правах наследования, о чем свидетельствуют документы из приложения 7 за №7-14-1/1, и стоящему на регистрации по месту проживания Потерпевшего.<br>Вторая группа свидетелей показывала спутанные различные факты несвязанные друг с другом, и противоречивые с точки зрения показаний данных ранее этими же свидетелями. Они отражены в приложении 3.<br>Осмотр тела трупа показал нахождение тела Потерпевшего в частично горизонтальном положении. Частично лежащем на земле задней стороной человека, в простонародье называемой &quot;зад&quot;, а частично спинной частью прислонившись к стене зданий №1/12 по Старой улице в 3 метрах от центрального входа. Было обнаружено наличие в области темени головы Потерпевшего ранение. Голова и грудь были накрыты пятном образованным веществом темно-бурого цвета, влажное, диаметром 10-20 см, в головной части пятна — небольшое отверстие - продавленное - конической формы - порвана кожа. Попытка задержать спутницу Потерпевшего не привела к задержанию. По городу был объявлен план &quot;Перехват&quot;, также не принесший значительных результатов.",
	name: "Пётр Петрович Галлус",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// НГ - 2018 собака за жопу кусака
	animation: -1,
	animationk: 10,
	desc: "–··––·<br>   ··––·– <br>  –··–·   ––··–– <br> –··–· ·· ––– –––  ––··–– <br>–·––·– ··––·– ··   –··–· ··––·– –·––·–<br> ··––·– ·––––· ·––·–· –··–· ··––·–  ––··––    ··––·– <br>··      ··  ––··––   ––··–– ––··–– <br>··  –·––·– ––– –·––·– ··   ––··––  –·––·––·––·–<br>·· ··––·–  ··–  ··––·– ··  –··–·  ···–  –··–· <br> ··––·– –··–· –··–·  ·· ··  ··––·– ––··––  –··–· <br>–·––·– ··––·– –··–· –·––·– ··––·–  ·· –·––·– ··––·– ··––·– –··–· <br>·–·–·",
	name: "φDoge",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// Pigletto
	animation: -1,
	animationk: 10,
	desc: ".......————..———.—...—..——........—————.——..————..—.———.———.—————..—...—.—.....—.—.———..——.—.—...—..—...—.—.....—————.——.——.—.—...—..—...—.—.—..—.....——.——.——.—...—..—————.—.—..—..——.—.—.——.—.—————........—.—.—.—.—.—.—.—.—.—.......————————.——..—.—.——......————————.—.....——.———..——.—..—.—.—.....——...——.—..———...——.—..—..——..—....—...—..——.———.....——.—.——.——.—..—.———————...——.—.....———.—.——....—.———.—.—.———.—.—.———...————...—.——.——..—.—.——..—.——.——.—.—..———...—.————.———...—.....—.————...———.—.—..————.——.—...——.——...—..—.—.——...—.—.————————.—.——.—..—.—...——..——————..—...—.—.——...—.——..—..—.———.——.—.—....—..—.—..——.....—..——..—.——.—.—.——.—.————...—.—....———........——.——————..—.—...—...——.—.—————————.—.—...——.—..——.——.——.—..——..—.——.——————..——.——.———.—.——..——.——....——.—.——.......—.....——...——...——.—————...——.—.....——..————————.——.————.....———.———.—.—........——————.—...————...—.—.—..—.—————.—..————.——..—————.———...——.—...—.—..———.—..——....—......—.—.—...—.—.—....—.—..——.———.——...—..—...—.—.——...—...——.—..——..—————.—————.——.—.—...——.——.——————...——.......—...—..—.—.————....—.———.—",
	name: "дон Пятачон",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Информация засекречена. Секретно засекречена в секретном месте.",
	name: "Резервный юнит",
	era: 0,
	tactic: 0,
}, {
	// Мороз
	name: "Дед",
}, {
	// Снегурка
	name: "Внучка",
}, {
	// Лось
	name: "Лось",
}];



function UnitTmpl(id, count) {
	this.id = id;
	this.count = count||1;
	
	this.data = {};
	this.data.code = Unit.getCode(this.id);
	
	if( this.id >= Unit.ids.tmplStart && this.id <= Unit.ids.tmplEnd ){
		var unitIdCount = UnitTmpl.toUnitIdCount(this.id, this.count);
		
		this.id = unitIdCount.id;
		this.count = unitIdCount.count;
	}
}

utils.extend(UnitTmpl, Unit);

UnitTmpl.prototype.isTemplate = function() {
	return true;
};

UnitTmpl.prototype.getName = function() {
	var name = (this.isTmplFirstTagNeg() ? 'Не ' : '') + Unit.getTagName(this.getTmplFirstTag());
	
	if( this.getTmplSecondTag() )
		name += ' и ' + (this.getTmplPriority() ? 'Желательно ' : '') + (this.isTmplSecondTagNeg() ? 'Не ' : '') + Unit.getTagName(this.getTmplSecondTag());
	
	return name.toLowerCase();
};

UnitTmpl.prototype.getBattleCost = function() {
	return 1;
};


UnitTmpl.toUnitIdCount = function(id, count){
	if( count > Unit.ids.tmplSecondNegLimit ){
		id |= Unit.ids.tmplSecondNegOffset;
		count -= Unit.ids.tmplSecondNegLimit;
	}
	if( count > Unit.ids.tmplFirstNegLimit ){
		id |= Unit.ids.tmplFirstNegOffset;
		count -= Unit.ids.tmplFirstNegLimit;
	}
	if( count > Unit.ids.tmplPriorLimit ){
		id |= Unit.ids.tmplPriorOffset;
		count -= Unit.ids.tmplPriorLimit;
	}
	
	return {id: id, count: count};
};

UnitTmpl.toTmplIdCount = function(unit, id, count){
	if( unit.isTmplSecondTagNeg() ){
		id ^= Unit.ids.tmplSecondNegOffset;
		count += Unit.ids.tmplSecondNegLimit;
	}
	if( unit.isTmplFirstTagNeg() ){
		id ^= Unit.ids.tmplFirstNegOffset;
		count += Unit.ids.tmplFirstNegLimit;
	}
	if( unit.getTmplPriority() ){
		id ^= Unit.ids.tmplPriorOffset;
		count += Unit.ids.tmplPriorLimit;
	}
	
	return {id: id, count: count};
};


function UnitFort(id, count) {
	this.id = id||Unit.ids.fort;
	this.count = count||0;
	
	this.data = {};
	
	this.data.code = Unit.tagCodes.fort;
}

utils.extend(UnitFort, Unit);

UnitFort.prototype.isFort = function() {
	return true;
};

UnitFort.prototype.getName = function() {
	return 'Линии обороны на поле боя';
};

UnitFort.prototype.getBattleCost = function(){return 1;};



function UnitAny(id, count) {
	this.id = id||Unit.ids.any;
	this.count = count||0;
	
	this.data = {};
	
	this.data.code = Unit.tagCodes.any;
}

utils.extend(UnitAny, Unit);

UnitAny.prototype.isAny = function() {
	return true;
};

UnitAny.prototype.getName = function() {
	return 'Любые войска';
};

UnitAny.prototype.getBattleCost = function(){return 1;};