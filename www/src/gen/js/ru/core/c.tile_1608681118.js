Tile = {};

Tile.param = {
    climate: 0,
    terr: 1,
    deposit: 2,
    wonder: 3,
    env: 4,
    rid: 5,
    road: 6,
    fog: 7,
    town: 8,
    townLevel: 9,
    clim_new: 10,
    hill_new: 11,
    mount_new: 12,
    low_water: 13,
    slots: 14,
    zone1: 15,
    zone2: 16,
    impMap: 17,
	// Конец стандартных (серверных)
	flag: 18, 
	// Конец раширяемых
	layersUpd: 19,
	dep: 20,
	terrain: 21,
    posTMT: 22,
    posTMpx: 23,
    posTCT: 24,
    posTCpx: 25,
    layers: 26,
    heightMap: 27,
    comment: 28,
    i: 29,
    cache: 30,//ассоциативный массив кэшируемых параметров
    roads: 31,
	defmoment: 32, //есть ли у тайла(города) защита от нападений
	roadsExt: 33, // Две дополнительные дороги определяющие будет ли пересечение дороги при переходе с текущего тайла в горизонтальном или вертикальном направлении
	realRoads: 34, // Дополнительный параметр указывающий, какой реальный тип имеет дорога в определенном направлении. Используется только в случае, если при переходе от тайла к тайлу дорога отрисовывается с разным типом. Пример: ЖД дорога переходящая в тоннель по факту тоже является тоннелем.
	boundary: 35, // Флаг указывающий, что тайл находиться на границе чанка
	actual: 36 // Флаг указывающий, что данные тайла актуальные
	// Конец клиентских
};

//Направления в зависимости от сетки карты
/*
1 2 3
0 - 4
7 6 5
*/
Tile.dirsMap = [
    {x:-1,	y:0},
    {x:-1,	y:-1},
    {x:0,	y:-1},
    {x:1,	y:-1},
    {x:1,	y:0},
    {x:1,	y:1},
    {x:0,	y:1},
    {x:-1,	y:1}
];

Tile.dirsMap9 = [//добавляем себя
    {x:0,  y:0},
    {x:-1,  y:0},
    {x:-1,  y:-1},
    {x:0,   y:-1},
    {x:1,   y:-1},
    {x:1,   y:0},
    {x:1,   y:1},
    {x:0,   y:1},
    {x:-1,  y:1}
];
    
	/*
	7 0 1
	6 0 2
	5 4 3
	*/
   
	//направления в зависимости от экрана 
	/*
	      1
	   0     2
	7     8     3
	   6     4
	      5
	*/
   
Tile.dirsScr = [
    {x:-0.5, y:-0.5},
    {x:0, 	y:-1},
    {x:0.5, y:-0.5},
    {x:1, 	y:0},
    {x:0.5, y:0.5},
    {x:0, 	y:1},
    {x:-0.5,y:0.5},
    {x:-1, 	y:0},
    {x:0, 	y:0}
];

Tile.HVdirs = [0,2,4,6];
  /*  
Tile.climate = {
    undefined: 0,
    water: 1,
    grasslands: 2,
    prairie: 3,
    desert: 4,
    snow: 5,
    deepwater: 6,
}*/

Tile.climate = {
    0: {
        name: 'undefined',
        title: 'Неизвестно',
    },
    1: {
        name: 'water',
        title: 'Водоем',
    },
    2: {
        name: 'grasslands',
        title: 'Луга',
    },
    3: {
        name: 'prairie',
        title: 'Степь',
    },
    4: {
        name: 'desert',
        title: 'Пустыня',
    },
    5: {
        name: 'snow',
        title: 'Снега',
    },
    6: {
        name: 'deepwater',
        title: '',
    },
};

utils.createIds(Tile.climate, Tile.climateIds = {});

Tile.relation = {
    none: 0,
    ally: 1,
    enemy: 2,
    self: 3,
    country: 4,
};

Tile.terrain = {
    0: {name: 'flat', title: 'Равнина'},
    1: {name: 'hills', title: 'Холмы'},
    2: {name: 'mountains', title: 'Горы'}
};

utils.createIds(Tile.terrain, Tile.terrainIds = {});

Tile.sizePxArr = [
    {x: 194, y: 98},
    {x: 98, y: 50}];
Tile.dispPxArr = [
    {x: 98, y: 49},
    {x: 49, y: 24.5}];
    
Tile.move = {
	hv: 1,
	diag: 1.5
};

Tile.move.land = {
	obstacles: {
		m: 2, // Горы
		h: 1.5, // Холмы
		dep: 1.5, // Местород
		river: 1 // Река
	}
};
Tile.move.water = {
	mult: {
		river: 0.5, 
		water: 1/1.5
	}
};

