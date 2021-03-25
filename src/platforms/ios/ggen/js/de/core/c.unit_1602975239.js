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
		case Unit.type.no: return 'Nein';
		case Unit.type.trooper: return 'Infanterie';
		case Unit.type.horseman: return 'Kavallerie';
		case Unit.type.tech: return 'Technik';
		case Unit.type.boat: return 'Schiff';
		case Unit.type.air: return 'Luftflotte';
		case Unit.type.space: return 'RS-Komponente';
	}
	return '';
};

Unit.getGroupNameW = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Angriff';
		case Unit.group.reserve: return 'Reserve';
		case Unit.group.distance: return 'Unterwasser-Angriff';
	}
	return '';
};

Unit.getGroupName = function(group) {
	switch (group) {
		case Unit.group.attack: return 'Angriff';
		case Unit.group.reserve: return 'Reserve';
		case Unit.group.distance: return 'Schützen';
		case Unit.group.torear: return 'Rundgang';
		case Unit.group.flank: return 'Flanke';
	}
	return '';
};

Unit.getAbilityCount = function() {
	return utils.sizeOf(Unit.ability) - 1;
};

Unit.getAbilityName = function(ability) {
	switch (ability) {
		case 0: return 'Nein';
		case 1: return 'Meister des Angriffs';
		case 2: return 'Meister der Verteidigung';
		case 3: return 'Stadtgründung';
		case 4: return 'Baumeister';
		case 5: return 'Zerstörer';
		case 6: return 'Schüchtern';
		case 7: return 'Völkermörder';
		case 9: return 'Massenschaden';
		case 10: return 'Raub-kommando (Krieger)';
		case 11: return 'Geheimdienst';
		case 12: return 'Transport';
		case 13: return 'Tiefen-Bomben';
		case 14: return 'Raub-kommando (Miliz)';
		case 15: return 'Profi';
		case 16: return 'Mauer-Überwindung';
		case 17: return 'Flachsee';
		case 18: return 'Tiefsee';
		case 19: return 'Kleiner Verteidigungsradius';
		case 20: return 'Mittlerer Verteidigungsradius';
		case 21: return 'Großer Verteidigungsradius';
		case 22: return 'Friedensstifter';
		case 23: return 'Nuklear-Angriff';
		case 24: return 'Vielseitig';
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
		case Unit.tags.no: name = 'Keine'; break;
		case Unit.tags.organic: name = 'Lebende'; break;
		case Unit.tags.shooter: name = 'Schütze'; break;
		case Unit.tags.technics: name = 'Maschine'; break;
		case Unit.tags.big: name = 'Gigant'; break;
		case Unit.tags.mounted: name = 'Kavallerie'; break;
		case Unit.tags.shielded: name = 'Schieldträger'; break;
		case Unit.tags.siege: name = 'Belagerung'; break;
		case Unit.tags.armored: name = 'Gepanzert'; break;
		case Unit.tags.fueled: name = 'Betankt'; break;
		case Unit.tags.spaceship: name = 'Raumschiff-Komponente'; break;
		case Unit.tags.aircraft: name = 'Luftflitte'; break;
		case Unit.tags.ship: name = 'Flotte'; break;
		case Unit.tags.trooper: name = 'Infanterie'; break;
		case Unit.tags.heavyarmored: name = 'Schwer gepanzert'; break;
	}
	
	if( neg && tag != Unit.tags.no ){
		name = 'Nicht ' + utils.downFirstLetter(name);
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
	train: {name: 'train', text: 'Länderauszahlung für das Training: '}
};

//дополнительная информация по юнитам
Unit.lib = [{
	// Воин
	animation: 6,
	animationk: 10,
	desc: "Blutrünstig und schrecklich wie eine Höhlen-Kakerlake. Er lebt nur im Kampf. Und überall wo er ist, gibt es Kampf. Sein Drang zu morden ist unaufhaltsam, seine Hände sind bis zu den Knien mit Blut verschmiert.",
	name: "Krieger",
	era: 0,
	tactic: 0,
}, {
	// Пращник
	animation: 9,
	animationk: 10,
	desc: "Früher waren sie Straßenkinder, die die Nachbarsfenster zerschlugen. Heute sind sie Krieger, die ihre Rowdy-Fähigkeiten bis zur Perfektion trainiert haben. Heere von Schleuderer-Veteranen jagen dem Gegner schrecken ein, indem sie die Gefäße mit Bier zielgenau abschießen.",
	name: "Schleuderer",
	era: 0,
	tactic: 1,
}, {
	// Копейщик
	animation: 20,
	animationk: 10,
	desc: "Nicht jeder Mann mit einem Speer ist ein Speerkämpfer! Aber jeder Speerkämpfer ist ein echter Mann! Eine feste Schulter für ein nettes Dorfmädchen, treuer Verteidiger von kleinen Kindern, Schrecken für jeden Gegner.",
	name: "Speerkämpfer",
	era: 1,
	tactic: 0,
}, {
	// Топорщик
	animation: 23,
	animationk: 10,
	desc: "Vor langer Zeit hat eine Horde von wilden Eichhörnchen die netten und gutherzigen Förstner in ihren Wohnungen überrascht. Eine schreckliche Katastrophe hat diese fröhlichen und guten Menschen zu gnadenlosen Kriegern gemacht.",
	name: "Axtkämpfer",
	era: 2,
	tactic: 0,
}, {
	// Пикинер
	animation: 40,
	animationk: 10,
	desc: "Ein echter Kampf-«Entomologe».<br>Die Lanzen scharf, die Hände stark, die Nerven - aus Stahl.",
	name: "Lanzenträger",
	era: 3,
	tactic: 0,
}, {
	// Бомбарда
	animation: 62,
	animationk: 10,
	desc: "",
	name: "Bombarde",
	era: 4,
	tactic: 4,
}, {
	// Бомбардирский корабль
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Bombardierungsschiff",
	era: 4,
	tactic: 6,
}, {
	// Пароход
	animation: -1,
	animationk: 10,
	desc: "Es ist an der Zeit, diese unsicheren Segel zu vergessen! Und diese nach Teer riechenden Seile auch! Die Kraft des Dampfes! Das ist der nächste Schritt in die Zukunft! Mach du ihn auch!",
	name: "Dampfschiff",
	era: 5,
	tactic: 6,
}, {
	// Метатель дротиков
	animation: 9,
	animationk: 10,
	desc: "",
	name: "Speerwerfer",
	era: 0,
	tactic: 1,
}, {
	// Трирема
	animation: -1,
	animationk: 10,
	desc: "Sie lieben das Meer? Ihnen gefällt es, zu rudern? Dann ist die Triere Ihre Wahl! Eine große Auswahl an Paddeln, bequeme Bänke, neue Bekanntschaften und jede Menge neuer Eindrücke. Eine Karriereleiter vom Sklaven bis zum angestellten Paddler. Und das alles zu den Geräuschen des Kampfes und dem Stöhnen der Feinde! Eine Aufgabe für echte Männer! Mit uns werden Sie die ganze Welt bereisen!",
	name: "Trireme",
	era: 2,
	tactic: 6,
}, {
	// Ладья
	animation: -1,
	animationk: 10,
	desc: "Aus einem von Wasser umgebenen und sich ständig, auch bei der höchsten Flut, über dem Wasser erhobenen Stück Land eines natürlichen Ursprungs auf eine Linie, die die Punkte mit der größten oberflächlichen Fließgeschwindigkeit des Flusses verbindet, auf eine große offene Fläche, die als Ergebnis der Übertragung der im Wasser enthaltenen kinetischen Gravitationsenergie, im Zusammenhang mit den divh auf dieses Feld auswirkenden äußeren Faktoren, charakteristisch schwingt, wechseln die mit ethnischen Abbildungen bemalten Schiffe ohne Kiel, die aus einem ganzen Baumstamm geschnitzt wurden und eine spezifische aerodynamische Form besitzen, ihre geografischen Koordinaten, indem sie die Energie der sich bewegenden Luftmassen und das erste Gesetz von Archimedes für sich ausnutzen.",
	name: "Kahn",
	era: 3,
	tactic: 6,
}, {
	// Боевой слон
	animation: -1,
	animationk: 10,
	desc: "Eine große Bestie mit einem durch und durch nervigen Charakter. Sie vernichtet regelmäßig die Ernte, nagt die Sträucher ab und erschreckt die Haustiere. Einziger Vorteil - man kann sie rausjagen und dazu zwingen, das Gleiche auf der Farm des Nachbarn zu tun.<br>Außerdem ist es angenehm, einem sterbenden Gegner den Todesstoß zu geben und auf einem Kampf-Elefanten ist es außerdem noch ungefährlich.",
	name: "Kampfelefant",
	era: 3,
	tactic: 3,
}, {
	// Дубинщик
	animation: 6,
	animationk: 10,
	desc: "Das Auftauchen der Keulenschwinger als eine Art des Heeres ist unzertrennlich mit der Evolutionstheorie verbunden. Als der Affe zum ersten Mal einen Stock in die Hände nahm... und seinen Brüdern die Köpfe einschlug - da wurden auch die tollen Kampf-Traditionen dieser mutigen Krieger gezeugt.",
	name: "Keulenschwinger",
	era: 0,
	tactic: 0,
}, {
	// Всадник
	animation: 15,
	animationk: 10,
	desc: "Nicht viele sehen diese kühnen Jungs, wie sie sich am Feuer ausruhen oder den hübschen Dorfmädchen die Röcke hochziehen. Sie leben von der Freiheit. Keine Wohnung und kein Haushalt hält sie auf. Der ewige Ruf des Windes und der Lärm der Hufen ruft sie in den nächsten Feldzug. Und als Bett dient ihnen die Pferdedecke.",
	name: "Reiter",
	era: 1,
	tactic: 2,
}, {
	// Бронеавтомобиль
	animation: 81,
	animationk: 10,
	desc: "Fröhlich mit den Stahl-Bolzen klingelnd, offenbart sich in den Wolken des ätzenden gelben Rauchs zur Bewunderung der einfachen Menschen das Wunder der Ingenieur-Kunst - das Gepanzerte Auto. Dieses wunderbare multifunktionale Gerät ist bereit, fast alle Wünsche der Konsumenten zu erfüllen. Es hält den Gegner im Galopp auf, es zündet die eine oder die andere Hütte an und besonders flinke Persönlichkeiten streben danach, sich auf dem Dach aufzustellen und der jubelnden Menge Richtungen zum nächsten Horizont zu weisen.",
	name: "Panzerauto",
	era: 6,
	tactic: 1,
}, {
	// Драгун
	animation: 68,
	animationk: 10,
	desc: "",
	name: "Dragoner",
	era: 4,
	tactic: 1,
}, {
	// Колесница
	animation: 18,
	animationk: 10,
	desc: "Kampf-Kutschen quietschen bedrohlich, sogar wenn sie sich in der Reserve befinden. Die von der Achse geflogenen schweren Räder sind besonders gefährlich.",
	name: "Streitwagen",
	era: 1,
	tactic: 2,
}, {
	// Автоматчик
	animation: 71,
	animationk: 10,
	desc: "Dieser wunderbare Mensch erhöht ohne Fragen den Gehalt an Eisen in Ihrem Körper bis zum benötigten tödlichen Maß.",
	name: "SMG-Schütze",
	era: 6,
	tactic: 0,
}, {
	// Пулеметчик
	animation: 73,
	animationk: 10,
	desc: "Alle echten Kanoniere sind einsam. Denn sie sind angsteinflößend. Denn sie werden von dem Glanz der Sonne auf den Läufen ihrer Maschinengewehre früh blind. Denn sie sind etwas taub von dem donnergleichen Lärm ihrer Maschinengewehre. Denn ihre Hände sind von den Verbrennungen durch den heißen Dampf ihrer Maschinengewehre verunstaltet. Denn sie stinken und sind dreckig vom Ruß des Schießpulvers ihrer Maschinengewehre. Aber sie sind glücklich. Denn es sind ihre Maschinengewehre. Denn in ihnen, in den Maschinengewehren, besteht ihr Leben und Zweck.",
	name: "Kanonier",
	era: 5,
	tactic: 1,
}, {
	// Лёгкий танк
	animation: 87,
	animationk: 10,
	desc: "Was kann es an einem Feiertag besseres geben, als einen riesigen Panzer, der morgens im eigenen Garten gefunden wurde? Dieser im Sonnenschein matt glänzende Lauf, der freundlich aus dem alten Hühnerstall herausragt, wird Ihre Laune augenblicklich heben. Jetzt müssen Sie nur noch die besten Freunde versammeln, Essen in das Innere dieses schallenden Ungeheuers packen und schon können Sie getrost zum Picknick in das Nachbardorf aufbrechen.",
	name: "Leichter Panzer",
	era: 6,
	tactic: 2,
}, {
	// Метатель бола
	animation: 9,
	animationk: 10,
	desc: "Mit einer flüssigen Bewegung aus dem Handgelenk verwandelt sich das Opfer in eine zusammengebundene Puppe, die nicht gefährlicher ist als ein Baby.",
	name: "Bola-Werfer",
	era: 2,
	tactic: 1,
}, {
	// Дивизионная пушка
	animation: 82,
	animationk: 10,
	desc: "Großes Rad, Motorlärm, Kraftstoffgeruch, Sehr Geheimer Plan, aber was ist das Wichtigste? Rechtzeitig die Munition zu verabreichen!",
	name: "Divisionskanone",
	era: 6,
	tactic: 3,
}, {
	// Пехотинец
	animation: 72,
	animationk: 10,
	desc: "",
	name: "Soldat",
	era: 5,
	tactic: 0,
}, {
	// Длинный лук
	animation: 43,
	animationk: 10,
	desc: "Einfache Kerle mit nicht so einfachen Bögen. Wenn sie sich abends um das Lagerfeuer versammeln, können sie stundenlang ihre besten Stücke vergleichen. Sie sind laut und schauen von oben herab auf die anderen, denn sie fühlen ihre Außerwähltheit. Kein Wunder, denn nur wirklich kräftige und starke Arme können mit einem wirklich langen Bogen fertig werden.",
	name: "Langbogen",
	era: 3,
	tactic: 1,
}, {
	// Кирасир
	animation: 34,
	animationk: 10,
	desc: "its a good day to die.",
	name: "Kürassier",
	era: 4,
	tactic: 2,
}, {
	// Мушкетер
	animation: 61,
	animationk: 10,
	desc: "Schnurrbärtige Lachbolzen, die es in schwerer Kriegszeit lieben, gutes Schießpulver anzuzünden und die die Metallkugeln zielsicher aus ihren Musketen in die bleichen Gesichter der Gegner verschicken.<br>Diese flotten Burschen lieben den Wein, die Frauen, ein ehrliches Duell und hassen Fehlzündungen.",
	name: "Musketier",
	era: 4,
	tactic: 1,
}, {
	// Егерь
	animation: 74,
	animationk: 10,
	desc: "",
	name: "Jäger",
	era: 5,
	tactic: 1,
}, {
	// Кавалерист
	animation: 70,
	animationk: 10,
	desc: "Sehr oft ist das Können, den Schnurrbart um den Finger zu wickeln, das entscheidende Kriterium für die Aufnahme in die Kavallerie. Aber diese Kerle waren auch mutig, tapfer und gerissen. Wenn sie von hinten angriffen, verwirrten sie den Feind, wie einen Haufen kleiner Mädchen und nahmen ihm den Siegeswillen.",
	name: "Kavallerist",
	era: 5,
	tactic: 2,
}, {
	// Алебардщик
	animation: 40,
	animationk: 10,
	desc: "Nichts zu sagen.",
	name: "Hellebardier",
	era: 4,
	tactic: 0,
}, {
	// Арбалетчик
	animation: 25,
	animationk: 10,
	desc: "Aggressiver, Prinzipienloser und überhaupt sehr unangenehmer Typ.",
	name: "Armbrust-Schütze",
	era: 2,
	tactic: 1,
}, {
	// Гренадер
	animation: 60,
	animationk: 10,
	desc: "",
	name: "Grenadier",
	era: 4,
	tactic: 1,
}, {
	// Современный танк
	animation: 88,
	animationk: 10,
	desc: "Gepanzerter Riese, Leviathan des Krieges, der die Erde erschüttert und Angst in den Seelen der Gegner verbreitet.",
	name: "Moderner Panzer",
	era: 8,
	tactic: 2,
}, {
	// Рыцарь
	animation: 34,
	animationk: 10,
	desc: "Die Ritter sind:<br>a) Edel, aber arrogant<br>b) Sauber, aber stinkend<br>c) Todbringend, aber ängstlich<br>d) ...nun, d) ist halt einfach nur d)",
	name: "Ritter",
	era: 3,
	tactic: 2,
}, {
	// Самурай
	animation: 33,
	animationk: 10,
	desc: "Wurde Ihnen schon mal der Bauch mit einem Katana aufgeschlitzt? Nein? Dann haben Sie Glück, normalerweise ist das tödlich und in der Ausführung eines Samurai dazu noch eindrucksvoll!",
	name: "Samurai",
	era: 3,
	tactic: 0,
}, {
	// Галера
	animation: -1,
	animationk: 10,
	desc: "Ein echter Seemann kann zwei Sachen machen: Er kann rudern und, natürlich, auch nicht rudern. Auch kann er das ganze Meer aufwühlen. Nur muss er dafür mehr rudern, als sonst.",
	name: "Galeere",
	era: 1,
	tactic: 6,
}, {
	// Разведчик
	animation: 31,
	animationk: 10,
	desc: "Was passiert wohl bei dem Nachbarn hinter dem Zaun? Willst du deine Chancen im Krieg analysieren? Oder mischst du dich einfach nur gerne überall ein? Bei alledem hilft der Späher! Späher - die Wahl der Profis.",
	name: "Späher",
	era: 3,
	tactic: 5,
}, {
	// Лучник
	animation: 7,
	animationk: 10,
	desc: "Die Anzahl an Bogenschützen ist direkt proportional zu der Anzahl der einäugigen Eichhörnchen in der Gegend. ",
	name: "Bogenschütze",
	era: 1,
	tactic: 1,
}, {
	// Мечник
	animation: 23,
	animationk: 10,
	desc: "Was kann es schrecklicheres geben, als unrasierte Männer mit scharfen rostigen Eisenstücken in den kräftigen Armen...",
	name: "Schwertkämpfer",
	era: 2,
	tactic: 0,
}, {
	// Пушка
	animation: 63,
	animationk: 10,
	desc: "",
	name: "Kanone",
	era: 4,
	tactic: 4,
}, {
	// Мортира
	animation: 62,
	animationk: 10,
	desc: "",
	name: "Mörser",
	era: 4,
	tactic: 4,
}, {
	// Гвардеец
	animation: 69,
	animationk: 10,
	desc: "In die Garde werden nur die Würdigen aufgenommen. Liste der Anforderungen:<br>- Kartenspielen;<br>- Trinken alkoholischer Getränke;<br>- Erhöhtes Selbstbewusstsein.<br>Deshalb kämpfen die vom Wein und Nichtstun wild gewordenen Gardisten auch so heftig und vernichten alles auf ihrem Weg.",
	name: "Gardist",
	era: 4,
	tactic: 0,
}, {
	// Катапульта
	animation: 8,
	animationk: 10,
	desc: "Eine Wurfmaschine, die mit Hilfe der Elastizität der gedrehten Fasern betrieben wird. Im Kampf beschießt ein Katapult die Gegner und nach dem Sieg fügt es den Gebäuden einer Stadt Schaden zu.",
	name: "Katapult",
	era: 2,
	tactic: 4,
}, {
	// Рутта
	animation: 26,
	animationk: 10,
	desc: '<span class="-adobe-font">Eine Art Rammbock - ein Belagerungshaken, der dazu dient, Steine von der Mauer runterzureißen. Es gab auch andere Tricks - denn in so einer Konstruktion kann man nicht nur einen Rammbock platzieren! - aber die hatten keinen großen Erfolg.</span>',
	name: "Rutte",
	era: 3,
	tactic: 1,
}, {
	// Поселенец
	animation: 19,
	animationk: 8,
	desc: "Die Einsiedler sind dazu bestimmt, neue Städte zu gründen. Sie werden im Altar, der Residenz, dem Schloss, Rathaus oder der Administration vorbereitet.",
	name: "Siedler",
	era: 1,
	tactic: 5,
}, {
	// Моргенштерн
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Morgenstern",
	era: 3,
	tactic: 0,
}, {
	// Онагр
	animation: 8,
	animationk: 10,
	desc: "",
	name: "Schleuder",
	era: 2,
	tactic: 4,
}, {
	// Требушет
	animation: 8,
	animationk: 10,
	desc: "",
	name: "Blide",
	era: 3,
	tactic: 4,
}, {
	// Гранатометчик
	animation: 78,
	animationk: 10,
	desc: "",
	name: "Granatenwerfer",
	era: 8,
	tactic: 0,
}, {
	// Лодка
	animation: -1,
	animationk: 10,
	desc: "Ein Boot besteht aus einem kräftigen Kiel, Rippen aus Holz, und mit Spanten und Brettern auf diesen Rippen. Die tapfere Crew des Bootes besteht aus drei Menschen, ganz zu schweigen von einem multifunktionalen Hund. Im Laufe der langen Reise erfreut der Hund das Dasein der Crew mit klagenden Liedern auf dem Kiel. Während des Kampfes spielt der Hund die Rolle eines «Krähenschnabels» - er wird am Schwanz mit einem festen Seil angebunden, auf das feindliche Schiff geworfen und dann kämpft die Crew mithilfe von schweren Eichen-Paddeln. In der Regel muss man nach jedem Kampf den Hund austauschen - aber davon laufen so viele herum, dass das kein Problem ist.",
	name: "Boot",
	era: 0,
	tactic: 6,
}, {
	// Каноэ
	animation: -1,
	animationk: 10,
	desc: "Nehmen Sie das Boot, tauschen Sie den Hund gegen ein Krokodil aus und schon haben sie ein Kanu. Ein Krokodil zu benutzen ist wesentlich problematischer, deshalb ist die Crew eines Kanus nicht nur tapfer, sondern auch schnell und flink. Und wenn man das Krokodil auch noch mit Federn schmückt, dann kann man es anbeten, ohne den Weg abzubrechen, was sich nicht nur auf die Geschwindigkeitseigenschaften eines Kanus positiv auswirkt, sondern auch auf die zukünftige Ernte.",
	name: "Kanu",
	era: 0,
	tactic: 6,
}, {
	// Пехотинец
	animation: 77,
	animationk: 10,
	desc: "",
	name: "Infanterie",
	era: 8,
	tactic: 0,
}, {
	// Конный лучник
	animation: 15,
	animationk: 10,
	desc: "",
	name: "Reiter-Bogenschütze",
	era: 1,
	tactic: 1,
}, {
	// Конный арбалетчик
	animation: 15,
	animationk: 10,
	desc: "Veteranen, die in der Militär-Klasse geachtet werden.<br>Die Devise dieser Jungs ist einfach: er kam, er sah, er hat es erschossen. Ihr wärt an ihrer Stelle keinen Tick besser. Denn was kann es spannenderes geben, als die Lieblings-Armbrust auf einen Dummkopf zu richten, der sorglos in der Gegend steht, und den Abzug zu betätigen?",
	name: "Reiter-Armbrustschütze",
	era: 2,
	tactic: 1,
}, {
	// Каравелла
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Karavelle",
	era: 3,
	tactic: 6,
}, {
	// Фрегат
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Fregatte",
	era: 4,
	tactic: 6,
}, {
	// Галеон
	animation: -1,
	animationk: 10,
	desc: "Ein Pool für den Frühsport? Ein Tennisplatz für den Abend? Eine freundschaftliche Partie Golf? Und das alles zu sanftem Schaukeln des Meeres? Keine Frage! Mit sieben Decks und einer Wasserverdrängung von bis zu 2.000 Tonnen ist nicht nur das möglich! Darf ich vorstellen, die Perfektion - eine Galeone!",
	name: "Galeone",
	era: 4,
	tactic: 6,
}, {
	// Рабочий
	animation: 14,
	animationk: 8,
	desc: "Arbeiter werden für die Kolonisierung von Vorkommen und den Bau von Straßen benötigt. Für deren Ausbildung braucht man viele Menschen und noch viel mehr Zeit. Denn nur den Besten der Besten, den Zuverlässigsten der Zuverlässigen können die Stammesangehörigen die wertvollen, mit Mustern überzogenen, Familien-Schaufeln anvertrauen. Mit Tränen in den Augen verabschiedet man sich von ihnen, denn alle wissen: Nach der Kolonisierung der Vorkommen kommt ein Arbeiter nie zurück.",
	name: "Arbeiter",
	era: 0,
	tactic: 5,
}, {
	// Ополченец
	animation: 17,
	animationk: 10,
	desc: "Vor allem sind sie in der Menge schrecklich, denn sie werden vom Geruch des Knoblauchs und des Selbstgebrannten, welcher von der Schulter des Nachbarn herübergeweht wird, wild.<br>Und die Mistgabeln in ihren erfahrenen Händen sind universell einsetzbar. Man kann damit der Frau den Rücken kratzen, die Bäuche der Feinde aufschlitzen... oder umgekehrt.",
	name: "Miliz",
	era: 1,
	tactic: 0,
}, {
	// Реактивная артиллерия
	animation: 90,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Raketenartillerie",
	era: 8,
	tactic: 3,
}, {
	// Мотопехота
	animation: 86,
	animationk: 10,
	desc: "",
	name: "Schützenpanzer",
	era: 8,
	tactic: 1,
}, {
	// КК Двигатель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "RS-Motor",
	era: 7,
	tactic: 8,
}, {
	// КК Рубка
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "RS-Kabüse",
	era: 7,
	tactic: 8,
}, {
	// КК Обшивка
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "RS-Verkleidung",
	era: 7,
	tactic: 8,
}, {
	// КК Топливный бак
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "RS-Kraftstofftank",
	era: 7,
	tactic: 8,
}, {
	// КК Солнечная батарея
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "RS-Solarzelle",
	era: 7,
	tactic: 8,
}, {
	// КК Модуль обеспечения
	animation: -1,
	animationk: 10,
	desc: "",
	name: "RS-Versorgungsmodul",
	era: 7,
	tactic: 8,
}, {
	// Миноносец
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Panzerschiff",
	era: 6,
	tactic: 6,
}, {
	// Эсминец
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Zerstörer",
	era: 7,
	tactic: 6,
}, {
	// Транспортный корабль
	animation: -1,
	animationk: 10,
	desc: "Was wirklich beeindruckt, ist der Bauch dieses Monstrums; es kommt einem vor, als ob er bodenlos wäre! Und auch nicht besonders wählerisch: Heere, Waren, Passagiere - alles wird verschluckt.<br>Die Kapazität - beeindruckend! Der Preis - beeindruckend! Die Geschwindigkeit - beeindruckend! Ein beeindruckendes Schiff!",
	name: "Transportschiff",
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
	desc: "Emergency. Maximum velocity. Unextention. One-two-three. Das boot. Attention waterpumps! Unextention! Get on board join the troop! Double-engine each for you. System activated. Das boot. Unextention.",
	name: "U-Boot",
	era: 6,
	tactic: 6,
}, {
	// Линкор
	animation: -1,
	animationk: 10,
	desc: "Wenn dieses Monstrum in die See sticht, dann zittern sogar bei einem Dreadnought die Schrauben!<br>Es ist zwar unbekannt, wer die Idee hatte, diesen Schrecken der Meere zu erschaffen, aber ebenbürtige - was die Feuerkraft angeht - hat es nicht.",
	name: "Schlachtschiff",
	era: 8,
	tactic: 6,
}, {
	// Атомная подводная лодка
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Atom-U-Boot",
	era: 7,
	tactic: 6,
}, {
	// Крейсер
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Kreuzer",
	era: 7,
	tactic: 6,
}, {
	// Дирижабль
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Luftschiff",
	era: 5,
	tactic: 7,
}, {
	// Собака-робот
	animation: 76,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Robohund",
	era: 8,
	tactic: 2,
}, {
	// Снайпер
	animation: 79,
	animationk: 10,
	desc: "",
	name: "Scharfschütze",
	era: 8,
	tactic: 0,
}, {
	// Джонка
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Dschunke",
	era: 1,
	tactic: 6,
}, {
	// Легионер
	animation: 24,
	animationk: 10,
	desc: "",
	name: "Legionär",
	era: 2,
	tactic: 0,
}, {
	// Воин-ягуар
	animation: 27,
	animationk: 10,
	desc: "",
	name: "Jaguar-Krieger",
	era: 2,
	tactic: 0,
}, {
	// Чо-ко-ну
	animation: 25,
	animationk: 10,
	desc: "",
	name: "Cho-ko-nu",
	era: 2,
	tactic: 1,
}, {
	// Мотоциклист
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Motorradfahrer",
	era: 6,
	tactic: 2,
}, {
	// Легкий истребитель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Leichter Jäger",
	era: 6,
	tactic: 7,
}, {
	// Легкий бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Leichter Bomber",
	era: 6,
	tactic: 7,
}, {
	// Пикировщик
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Sturzflug-Bomber",
	era: 6,
	tactic: 7,
}, {
	// Аэростат
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Ballon",
	era: 4,
	tactic: 7,
}, {
	// Зенитное орудие
	animation: 83,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Flakgeschütz",
	era: 7,
	tactic: 3,
}, {
	// Тачанка ПВО
	animation: 80,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Tatschanka Luftverteidigung",
	era: 5,
	tactic: 4,
}, {
	// Танк-ягуар
	animation: 89,
	animationk: 10,
	desc: "",
	name: "Jaguar-Panzer",
	era: 7,
	tactic: 2,
}, {
	// Истребитель
	animation: -1,
	animationk: 10,
	desc: "",
	name: "Luftjäger",
	era: 7,
	tactic: 7,
}, {
	// Бомбардировщик
	animation: -1,
	animationk: 10,
	desc: "Coming in on a wing and the preyer!<br>Coming in on a wing and the preyer!<br>Though there&#39;s one motor gone<br>We can still carry on.",
	name: "Bomber",
	era: 7,
	tactic: 7,
}, {
	// Штурмовик
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Angriffsflieger",
	era: 7,
	tactic: 7,
}, {
	// Двухместная колесница
	animation: 91,
	animationk: 10,
	desc: "",
	name: "Doppel-Streitwagen",
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
	name: "Jet-Fighter",
	era: 8,
	tactic: 7,
}, {
	// Реактивный бомбардировщик
	animation: -1,
	animationk: 10,
	desc: " <br> <br> <br>",
	name: "Jet-Bomber",
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
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Papyrusboot",
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
	name: "Graben-Mörser",
	era: 6,
	tactic: 0,
}, {
	//Конный пехотинец
	animation: 92,
	animationk: 10,
	desc: "",
	name: "Schwerer Panzer",
	era: 7,
	tactic: 2,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "MTW",
	era: 7,
	tactic: 1,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Raketenwerfer",
	era: 7,
	tactic: 3,
}, {
	// Резервный юнит
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Flammenwerfer",
	era: 7,
	tactic: 0,
}, {
	// ЗРПК
	animation: -1,
	animationk: 10,
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Flugabwehrpanzer",
	era: 8,
	tactic: 4,
}, {
	// Обезьяна
	animation: -1,
	animationk: 10,
	desc: "Ooh-ooh-ooh! Aah-aah-aah! Ook-ook-ook? Ook!",
	name: "Dr. Horace W.",
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
	desc: "Die Information ist verschlüsselt. Ganz geheim an einem geheimen Ort verschlüsselt.",
	name: "Reserve-Einheit",
	era: 0,
	tactic: 0,
}, {
	// Мороз
	name: "Nikolaus",
}, {
	// Снегурка
	name: "Schneemädchen",
}, {
	// Лось
	name: "Rentier",
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
	var name = (this.isTmplFirstTagNeg() ? 'Nicht ' : '') + Unit.getTagName(this.getTmplFirstTag());
	
	if( this.getTmplSecondTag() )
		name += ' und ' + (this.getTmplPriority() ? 'Erwünscht ' : '') + (this.isTmplSecondTagNeg() ? 'Nicht ' : '') + Unit.getTagName(this.getTmplSecondTag());
	
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
	return 'Verteidigungslinien auf Schlachtfeld';
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
	return 'Irgendwelche Truppen';
};

UnitAny.prototype.getBattleCost = function(){return 1;};