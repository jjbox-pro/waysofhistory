function Path(params) {
    $.extend(this, params);
}


Path.prototype.clone = function(){
	return utils.copyProperties(new Path(), this);
};

Path.prototype.parse = function(arr){
    for(var type in Path.types){
        this[type] = arr[Path.types[type]];
    }
	
    if( this.combinewater === undefined ){
        if( this.water && this.deepwater )
            this.combinewater = Math.max(this.water, this.deepwater);
        else
            this.combinewater = 0;
    }
    
	return this;
};

Path.prototype.calcMinDist = function(){
    if(this.air == 0) return 0;
    
    var min = 99999;
    
    if(this.land && this.land < min) min = this.land;
    if(this.water && this.water < min) min = this.water;
    if(this.deepwater && this.deepwater < min) min = this.deepwater;
    
    return min;
};

Path.prototype.hasWaterOnly = function(){
	return this.water && (!this.deepwater && !this.land);
};

Path.prototype.getByType = function(type){
    return this[Path.typesNames[type]]||0;
};

Path.prototype.getLand  = function(){
    return this.getByType(Path.types.land);
};

Path.prototype.getWater  = function(){
    return this.getByType(Path.types.water);
};

Path.prototype.getDeepWater  = function(){
    return this.getByType(Path.types.deepwater);
};

Path.prototype.getCombineWater = function(){
    return this.getByType(Path.types.combinewater);
};

Path.prototype.getArr = function(){
    var arr = [];
    
    for(var type in Path.types){
        arr[Path.types[type]] = this[type]||0;
    }
    
    return [arr];
};


Path.types = {
	land: 0,
	deepwater: 1,
	water: 2,
	combinewater: 3
};

utils.createNames(Path.types, Path.typesNames = {});





// Список маршрутов от тайла до тайла
function RouteList(params, data) {
	this.list = [];
	
	if( params )
		this.parse(params);
	
	$.extend(this, data);
}

utils.extend(RouteList, List);

RouteList.prototype.parse = function(params){
	// Если вернулся путь и маршрут без воды - добавляем 0-ые водные пути к данным
	if( params.length < 3 )
		params.splice(1, 0, 0, 0, 0);
	
	this.path = new Path().parse(params);
	
	// Маршруты передаются в обратном порядке
	if( params[Route.types.land] )
		this.list.push(new Route(params[Route.types.land], Route.types.land, this.path.land));
	if( params[Route.types.water] )
		this.list.push(new Route(params[Route.types.water], Route.types.water, this.path.water));
	if( params[Route.types.deepwater] )
		this.list.push(new Route(params[Route.types.deepwater], Route.types.deepwater, this.path.deepwater));
	
	if( params[Route.types.combinewater] && (this.path.water != this.path.combinewater || params[Route.types.water] != params[Route.types.combinewater]) )
		this.list.push(new Route(params[Route.types.combinewater], Route.types.combinewater, this.path.combinewater));
	/*
	if( params[Route.types.noimpland] && (this.path.land != this.path.noimpland || params[Route.types.land] != params[Route.types.noimpland]) )
		this.list.push(new Route(params[Route.types.noimpland], Route.types.noimpland, this.path.noimpland));
	*/
	
	// Сортируем по возрастанию пути
	this.sort(function(a, b){
		return b.getPath() - a.getPath();
	});
};

RouteList.prototype.getFirst = function() {
	for (var elem in this.list)
		return this.list[elem];
	
	return false;
};

RouteList.prototype.getLast = function() {
	var elem = false;
	for (elem in this.list) 
		elem = this.list[elem];
	
	return elem;
};

RouteList.prototype.getRouteCount  = function(){
    return utils.sizeOf(this.list);
};

RouteList.prototype.hasRoute  = function(){
    return !!this.getRouteCount();
};

RouteList.prototype.getRoute  = function(type){
	for(var route in this.list){
		if( this.list[route].getType() == type )
			return this.list[route];
	}
	
	return false;
};

