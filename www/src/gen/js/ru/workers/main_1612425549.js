window = self;

WorkerMgr = function(){};


WorkerMgr.prototype.init = function(data){
	window.wofh = {};
	
	this.initScripts(data);
	
	this.initAppl(data);
	
    workerMgr.postMessage({handler: 'onInit'});
    
	return this;
};

WorkerMgr.prototype.initScripts = function(data){
	var root = data.root||'/';
	
	importScripts(root + 'gen/js/ru/lib/moment.min_1560026397.js');
	
	importScripts(root + 'gen/js/ru/app/debug_1603265045.js');
	importScripts(root + 'gen/js/ru/app/util_1612406235.js');
	
		utils.copy = function(to, from){
			return utils.copyProperties(to, from);
		};
	
	utils.copy(debug, data.debug);
	
	importScripts(root + 'gen/js/ru/app/timer_1609116996.js');
	
	timeMgr.unbind();
	
	importScripts(root + 'gen/js/ru/app/ls_1602992885.js');
	importScripts(root + 'gen/js/ru/app/hash_1603150702.js');
	importScripts(root + 'gen/js/ru/app/snipet_1612425521.js');
	importScripts(root + 'gen/js/ru/app/wndMgr_1611225654.js');
	
	importScripts(root + 'gen/js/ru/core/c.element_1602389906.js');
	importScripts(root + 'gen/js/ru/core/c.baseItem_1587467149.js');	
	importScripts(root + 'gen/js/ru/core/c.account_1603250794.js');
	
		Account.prototype.unpack = function(){
			delete this.name;
			delete this.sex;
			
			this.unpackParts();
		};
		
		Account.prototype.unpackParts = function(){};
		
		Account.prototype.prepareFutureBuilds = function(){};
		
        utils.overrideMethod(Account, 'updLinks', function __method__(){
            __method__.origin.call(this);
            
            delete this.race;

			if( !this.country )
				delete this.country;

			delete this.upd;
        });
	
	importScripts(root + 'gen/js/ru/core/c.list_1602385629.js');
	importScripts(root + 'gen/js/ru/core/c.countList_1602385627.js');
	importScripts(root + 'gen/js/ru/core/c.buildList_1587467153.js');
	importScripts(root + 'gen/js/ru/core/c.race_1587467188.js');
	importScripts(root + 'gen/js/ru/core/c.resource_1603076986.js');
	importScripts(root + 'gen/js/ru/core/c.resList_1587467194.js');
	importScripts(root + 'gen/js/ru/core/c.event_1600920507.js');
	importScripts(root + 'gen/js/ru/core/c.eventList_1604805592.js');
	importScripts(root + 'gen/js/ru/core/c.country_1598944521.js');
	
		Country.prototype.unpack = function(){
			delete this.name;
			
			this.unpackParts();
		};
		
		Country.prototype.unpackParts = function(){};
		
        utils.overrideMethod(Country, 'updLinks', function __method__(){
            __method__.origin.call(this);
            
            delete this.upd;
        });
	
	importScripts(root + 'gen/js/ru/core/c.accountScience_1602992891.js');
	importScripts(root + 'gen/js/ru/core/c.build_1599950689.js');
	importScripts(root + 'gen/js/ru/core/c.science_1603076988.js');
		
		Science.prototype.initArmy = function(){};
		
		Science.prototype.initSpecialists = function(){};
	
	importScripts(root + 'gen/js/ru/core/c.scienceList_1586332095.js');
	importScripts(root + 'gen/js/ru/core/c.slot_1606024502.js');
	importScripts(root + 'gen/js/ru/core/c.deposit_1607496481.js');
	importScripts(root + 'gen/js/ru/core/c.road_1587467199.js');
	importScripts(root + 'gen/js/ru/core/c.tile_1608681118.js');
	importScripts(root + 'gen/js/ru/core/c.mapImp_1586332063.js');
	importScripts(root + 'gen/js/ru/core/c.trade_1602721106.js');
	importScripts(root + 'gen/js/ru/core/c.path_1601799409.js');
	importScripts(root + 'gen/js/ru/core/c.town_1603150711.js');
	
		Town.prototype.unpack = function(){
			delete this.name;
			
			this.unpackParts();
		};
		
		Town.prototype.unpackParts = function(){};
		
		Town.prototype.unpackStock = function() {
			if( !this.stock || this.stock instanceof Stock )
				return;
			
			var stock = new Stock();
			
			stock.town = this;
			
			stock.list = this.stock.list;
			
			for(var resId in stock.list){
				var stockRes = new StockRes();
				
				stockRes.town = stock.town;
				
				stock.list[resId] = utils.copyProperties(stockRes, stock.list[resId]);
			}
			
			delete this.stock.list;
			
			utils.copyProperties(stock, this.stock);
			
			this.stock = stock;
		};
		
        utils.overrideMethod(Town, 'updLinks', function __method__(){
            __method__.origin.call(this);
            
            delete this.upd;
        });
		
		Town.prototype.setWonderEffectTimer = function(){};
		
	importScripts(root + 'gen/js/ru/core/c.slotList_1602385632.js');
	importScripts(root + 'gen/js/ru/core/c.world_1587467240.js');
	importScripts(root + 'gen/js/ru/view/comp/block_1611621320.js');
	
		Block.prototype.fullName = function(){};

		Block.prototype.calcTmplFolder = function(){};

		Block.prototype.saveChunk = function(){};

	importScripts(root + 'gen/js/ru/view/comp/interface_1603845030.js');
	importScripts(root + 'gen/js/ru/view/map/i.map_1611629432.js');
	
		iMap.prototype.calcTmplFolder = function(){};
		
		iMap.prototype.makeRoadBinByDir = function(dir, type) {
			return ((+type+1) << (dir*3));
		};
		
		iMap.prototype.makeRoadBinByDirs = function(roadDirs, roadDirsCross) {
			roadDirs = roadDirs||[];

			if( !utils.isArray(roadDirs) )
				return 0;

			roadDirs = utils.clone(roadDirs);

			if( roadDirs.length < 8 ){
				for(var i = roadDirs.length; i < 8; i++){
					roadDirs.push(0);
				}
			}
			else if( roadDirs.length > 8 )
				roadDirsCross = roadDirs.splice(8);

			roadDirs = roadDirs.splice(2).concat(roadDirs);

			if( roadDirsCross && utils.isArray(roadDirs) && (roadDirsCross.length > 0 && roadDirsCross.length < 3) )
				roadDirs = roadDirs.concat(roadDirsCross);

			var roadBin = 0;

			for (var roadDir in roadDirs) {
				var roadType = roadDirs[roadDir];

				roadBin |= this.makeRoadBinByDir(roadDir, roadType-1);
			}

			return roadBin;
		};
		
		iMap.prototype.initStaticNotif = function(){};
		
		iMap.prototype.initSettings = function(){};
        
    importScripts(root + 'gen/js/ru/view/map/bckMap_1608768036.js');

        bckMap.prototype.simplifyImgSets = function(){};

        bckMap.prototype.cleanChunksLoadArr = function(){};

        bckMap.prototype.loadResourcesForView = function(){};

        bckMap.prototype.showView = function(){};

        bckMap.prototype.prepareChunksByWorker = function(){};

        bckMap.prototype.toggleMap = function(){};

        bckMap.prototype.setMapCls = function(){};

    importScripts(root + 'gen/js/ru/view/map/bckMapSimple_1603679080.js');

        bckMapSimple.prototype.setMapCls = function(){};
};

