function ResList(data, sciToLuck) {
	this.list = {};
	this.allowZero = false;
	this.elemClass = Resource;
    this.sciToLuck = sciToLuck;
	if (data) { 
		this.parse(data);
	}

}

utils.extend(ResList, CountList);

//парсит строку в массив
ResList.prototype.parseStr = function(str) {
    var result = [];

    if (str) {
        var arr = str.split('^');
        arr.pop();
        for (var i in arr) {
            var resId = utils.charToInt(arr[i].charAt(0));
            if (this.sciToLuck && resId == Resource.ids.science) {
                resId = Resource.ids.luck;
            }
            result[resId] = parseFloat(arr[i].substr(1));
        }
    }
    return result;
};

//В отличии от стандартного метода учитывает особенности пищи
ResList.prototype.calcIncludeCount = function(list, need){
    if (!need) {
        return CountList.prototype.calcIncludeCount.apply(this, arguments);
    } else {
        var diffList = this.clone().diffList(list.mult(need));
        if (diffList.hasNegative()) return 0;
		var foodCount = list.getCount(Resource.ids.food) * need;
		
		if (foodCount <= 0) return need;
		
        for (var res in diffList.getList()){
            res = diffList.getElem(res);
            if (res.isGrown()) {
                foodCount -= res.getCount();
                
                if (foodCount <= 0) return need;
            }
        }
		
        return 0;
    }
};

ResList.prototype.excludeResList = function(resList){
	var foodCount = this.getFood().getCount() - Math.max(0, resList.getFoodCountAfterSpend(this));
	
	this.diffList(resList).getList();
	
	this.setCount(this.getFood(), foodCount);
	
	return this;
};

ResList.prototype.getFoodCountAfterSpend = function(resList){
    var count = this.getElem(Resource.ids.food).getCount();
	
	for (var resId in resList.getList()){
		var res = resList.getElem(resId);
		
		if(res.isGrown())
			count -= res.getCount(); // Вычитаем ресурсы роста из пищи на складе
	}
    
    return count;
};

/*
//слияние 
ResList.prototype.toString = function() {
	var resStr = '';
	for (var res in this.getList()){
		if (res >=0) {
		var res = this.getElem(res);
			resStr += utils.intToChar(res.getId())+res.getCount()+'^';
		}
	}
	return resStr;
}*/

ResList.prototype.setAllowZero = function(val) {
	this.allowZero = val;
};

//PRIV удалить ресурс из списка
ResList.prototype.delRes = CountList.prototype.delElem;

//добавить количесто к ресурсу
ResList.prototype.addRes = CountList.prototype.addCount;

//установить количество ресурса
ResList.prototype.setRes = CountList.prototype.setCount;

ResList.prototype.getRes = CountList.prototype.getElem;

ResList.prototype.hasRes = CountList.prototype.hasElem;

//массив
ResList.prototype.getArr = function(){
	var arr = [];
	
	for (var i in this.list) {
		arr.push(this.list[i]);
	}
	
	return arr;
};

//исключить еду из списка
ResList.prototype.excludeFood = function () {
	for (var res in this.list) {
		if (res == Resource.ids.food) delete this.list[res];
	}
	return this;
};

ResList.prototype.calcFood = function () {
	var food = new Resource(Resource.ids.food, 0);
	for (var res in this.list) {
		var res = this.list[res];
		if (res.isGrown()) {
			food.count += res.count;
		}
	}
	return food;
};

ResList.prototype.getGrown = function () {
	var list = this.getList();
	
	for (var res in list){
        res = list[res];
        if ( !res.isGrown() || res.isFood() ){
           this.delElem(res);
        }
    }
	
	return this;
};

ResList.prototype.getAgro = function () {
	var list = this.getList();
	
	for (var res in list){
        res = list[res];
        if ( !res.isAgro() || res.isFood() ){
           this.delElem(res);
        }
    }
	
	return this;
};

ResList.prototype.getProd = function () {
	var list = this.getList();
	
	for (var res in list){
        res = list[res];
        if ( !res.isProd() ){
           this.delElem(res);
        }
    }
	
	return this;
};

ResList.prototype.getFood = function () {
	return this.getRes(Resource.ids.food);
};

ResList.prototype.hasFood = function () {
	return this.getFood().getCount() > 0;
};


//объединить все ресурсы роста в пищу. Отдельные ресурсы роста при этом исчезают
ResList.prototype.joinFood = function() {
	var food = this.calcFood();
	
	for (var resId in this.list) {
		var res = this.list[resId];
		if (res.isGrown()) delete this.list[resId];
	}
	
	this.addElem(food);
	
	return this;
};

