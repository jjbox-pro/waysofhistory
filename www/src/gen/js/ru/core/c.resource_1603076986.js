function Resource (id, count) {
	this.id = +Element.getId(id);
	this.count = +count||0;
	this.lib = lib.resource.data[this.id];
}

utils.extend(Resource, Element);

/*******************
** Базовые методы **
********************/

Resource.prototype.clone = function(){
	return utils.copyProperties(new this.constructor(), this);
};

/***********
** Разное **
************/


Resource.prototype.getName = function () {
    return this._getAddLib().name;
};

Resource.prototype.getNoBarter = function () {
    return this._getAddLib().noBarter||false;
};

Resource.prototype.getHint = function () {
    var name = this.getName();
    if(!this.isFood() && this.isGrown()){
        name += '. Является '+snip.resBig(Resource.ids.food, '').replace(/"/g,"&#39;")+' пищей';
    }
    
	return name;
};

Resource.prototype.isEnabled = function() {
    return this.id != Resource.ids.aluminium && this.id != Resource.ids.music && this.id != Resource.ids.luck;
}

Resource.prototype.isEmpty = function () {
	return this.id == Resource.no
}

Resource.prototype.getEffect = function () {
	return this.lib.effect;
};

Resource.prototype.getEffectType = function () {
	return Resource.getEffectType(this.id);
};


Resource.prototype.getEffect_ = function (v) {
	return Resource.getEffect_(this.id, v);
};

Resource.prototype.getProdtype = function () {
	return this.lib.prodtype;
};

Resource.prototype.getType = function () {
	return this.lib.type;
};

Resource.prototype.isFood = function(){
	return this.getId() == Resource.ids.food;
};

Resource.prototype.isScience = function(){
	return this.getId() == Resource.ids.science;
};

Resource.prototype.isMoney = function(){
	return this.getId() == Resource.ids.money;
};

Resource.prototype.isAgro = function(){
	return this.getProdtype() == Resource.prodtypes.food;
};

Resource.prototype.isProd = function(){
	return this.getProdtype() == Resource.prodtypes.production;
};

Resource.prototype.isCult = function(){
	return this.getType() == Resource.types.culture;
};

Resource.prototype.isGrown = function(){
	return this.getType() == Resource.types.grown;
};

Resource.prototype.isStockable = function () {
	return (this.isAgro() || this.isProd()) && this.getId() != Resource.ids.food;
};

Resource.prototype.canConsumpt = function(){
    return this.getType() != Resource.types.no;
};

Resource.prototype.toResList = function(){
	var resList = new ResList();
	resList.addElem(this);
	return resList;
};

Resource.prototype.sciToLuck = function(){
	if (this.getId() == Resource.ids.science) {
        this.id = Resource.ids.luck
        this.lib = lib.resource.data[this.id];
    }
	return this;
};


Resource.prototype.needPledge = function(){
    return this.getId() != Resource.ids.uran;
}

/*
Resource.prototype.getGroup = function(){
    if (this.isCult()){
        return Resource.groups.cultural;
    } else if (this.isGrown()){
        return Resource.groups.grown;
    } else {
        return this._getAddLib().group;
    }
}*/
/**
 * статические методы
 */

// получение названия ресурса
Resource.getName = function (id) {
	return lib.resource.data[id].name;
};

// получение всех ресурсов
Resource.getAll = function () {
	var data = utils.clone(lib.resource.data);
	data.length = 23;
	return data;
};

// получение всех ресурсов склада
Resource.getList = function () {
	var list = [];
	for (var res in lib.resource.data) {
		res = new Resource(+res);
        if (res.isEnabled()) {
            list.push(res);   
        }
	}
	return list;
}

Resource.getEffectType = function (id) {
	return lib.resource.data[id].type;
};

Resource.getEffect_ = function (id, v) {
	return lib.resource.data[id].effect;
};

Resource.getEcology = function (id) {
	return lib.resource.data[id].ecology;
};

Resource.getConsumption_ = function (id) {
	return lib.resource.data[id].consumption;
};

Resource.countFromStr = function (str) {
	str = str || '';
	var groups = str.split('^');
	var size = 0;
	for (var i in groups) {
		if (!groups[i]) continue;

		size += parseInt(groups[i].substr(1));
	}
	return size;
};



Resource.init = function(){
    this.initFoodName();
    
    this.initFuel();
};

Resource.initFoodName = function(){
    var resFood = Resource.lib[Resource.ids.food],
		listStr = [],
		list = Resource.getList();
	
    for (var res in list){
        res = list[res];
        if (res.isGrown() && !res.isFood()){
            listStr.push(snip.resBig(res, ''));
        }
    }
    
    resFood.name += utils.clearString('<br/>('+listStr.join('').replace(/"/g,"'")+')');
};

Resource.initFuel = function(){
    this.fuelLandCons = new ResList(lib.trade.fuellcons);
    this.fuelLandSpeed = new ResList(lib.trade.fuellspeed);
    this.fuelWaterCons = new ResList(lib.trade.fuelwcons);
    this.fuelWaterSpeed = new ResList(lib.trade.fuelwspeed);
	this.fuelAirCons = new ResList(lib.trade.fuelacons);
    this.fuelAirSpeed = new ResList(lib.trade.fuelaspeed);
    this.fuelScience = new ResList(lib.trade.fuelscience);
};

Resource.getFuelConsList = function(wayType){
	switch (wayType){
		case Trade.wayType.w: return this.fuelWaterCons;
		case Trade.wayType.a: return this.fuelAirCons;
		default: return this.fuelLandCons;
	}
};

Resource.getFuelSpeedList = function(wayType){
	switch (wayType){
		case Trade.wayType.w: return this.fuelWaterSpeed;
		case Trade.wayType.a: return this.fuelAirSpeed;
		default: return this.fuelLandSpeed;
	}
};

Resource.prototype.getFuelSpeed = function(wayType) {
    var list = Resource.getFuelSpeedList(wayType);
    var res = list.hasElem(this);
    return res ? list.getCount(this) : 1;
};


/**
 * константы
 */

Resource.defaultResInc = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
Resource.resBuildDef = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1];
 
Resource.ids = {
	science: 0,
	money: 1,
	food: 2,
	wood: 3,
	iron: 4,
	fuel: 5,
	stone: 6,
	horse: 7,
	sulfur: 8,
    aluminium: 9,
	uran: 10,
    fruit: 11,
    mais: 12,
    wheat: 13,
    rice: 14,
	fish: 15,
	meat: 16,
	wine: 17,
	jewels: 18,
    cloth: 19,
    music: 20,
	films: 21,
	books: 22,
	luck: 50
}

Resource.effectTitle = [
    'Производство знаний',
    'Производство денег',
    'Производство пищи',
    'Производство древесины',
    'Производство металлов',
    'Производство топлива',
    'Производство гранита',
    'Производство вьючных животных',
    'Производство серы',
    'Производство алюминия',
    'Производство урана',
    'Производство фруктов',
    'Производство кукурузы',
    'Производство пшеницы',
    'Производство риса',
    'Производство рыбы',
    'Производство мяса',
    'Производство вина',
    'Производство драгоценностей',
    'Производство одежды',
    'Производство музыки',
    'Производство фильмов',
    'Производство книг',
];


 
Resource.no = -1;

Resource.prodtypes = {
	science: 0, 
	money: 1, 
	food: 2, 
	production: 3,
	luck: 4
}

Resource.types = {
	no: 0,
	grown: 1,
	culture: 2,
	science: 3,
	production: 4,
	grownScience: 5
};
/*
Resource.groups = {
    static: 0,
    strategic: 1,
    other: 2,
    grown: 3,
    cultural: 4
}*/

lib.resource.data[Resource.ids.luck] = {
	id: Resource.ids.luck,
	name: 'Удача',
	prodtype: Resource.prodtypes.luck,
}

Resource.lib = {
    0: {
        name: 'Знания',
    },
    1: {
        name: 'Деньги',
        noBarter: true,
    },
    2: {
        name: 'Пища. Не является самостоятельным ресурсом и представляет собой совокупность всех ресурсов роста.',
        noBarter: true,
    },
    3: {
        name: 'Древесина',
    },
    4: {
        name: 'Металл',
    },
    5: {
        name: 'Топливо',
        noBarter: true,
    },
    6: {
        name: 'Гранит',
    },
    7: {
        name: 'Вьючные животные',
    },
    8: {
        name: 'Сера',
        noBarter: true,
    },
    9: {
        name: 'Алюминий',
        noBarter: true,
    },
    10: {
        name: 'Уран',
        noBarter: true,
    },
    11: {
        name: 'Фрукты',
    },
    12: {
        name: 'Кукуруза',
    },
    13: {
        name: 'Пшеница',
    },
    14: {
        name: 'Рис',
    },
    15: {
        name: 'Рыба',
    },
    16: {
        name: 'Мясо',
    },
    17: {
        name: 'Вино',
    },
    18: {
        name: 'Драгоценности',
    },
    19: {
        name: 'Одежда',
    },
    20: {
        name: 'Музыка',
    },
    21: {
        name: 'Фильмы',
        noBarter: true,
    },
    22: {
        name: 'Книги',
    },
    50: {
        name: 'Удача',
    }
}