WorkerMgr.prototype.initAppl = function(){
	wofh.world = (new World()).init();
	
	
	
	iMapMask = function(){
		iMapMask.superclass.constructor.apply(this, arguments);
	};
	
	utils.extend(iMapMask, iMap);
	
	
	iMapMask.prototype.saveChunk = function(newChunk){
		this.newChunks.push(newChunk);
		
		iMapMask.superclass.saveChunk.apply(this, arguments);
	};
	
	iMapMask.prototype.getOldBoundaryChunks = function(){
		var boundaryChunks = [], // Чанки, тайлы которых граничат с текущими
			boundaryChunk,
			boundaryTiles;
		
		for(var newChunk in this.newChunks){
			newChunk = this.newChunks[newChunk];

			for(var dir in Tile.dirsMap) {
				dir = Tile.dirsMap[dir];
				
				boundaryChunk = this.getChunk({
					x: newChunk.posCMC.x + dir.x,
					y: newChunk.posCMC.y + dir.y
				});
				
				if( !boundaryChunk || this.isNewChunk(boundaryChunk) )
					continue;
				
				boundaryTiles = boundaryChunk.tiles;
				
				boundaryChunk = {
					posCMC: boundaryChunk.posCMC,
					tiles: {}
				};
				
				boundaryChunks.push(boundaryChunk);
				
				for(var i = 0; i < boundaryTiles.length; i++){
					var boundaryTile = boundaryTiles[i];
					
					if( boundaryTile && boundaryTile[Tile.param.boundary] && !boundaryTile[Tile.param.layers].cached )
						boundaryChunk.tiles[i] = boundaryTile;
				}
			}
		}
		
		return boundaryChunks;
	};
	
	iMapMask.prototype.isNewChunk = function(boundaryChunk){
		for(var newChunk in this.newChunks){
			newChunk = this.newChunks[newChunk];
			
			if( newChunk.posCMC.x == boundaryChunk.posCMC.x && newChunk.posCMC.y == boundaryChunk.posCMC.y )
				return true;
		}
		
		return false;
	};
	
	
	
	bckMapMask = function(){
		bckMapMask.superclass.constructor.apply(this, arguments);
		
		if( debug.useMapRoadsCacheInWorker() ){
			this.canvasRoadTag = new OffscreenCanvas(Tile.sizePxArr[0].x + 40, Tile.sizePxArr[0].y + 43);
			this.canvasRoadTag.width = Tile.sizePxArr[0].x + 40;
			this.canvasRoadTag.height = Tile.sizePxArr[0].y + 43;
			this.canvasRoad = this.canvasRoadTag.getContext('2d');
			this.canvasRoad.offset = {x: 20, y: 10};
			
			this.transferableList = [];
		}
	};

	utils.extend(bckMapMask, bckMap);
	
	
	bckMapMask.prototype.prepareChunks = function(data){
		bckMapMask.superclass.prepareChunks.apply(this, arguments);
		
		if( debug.useMapRoadsCacheInWorker() )
			this.cacheRoads(data);
		else
			workerMgr.mapChunksReady(data);
			
	};
	
	bckMapMask.prototype.loadRoadRes = function(callback){
		var roads = this.createResRoads('https://test.waysofhistory.com/img/map1/road-100/'+'road_', {asphalt: true});
		
		this.roadResCount = 0;
		
		this.resLoaded = [{road:{}}];
		this.patterns = {0:{road:{}}};
		
		for(var road in roads){
			road = roads[road];
			
			map.resLoaded[0].road[road.roadType] = [];
			map.patterns[0].road[road.roadType] = [];
			
			for(var url in road.url){
				this.requestRes(url, road.url[url], road.roadType, callback);
			}
		}
	};
	
	bckMapMask.prototype.requestRes = function(i, url, roadType, callback){
		var request = new XMLHttpRequest();
		
		request.open('GET', url);
		request.responseType = 'blob';

		request.onload = function(){
			if( request.status === 200 ){
				createImageBitmap(request.response).then(function(imgBitmap){
					map.resLoaded[0].road[roadType][i] = imgBitmap;
					
					map.patterns[0]['road'][roadType][i] = map.canvasRoad.createPattern(imgBitmap, 'repeat');
					map.patterns[0]['road'][roadType][i].src = imgBitmap;

					map.roadResLoaded(callback);
				});
			} 
			else
				console.log('Image didn\'t load successfully; error code:' + request.statusText);
		};

		request.onerror = function(){

		};

		this.roadResCount++;

		request.send();
	};
	
	bckMapMask.prototype.roadResLoaded = function(callback){
		if( --this.roadResCount )
			return;
		
		callback();
	};
	
	bckMapMask.prototype.cacheRoads = function(data){
		this.drawRoadCache = true;
		
		for(var i = 0; i < iMap.roadsCache.length; i++){
			var tileInfo = iMap.roadsCache[i];
			
			if( tileInfo.type == Road.ids.tunnel )
				continue;
			
			tileInfo.cache = {};
			
			var resInfo = this.tResRoads[tileInfo.name];
			
			if( this.renderRoadTile(tileInfo, 0, resInfo, false, 'road') ){
				tileInfo.cache[0] = this.canvasRoadTag.transferToImageBitmap();;
				
				this.transferableList.push(tileInfo.cache[0]);
			}
			
			if( this.renderRoadTile(tileInfo, 1, resInfo, false, 'road') ){
				tileInfo.cache[1] = this.canvasRoadTag.transferToImageBitmap();
				
				this.transferableList.push(tileInfo.cache[1]);
			}
			
			tileInfo.roads.length = 0;
		}
		
		workerMgr.mapChunksReady(data);
	};
    
    bckMapMask.prototype.canRoadsCache = function(){
		return true;
	};
    
    
    
    bckMapSimpleMask = function(){
        bckMapSimpleMask.superclass.constructor.apply(this, arguments);
    };
    
    utils.extend(bckMapSimpleMask, bckMapSimple);


    bckMapSimpleMask.prototype.prepareChunks = function(data){
        bckMapSimpleMask.superclass.prepareChunks.apply(this, arguments);

        workerMgr.mapChunksReady(data);
    };

    bckMapSimpleMask.prototype.canRoadsCache = function(){
        return false;
    };
    
    
	
	wndMgr.interface = new iMapMask();
	
    mapMask = new bckMapMask(wndMgr.interface);

    mapSimpleMask = new bckMapSimpleMask(wndMgr.interface);

    workerMgr.checkMapVersion();
	
    
	
	Science.init();
	
	Town.init();
};


