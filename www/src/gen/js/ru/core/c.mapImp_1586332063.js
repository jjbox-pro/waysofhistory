function MapImp (id, level) {
    if (typeof(id) == "object") {//вместо параметров массив
        var arr = id;
        this.id = arr[0];
        this.level = arr[1];
    } else {
        this.id = id;
        this.level = level||1;
    }
};

utils.extend(MapImp, Element);

MapImp.prototype.getId = function () {
	return this.id;
};

MapImp.prototype.getLevel = function () {
	return this.level;
};

MapImp.prototype.setLevel = function (level) {
	this.level = level;
};

MapImp.prototype.clone = function (level) {
    if (!level) level = this.level
	return new MapImp(this.id, level);
};

MapImp.prototype.canUp = function () {
	return this.level < this.getMaxLevel();
};

MapImp.prototype.getUp = function () {
	return new MapImp(this.id, this.level+1);
};

/**
 * библиотечные методы
 */

MapImp.prototype._getLib = function () {
	return lib.map.environment[this.id];
};

MapImp.prototype.getLevels = function () {
    return this._getLib().levels;
};

MapImp.prototype._getLibLevel = function () {
	return this._getLib().levels[this.level-1];
};

MapImp.prototype.getMaxLevel = function () {
	return this._getLib().levels.length;
};

MapImp.prototype.isAvail = function (account) {
	account = account||wofh.account;
	
    return this.level <= account.research.env[this.id];
};

MapImp.prototype.isKnown = function () {
    return this.getScience().isEmpty() || this.getScience().isKnown();  
};

MapImp.prototype.getKnownLevel = function () {
    for (var level = this.getMaxLevel(); level >= 1; level--){
        var clone = this.clone(level); 
        if (clone.isKnown()) {
            return level;
        }
    }
	return 0;
};

MapImp.prototype.getMaxKnown = function () {
    var level = this.getKnownLevel();
    return level ? this.clone(level) : false;
};

MapImp.prototype.getCost = function () {
	return new ResList(this._getLibLevel().cost);
};

MapImp.prototype.getEffect = function () {
	return this._getLibLevel().effect;
};

MapImp.prototype.isMain = function () {
	return this._getLib().main == 1;
};

MapImp.prototype.isEffectGetTypePercent = function () {
	return this._getAddLib().effectGetType == MapImp.effectGetType.percent;
};

MapImp.prototype.getName = function () {
	return this._getAddLib().name;
};

MapImp.prototype.getScience = function () {
	return new Science(this._getLibLevel().science);
};

MapImp.prototype.getWorkers = function () {
	return new Unit(Unit.ids.worker, this._getLibLevel().workers);
};

MapImp.prototype.calcRealEffect = function (users) {
    users = users || 1;
	return this.getEffect() * 0.5 * (1 + users) / users;
};
/**
 * расширенные методы 
 */
 
MapImp.prototype.getEffectType = function () {
	return this._getAddLib().effectType;
};

MapImp.prototype.getCondition = function () {
	return this._getAddLib().condition;
};

MapImp.prototype.getDisplay = function () {
	return this._getAddLib().display;
};

MapImp.prototype.getHint = function () {
	return this._getAddLib().hint;
};
// Позиция в педии
MapImp.prototype.getHelpPos = function () {
	return this._getAddLib().helpPos;
};

MapImp.prototype.getMapZ = function () {
	return this._getAddLib().mapZ;
}; 
/*
MapImp.prototype.getEffectText = function () {
	return this._getAddLib().effectText(this.getEffect());
};
*/
MapImp.prototype.townCanUse = function () {
	return this._getAddLib().townCanUse;
};

MapImp.prototype.isLikeBridge = function () {
	return this._getAddLib().isLikeBridge;
};

MapImp.prototype.getDefClimate = function () {
	return this._getAddLib().defClimate;
};

MapImp.prototype.isEnoughWorkers = function (town) {
	town = town||wofh.town;
	
	return !(this.getWorkers().getCount() > town.army.own.getCount(this.getWorkers()));
};

