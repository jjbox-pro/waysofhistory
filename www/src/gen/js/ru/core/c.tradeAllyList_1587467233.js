function TradeAllyList(data) {
	this.elemClass = TradeAlly;
	this.list = {};
	
	this.parseRaw(data);
}

utils.extend(TradeAllyList, List);

// Преобразование массива или объекта с данными
TradeAllyList.prototype.parseArr = function(data){
	data = data||{};
	var my = data.my||{},
		consist = data.consist||{};
		
		for(var ally in data.my){
			ally = data.my[ally];
			my[ally[0]] = ally;
		}	
		
		for (var elem in consist) {
			elem = new this.elemClass(consist[elem], my);
			this.list[elem.getId()] = elem;
		}
};

TradeAllyList.prototype.parseRaw = function(data){
	var myIds = [];

    for(var allyRaw in data.my){
		allyRaw = data.my[allyRaw];
		myIds[allyRaw[0]] = true;
	}	
	
    for(var allyPos in data.consist){
        var allyRaw = data.consist[allyPos];
        var ally = new this.elemClass(allyRaw, myIds[allyRaw[0]]);
		
		this.addElem(ally);
    }
};

TradeAllyList.prototype.updElem = function(data, elem){
	elem = elem||this.getElem(data.id);
	
	for(var key in data)
		if( data[key] !== undefined )
			elem[key] = data[key];
	
	return elem;
};

TradeAllyList.prototype.getCountryAlly = function(){
	for (var ally in this.getList()) {
		ally = this.getElem(ally);
		if (ally.country){
			return ally;
		}
	}
	return false;
}

TradeAllyList.prototype.getMyCount = function(){
	var count = 0;
	
	for (var ally in this.getList()) {
		ally = this.getElem(ally);
		if (ally.my) {
			count ++;	
		}
	}
	
	return count;
};

TradeAllyList.prototype.getConsistCount = function(){
	var count = 0;
	
	for (var ally in this.getList()) {
		ally = this.getElem(ally);
		if (!ally.my && !ally.country) {
			count ++;	
		}
	}
	
	return count;
};