WorkerMgr.prototype.initBase = function(data){
	if( data.account ){
		wofh.account = data.account; // Во время инициализации данных акка могут быть обращения к wofh.account (не совсем корректно)
		
		wofh.account = new Account(data.account);
	}
	
	if( data.town )
		wofh.town = new Town(data.town);
	
	if( data.country )
		wofh.country = new Country(data.country);
	else
		delete wofh.country;
};

WorkerMgr.prototype.setLib = function(lib){
	window.lib = lib;
};

WorkerMgr.prototype.setLocalStorage = function(localStorage){
	window.localStorage = localStorage;
};


WorkerMgr.prototype.prepareMapChunks = function(data){
	var result = {handler: 'onMapChunksReady', uid: data.uid};
	
	if( !data.chunks ){
		result.chunks = data.chunks;
		
		workerMgr.postMessage(result);
		
		return;
	}
	
	Account.prototype.unpackParts = function(){
		delete this.race;
	};
	
	this.initBase(data);

	utils.copy(map, data.map); // Настройки карты
	
	wofh.world.parse(data.world.towns, data.world.accounts, data.world.countries);
	
	
	map.map.newChunks = [];
    
	map.prepareChunks(data);
};

WorkerMgr.prototype.mapChunksReady = function(data){
	var result = {handler: 'onMapChunksReady', uid: data.uid};
	
	result.chunks = map.map.newChunks;
	
	result.boundaryChunks = map.map.getOldBoundaryChunks(); // Чанки, тайлы которых граничат с текущими

	workerMgr.postMessage(result, debug.useMapRoadsCacheInWorker() ? map.transferableList : undefined);
	
	if( debug.useMapRoadsCacheInWorker() ){
		for(var i = 0; i < iMap.roadsCache.length; i++){
			if( !iMap.roadsCache[i].cache )
				continue;
			
			var roadCache = iMap.roadsCache[i].cache;
			
			for(var cache in roadCache){
				roadCache[cache].close();
			}
			
			delete iMap.roadsCache[i].cache;
		}
		
		map.transferableList.length = 0;
		iMap.roadsCache.length = 0;
	}
	
	for(var tiles in result.chunks){
		tiles = result.chunks[tiles].tiles;

		for(var i = 0; i < tiles.length; i++){
			if( !tiles[i] )
				continue;

			delete tiles[i][Tile.param.actual];

			tiles[i][Tile.param.layers] = {cached: true}; // Чистим слои для экономии памяти
		}
	}

	for(var tiles in result.boundaryChunks){
		tiles = result.boundaryChunks[tiles].tiles;

		for(var tile in tiles){
			tile = tiles[tile];

			if( !tile )
				continue;

			delete tile[Tile.param.actual];

			tile[Tile.param.layers] = {cached: true}; // Чистим ячейку со слоями, у перерасчитанных граничних тайлов
		}
	}

	map.map.newChunks = [];
};

