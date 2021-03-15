function Deposit(id, tile) {
	this.getAttributes(id);
	this.tile = tile;
}

utils.extend(Deposit, Element);


Deposit.townDistance = 2;

// получение информации о местороде
Deposit.prototype.getAttributes = function (id) {
	this.id = id;
	for (var i in lib.map.deposit[this.id]) {
		this[i] = lib.map.deposit[this.id][i];
	}
	
	return this;
};

Deposit.prototype.clone = function () {
	return new Deposit(this.id);
};

Deposit.prototype.getId = function () {
	return this.id;
};

// Получаем id со смещением
Deposit.prototype.getOffsetId = function (offset) {
	return this.id - (offset||1);
};


Deposit.prototype.getClimate = function () {
	return this.climate;
};

Deposit.prototype.isEmpty = function () {
	return this.id == Deposit.no;
};

Deposit.prototype.isUndefined = function () {
	return this.id == Deposit.undefined;
};

Deposit.prototype.getName = function () {
	if (this.isEmpty()) return '';
	return this._getAddLib().name;
};

Deposit.prototype.getGroupId = function () {
	return this._getAddLib().groupId;
};

Deposit.prototype.getRes = function () {
	var resList = new ResList();
	resList.setSorted(true);
	
	if (!this.isEmpty()) {
		for (var pair in this.res) {
			pair = this.res[pair];
			resList.addCount(pair[1], pair[0]);
		}
	}
	
	return resList;
};

/**
 * небиблиотечные методы
 */


Deposit.prototype.calcColonizeErrors = function() {
	var errors = {};
	
	var town = wofh.town;

	if (!this.isNear(town.pos)) 
		errors.faraway = true;//далеко от города
	if (this.isUndefined()) 
		errors.undefined = true;//неизвестный местород
	if (!town.getDeposit().isEmpty()) 
		errors.townBusy = true;//город уже имеет месторождение
	if (town.army.own.getCount(Unit.ids.worker) < this.calcPopCost())
		errors.noWorkers = true;//нет нужного числа рабочих
	if (this.tile[Tile.param.climate] == 1/*вода*/ && !town.getType().hasBank)
		errors.sea = true;//город на суше, местород в воде

	return errors;
};

Deposit.prototype.canColonize = function(){
	var errors = this.calcColonizeErrors();
    
    return errors.faraway || errors.undefined || errors.sea ? false : true;
};

Deposit.prototype.calcPopCost = function(){
	var cost = wofh.account.getColonizationCost();
	
	if( this.getRes().hasElem(Resource.ids.uran) )
		cost = Math.max(lib.resource.uranworkers, cost);
	
	return cost;
};
   
Deposit.prototype.isNear = function(pos){
	var selfPos = this.tile[Tile.param.posTMT];
	//return Math.abs(selfPos.x - pos.x) <= Deposit.townDistance && Math.abs(selfPos.y - pos.y) <= Deposit.townDistance;
	return Trade.calcMapCoordDistance(selfPos, pos, 'x') <= Deposit.townDistance && Trade.calcMapCoordDistance(selfPos, pos, 'y') <= Deposit.townDistance
};

Deposit.prototype.isAvailAcc = function(){
	var science = Science.get(this.science);
	
	return science.isEmpty() || science.isKnown();
};

/**
 * статические методы
 */


Deposit.init = function(){
	Deposit.list = [];
    
	for(var deposit in lib.map.deposit){
		deposit = new Deposit(deposit);
        
		Deposit.list[deposit.getId()] = deposit;
	}
};


Deposit.calcStrength = function(townsCount){
	townsCount = townsCount||utils.sizeOf(wofh.towns);
	
	return lib.war.colonydestroy[0] * Math.pow(townsCount, lib.war.colonydestroy[1]);
};

/* константы */

Deposit.ids = {
	pearls: 29,
	oilWater: 46,
	group: 1000
};

Deposit.no = lib.map.nodeposit;
Deposit.undefined = 0;

//ресурсы, которые отображаются блоками со скруглениями
Deposit.joined  = [0, 1, 2];//пока только лес для 3х климатических зон

Deposit.lib = {
	0: {
		name: 'Неизвестное месторождение',
	},
	1: {
		name: 'Лес'
	},
	2: {
		name: 'Лес'
	},
	3: {
		name: 'Лес'
	},
	4: {
		name: 'Оазис'
	},
	5: {
		name: 'Бананы'
	},
	6: {
		name: 'Яблоки'
	},
	7: {
		name: 'Абрикосы'
	},
	8: {
		name: 'Виноград'
	},
	9: {
		name: 'Виноград'
	},
	10: {
		name: 'Кукуруза'
	},
	11: {
		name: 'Пшеница'
	},
	12: {
		name: 'Рис'
	},
	13: {
		name: 'Рыба'
	},
	14: {
		name: 'Киты'
	},
	15: {
		name: 'Крабы'
	},
	16: {
		name: 'Устрицы'
	},
	17: {
		name: 'Свиньи'
	},
	18: {
		name: 'Коровы'
	},
	19: {
		name: 'Олени'
	},
	20: {
		name: 'Овцы'
	},
	21: {
		name: 'Овцы'
	},
	22: {
		name: 'Хлопок'
	},
	23: {
		name: 'Лен'
	},
	24: {
		name: 'Золото'
	},
	25: {
		name: 'Серебро'
	},
	26: {
		name: 'Алмазы'
	},
	27: {
		name: 'Изумруды'
	},
	28: {
		name: 'Рубины'
	},
	29: {
		name: 'Жемчуг'
	},
	30: {
		name: 'Железная руда'
	},
	31: {
		name: 'Железная руда'
	},
	32: {
		name: 'Железная руда'
	},
	33: {
		name: 'Гранит'
	},
	34: {
		name: 'Гранит'
	},
	35: {
		name: 'Гранит'
	},
	36: {
		name: 'Лошади'
	},
	37: {
		name: 'Верблюды'
	},
	38: {
		name: 'Слоны'
	},
	39: {
		name: 'Серная руда'
	},
	40: {
		name: 'Серная руда'
	},
	41: {
		name: 'Серная руда'
	},
	42: {
		name: 'Природный газ'
	},
	43: {
		name: 'Природный газ'
	},
	44: {
		name: 'Нефть'
	},
	45: {
		name: 'Нефть'
	},
	46: {
		name: 'Нефть'
	},
	47: {
		name: 'Уголь'
	},
	48: {
		name: 'Уголь'
	},
	49: {
		name: 'Уран'
	},
	50: {
		name: 'Уран'
	},
	51: {
		name: 'Уран'
	},
	52: {
		name: 'Источник мудрости'
	},
}

Deposit.groupIds = {};

Deposit.isGroupId = function(id){
	return id > Deposit.ids.group;
};

// Инитим местороды по группам (без учёта елиматов)
(function(){
	var groups = {};
	
	for(var deposit in Deposit.lib){
		deposit = Deposit.lib[deposit];

		if( !groups[deposit.name] )
			groups[deposit.name] = [];

		groups[deposit.name].push(deposit);
	}
	
	var groupId = Deposit.ids.group,
		group;
	
	for(var groupName in groups){
		group = groups[groupName];
		
		if( group.length < 2 )
			continue;
		
		groupId++;
		
		Deposit.groupIds[groupId] = groupName;
		
		for(var deposit in group){
			group[deposit].groupId = groupId;
		}
	}
})();