RouteList.prototype.getLand  = function(){
    return this.getRoute(Route.types.land);
};

RouteList.prototype.getWater  = function(){
    return this.getRoute(Route.types.water);
};

RouteList.prototype.getDeepWater  = function(){
    return this.getRoute(Route.types.deepwater);
};

RouteList.prototype.getCombineWater  = function(){
    return this.getRoute(Route.types.combinewater);
};



// Маршрут от тайла до тайла
function Route(dirs, type, path) {
	this.parseDirs(dirs);
	
	this.type = type;
	this.path = path;
}

Route.prototype.parseDirs = function(dirs){
	if( typeof(dirs) === 'string' )
		dirs = dirs.split('').reverse();
	
	this.dirs = dirs;
};

Route.prototype.getDirs = function(){
	return this.dirs;
};

Route.prototype.getDir = function(pos){
	var dir = this.dirs[pos];
	
	if( this.isTunnelDir(dir) )
		dir = Route.tunnelDirs[dir];
		
	return (+dir+2)%8;
};

Route.prototype.isTunnelDir = function(dir){
	return Route.tunnelDirs[dir] !== undefined;
};

Route.prototype.getType = function(){
	return this.type;
};

Route.prototype.getPath = function(){
	return this.path;
};

Route.tunnelDirs = {
	a: 0,
	b: 1,
	c: 2,
	d: 3,
	e: 4,
	f: 5,
	g: 6,
	h: 7
};

Route.types = {
	land: 4,
	deepwater: 5,
	water: 6,
	combinewater: 7
};

Route.modeIds = {
	all: 0,
	noRoads: 1,
	dirt: 2,
	highway: 3,
	railway: 4,
	maglev: 5,
	groundRoads5andTunnels: 6
};

Route.modes = {};
Route.modes[Route.modeIds.all] = {id:Route.modeIds.all, title:'Построить пути по воде и суше с учетом текущих дорог и мостов', titleReceived:'Сухопутный путь с учетом текущих дорог и мостов'};
Route.modes[Route.modeIds.noRoads] = {id:Route.modeIds.noRoads, title:'Построить путь без учета существующих дорог и мостов', titleReceived:utils.clearString(utils.upFirstLetter('путь без учета существующих дорог и мостов'))};
Route.modes[Route.modeIds.dirt] = {id:Route.modeIds.dirt, road:Road.ids.dirt, bridge: 1, title:'Построить путь так, словно везде грунтовка и мосты 1 уровня', titleReceived:utils.clearString(utils.upFirstLetter('путь так, словно везде грунтовка и мосты 1 уровня'))};
Route.modes[Route.modeIds.highway] = {id:Route.modeIds.highway, road:Road.ids.highway,  bridge: 2, title:'Построить путь так, словно везде шоссе и мосты 2 уровня', titleReceived:utils.clearString(utils.upFirstLetter('путь так, словно везде шоссе и мосты 2 уровня'))};
Route.modes[Route.modeIds.railway] = {id:Route.modeIds.railway, road:Road.ids.railway, bridge: 3, title:'Построить путь так, словно везде железная дорога и мосты 3 уровня', titleReceived:utils.clearString(utils.upFirstLetter('путь так, словно везде железная дорога и мосты 3 уровня'))};
Route.modes[Route.modeIds.maglev] = {id:Route.modeIds.maglev, road:Road.ids.maglev, bridge: 3, title:'Построить путь так, словно везде маглев и мосты 3 уровня', titleReceived:utils.clearString(utils.upFirstLetter('путь так, словно везде маглев и мосты 3 уровня'))};
Route.modes[Route.modeIds.groundRoads5andTunnels] = {id:Route.modeIds.groundRoads5andTunnels, road:Road.ids.tunnel, bridge: 3, title:'Построить путь так, словно везде маглев, тоннели и мосты 3 уровня', titleReceived:utils.clearString(utils.upFirstLetter('путь так, словно везде маглев, тоннели и мосты 3 уровня'))};