WorkerMgr.prototype.checkMapVersion = function(){
	map = iMapMask.isSimplified() ? mapSimpleMask : mapMask;
};


WorkerMgr.prototype.tryPrepareMapChunks = function(data){
	if( map.canRoadsCache() && debug.useMapRoadsCacheInWorker() ){
		if( map.firstChunksLoaded )
			this.prepareMapChunks(data);
		else{
			map.loadRoadRes(function(){
				map.firstChunksLoaded = true;
				
				workerMgr.prepareMapChunks(data);
			});
		}
	}
	else
		this.prepareMapChunks(data);
};

WorkerMgr.prototype.calcFutureBuilds = function(data){
	var result = {handler: 'onFutureBuildsReady', uid: data.uid};
	
	Account.prototype.unpackParts = function(){
		this.unpackScience();
	};
	
	this.initBase(data);
	
	var builds = wofh.account.science.calcFutureBuilds(data.deepness).getList(),
		buildsRaw = {};
	
	for(var build in builds){
		build = builds[build];
		
		var needScience = build.needScience.getList(),
			needScienceRaw = {};
		
		for(var science in needScience){
			science = needScience[science];
			
			needScienceRaw[science.getId()] = science.getId();
		}
		
		build.needScience = needScienceRaw;
		
		buildsRaw[build.getId()] = {
			id: build.getId(),
			level: build.level,
			needScience: build.needScience
		};
	}
	
	result.builds = buildsRaw;
	
	workerMgr.postMessage(result);
};

WorkerMgr.prototype.updWorker = function(data){
	var result = {handler: 'onUpdWorker', uid: data.uid};
	
	workerMgr.postMessage(result);
};



WorkerMgr.prototype.postMessage = function(data, transferableList){
	postMessage(data, transferableList);
};

onmessage = WorkerMgr.prototype.onmessage = function(event){
	var data = event.data[0];
	
    
	if( data.lib )
		workerMgr.setLib(data.lib);
    
	if( data.localStorage )
		workerMgr.setLocalStorage(data.localStorage);
    
    if( data.clearMapChunks )
		iMap.clearChunks();
    
    if( data.checkMapVersion )
        workerMgr.checkMapVersion();
    
    
	if( data.init )
		workerMgr.init(data);
	else if( data.prepareChunks )
		workerMgr.tryPrepareMapChunks(data);
	else if( data.calcFutureBuilds )
		workerMgr.calcFutureBuilds(data);
    else if( data.updWorker )
		workerMgr.updWorker(data);
};



workerMgr = new WorkerMgr();