MapImp.prototype.allowLuckBonus = function(){
	return this.getId() == MapImp.ids.skiResort;
};

MapImp.prototype.getLuckBonusEffect = function (town) {
	town = town||wofh.town;
	
	// На курорт действет бонус МУ проиводства
	if( this.allowLuckBonus() )
		return	1 + town.getLuckBonus(LuckBonus.ids.production).getEffect();
	
	return 1;
};



MapImp.prototype.getEffectUngrown = function () {
	return this._getAddLib().effectUngrown||0;
};

MapImp.prototype.calcEffectUngrown = function (effect) {
	effect = effect||this.getEffect();
	
	return effect * this.getEffectUngrown();
};

MapImp.prototype.calcEffectProd = function (effect, effectProd) {
	effectProd = effectProd||this.getEffectProd();
	
	if( effectProd )
		return effectProd.mult * (effect||this.getEffect());
	
	return 0;
};

MapImp.prototype.getEffectProd = function () {
	var effectProd = MapImp.effectProd[this._getAddLib().effectProd]||{};
	
	return effectProd[this.getId()];
};

MapImp.prototype.hasAddEffect = function () {
	return !this.isEffectGetTypePercent() || this.getEffectProd();
};

/**
 * методы класса
 */

MapImp.getAll = function(){
	var list = new List();
	
	for (var mapImp in lib.map.environment) {
        var imp = new MapImp(mapImp);
		
        list.addElem(imp);
	}
	
	return list;
};

/**
 * константы
 */
 
MapImp.ids = {
	bridge: 0,
	agriculture: 1,
	prodHill: 2,
	knowledgeLand: 3,
	money: 4,
	riverProd: 5,
	growth: 6,
	culture: 7,
	waterProd: 8,
	knowledgeWater: 9,
	resort: 10,
	skiResort: 11
};

MapImp.effectType = {
	science: Resource.prodtypes.science,
	food: Resource.prodtypes.food,
	production: Resource.prodtypes.production,
	money: Resource.prodtypes.money,
	watercross: 4,
	grow: 5,
    culture: 6,
    waterProd: 7,
};

MapImp.effectGetType = {
	percent: 0,
	count: 1
};

MapImp.buildErr = {
    distance: 1,
    relief: 2,
    res: 3,
    unit: 4,
    science: 5,
	level: 6
};

MapImp.effectProd = {};

MapImp.effectProd[MapImp.effectType.science] = {};
MapImp.effectProd[MapImp.effectType.science][MapImp.ids.knowledgeLand] = {mult: 2};

