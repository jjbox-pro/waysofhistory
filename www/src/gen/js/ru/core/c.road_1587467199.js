function Road(id, rough) {
	this.id = id;
	
	if( !this.isTunnel() )
		this.rough = rough; // Дорога проходит через неровную местность, цена увеличена. Исключение - тоннель.
}

utils.extend(Road, Element);

Road.prototype._getLib = function () {
	if( this.isTunnel() )
		return lib.map.tunnel;
	
	return lib.map.road[this.id];
};

Road.prototype.getCost = function(){
    var resList = new ResList(this._getLib().cost);
	
    if( this.rough ) 
		resList = resList.mult(lib.map.hardroadk);
	
    return resList;
};

Road.prototype.getUnit = function(){
    var unitCount = this._getLib().workers;
	
    if( this.rough )
		unitCount *= lib.map.hardroadk;
	
    return new Unit(Unit.ids.worker, unitCount);
};

Road.prototype.getSpeed = function(){
    return this._getLib().speed;
};

Road.prototype.getScience = function(){
    return new Science(this._getLib().science);
};

Road.prototype.getName = function(){
    return this._getAddLib().name;
};

Road.prototype.isRiver = function(){
    return this._getAddLib().river;
};

Road.prototype.isTunnel = function(){
    return this.getId() == Road.ids.tunnel;
};

Road.ids = {
	river: 0,
	dirt: 1,
	highway: 2,
	railway: 3,
	maglev: 4,
	tunnel: 5 // Не стандартный. По сути - ЖД дорога. Отрисовка - маглев
};

Road.lib = {};
Road.lib[Road.ids.river] =		{name: 'Река', river: true};
Road.lib[Road.ids.dirt] =		{name: 'Грунтовая дорога'};
Road.lib[Road.ids.highway] =	{name: 'Шоссе'};
Road.lib[Road.ids.railway] =	{name: 'Железная дорога'};
Road.lib[Road.ids.maglev] =		{name: 'Маглев'};
Road.lib[Road.ids.tunnel] =		{name: 'Тоннель'};


Road.getList = function(noRiver){
	var list = [];
	
	for (var road in lib.map.road) {
        var road = new Road(road);
		
        if (!road.isRiver() || !noRiver) {
            list.push(road);
        }
	}
	
	list.push(new Road(Road.ids.tunnel));
    
	return list;
};