// Максимальная скорость преодоления пути между тайлами. Берется, как переход на гору (возможна еще более медленная скорость - переход на холм с устьем реки).
Tile.move.maxSpeed = Tile.move.land.obstacles.m + 0.5;
// Минимальная скорость преодоления пути между тайлами. Берется, как переход на клетку с маглевом без препятсвий
Tile.move.minSpeed = lib.map.road[4].speed;

Tile.fogDirs = {
	
};


Tile.init = function(tile){
	var countryId = Tile.getCountryId(tile);
	
	tile[Tile.param.flag] = '';
	
	if( countryId ){
		var countryFlag = Tile.getCountryFlag(countryId);
		
		// Из-за бордюрных проверок, chunk может не содержать нужной страны, getChunkForTile нельзя использовать, т.к. зацикливается
		if( countryFlag )
			tile[Tile.param.flag] = countryFlag;
	}
};

//Извлекаем уровень улучшения из массива
Tile.getTileImpLevel = function(tile, impId) {
    if(!tile || tile.length==0) return 0;

    var tileImp = tile[Tile.param.env];
    if (typeof tileImp != 'undefined' && tileImp) {
        for (var i in tileImp) {
            if (tileImp[i][0] == impId) return tileImp[i][1];
        }
    }
    return 0;
};


Tile.getTileImp = function(tile, impId){
    var level = Tile.getTileImpLevel(tile, impId);
    if (level) return new MapImp(impId, level);
    else return false;
};
    
Tile.getTileImpUp = function(tile, impId){
    var imp = Tile.getTileImp(tile, impId);

    if (imp) {
        if (imp.canUp()) {
            return imp.getUp();
        } else {
            return false;
        }
    } else {
        return new MapImp(impId, 1);
    }
}


//список конфликтующих улучшений
Tile.getTileImpConflict = function(tile, imp) {
    var conflicts = {};

    if (!imp.isMain()) return conflicts;

    if(!tile || tile.length==0) return conflicts;

    var tileEnv = tile[Tile.param.env];
    if (tileEnv) {
        for (var i in tileEnv) {
            var imp2 = new MapImp(tileEnv[i][0], tileEnv[i][1]);
            if (imp2.isMain() && imp2.getId() != imp.getId()){
                conflicts[imp.getId()] = imp2
            }
        }
    }
    return conflicts;
};

Tile.hasImpMain = function(tile){
	var imps = tile[Tile.param.env];
	
	for(var imp in imps){
		if( (new MapImp(imps[imp])).isMain() )
			return true;
	}
		
	return false;
};

Tile.hasCoast = function(tile, map){
	for (var dir in Tile.dirsMap) {
		var nextTile = map.getTileByDir(tile[Tile.param.posTMT], +dir);
		if (!nextTile) continue;
		if (nextTile[Tile.param.climate] == 1) {
			return true;
		}
	}
	
	return false;
};

Tile.canBuildImp = function(impId, tile, map){
    var error = new ErrorX();

    var cond = new MapImp(impId).getCondition(),
		impLevel = Tile.getTileImpLevel(tile, impId);
	
    if (Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT]) > (cond.closeToTown? 1.9: lib.map.makeroaddistance)) {//расстояние
        error.add(MapImp.buildErr.distance);
    }
	if( impLevel == lib.map.environment[impId].levels.length ){
		return error.add(MapImp.buildErr.level);
	}
	else if (impLevel >= wofh.account.research.env[impId]){
		return error.add(MapImp.buildErr.science);
	}
    if (cond.onlyOnRiver && Tile.tileRiverCount(tile) != 2)// число рек на тайле : если меньше, значит или сухая земля, или исток, если больше - речной перекрёсток, тоже нельзя
        return error.add(MapImp.buildErr.relief);
    if (cond.notOnRiver && Tile.tileRiverCount(tile) > 0)
        return error.add(MapImp.buildErr.relief);
	if (cond.closeToWater) {
        if (Tile.tileRiverCount(tile) == 0){
            var pass = false;
            for (var dir in Tile.dirsMap) {
                var nextTile = map.getTileByDir(tile[Tile.param.posTMT], dir);
                if (!nextTile) continue;
                if (nextTile[Tile.param.climate] == 1 || Tile.tileRiverCount(nextTile) > 0) {
                    pass = true;
                    break;
                }
            }
            if (!pass) return error.add(MapImp.buildErr.relief);
        }
    }
	if (cond.closeToCoast) {
		var pass = false;
		for (var dir in Tile.HVdirs) {
			dir = Tile.HVdirs[dir];
			var nextTile = map.getTileByDir(tile[Tile.param.posTMT], dir);
			if (!nextTile) continue;
			if (nextTile[Tile.param.climate] == 1) {
				pass = true;
				break;
			}
		}
		if (!pass) return error.add(MapImp.buildErr.relief);
	}

    if (cond.notOnDeposit && (tile[Tile.param.dep] != lib.map.nodeposit && tile[Tile.param.dep] != Deposit.ids.oilWater)) return error.add(MapImp.buildErr.relief);
    if (cond.notOnTown && (tile[Tile.param.town] != lib.town.notown && tile[Tile.param.dep] == lib.map.nodeposit)) return error.add(MapImp.buildErr.relief);

    var pass = false;
    for (var climate in cond.onlyOnTerrain) {
        if (tile[Tile.param.terrain] == cond.onlyOnTerrain[climate]){ 
            pass = true;
            break;
        };
    }
    if (!pass) return error.add(MapImp.buildErr.relief);

    if (cond.notOnClimate) {
        for (var climate in cond.notOnClimate) {
            if (tile[Tile.param.climate] == cond.notOnClimate[climate]) return error.add(MapImp.buildErr.relief);
        }
    }

    return error;
};

