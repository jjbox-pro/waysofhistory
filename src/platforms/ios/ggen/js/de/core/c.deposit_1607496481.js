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
		name: 'Unbekanntes Vorkommen',
	},
	1: {
		name: 'Wald'
	},
	2: {
		name: 'Wald'
	},
	3: {
		name: 'Wald'
	},
	4: {
		name: 'Oase'
	},
	5: {
		name: 'Bananen'
	},
	6: {
		name: 'Äpfel'
	},
	7: {
		name: 'Aprikosen'
	},
	8: {
		name: 'Weintrauben'
	},
	9: {
		name: 'Weintrauben'
	},
	10: {
		name: 'Mais'
	},
	11: {
		name: 'Weizen'
	},
	12: {
		name: 'Reis'
	},
	13: {
		name: 'Fisch'
	},
	14: {
		name: 'Wale'
	},
	15: {
		name: 'Krabben'
	},
	16: {
		name: 'Austern'
	},
	17: {
		name: 'Schweine'
	},
	18: {
		name: 'Kühe'
	},
	19: {
		name: 'Hirsche'
	},
	20: {
		name: 'Schafe'
	},
	21: {
		name: 'Schafe'
	},
	22: {
		name: 'Baumwolle'
	},
	23: {
		name: 'Lein'
	},
	24: {
		name: 'Gold'
	},
	25: {
		name: 'Silber'
	},
	26: {
		name: 'Diamanten'
	},
	27: {
		name: 'Smaragde'
	},
	28: {
		name: 'Rubine'
	},
	29: {
		name: 'Perlen'
	},
	30: {
		name: 'Eisenerz'
	},
	31: {
		name: 'Eisenerz'
	},
	32: {
		name: 'Eisenerz'
	},
	33: {
		name: 'Granit'
	},
	34: {
		name: 'Granit'
	},
	35: {
		name: 'Granit'
	},
	36: {
		name: 'Pferde'
	},
	37: {
		name: 'Kamele'
	},
	38: {
		name: 'Elefanten'
	},
	39: {
		name: 'Schwefelerz'
	},
	40: {
		name: 'Schwefelerz'
	},
	41: {
		name: 'Schwefelerz'
	},
	42: {
		name: 'Erdgas'
	},
	43: {
		name: 'Erdgas'
	},
	44: {
		name: 'Öl'
	},
	45: {
		name: 'Öl'
	},
	46: {
		name: 'Öl'
	},
	47: {
		name: 'Kohle'
	},
	48: {
		name: 'Kohle'
	},
	49: {
		name: 'Uran'
	},
	50: {
		name: 'Uran'
	},
	51: {
		name: 'Uran'
	},
	52: {
		name: 'Quelle der Weisheit'
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

