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
		case Unit.type.no: return 'No';
		case Unit.type.trooper: return 'Infantry';
		case Unit.type.horseman: return 'Cavalry';
		case Unit.type.tech: return 'Machinery';
		case Unit.type.boat: return 'Ship';
		case Unit.type.air: return 'Air unit';
		case Unit.type.space: return 'SS component part';
	}
	return '';
};

Unit.getGroupNameW = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Attack';
		case Unit.group.reserve: return 'Reserve';
		case Unit.group.distance: return 'Underwater attack';
	}
	return '';
};

Unit.getGroupName = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Attack';
		case Unit.group.reserve: return 'Reserve';
		case Unit.group.distance: return 'Ranged';
		case Unit.group.torear: return 'Bypass';
		case Unit.group.flank: return 'Flank';
	}
	return '';
};

Unit.getAbilityCount = function() {
	return utils.sizeOf(Unit.ability) - 1;
};

Unit.getAbilityName = function(ability) {
	switch (ability) {
		case 0: return 'No';
		case 1: return 'Offensive expert';
		case 2: return 'Defensive expert';
		case 3: return 'Founder';
		case 4: return 'Builder';
		case 5: return 'Demolisher';
		case 6: return 'Shy';
		case 7: return 'Cutthroat';
		case 9: return 'Mass damage';
		case 10: return 'Pillage team (warriors)';
		case 11: return 'Scouting';
		case 12: return 'Transport';
		case 13: return 'Depth charges';
		case 14: return 'Pillage team (militiamen)';
		case 15: return 'Professional';
		case 16: return 'Overcome the fortifications';
		case 17: return 'Shallow-water';
		case 18: return 'Deep-water';
		case 19: return 'Small defense radius';
		case 20: return 'Average defense radius';
		case 21: return 'Large defense radius';
		case 22: return 'Peacekeeper';
		case 23: return 'Nuclear attack';
		case 24: return 'Versatile';
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
		case Unit.tags.no: name = 'None'; break;
		case Unit.tags.organic: name = 'Living'; break;
		case Unit.tags.shooter: name = 'Shooter'; break;
		case Unit.tags.technics: name = 'Machine'; break;
		case Unit.tags.big: name = 'Giant'; break;
		case Unit.tags.mounted: name = 'Cavalry'; break;
		case Unit.tags.shielded: name = 'Shielded'; break;
		case Unit.tags.siege: name = 'Siege machine'; break;
		case Unit.tags.armored: name = 'Armored'; break;
		case Unit.tags.fueled: name = 'Fueled'; break;
		case Unit.tags.spaceship: name = 'Spaceship part'; break;
		case Unit.tags.aircraft: name = 'Aircraft'; break;
		case Unit.tags.ship: name = 'Fleet'; break;
		case Unit.tags.trooper: name = 'Infantry'; break;
		case Unit.tags.heavyarmored: name = 'Heavy armored'; break;
	}
	
	if( neg && tag != Unit.tags.no ){
		name = 'Not ' + utils.downFirstLetter(name);
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
	train: {name: 'train', text: 'Country payout for training: '}
};

//дополнительная информация по юнитам
Unit.lib = [{
	// Воин
	animation: 6,
	animationk: 10,
	desc: "Bloodthirsty and ugly as a cave cockroach. He lives only for battle, and wherever he goes, battle goes with him. His hunger for the kill is insatiable. His hands are knee-deep in blood.",
	name: "Warrior",
	era: 0,
	tactic: 0,
}, {
	// Пращник
	animation: 9,
	animationk: 10,
	desc: "The urchins who used to toss stones through their neighbors’ windows are now warriors who have turned their aptitude for vandalism into an art. Squadrons of these seasoned slingers strike terror into the hearts of their enemies, shattering flagons of ale with perfectly-aimed shots.",
	name: "Slinger",
	era: 0,
	tactic: 1,
}, {
	// Копейщик
	animation: 20,
	animationk: 10,
	desc: "Not every man with a lance is a lance knight, but every lance knight is a real man - a strong shoulder for a kind countrywoman, a stalwart protector of the little ones, and a terror to his foes.",
	name: "Lance knight",
	era: 1,
	tactic: 0,
}, {
	// Топорщик
	animation: 23,
	animationk: 10,
	desc: "One day these peaceful, good-natured forest rangers were caught unawares in their secluded abodes by a horde of rabid squirrels. This terrible cataclysm turned these once meek and merry folk into ruthless warriors.",
	name: "Axeman",
	era: 2,
	tactic: 0,
}, {
	// Пикинер
	animation: 40,
	animationk: 10,
	desc: "A true «entomologist» of the battlefield.<br>Their pikes are sharp. Their hands are strong. Their nerves are like steel cables.",
	name: "Pikeman",
	era: 3,
	tactic: 0,
}, {
	// Бомбарда
	animation: 62,
	animationk: 10,
	desc: "",
	name: "Bombard",
	era: 4,
	tactic: 4,
}, {
	// Бомбардирский корабль
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Bombardier ship",
	era: 4,
	tactic: 6,
}, {
	// Пароход
	animation: -1,
	animationk: 10,
	desc: "Forget all about unreliable sails and smelly, pitch-soaked rigging - steam power is the wave of the future! Get with the program!",
	name: "Steamboat",
	era: 5,
	tactic: 6,
}, {
	// Метатель дротиков
	animation: 9,
	animationk: 10,
	desc: "",
	name: "Javelin thrower",
	era: 0,
	tactic: 1,
}, {
	// Трирема
	animation: -1,
	animationk: 10,
	desc: "Do you love the open water? Are you obsessed with rowing? Well, the trireme is the answer to your prayers! Enjoy a wide selection of oars, comfy benches, new acquaintances, and lots and lots of unforgettable experiences. Grow your career from slave to freelance oarsman, all to the tune of clashing steel and the moans of your enemies - now that’s a man’s job! Go ahead, see the world today!",
	name: "Trireme",
	era: 2,
	tactic: 6,
}, {
	// Ладья
	animation: -1,
	animationk: 10,
	desc: "From a naturally occurring plot of land, surrounded by water on all sides and constantly surging above the flow - even during high tide, to the line where all points converge with the river’s maximum surface velocity, and further to the vast open space beyond as it fluctuates due to shifts of gravimetric energy in the water column combined with external forces, employing the energy of large transferred air masses and the first law of Archimedes, keel-less rowboats, covered in ethnic etchings, hewn from a single tree trunk into a specific aerodynamic form, alter their geographical coordinates.",
	name: "Bark",
	era: 3,
	tactic: 6,
}, {
	// Боевой слон
	animation: -1,
	animationk: 10,
	desc: "A huge beast with a serious attitude problem. It routinely tramples crops, gnaws bushes, and scares away domestic animals. The only plus - sometimes you can sic it on your neighbor’s farm.<br>Not to mention the pleasure of finishing off a dying enemy from the relative safety of a battle elephant’s back.",
	name: "Battle elephant",
	era: 3,
	tactic: 3,
}, {
	// Дубинщик
	animation: 6,
	animationk: 10,
	desc: "The emergence of macemen as a military unit is strongly connected with evolutionary theory. When the first monkey took up a stick and smashed its confrere in the dome, the glorious tradition of these valiant warriors was born.",
	name: "Maceman",
	era: 0,
	tactic: 0,
}, {
	// Всадник
	animation: 15,
	animationk: 10,
	desc: "You’ll never see these dashing lads resting idly by the fire or peeking up the skirts of cute country girls. They live and breathe freedom, refusing the bonds of home and hearth. Summoned by the eternal call of the wind and the thunder of hooves, they yearn only for the open road, and horse blankets are the only bedding they need.",
	name: "Horseman",
	era: 1,
	tactic: 2,
}, {
	// Бронеавтомобиль
	animation: 81,
	animationk: 10,
	desc: "With a cheerful clinking of steel screws, this engineering wonder - the armored car - reveals itself to the crowd, bathed in plumes of acidic yellow smoke. This wonderfully versatile device can satisfy even the most demanding citizens. It’s guaranteed to stop enemies in their tracks no matter what they throw at it. Some daring individuals love to clamber on top of it and, inspired by the shouting mob around them, point the way to a bright future.",
	name: "Armored car",
	era: 6,
	tactic: 1,
}, {
	// Драгун
	animation: 68,
	animationk: 10,
	desc: "What happens when you put a musketeer on a horse? You get a Dragoon! Happy folks who don&#39;t have to walk and take great joy in charging towards enemy lines, firing away once their musketeer cousins have done most of the damage. As a result they get all the glory and women with minimal hurt. And keep their glorious whiskers intact!",
	name: "Dragoon",
	era: 4,
	tactic: 1,
}, {
	// Колесница
	animation: 18,
	animationk: 10,
	desc: "The battle carts creak frighteningly even when they’re out of commission. Their heavy wheels can be extremely dangerous when thrown from their axis.",
	name: "Chariot",
	era: 1,
	tactic: 2,
}, {
	// Автоматчик
	animation: 71,
	animationk: 10,
	desc: "This delightful fellow will be more than happy to increase your iron intake to the requisite fatal level.",
	name: "Submachine gunner",
	era: 6,
	tactic: 0,
}, {
	// Пулеметчик
	animation: 73,
	animationk: 10,
	desc: "All real machine gunners are lone-wolf types. Because they’re scary. Because they’re half-blind from the glint of the sun’s rays on their machine guns. Because they’re half-deaf from their weapons’ thunderous rumble. Because their hands are disfigured by countless burns from the sizzling steam of their white-hot muzzles. Because the endless bath of gunpowder smoke from their machine guns has provided them with a certain musky odor. But they’re happy, for it is their machine guns that give their lives meaning.",
	name: "Machine gunner",
	era: 5,
	tactic: 1,
}, {
	// Лёгкий танк
	animation: 87,
	animationk: 10,
	desc: "What could make your holiday more memorable than the diesel stink of a huge tank as it crashes through your backyard first thing in the morning? Its matte barrel, gleaming in the dawn sun as it protrudes from the old chicken coop, will raise your spirits in a second. Call up your friends, load some provisions into the womb of this clanking monstrosity, and set off for a lovely picnic in the country.",
	name: "Light tank",
	era: 6,
	tactic: 2,
}, {
	// Метатель бола
	animation: 9,
	animationk: 10,
	desc: "With a flick of your wrist your victim will turn into a swaddled doll, no more dangerous than a baby.",
	name: "Bola thrower",
	era: 2,
	tactic: 1,
}, {
	// Дивизионная пушка
	animation: 82,
	animationk: 10,
	desc: "A big wheel, the roar of an engine, the tangy smell of fuel, a Super Secret Plan, but what’s the point? The point is to hand over the shells on time!",
	name: "Squadron cannon",
	era: 6,
	tactic: 3,
}, {
	// Пехотинец
	animation: 72,
	animationk: 10,
	desc: "&quot;What is the spirit of the bayonet?&quot; ... &quot;To kill, kill, kill, with the cold blue steel!&quot;. &quot;What makes the grass grow?&quot; ... &quot;Blood, blood, blood!&quot;",
	name: "Soldier",
	era: 5,
	tactic: 0,
}, {
	// Длинный лук
	animation: 43,
	animationk: 10,
	desc: "They might be simple fellows, but their bows - not so much. These chaps love nothing more than to gather around the fire at night and compare their beloved tools of the trade. Sure, sometimes they overdo it. They tend to be very aware of how special they are, sometimes looking down their noses at other people. And no wonder, since it takes strong, firm hands to master such a long bow.",
	name: "Longbow",
	era: 3,
	tactic: 1,
}, {
	// Кирасир
	animation: 34,
	animationk: 10,
	desc: "its a good day to die.",
	name: "Cuirassier",
	era: 4,
	tactic: 2,
}, {
	// Мушкетер
	animation: 61,
	animationk: 10,
	desc: "Whiskered wiseacres. They enliven the drudgery of wartime by propelling well-aimed iron balls from their long, sturdy muskets into lines of incredulous foes.<br>Their turn-ons include wine, women, and duels to the death; their only turn-off: misfires.",
	name: "Musketeer",
	era: 4,
	tactic: 1,
}, {
	// Егерь
	animation: 74,
	animationk: 10,
	desc: "",
	name: "Ranger",
	era: 5,
	tactic: 1,
}, {
	// Кавалерист
	animation: 70,
	animationk: 10,
	desc: "More often than not, the ability to twirl one’s moustache was the main criterion for acceptance into the cavalry. But the bravery, courage and quick wits of these fellows were also legendary. Attacking from the rear, they would cause chaos not only among the enemy ranks, but also among packs of enemy wenches, thus stripping their foes of the last vestige of their reason and will to victory.",
	name: "Cavalryman",
	era: 5,
	tactic: 2,
}, {
	// Алебардщик
	animation: 40,
	animationk: 10,
	desc: "Nothing to say for now.",
	name: "Halberdier",
	era: 4,
	tactic: 0,
}, {
	// Арбалетчик
	animation: 25,
	animationk: 10,
	desc: "An aggressive, unprincipled, and altogether very unpleasant fellow.",
	name: "Crossbowman",
	era: 2,
	tactic: 1,
}, {
	// Гренадер
	animation: 60,
	animationk: 10,
	desc: "The soul of the party. Mildly strong and very healthy, they can carry up to four scores and seven units of beer and snacks. Just don&#39;t ask them to throw a joke. Once you send them to ruin another city, you can be sure they will deliver a lot of damage around. Even if they are slow dancers, they are not the favorites of the ladies, but this happy guys are a blast.",
	name: "Grenadier",
	era: 4,
	tactic: 1,
}, {
	// Современный танк
	animation: 88,
	animationk: 10,
	desc: "An armored giant, a leviathan of war that shakes the earth and sows the seeds of terror in its enemies’ souls.",
	name: "Modern tank",
	era: 8,
	tactic: 2,
}, {
	// Рыцарь
	animation: 34,
	animationk: 10,
	desc: "Knight:<br>a) Noble yet arrogant<br>b) Well-groomed yet bath-averse<br>c) Vicious yet timid<br>d) Gallant yet, uh, «festive.» Take your pick.",
	name: "Knight",
	era: 3,
	tactic: 2,
}, {
	// Самурай
	animation: 33,
	animationk: 10,
	desc: "Have you ever been disemboweled by a katana? No? Then you’re in luck, since it’s usually deadly and, if done by an experienced samurai, ridiculously awesome.",
	name: "Samurai",
	era: 3,
	tactic: 0,
}, {
	// Галера
	animation: -1,
	animationk: 10,
	desc: "A true sailor can do two things well: he can row, and he can not row. He can also beat the waters into a roiling froth, but this will require a bit more rowing than usual.",
	name: "Galley",
	era: 1,
	tactic: 6,
}, {
	// Разведчик
	animation: 31,
	animationk: 10,
	desc: "Do you ever wonder what’s going on behind your neighbor’s high fence? Do you want to accurately assess your chances at war? Or do you simply love to meddle in everybody else’s business? If you answered «yes» to any of these questions, then you need scouts! Real professionals choose scouts for all their reconnaissance needs.",
	name: "Scout",
	era: 3,
	tactic: 5,
}, {
	// Лучник
	animation: 7,
	animationk: 10,
	desc: "The quantity of archers in a given region is directly proportional to the number of one-eyed squirrels in the vicinity. ",
	name: "Archer",
	era: 1,
	tactic: 1,
}, {
	// Мечник
	animation: 23,
	animationk: 10,
	desc: "What’s worse then a bunch of unshaven mooks with rusty iron pokers?",
	name: "Swordsman",
	era: 2,
	tactic: 0,
}, {
	// Пушка
	animation: 63,
	animationk: 10,
	desc: "",
	name: "Cannon",
	era: 4,
	tactic: 4,
}, {
	// Мортира
	animation: 62,
	animationk: 10,
	desc: "",
	name: "Mortar",
	era: 4,
	tactic: 4,
}, {
	// Гвардеец
	animation: 69,
	animationk: 10,
	desc: "Only the most worthy men are chosen for the guard. The list of requirements includes:<br>- playing cards;<br>- drinking alcoholic beverages;<br>- inflated self-esteem.<br>That’s why guards, enraged by wine and idleness, are in such a hurry to join the fray, crushing both friend and foe in their path.",
	name: "Guardsman",
	era: 4,
	tactic: 0,
}, {
	// Катапульта
	animation: 8,
	animationk: 10,
	desc: "A projectile machine, spring-loaded and ready for action. Catapults bombard enemy positions during battle, then damage a city’s buildings after victory.",
	name: "Catapult",
	era: 2,
	tactic: 4,
}, {
	// Рутта
	animation: 26,
	animationk: 10,
	desc: '<span class="-adobe-font">Th3 m0ar puzzl1ng is th3 n4m3 0v th3 t3ns10n r0t0r. T3ns10n should3r r0tati0n cre4tes an opp0rtun1tУ to bu1ld 4 str0ng dr1v1ng f0rc3. With th3 l4unch 0f th3 rot4ting d3s1gn, r0tat3 it 0ff th3 initi4l elast1c fast3ning surf4c3 with 4 ro7a71ng drУing fish sen7 flУing in7o the 4ir r1ng d1r3cti0n, to b3gin to rev3rse the d347h.</span>',
	name: "Springald",
	era: 3,
	tactic: 1,
}, {
	// Поселенец
	animation: 19,
	animationk: 8,
	desc: "Settlers are used to found new cities. They can be trained in a shrine, residence, castle, city hall, or mayor’s office.",
	name: "Settler",
	era: 1,
	tactic: 5,
}, {
	// Моргенштерн
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Morgenstern",
	era: 3,
	tactic: 0,
}, {
	// Онагр
	animation: 8,
	animationk: 10,
	desc: "",
	name: "Onager",
	era: 2,
	tactic: 4,
}, {
	// Требушет
	animation: 8,
	animationk: 10,
	desc: "",
	name: "Trebuchet",
	era: 3,
	tactic: 4,
}, {
	// Гранатометчик
	animation: 78,
	animationk: 10,
	desc: "",
	name: "Grenade launcher",
	era: 8,
	tactic: 0,
}, {
	// Лодка
	animation: -1,
	animationk: 10,
	desc: "A boat is comprised of a powerful keel, a wooden frame, and planks laid over that frame. The boat’s fearless crew is comprised of three men, not counting a versatile dog. Throughout their lengthy voyage, this dog will brighten the crew’s everyday life by howling mournful songs from the keel. During battle, the dog can be used as a «raven’s beak» - just tie a sturdy rope to its tail and toss it onto an enemy ship while the crew dukes it out with heavy oak oars. The dog usually has to be replaced after every battle, so it’s a good thing there’s always plenty of strays around.",
	name: "Boat",
	era: 0,
	tactic: 6,
}, {
	// Каноэ
	animation: -1,
	animationk: 10,
	desc: "Take a boat, change its dog to a crocodile, and presto - you get a canoe. Using a crocodile is way more difficult, however, which is why the crew of a canoe has to be not only brave, but also quick and deft. But wait, it gets better - just spruce the crocodile up with a few feathers and you can worship it without interrupting your trip, which has been proven to positively affect both the canoe’s mobility and next year’s crops.",
	name: "Canoe",
	era: 0,
	tactic: 6,
}, {
	// Пехотинец
	animation: 77,
	animationk: 10,
	desc: "It takes bravery to jump from the skies, dangling under little more than an oversize tent. But it takes a special type of bravery to do so willingly, from a perfectly working aircraft, time and time again. Plus, as the poor soldiers who have to walk to their battles say, a fair bit of stupidity. They&#39;re just jealous.",
	name: "Infantry",
	era: 8,
	tactic: 0,
}, {
	// Конный лучник
	animation: 15,
	animationk: 10,
	desc: "Reckless and cheery fellas. In the morning - grumpy and sinister. Can be understood. Their life’s hard. Their routine’s brutal. And horses… well, horses are OK.",
	name: "Horse archer",
	era: 1,
	tactic: 1,
}, {
	// Конный арбалетчик
	animation: 15,
	animationk: 10,
	desc: "Hardened veterans who enjoy the esteem of the entire military caste.<br>They have a simple motto: I came, I saw, I shot. If you were in their shoes, it would be the same for you. After all, what could be more entertaining than aiming your favorite crossbow at some carelessly prominent nitwit and slowly squeezing the trigger?",
	name: "Horse crossbowman",
	era: 2,
	tactic: 1,
}, {
	// Каравелла
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Caravel",
	era: 3,
	tactic: 6,
}, {
	// Фрегат
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Frigate",
	era: 4,
	tactic: 6,
}, {
	// Галеон
	animation: -1,
	animationk: 10,
	desc: "Want a pool for your morning exercises? A tennis court in the evening? A friendly round of golf? And all of it accompanied by the gentle rocking of waves? No problem! Seven decks and up to 2,000 tons will do you one better! Allow me to introduce you to the height of perfection - a Galleon!",
	name: "Galleon",
	era: 4,
	tactic: 6,
}, {
	// Рабочий
	animation: 14,
	animationk: 8,
	desc: "You need workers to colonize deposits and build roads, but training them is no joke - it takes a lot of people and a lot of time. After all, only to the best of the best, the most hard-working and reliable can be entrusted with the precious and intricately decorated family shovels. Friends and family send them off to perform their feats of labor with tears in their eyes, knowing that no worker has ever left to colonize a deposit and returned to tell the tale.",
	name: "Worker",
	era: 0,
	tactic: 5,
}, {
	// Ополченец
	animation: 17,
	animationk: 10,
	desc: "They’re most terrifying in groups, when the strong smell of garlic and moonshine wafting from a neighbor’s shoulder turns them into beasts.<br>Not to mention that the pitchforks in their capable hands turn into universal devices capable of scratching your wife’s back, disemboweling an invader, and even pitching rotten hay.",
	name: "Militiaman",
	era: 1,
	tactic: 0,
}, {
	// Реактивная артиллерия
	animation: 90,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Rocket artillery",
	era: 8,
	tactic: 3,
}, {
	// Мотопехота
	animation: 86,
	animationk: 10,
	desc: "",
	name: "Infantry fighting vehicle",
	era: 8,
	tactic: 1,
}, {
	// КК Двигатель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "SS Engine",
	era: 7,
	tactic: 8,
}, {
	// КК Рубка
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "SS Cockpit",
	era: 7,
	tactic: 8,
}, {
	// КК Обшивка
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "SS Hull",
	era: 7,
	tactic: 8,
}, {
	// КК Топливный бак
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "SS Fuel tank",
	era: 7,
	tactic: 8,
}, {
	// КК Солнечная батарея
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "SS Solar-cell array",
	era: 7,
	tactic: 8,
}, {
	// КК Модуль обеспечения
	animation: -1,
	animationk: 10,
	desc: "",
	name: "SS Support module",
	era: 7,
	tactic: 8,
}, {
	// Миноносец
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Ironclad",
	era: 6,
	tactic: 6,
}, {
	// Эсминец
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Destroyer",
	era: 7,
	tactic: 6,
}, {
	// Транспортный корабль
	animation: -1,
	animationk: 10,
	desc: "What really astounds you is the belly of this barge - it’s seemingly bottomless! And it’s none too picky - troops, goods, passengers... it can swallow anything.<br>Its capacity will astound you! Its price will astound you! Its schedule will astound you! In a word - it’s an astounding ship!",
	name: "Transport ship",
	era: 7,
	tactic: 6,
}, {
	// Дредноут
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Dreadnought",
	era: 6,
	tactic: 6,
}, {
	// Подводная лодка
	animation: -1,
	animationk: 10,
	desc: "Emergency! Maximum velocity! Unextention! One-two-three. Attention waterpumps! Unextention. Get on board join the troop! Double-engine each for you. System activated. Unextention.",
	name: "Submarine",
	era: 6,
	tactic: 6,
}, {
	// Линкор
	animation: -1,
	animationk: 10,
	desc: "When this monster sails off, even the propellers of dreadnoughts start to tremble!<br>No one knows for certain whose idea it was to create this sea-monster, but its firepower is second to none.",
	name: "Battleship",
	era: 8,
	tactic: 6,
}, {
	// Атомная подводная лодка
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Nuclear submarine",
	era: 7,
	tactic: 6,
}, {
	// Крейсер
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Cruiser",
	era: 7,
	tactic: 6,
}, {
	// Дирижабль
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Dirigible",
	era: 5,
	tactic: 7,
}, {
	// Собака-робот
	animation: 76,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Robodog",
	era: 8,
	tactic: 2,
}, {
	// Снайпер
	animation: 79,
	animationk: 10,
	desc: "",
	name: "Sniper",
	era: 8,
	tactic: 0,
}, {
	// Джонка
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Junk",
	era: 1,
	tactic: 6,
}, {
	// Легионер
	animation: 24,
	animationk: 10,
	desc: "",
	name: "Legionary",
	era: 2,
	tactic: 0,
}, {
	// Воин-ягуар
	animation: 27,
	animationk: 10,
	desc: "",
	name: "Jaguar-warrior",
	era: 2,
	tactic: 0,
}, {
	// Чо-ко-ну
	animation: 25,
	animationk: 10,
	desc: "",
	name: "Chu-ko-nu",
	era: 2,
	tactic: 1,
}, {
	// Мотоциклист
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Motorcyclist",
	era: 6,
	tactic: 2,
}, {
	// Легкий истребитель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Lightweight fighter",
	era: 6,
	tactic: 7,
}, {
	// Легкий бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Light bomber",
	era: 6,
	tactic: 7,
}, {
	// Пикировщик
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Dive bomber",
	era: 6,
	tactic: 7,
}, {
	// Аэростат
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Aerostat",
	era: 4,
	tactic: 7,
}, {
	// Зенитное орудие
	animation: 83,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Air defense gun",
	era: 7,
	tactic: 3,
}, {
	// Тачанка ПВО
	animation: 80,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Mobile SAM",
	era: 5,
	tactic: 4,
}, {
	// Танк-ягуар
	animation: 89,
	animationk: 10,
	desc: "",
	name: "Jaguar tank",
	era: 7,
	tactic: 2,
}, {
	// Истребитель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Fighter aircraft",
	era: 7,
	tactic: 7,
}, {
	// Бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Coming in on a wing and the preyer!<br>Coming in on a wing and the preyer!<br>Though there&#39;s one motor gone<br>We can still carry on.",
	name: "Bomber aircraft",
	era: 7,
	tactic: 7,
}, {
	// Штурмовик
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Attack aircraft",
	era: 7,
	tactic: 7,
}, {
	// Двухместная колесница
	animation: 91,
	animationk: 10,
	desc: "",
	name: "Two-Seat Chariot",
	era: 1,
	tactic: 2,
}, {
	// НГ 2020
	imgId: '93_',
	animation: -1,
	animationk: 10,
	desc: "Komunikado inter la landoj perdiĝis, kaj tiuj, kiuj postvivis el la antaŭaj miliardoj batalis mortigan batalon pro ekzisto. Ne estas evidenteco de ĉi tiuj jarmiloj, sed la rezultoj estas evidentaj. Kaj la homaro estas regata de frenezo. Ili mortigas ĉiujn fremdulojn, tio donas al ili plezuron, kaj ili mem estas strangaj unu al la alia.",
	name: "Slippery Rat",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// Реактивный истребитель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Jet fighter",
	era: 8,
	tactic: 7,
}, {
	// Реактивный бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "<br><br><br>",
	name: "Jet bomber",
	era: 8,
	tactic: 7,
}, {
	// Импи
	animation: 84,
	animationk: 10,
	desc: "",
	name: "Impi",
	era: 1,
	tactic: 0,
}, {
	// Мамлюк
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Mamluk",
	era: 4,
	tactic: 2,
}, {
	//Папмрусная лодка
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Papyrus Boat",
	era: 0,
	tactic: 6,
}, {
	// Латник
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Landsknecht",
	era: 3,
	tactic: 0,
}, {
	// Минометчик
	animation: -1,
	animationk: 10,
	desc: "Silently and obscure man with &quot;bang-boom&quot; pipe, give reason to think about meaning of life and infinity of space even behind true steel tank armor.",
	name: "Trench-mortar",
	era: 6,
	tactic: 0,
}, {
	//Конный пехотинец
	animation: 92,
	animationk: 10,
	desc: "",
	name: "Heavy tank",
	era: 7,
	tactic: 2,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "APC",
	era: 7,
	tactic: 1,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Rocket launcher",
	era: 7,
	tactic: 3,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Flamethrower",
	era: 7,
	tactic: 0,
}, {
	// ЗРПК
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "SPAAG",
	era: 8,
	tactic: 4,
}, {
	// Обезьяна
	animation: -1,
	animationk: 10,
	desc: "Ooh-ooh-ooh! Aah-aah-aah! Ook-ook-ook? Ook!",
	name: "dr.Horace W.",
	era: 0,
	tactic: 0,
	holiday: true
}, {
	// НГ - 2017 петух
	animation: -1,
	animationk: 10,
	desc: "Boy, thou uproarious shark of heaven, Slaughter of Elysium, Hearts on fire, aroused, enraptured, We will tolchock you on the rot and kick your grahzny vonny bum. What a twist!<br><br><br><br><br><br><br>",
	name: "Clocktwist R Chicken!",
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
	name: "Pigletto",
	era: 0,
	tactic: 0,
	holiday: true,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "This information is classified. Secretly classified, in a top secret location.",
	name: "Reserved",
	era: 0,
	tactic: 0,
}, {
	// Мороз
	name: "Santa",
}, {
	// Снегурка
	name: "Snowflake",
}, {
	// Лось
	name: "Deer",
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
	var name = (this.isTmplFirstTagNeg() ? 'Not ' : '') + Unit.getTagName(this.getTmplFirstTag());
	
	if( this.getTmplSecondTag() )
		name += ' and ' + (this.getTmplPriority() ? 'Desirable ' : '') + (this.isTmplSecondTagNeg() ? 'Not ' : '') + Unit.getTagName(this.getTmplSecondTag());
	
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
	return 'Defence lines on the battlefield';
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
	return 'Any troops';
};

UnitAny.prototype.getBattleCost = function(){return 1;};