Tile.hasRoad = function(tile){
	if( !tile ) return false;
	
    var roads = tile[Tile.param.roads];
	
	for(var road in roads)
		if( roads[road] > 1 )
			return true;
	
	return false;
};

Tile.initRoadLayers = function(tile){
	if( !tile[Tile.param.layers].road ) tile[Tile.param.layers].road = [];
	if( !tile[Tile.param.layers].pike_road ) tile[Tile.param.layers].pike_road = [];
};

Tile.isNotResearchedRoad = function(roadType, checkTunnelAbil){
	if( checkTunnelAbil )
		return !wofh.account.hasAbility(Science.ability.roadTunnel);
	
	return roadType >= wofh.account.research.road;
};

Tile.isMountains = function(tile){
	return tile && tile[Tile.param.terrain] == Tile.terrainIds.mountains;
};

Tile.hasMountainTunnel  = function(tile){
    return Tile.isMountains(tile) && Tile.hasRoad(tile);
};

Tile.isMountainRoad = function(roadType){
    return roadType == Road.ids.tunnel;
};

Tile.isWater = function(tile){
	return tile && tile[Tile.param.climate] == Tile.climateIds.water;
};



// Если задан inDir - ищет реку в заданном направлении
Tile.tileRiverCount = function(tile, inDir, useRoadsExt){
    var count = 0;
	
	if( !tile )
		return count;
		
	var roads = tile[Tile.param.roads];
	
	if( inDir === undefined ){
		for(var dir in roads){
			// Река
			if( roads[dir] == 1 )
				count++;
		}
	}
	else{
		if( useRoadsExt )
			roads = tile[Tile.param.roadsExt];
		
		if( roads[inDir] == 1 )
			count++;
	}
	
    return count;
};

Tile.isMoveThroughRiver = function(fromTile, toTile, dir){
	if( Tile.tileRiverCount(toTile) )
		return true;
	
	if( 
		(dir == 1 && Tile.tileRiverCount(fromTile, 8, true)) ||
		(dir == 5 && Tile.tileRiverCount(toTile, 8, true)) ||
		(dir == 3 && Tile.tileRiverCount(fromTile, 9, true)) ||
		(dir == 7 && Tile.tileRiverCount(toTile, 9, true))
	){
		return true;
	}

	return false;
};

Tile.getWaterZones = function(tile, useRivers, map){
    var zones = [];
    
    if(useRivers){
        var zone2 = tile[Tile.param.zone2];
        if (zone2) {
            zones.push(zone2);
        }
    }
    
    if (tile[Tile.param.climate] != Tile.climateIds.water) {
        for (var dir in Tile.HVdirs) {
            dir = Tile.HVdirs[dir];
            
            var nextTile = map.getTileByDir(tile[Tile.param.posTMT], dir);
            if(!nextTile) continue;
            
            if(nextTile[Tile.param.climate] == Tile.climateIds.water){
                zones.push(nextTile[Tile.param.zone1]);
            }
        }
    }
    
    return zones;
};



Tile.getPlayerId = function(tile){
    var acc = wofh.world.getAccountByTown(tile[Tile.param.town]);
	
    return acc ? acc.id : 0;
};

Tile.getCountryId = function(tile){
    var country = wofh.world.getCountryByTown(tile[Tile.param.town]);
	
    return country ? country.id : 0;
};

Tile.getCountryFlag = function(countryId){
	var country = wofh.world.getCountry(countryId);
	
	if( country )
		return country.flag;
};