MapImp.lib = [
	{//0-мост
        name: 'Мост',
        townCanUse: false,
        isLikeBridge: true,
		effectType: MapImp.effectType.watercross,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.prairie,
		condition: {
			closeToTown: false,
			onlyOnRiver: true,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: false,
			notOnTown: false,
			onlyOnTerrain: [0],
			notOnClimate: false,
		},
        display: {
            onRiver: true,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно строить в радиусе ' + lib.map.makeroaddistance + ' полей от строящего города поперек русла реки' +snip.hint('Невозможно построить в истоках реки и местах соединения нескольких рек.<br>Может быть построено в месте где уже есть город.'),
		//effectText: doT.template('Переправа через реки'),
		helpPos: 0, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//1-орошения
        name: 'Ирригация',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.food,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.desert,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: true,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0],
			notOnClimate: [5],
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно строить возле строящего города, на равнине рядом с рекой или водоёмом, в любой климатической зоне кроме снегов '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% сельское хозяйство'),
		helpPos: 1, // Позиция в педии
		mapZ: 4, // Порядок отрисовки на карте
	},
	{//2-шахты
        name: 'Шахты',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.production,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.snow,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [1],
			notOnClimate: [4],
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно строить возле строящего города, на холмах в любой климатической зоне, кроме пустыни '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% промышленность'),
		helpPos: 2, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//3-кампус
        name: 'Кампус',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.science,
		effectGetType: MapImp.effectGetType.percent,
		effectProd: MapImp.effectType.science,
		defClimate: Tile.climateIds.grasslands,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: true,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0],
			notOnClimate: false,
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на равнине, кроме участков с рекой '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% знания'),
		helpPos: 3, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//4-ярмарка
        name: 'Ярмарка',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.money,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.grasslands,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: true,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0],
			notOnClimate: [4, 5],
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на равнине, кроме участков с рекой, в любой климатической зоне, кроме пустыни и снегов '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% деньги'),
		helpPos: 4, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//5-водяная мельница
        name: 'Гидротехническое сооружение',
        townCanUse: true,
        isLikeBridge: true,
		effectType: MapImp.effectType.production,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.prairie,
		condition: {
			closeToTown: true,
			onlyOnRiver: true,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: false,
			onlyOnTerrain: [0],
			notOnClimate: false,
		},
        display: {
            onRiver: true,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на реке.'+snip.hint('Невозможно построить в истоках реки и местах соединения нескольких рек.'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% производство'),
		helpPos: 5, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//6-пригород
        name: 'Пригород',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.grow,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.grasslands,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0],
			notOnClimate: false,
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на равнине без месторождения '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% рост'),
		helpPos: 6, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//7-заповедник
        name: 'Заповедник',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.culture,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.grasslands,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0,1],
			notOnClimate: false,
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: true,
        },
        hint: 'Можно построить возле строящего города, на равнине без месторождения и холмах '+snip.hint('Не может быть построено <br>на одном месте с городом или месторождением'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% культура'),
		helpPos: 7, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//8-Промысловая зона
        name: 'Промысловая зона',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.waterProd,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.water,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: false,
			onlyOnTerrain: [-1],
			notOnClimate: [0, 2, 3, 4, 5, 6],
		},
        display: {
            onRiver: false,
            noRelatives: true,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на воде без месторождения, за исключением '+snip.depositLink(Deposit.ids.oilWater, 'Нефти')+''+snip.hint('Увеличивает эффективность добычи только водных месторождений'),
		//effectText: doT.template('+{{=Math.round(it*100)}}% производство рыбы и жемчуга'),
		helpPos: 10, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//9-Исследовательская акватория
        name: 'Исследовательская акватория',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.science,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.water,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToWater: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [-1],
			notOnClimate: [0, 2, 3, 4, 5, 6],
		},
        display: {
            onRiver: false,
            noRelatives: true,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на воде без месторождения, за исключением '+snip.depositLink(Deposit.ids.oilWater, 'Нефти')+'',
		//effectText: doT.template('+{{=Math.round(it*100)}}% знания'),
		helpPos: 11, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//10-Курорт
        name: 'Курорт',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.money,
		effectGetType: MapImp.effectGetType.percent,
		defClimate: Tile.climateIds.grasslands,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			closeToCoast: true,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [0, 1],
			notOnClimate: [5],
		},
        display: {
            onRiver: false,
            noRelatives: false,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на равнине без месторождения и холмах, в любой климатической зоне кроме снегов, на берегу водоема.',
		//effectText: doT.template('+{{=Math.round(it*100)}}% знания'),
		helpPos: 8, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
	{//11-Горнолыжный курорт
        name: 'Горнолыжный курорт',
        townCanUse: true,
        isLikeBridge: false,
		effectType: MapImp.effectType.money,
		effectGetType: MapImp.effectGetType.count,
		effectUngrown: lib.town.skipopdec, // Редкое свойство. Использование УМ приводит к спаду населения. 
		defClimate: Tile.climateIds.snow,
		condition: {
			closeToTown: true,
			onlyOnRiver: false,
			notOnRiver: false,
			notOnDeposit: true,
			notOnTown: true,
			onlyOnTerrain: [2],
			notOnClimate: [3, 4],
		},
        display: {
            onRiver: false,
            noRelatives: true,
            useClimate: false,
        },
        hint: 'Можно построить возле строящего города, на горах снегов или лугов.',
		//effectText: doT.template('+{{=Math.round(it*100)}}% знания'),
		helpPos: 9, // Позиция в педии
		mapZ: 5, // Порядок отрисовки на карте
	},
];

