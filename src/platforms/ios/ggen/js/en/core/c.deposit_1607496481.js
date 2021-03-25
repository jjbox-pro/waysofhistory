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
		name: 'Unknown deposit',
	},
	1: {
		name: 'Forest'
	},
	2: {
		name: 'Forest'
	},
	3: {
		name: 'Forest'
	},
	4: {
		name: 'Oasis'
	},
	5: {
		name: 'Bananas'
	},
	6: {
		name: 'Apples'
	},
	7: {
		name: 'Apricots'
	},
	8: {
		name: 'Grapes'
	},
	9: {
		name: 'Grapes'
	},
	10: {
		name: 'Corn'
	},
	11: {
		name: 'Wheat'
	},
	12: {
		name: 'Rice'
	},
	13: {
		name: 'Fish'
	},
	14: {
		name: 'Whales'
	},
	15: {
		name: 'Crabs'
	},
	16: {
		name: 'Oysters'
	},
	17: {
		name: 'Pigs'
	},
	18: {
		name: 'Cows'
	},
	19: {
		name: 'Deer'
	},
	20: {
		name: 'Sheep'
	},
	21: {
		name: 'Sheep'
	},
	22: {
		name: 'Cotton'
	},
	23: {
		name: 'Flax'
	},
	24: {
		name: 'Gold'
	},
	25: {
		name: 'Silver'
	},
	26: {
		name: 'Diamonds'
	},
	27: {
		name: 'Emeralds'
	},
	28: {
		name: 'Rubies'
	},
	29: {
		name: 'Pearls'
	},
	30: {
		name: 'Iron ore'
	},
	31: {
		name: 'Iron ore'
	},
	32: {
		name: 'Iron ore'
	},
	33: {
		name: 'Granite'
	},
	34: {
		name: 'Granite'
	},
	35: {
		name: 'Granite'
	},
	36: {
		name: 'Horses'
	},
	37: {
		name: 'Camels'
	},
	38: {
		name: 'Elephants'
	},
	39: {
		name: 'Sulphur ore'
	},
	40: {
		name: 'Sulphur ore'
	},
	41: {
		name: 'Sulphur ore'
	},
	42: {
		name: 'Natural gas'
	},
	43: {
		name: 'Natural gas'
	},
	44: {
		name: 'Oil'
	},
	45: {
		name: 'Oil'
	},
	46: {
		name: 'Oil'
	},
	47: {
		name: 'Coal'
	},
	48: {
		name: 'Coal'
	},
	49: {
		name: 'Uranium'
	},
	50: {
		name: 'Uranium'
	},
	51: {
		name: 'Uranium'
	},
	52: {
		name: 'A source of wisdom'
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