Tile.getWonder = function(tile){
    var wonder = tile[Tile.param.wonder];
    var wonderId = wonder%1000;
    return new Slot(wonderId, Math.min(lib.build.maxlevel, utils.toInt(wonder/1000)), lib.build.nobuild, wonder>=21000);
};

Tile.isSame = function(tile1, tile2){
    return Tile.isSamePos(tile1[Tile.param.posTMT], tile2[Tile.param.posTMT]);
};

Tile.isSamePos = function(pos1, pos2){
    return pos1.x == pos2.x && pos1.y == pos2.y
};

Tile.asRaw = function(rawTile, tile){
	if( rawTile && tile ){
		for(var i in rawTile){
			if( i == Tile.param.env ){
				if( !utils.isEqual(rawTile[i], tile[i]) )
					return false;
			}
			else if( rawTile[i] != tile[i] )
				return false;
		}
		
		return true;
	}
	else
		return rawTile == tile;
};

Tile.clone = function(tile){
    var layers = tile[Tile.param.layers];
    tile[Tile.param.layers] = null;

    var clone = utils.clone(tile);

    tile[Tile.param.layers] = layers;    
    clone[Tile.param.layers] = layers; 

    return clone;   
};


Tile.calcPosTCT = function(tile, i){
    tile[Tile.param.posTCT] = {
        x: i%Chunk.sizeT.x,
        y: parseInt(i/Chunk.sizeT.y)
    };   
};

Tile.calcPosTCpx = function(tile){
    tile[Tile.param.posTCpx] = {
        x: Chunk.sizePx.x/2 + (tile[Tile.param.posTCT].x - tile[Tile.param.posTCT].y - 1) * (Tile.dispPxArr[0].x),
        y: (tile[Tile.param.posTCT].x + tile[Tile.param.posTCT].y) * Tile.dispPxArr[0].y
    };
};

Tile.calcPosTMpx = function(tile, chunk){
    tile[Tile.param.posTMpx] = {
        x: tile[Tile.param.posTCpx].x + chunk.posCMpx.x,
        y: tile[Tile.param.posTCpx].y + chunk.posCMpx.y
    };
};


Tile.hasCoor = function(tile, x, y, callbackOrLog){
	if( !tile )
		return;
	
	var posTMT = tile.posTMT||tile[Tile.param.posTMT];
	
	if( !posTMT )
		return;
	
	if( posTMT.x == x && posTMT.y == y ){
		if( callbackOrLog instanceof Function )
			callbackOrLog(tile, x, y);
		else
			console.log(callbackOrLog||'');
		
		return true;
	}
	
	return false;
};

Tile.getRoads = function(tile) {
	return tile[Tile.param.roads];
};

Tile.getRealRoads = function(tile) {
	return tile[Tile.param.realRoads]||tile[Tile.param.roads];
};

Tile.getRealRoadsCount = function(tile) {
    var realRoads = Tile.getRealRoads(tile),
        roads = {},
        roadCount = 0;

    for( var road in realRoads ){
        road = realRoads[road];
        
        if( road > 1 && !roads[road] ){
            roads[road] = true;
            
            ++roadCount;
        }
    }
    
    return roadCount;
};

Tile.addLayer = function(tile, layerName, layer) {
	if( !tile ) return;
	
	tile[Tile.param.layers][layerName] = tile[Tile.param.layers][layerName]||[];
						
	tile[Tile.param.layers][layerName].push(layer);
};

Tile.isDebug = function(tile){
	if( !debug.params.tile )
        return;
    
    var coor = JSON.parse(debug.params.tile);

    return Tile.hasCoor(tile, coor[0], coor[1]);
};




Chunk = {};

//Размер чанка в тайлах
Chunk.sizeT = {x: 15, y: 15};

//Размер чанка в пикселях
Chunk.sizePx = {
    x: Chunk.sizeT.x * Tile.dispPxArr[0].x*2,
    y: Chunk.sizeT.y * Tile.dispPxArr[0].y*2
};

Chunk.getTilePos = function(posTMT, chunk){
    return (posTMT.x - chunk.posCMT.x) + (posTMT.y - chunk.posCMT.y) * Chunk.sizeT.y;
};


function TTile(){}

function TileSelect(){}

utils.extend(TileSelect, TTile);


TileSelect.prototype.getRoadDirs = function(){
	return this.roadDirs;
};

TileSelect.prototype.getRealRoadDirs = function(){
	return this.realRoadDirs||this.roadDirs;
};

TileSelect.prototype.hasImp = function(impId){
	for(var imp in this.improves){
        if( this.improves[imp].id == impId )
            return true;
    }
    
    return false;
};