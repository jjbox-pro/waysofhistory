function MilitaryList(data) {
	this.elemClass = MilitaryElement;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(MilitaryList, List);

// Преобразование массива или объекта с данными
MilitaryList.prototype.parseArr = function(arrOrObj){
	if( arrOrObj instanceof Array ){
		for (var elemId in arrOrObj) {
			var elem = new this.elemClass(arrOrObj[elemId]);
			this.list[elem.getId()||elemId] = elem;
		}
	}
	else{
		for (var elem in arrOrObj) {
			elem = new this.elemClass(arrOrObj[elem], elem);
			this.list[elem.getId()] = elem;
		}
	}
};

MilitaryList.prototype.getTownElements = function (callback, town, onlyCount){
	if( !callback || !town ) return;
	
	var elementsList = new this.constructor();
	var elements = this.getList();
	for (var element in elements) {
		element = elements[element].clone();
		
		if ( callback(element) )
			elementsList.addElem(element);	
	}
	
	if( onlyCount )
		return elementsList.getLength();
	
	return elementsList;
};

MilitaryList.prototype.updElem = function(data, elem){
	elem = elem||this.getElem(data.id);
	
	for(var key in data)
		if( data[key] !== undefined )
			elem[key] = data[key];
	
	return elem;
};



function FleetList(data){
	this.elemClass = Fleet;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(FleetList, MilitaryList);

FleetList.prototype.parseArr = function(fleets){
	for (var fleet in fleets) {
		fleet = new this.elemClass(fleets[fleet], fleet);
		this.list[fleet.getId()] = fleet;
		
		wofh.events.addFleetEvent(fleet);
	}
};

FleetList.prototype.getTownFleets = function (town, onlyCount){
	if (!town) town = wofh.town;
	
	return this.getTownElements(function(element){
		return element.t1 == town.id || element.t2 == town.id || element.t4 == town.id;
	}, town, onlyCount);
};



function ReinforceList(data){
	this.elemClass = Reinforce;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(ReinforceList, MilitaryList);

ReinforceList.prototype.getTownReinforce = function (town, onlyCount, location){
	if (!town) town = wofh.town;
	
	return this.getTownElements(function(element){
		if( location ){
			if( location == ReinforceList.location.in )
				return element.town == town.id;
			else
				return element.home == town.id || element.useTownFleet();
		}
		else
			return element.town == town.id || element.home == town.id || element.useTownFleet();
	}, town, onlyCount);
};



ReinforceList.location = {
	in: 'in',
	out: 'out'
};



function CommandingList(data){
	this.elemClass = Commanding;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(CommandingList, MilitaryList);



function BattleList(data){
	this.elemClass = Battle;
	this.list = [];
	
	this.parseArr(data);
}

utils.extend(BattleList, MilitaryList);

BattleList.prototype.parseArr = function(arr){
	for (var elem in arr) {
		elem = new this.elemClass(arr[elem]);
		
		this.list.push(elem);
	}
};

BattleList.prototype.addElem = function(arr){
	this.list.push(arr);
};

BattleList.prototype.getTownBattles = function (town, onlyCount){
	if (!town) town = wofh.town;
	
	return this.getTownElements(function(element){
		return element.town == town.id || element.home == town.id;
	}, town, onlyCount);
};