ResList.prototype.getStockable = function () {
	for (var resId in this.list) {
		var res = this.list[resId];
		if (!res.isStockable()) delete this.list[resId];
	}
	return this;
};

ResList.prototype.removePrecision = function () {
	for (var resId in this.list) {
		var res = this.list[resId];
		if (res.getCount() < 0.5) delete this.list[resId];
	}
	
	return this;
};

ResList.prototype.sortByDefault = function () {
    var clone = new ResList().setSorted(true);
	
	for (var res in ResList.sortDefArray) {
        res = ResList.sortDefArray[res];
		res = this.getElem(res, false);
		
        if ( res )
            clone.addElem(res);
	}
	
    return clone;
};

ResList.prototype.getGroups = function (opt) {
	opt = opt||{};
	
    var clone = {},
		groups = utils.clone(ResList.groups);
	
	if( opt.joinFoodToGrown )
		groups[ResList.groupType.grown].unshift(Resource.ids.food);
	
	for(var groupId in opt.exclude){
		groupId = opt.exclude[groupId];
		
		delete groups[groupId];
	}
	
    for (var groupId in groups){
    	var group = groups[groupId];
    	clone[groupId] = new ResList().setSorted(true);
    	for (var res in group) {
    		var res = this.getElem(group[res]);
    		clone[groupId].addElem(res);
    	}
    }
	
    return clone;
};

ResList.prototype.sortByGroups = function (opt) {
	var resGroups = this.getGroups(opt);
	
	delete this.list;
	
	this.setSorted(true, true);
	
	for(var resGroup in resGroups){
		resGroup = resGroups[resGroup].getList();
		
		for(var res in resGroup){
			this.addElem(resGroup[res]);
		}
	}
	
	return this;
};

ResList.prototype.parseFormObj = function (formData) {
    for (var id in formData) {
        if(id[0] != 'r' || !(+id[1])) continue;
		
        var count = formData[id]||0,
			id = id.substring(1);
        
        this.setCount(id, count);
    }
	
    return this;
};

ResList.sortDefArray = [
	Resource.ids.science, 
	Resource.ids.money, 
	Resource.ids.food, 
	Resource.ids.wood, 
	Resource.ids.iron, 
	Resource.ids.stone, 
	Resource.ids.uran, 
	Resource.ids.horse, 
	Resource.ids.fuel, 
	Resource.ids.sulfur, 
	Resource.ids.books,
	Resource.ids.meat,
	Resource.ids.fruit, 
	Resource.ids.fish, 
	Resource.ids.rice, 
	Resource.ids.wheat, 
	Resource.ids.mais, 
	Resource.ids.cloth, 
	Resource.ids.wine, 
	Resource.ids.jewels, 
	Resource.ids.films
];

ResList.groupType = {
	special: 0,
	prod: 1,
	mix: 2,
	grown: 3,
	cult: 4
};

ResList.groups = {};
ResList.groups[ResList.groupType.special] = [Resource.ids.science, Resource.ids.money, Resource.ids.food];
ResList.groups[ResList.groupType.prod] = [Resource.ids.wood, Resource.ids.iron, Resource.ids.stone, Resource.ids.uran];
ResList.groups[ResList.groupType.mix] = [Resource.ids.horse, Resource.ids.fuel, Resource.ids.sulfur, Resource.ids.books];
ResList.groups[ResList.groupType.grown] = [Resource.ids.meat, Resource.ids.fruit, Resource.ids.fish, Resource.ids.rice, Resource.ids.wheat, Resource.ids.mais];
ResList.groups[ResList.groupType.cult] = [Resource.ids.cloth, Resource.ids.wine, Resource.ids.jewels, Resource.ids.films];


ResList.filter = {};

ResList.filter.resType = {
	all: -1,
	grown: 100,
	cult: 101
};
ResList.filter.type = {
	'default': 1 << 0,
	extend: 1 << 1,
	select: 1 << 2,
	resbin: 1 << 3
};

ResList.getResBinFilter = function(){
	var list = ResList.getAll().getList(),
		filter = 0;
	
	for(var res in list){
		res = list[res];
		
		if( res.getId() > 1 )
			filter ^= (1 << res.getId());
	}
	
	return filter;
};

ResList.getAll = function () {
	var list = new ResList();
	for (var res in lib.resource.data) {
		res = new Resource(+res);
		
		if( res.isEnabled() )
			list.createElem(res);
			
	}
	return list;
};

ResList.getFromResBin = function (resbin) {
	var list = new ResList();
	
	if( resbin ){
		resbin = resbin.toString(2).split('').reverse();

		for(var resId in resbin){
			if( +resbin[resId] )
				list.setCount(resId, 1);
		}
	}
	
	return list;
};


