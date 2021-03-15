iMap = function(){
	iMap.superclass.constructor.apply(this, arguments);
    
    this.init();
};

utils.extend(iMap, Interface);

iMap.chunks = [];

iMap.chunksShift = 32;

iMap.mode = {};

iMap.mode.type = {view: 'view', build: 'build', makeRoute: 'makeRoute'};

iMap.version = {full: 2, simplified: 3};

iMap.isFull = function(){
    return ls.getMapVersion(iMap.version.full) == iMap.version.full;
};

iMap.isSimplified = function(){
    return ls.getMapVersion(iMap.version.full) == iMap.version.simplified;
};

iMap.getMapConstructor = function(){
    return this.isSimplified() ? bckMapSimple : bckMap;
};

iMap.clearChunks = function(callback){
    iMap.chunks = [];

    if( callback )
        callback();
};

iMap.clearChunksByWorker = function(callback){
    reqMgr.updWorker({
        localStorage: LS.getActualLS(),
        clearMapChunks: true,
        checkMapVersion: true
    }, function(){
        iMap.chunks = [];

        if( callback )
            callback();
    });
};


if( debug.useMapRoadsCacheInWorker() ){
    iMap.roadsCache = [];

    iMap.compressRoadsCache = function(){
        if( wndMgr.interfaces.map.isAnimated() )
            return;

        var tile = iMap.roadsCache.pop();

        if( !tile )
            return;

        var roads = tile[Tile.param.layers].road;

        for(var roadCache in roads){
            roadCache = roads[roadCache].cache;

            if( !roadCache )
                continue;

            for(var cache in roadCache){
                var roadImg = new Image();

                if( !iMap.canvasCompress ){
                    iMap.canvasCompressTag = document.createElement('canvas');
                    iMap.canvasCompressTag.width = roadCache[cache].width;
                    iMap.canvasCompressTag.height = roadCache[cache].height;
                    iMap.canvasCompress = iMap.canvasCompressTag.getContext('2d');
                }

                iMap.canvasCompress.clearRect(0, 0, iMap.canvasCompressTag.width, iMap.canvasCompressTag.height);
                iMap.canvasCompress.drawImage(roadCache[cache], 0, 0);

                roadImg.src = iMap.canvasCompressTag.toDataURL();

                roadCache[cache].close();
                roadCache[cache] = roadImg;
            }
        }

        setTimeout(iMap.compressRoadsCache, 100);
    };
}


iMap.prototype.calcName = function(){
    return 'map';
};

iMap.prototype.calcTmplFolder = function(){
    return tmplMgr.iMap;
};

iMap.prototype.calcChildren = function(){
    //виды на главной странице
    this.children.loadIndicator = bLoadIndicator;
    this.children.clock = pClock;

    this.children.map = iMap.getMapConstructor();

    this.children.right = bMapR;
    this.children.tlBlock = bMapTL;
    this.children.minimap = bMapMini;
    this.children.mainmenu = bShortMainMenu;
};

iMap.prototype.getData = function(){
    this.setUpd();

    this.dataReceived();
};

iMap.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.accNewCenterTown];

    this.notif.other[Notif.ids.mapVersion] = this.onVersionChange;
    this.notif.other[Notif.ids.townCur] = this.calcSelectTileDist;
    this.notif.other[Notif.ids.mapChunkLoaded] = this.checkSelectedTileLoaded;
    this.notif.other[Notif.ids.mapTileSelect] = this.getRoute;
};

iMap.prototype.beforeShowChildren = function(){
    wndMgr.$body.addClass('-if-map');

    if( this.clrMapScr )
        this.toggleInterface(true);
};

iMap.prototype.afterShow = function(){
    this.setZoom(this.zoomLevel);

    notifMgr.runEvent(Notif.ids.mapShow);

    wofh.account.ability.checkMap();
};

iMap.prototype.refresh = function(){
    this.lastPosMWT = this.tileSelect && utils.clone(this.tileSelect.posTMT);

    this.close();

    this.show();
};

iMap.prototype.clearWrp = function() {	
    this.mode = {type: iMap.mode.type.view};

    delete this.tileSelect;
    delete this.tileHover;
    delete this.tileRoutes;
    delete this.mapRoutes;
    delete this.tileHighlight;
    
    iMap.superclass.clearWrp.apply(this, arguments);
};


iMap.prototype.init = function(){
    this.initZoom();
	
    this.zoomPoints = [100, 93, 86,  81,  73,  68,  63,  58,  54,  50];
    this.zoomPointsSimplified = [100, 87,  76,  66,  57,  50,  43,  37,  33,  28];
	
	this.zoom = 1;//текущий зум
    
    //настройки интерфейса
	this.settings = {};
	
    this.initSettings();
    
    this.mode = {type: iMap.mode.type.view};
    
	//активные ауры
	this.activeAura = {};
    
	//Размеры тайла
    this.dispTTpx = {x: 98,y: 49};
};

    iMap.prototype.initZoom = function(){
        this.zoomLevelMax = 100;
        this.zoomLevelNorm = 100;
        this.zoomLevelMin = 30;
    };


iMap.prototype.initStaticNotif = function(){
    notifMgr.addListener(Notif.ids.workerMapChunks, 'workerMapChunks', this.processChunksFromWorker, this);
};

iMap.prototype.setId = function(idStr){
    this.id = idStr;

    //Позиция карты
    this.posMWT = utils.clone(wofh.town.pos);
};

iMap.prototype.getId = function(){
    if ( !this.tileSelect )
        return '';

    return hashMgr.toStr(this.tileSelect.posTMT, true);
};

iMap.prototype.setHash = function(){
    hashMgr.parse(['map', this.getId()], true);
};


iMap.prototype.onIdChange = function(newId){
    var hashData = this.getHash(newId);

    if( hashData )
        this.moveTo(hashData, {highlight: true});
};

iMap.prototype.onVersionChange = function(){
    this.refresh();
};

//загрузка настроек
iMap.prototype.initSettings = function(){
    this.settings = LS.get('map');
    
    if( !this.settings ){
        this.settings = {};
        this.settings.zoom = 0;//нулевой уровень зума!    
        this.settings.mmap = 'clim';
        this.settings.p_aura_show = true;
        this.settings.p_iface_show = true;
        this.settings.p_filter_show = true;

        this.settings.p_iface = Quest.isAvail(Quest.ids.deposit) ? {colonization: true} : {};

        this.settings.p_rgt = false;
    }
    
    if( !this.settings.p_filter2 )
        this.setDefFilter2();
    
    this.initSettingsRight();
    
    this.initSettingsZoom();
    
    this.routeMode = Route.modes[Route.modeIds.all];
};

iMap.prototype.initSettingsRight = function(){
    if( Quest.isActive(Quest.ids.mappost) ) this.settings.p_rgt = true;
};

iMap.prototype.initSettingsZoom = function(){
    this.zoomLevel = this.settings.zoom||this.getNormZoom();
};

iMap.prototype.setUpd = function(){
    this.upd = timeMgr.getNow();
};

iMap.prototype.processChunksFromWorker = function(data){
    var map = this.map;

    // Сохраняем пересчитанные граничные тайлы
    for(var boundaryChunk in data.boundaryChunks){
        boundaryChunk = data.boundaryChunks[boundaryChunk];

        var chunk = this.getChunk(boundaryChunk.posCMC);

        if( !chunk )
            continue;

        for(var tile in boundaryChunk.tiles){
            chunk.tiles[tile] = boundaryChunk.tiles[tile]; // Пересчитанные граничные тайлы
        }
    }

    var needPreCacheRoads = false;

    if( map.canPreCacheRoads() ){
        needPreCacheRoads = true;

        map.drawRoadCache = true;

        map.roadsListForPreCache = [];	
    }

    for(var chunk in data.chunks){
        chunk = data.chunks[chunk];

        map.cleanChunksLoadArr(chunk);

        var oldChunk = this.getChunk(chunk.posCMC);

        this.saveChunk(oldChunk||chunk);

        for(var i = 0; i < chunk.tiles.length; i++){
            var tile = chunk.tiles[i];

            if( !tile )
                continue;

            if( oldChunk ){
                if( tile[Tile.param.actual] )
                    continue;
                else
                    oldChunk.tiles[i] = tile;
            }

            if( needPreCacheRoads )
                map.preCacheRoads(tile);
            else if( debug.useMapRoadsCacheInWorker() && tile[Tile.param.layers].road && tile[Tile.param.layers].road.length )
                iMap.roadsCache.push(tile);

            delete tile[Tile.param.actual];
        }
    }

    if( needPreCacheRoads && map.roadsListForPreCache.length ){
        // createImageBitmap - работает гораздо быстрее, но жрет больше памяти, поэтому юзаем только при первом захде на карту (не работает на яБлонах)
        if( window.createImageBitmap ){
            map.preCacheRoadsAsync();
            
            return;
        }

        map.preCacheRoadsSync();
    }

    this.showView();
};

iMap.prototype.showView = function(){
    this.map.inWorker = false;

    this.map.drawRoadCache = false;

    if( debug.useMapRoadsCacheInWorker() )
        iMap.compressRoadsCache();

    this.map.showView(true);
};

iMap.prototype.getRoute = function(){
    if ( !this.tileSelect || !this.tileRoutes || !this.canRoute(this.tileSelect) || this.mode.type != iMap.mode.type.makeRoute ) return;

    this.mapRoutes = new RouteList(false, {
        from: this.tileRoutes,
        to: this.tileSelect,
        dataLoading: true
    }); // Сохраняем только данные по начальному и конечному тайлу (для возможности показать вектор дистанции) по которым строим маршрут

    notifMgr.runEvent(Notif.ids.mapRequestRoute);

    var self = this,
        posTo = Trade.movePointToMap(this.tileSelect.tile[Tile.param.posTMT]),
        posFrom = Trade.movePointToMap(this.tileRoutes.tile[Tile.param.posTMT]),
        path = [+this.posMWT.o, 
            [posFrom.x, posFrom.y, posTo.x, posTo.y]
        ];

    reqMgr.getTileData(false, path, false, function(resp){
        self.mapRoutes = new RouteList(self.extractPath(resp.path_, posFrom, posTo), {
            from: self.tileRoutes,
            to: self.tileSelect,
            mode: self.routeMode
        }); // Маршрут от тайла до тайла (с данными по путям)

        self.mapRoutes.getLast().active = true;

        self.setMode(iMap.mode.type.view);

        notifMgr.runEvent(Notif.ids.mapRouteReceived);
        notifMgr.runEvent(Notif.ids.mapShowRoute);
    }, this.routeMode.id);
};

iMap.prototype.canRoute = function(tileSelect){
    return tileSelect && tileSelect.climate.id != Tile.climateIds.water;
};

iMap.prototype.calcSelectTileDist = function(){
    if (!this.tileSelect) return;

    var self = this;

    this.tileSelect.dist = {
        air: Trade.calcMapDistance(wofh.town.pos, this.tileSelect.posTMT)
    };

    var pos = Trade.movePointToMap(this.tileSelect.tile[Tile.param.posTMT]); // Нормируем координаты

    var path = [+this.posMWT.o, 
        [wofh.town.pos.x, wofh.town.pos.y, pos.x, pos.y]
    ];

    reqMgr.getTileData(false, path, false, function(resp){
        if( !self.tileSelect )
            return;

        //путь
        var path = self.extractPath(resp.path_, wofh.town.pos, pos);;

        self.tileSelect.dist = new Path({air: self.tileSelect.dist.air}).parse(path);

        self.tileSelect.dist.min = self.tileSelect.dist.calcMinDist();

        notifMgr.runEvent(Notif.ids.mapTileSelectInfo);
    });
};

//после получения чанка, нужно выделять тайл
iMap.prototype.checkSelectedTileLoaded = function(){
    //установка выбранного тайла - по городу
    var tile = this.getTile(this.posMWT);

    if( !tile )
        return;

    this.selectTile(tile);

    if( !this.tileHover ) {
        this.tileHover = {
            tile: this.tileSelect.tile,
            posTMT: this.tileSelect.posTMT
        };
    }
};

iMap.prototype.toggleMove = function(val){
    this.isMoving = val;

    notifMgr.runEvent(Notif.ids.mapMoving);
};

iMap.prototype.toggleZoom = function(val){
    this.isZooming = val;

    notifMgr.runEvent(Notif.ids.mapMoving); //!!!
};

iMap.prototype.isAnimated = function(){
    return this.isMoving || this.isZooming;
};

iMap.prototype.moveTo = function(posMWT, opt){
    opt = opt||{};

    this.toggleMove(true);

    if( posMWT.o != this.posMWT.o ){
        this.posMWT = posMWT;

        if( this.map )
            this.map.data = [];	

        delete this.tileSelect;

        var self = this;

        this.coorTransform(function(){
            var minimap = self.getMM();

            if( minimap )
                minimap.loadMMdisp();

            self._moveTo(posMWT, opt);
        });
    }
    else{
        posMWT.x = +posMWT.x;
        posMWT.y = +posMWT.y;

        posMWT = Trade.movePointToMap(posMWT);

        this.posMWT.x = posMWT.x;
        this.posMWT.y = posMWT.y;

        this._moveTo(posMWT, opt);
    }
};

    iMap.prototype._moveTo = function(posMWT, opt){
        if( opt.highlight )
            this.highlightTile(posMWT);

        if( this.map ){
            this.showCenter(opt);

            this.map.showView();
        }

        this.toggleMove(false);

        notifMgr.runEvent(Notif.ids.mapMove);
    };

iMap.prototype.getMM = function(){
    return this.children.minimap;
};

iMap.prototype.getLoadIndicator = function(){
    return this.children.loadIndicator;
};

iMap.prototype.getRight = function(){
    return this.children.right;
};


iMap.prototype.loadPosMWT = function(){
    var posMWT = this.getHash(this.lastPosMWT);

    delete this.lastPosMWT;

    if( posMWT )
        this.posMWT = posMWT;
};

iMap.prototype.getHash = function(hashData){
    hashData = hashData||this.id;

    if( hashData ){
        if( typeof(hashData) == 'string' )
            hashData = utils.urlToObj(hashData, true);
        else
            hashData = utils.clone(hashData);
    }
    else
        return false;

    if( typeof(hashData.x) != 'undefined' && typeof(hashData.y) != 'undefined' ){
        var pos = {
            o: utils.toInt(hashData.o),
            x: utils.toInt(hashData.x),
            y: utils.toInt(hashData.y)
        };

        pos = Trade.movePointToMap(pos);

        if( pos.o == 0 ) 
            pos.o = wofh.town.id;

        return pos;
    }

    return false;
};


iMap.prototype.coorTransform = function(callback) {
    var self = this;

    reqMgr.getMapCoord(this.posMWT.o, function(resp){
        if( self.stopped ) return;

        if( !resp.data || resp.error ){
            self.map.dispMMT = {
                x: 0,
                y: 0
            };
            self.posMWT = {o: wofh.town.pos.o, x: 0, y: 0};

            var alert = 'Ты пытаешься заглянуть в неизведанное.<br>Проверь координаты.';

            if( resp.error == ErrorX.ids.WEcantLoadTown )
                alert = 'Ты не можешь больше увидеть место по этому описанию местности.<br><br>Время неумолимо меняет местность, исчезают ориентиры и знакомые пейзажи остаются лишь в наших воспоминаниях. Попробуй достать более свежую ссылку.';

            wndMgr.addAlert(alert);
        }
        else{
            self.map.dispMMT = {
                x: - resp.data.dx,
                y: - resp.data.dy
            };
            if( self.map.dispMMT.x || self.map.dispMMT.y ){
                self.posMWT.o = wofh.town.pos.o;
                self.posMWT.x = self.posMWT.x + self.map.dispMMT.x;
                self.posMWT.y = self.posMWT.y + self.map.dispMMT.y;
            }
        }

        notifMgr.runEvent(Notif.ids.mapMove);

        callback();
    });
};
//перенос вида к центру
iMap.prototype.showCenter = function(opt){
    opt = opt||{};

    var offset = opt.offset||{};

    var posTMpx = this.map.getPosTMpxByPosTMT(this.posMWT),
        pos = {
            x: (-posTMpx.x + this.map.sizeVpx.x * this.zoom / 2) + (offset.x||0),
            y: (-posTMpx.y + this.map.sizeVpx.y * this.zoom / 2) + (offset.y||0)
        };

    if( opt.onlyX )
        pos.y = this.map.posMWpx.y;
    if( opt.onlyY )
        pos.x = this.map.posMWpx.x;	

    this.map.setPosMWpx(pos);

    this.map.showView();
};

iMap.prototype.setDefFilter2 = function(){
    this.settings.p_filter2 = LS.mapFilter2.default.split('.');

    for (var i in this.settings.p_filter2){
        this.settings.p_filter2[i] = +this.settings.p_filter2[i];
    }
};

iMap.prototype.splitSettings = function(arr, ref){
    var params = {};
    for(var paramName in ref){
        var paramVal = ref[paramName];
        if(typeof(paramVal) == 'number'){
            params[paramName] = +arr[paramVal];
        }
    }
    return params;
};
//сохранение настроек
iMap.prototype.setSettings = function(){
    LS.set('map', this.settings);
};


iMap.prototype.changeZoom = function(delta){
    var newZoom = this.zoomLevel + delta;

    if( newZoom < 0 || newZoom > this.getMinZoom() ) 
        return;

    this.zoomLevel = newZoom;

    this.setZoom(this.zoomLevel);
};

iMap.prototype.setZoom = function(zoomLevel){
    zoomLevel = Math.max(zoomLevel, 0);

    zoomLevel = Math.min(zoomLevel, this.getZoomPoints().length - 1);

    this.zoomLevel = zoomLevel;

    var zoom = 100 / this.getZoomPoints()[this.zoomLevel];

    var delta = this.zoom - zoom;

    //установка зума
    this.settings.zoom = this.zoomLevel;

    this.setSettings();

    this.zoom = zoom;

    notifMgr.runEvent(Notif.ids.mapZoom, delta);
};

iMap.prototype.setMaxZoom = function(){
    this.setZoom(this.getMaxZoom());
};

iMap.prototype.setMinZoom = function(){
    this.setZoom(this.getMinZoom());
};

iMap.prototype.getMaxZoom = function(){
    return 0;
};

iMap.prototype.getNormZoom = function(){
    return 0;
};

iMap.prototype.getMinZoom = function(){
    return this.getZoomPoints().length - 1;
};


iMap.prototype.setMode = function(type, subtype, subid){
    if( type )
        this.mode.type = type;

    if( subtype )
        this.mode.subtype = subtype;

    if( subid !== undefined )
        this.mode.subid = subid;

    notifMgr.runEvent(Notif.ids.mapMode);
};


iMap.prototype.prepareModePanelRoad = function(roadType, tile1, tile2){
    if (!roadType) roadType = 1;

    var rough = ((tile1 && tile1[Tile.param.dep] != Deposit.no) || (tile2 && tile2[Tile.param.dep] != Deposit.no));

    var road = new Road(roadType, rough);

    var data = {
        road: road,
        time: (this.tileSelect.dist.air / lib.units.list[Unit.ids.worker].speed)||lib.map.minroadmovetime
    };

    return data;
};


iMap.prototype.showActionsPopup = function(cls){
    if( !this.tileSelect )
        return;

    var self = this,
        data = {cls: cls, cost: {}};

    switch(cls){
        case 'depError':
            data.units = this.tileSelect.deposit.calcPopCost();
            data.errors = this.tileSelect.btnErrors;
            break;
        case 'townFound':
            data.cost.unit = new Unit(Unit.ids.settler, Town.getNewTownCost());

            data.err = this.getFoundTownErrors(this.tileSelect.tile);

            var minDist = Math.min(this.tileSelect.dist.land||999999, this.tileSelect.dist.deepwater||999999);

            data.time = Math.round(minDist / lib.units.list[Unit.ids.settler].speed);

            data.res = new ResList();
            var resources = lib.units.list[Unit.ids.settler].pay;
            for(var res in resources){
                if( resources[res][1] != 0 ){
                    data.res.addCount(resources[res][0], Math.ceil( (timeMgr.invHtS * data.time)  * resources[res][1] * data.cost.unit.getCount()));
                }
            }

            break;
        case 'depColonize':
            data.id = this.tileSelect.tile[Tile.param.dep];

            var depCost = new Deposit(data.id).calcPopCost();

            data.cost.unit = new Unit(Unit.ids.worker, depCost);

            data.errors = this.tileSelect.btnErrors;

            data.time = Math.round(this.tileSelect.dist.air / lib.units.list[Unit.ids.worker].speed);
            break;
        case 'depFree':
            break;
        case 'roadBuild':
            data = this.prepareModePanelRoad(this.tileSelect.roadType, this.tileSelect.tile, this.tileHover.tile);
            data.cls = cls;

            //ошибки
            data.err = {};
            data.warn = {};

            if (wofh.town.getStock().getHasList().calcIncludeCount(data.road.getCost()) < 1) data.err.res = true;
            if (wofh.town.army.own.getCount(data.road.getUnit()) < data.road.getUnit().count) data.err.unit = true;

            if (data.road.rough) data.warn.dep = true;

            if(!utils.sizeOf(data.err)) delete data.err;


            break;
        case 'impBuild':
            var impId = this.mode.subid;
            if (impId == undefined) return;
            data.imp = Tile.getTileImpUp(this.tileSelect.tile, impId);
            if (!data.imp) data.imp = new MapImp(impId, 1);

            data.cost.res = data.imp.getCost();

            data.time = utils.servRound(this.tileSelect.dist.air / lib.units.list[Unit.ids.worker].speed)||lib.map.minenvmovetime;

            data.conflicts = Tile.getTileImpConflict(this.tileSelect.tile, data.imp);

            //ошибки
            data.err = Tile.canBuildImp(data.imp.getId(), this.tileSelect.tile, this);

            if (wofh.town.getStock().getHasList().calcIncludeCount(data.cost.res, 1) < 1) data.err.add(MapImp.buildErr.res);
            if ( !data.imp.isEnoughWorkers() ) data.err.add(MapImp.buildErr.unit);

            break;
        case 'spy':
            data.cost = {};
            data.cost.units = [{
                id: Unit.ids.spy,
                count: ~~utils.oddFunc(lib.map.rangespies, this.tileSelect.dist.air),
                have: wofh.town.army.own.getCount(Unit.ids.spy),
            }];
            if(data.cost.units[0].count > data.cost.units[0].have){
                data.err = true;
            }

            data.time = this.tileSelect.dist.air / lib.units.list[Unit.ids.spy].speed;
            break;
    }

    //запоминаем стоимость
    this.impCost = data.cost;

    wndMgr.addModal(tmplMgr.iMap.cursorPopup(data), {
        callbacks: {
            bindEvent: function(){
                var wnd = this;

                this.wrp
                    .on('click', '.map_curPop_dep_sbm', function(){//колонизация МР
                        var pos = self.map.getTilesDisp(self.tileSelect.posTMT);

                        reqMgr.depositGet(pos.dx, pos.dy);
                    })
                    .on('click', '.map_curPop_depFree_sbm', function(){//деколонизация МР
                        reqMgr.depositFree(self.tileSelect.town.id, function(resp) {
                            //удаляем вектор
                            self.map.removeDepLine(self.tileSelect.tile[Tile.param.town]);

                            //подменяем значение в тайле
                            delete self.tileSelect.accounts;
                            delete self.tileSelect.town;
                            delete self.tileSelect.player;
                            delete self.tileSelect.country;
                            delete self.tileSelect.deposit.strength;

                            delete self.tileSelect.tile[Tile.param.layers].flag;
                            self.tileSelect.tile[Tile.param.town] = 0;

                            //пересчитываем стили тайла
                            self.map.generateStyle(self.tileSelect.tile);
                            self.map.calcImgLayers();
                            //перерисовываем карту
                            self.map.requestRender();
                            self.map.curBtns.clearWrp();
                        });
                    })
                    .on('click', '.map_curPop_spy_sbm', function(){//шпионаж
                        var pos = self.map.getTilesDisp(self.tileSelect.posTMT);

                        reqMgr.explore(pos.dx, pos.dy, function(){
                            wndMgr.addWnd(wArmy);
                        });
                    })
                    .on('click', '.map_curPop_town_sbm', function(){//новый город
                        wnd.noClose = true;

                        var pos = self.map.getTilesDisp(self.tileSelect.posTMT);

                        var loaderId = contentLoader.start(
                            wnd.wrp.find('.wnd-cont-wrp'), 
                            0, 
                            function(){
                                reqMgr.newTown(pos.dx, pos.dy, {
                                    onSuccess: function(){
                                        contentLoader.stop(loaderId);

                                        wnd.close();
                                    },
                                    onFail: function(){
                                        contentLoader.stop(loaderId);

                                        self.showActionsPopup(cls);

                                        wnd.close();
                                    }
                                });
                            }
                        );
                    })
                    .on('click', '.map_curPop_road_sbm', function(){//дорога
                        var pos = self.map.getTilesDisp(self.tileSelect.posTMT),
                            dir = (self.tileSelect.dir+6)%8,
                            nextTile = self.getTileByDir(self.tileSelect.posTMT, self.tileSelect.dir);

                        reqMgr.buildRoad(pos.dx, pos.dy, dir, function() {
                            self.map.onClickTile(nextTile, true);
                        });
                    })
                    .on('click', '.map_curPop_imp_sbm', function(event){//улучшение
                        event.stopImmediatePropagation(); // Дабы не вызывался обработчик .map_curPop button

                        var $this = $(this);

                        if( $this.hasClass('-disabled') )
                            return false;
                        else
                            $this.addClass('-disabled');

                        var loaderId = contentLoader.start(
                            $this, 
                            0, 
                            function(){
                                var pos = self.map.getTilesDisp(Trade.movePointToMap(self.tileSelect.posTMT)),
                                    envType = self.mode.subid,
                                    level = Tile.getTileImpLevel(self.tileSelect.tile, envType)+1;

                                reqMgr.buildEnv(pos.dx, pos.dy, envType, level, function() {
                                    contentLoader.stop(loaderId);

                                    wnd.close();
                                });
                            },
                            {icon: ContentLoader.icon.short, cssPosition: {right: -55, top: 1}, callback:function(){
                                $this.removeClass('-disabled');
                            }}
                        );

                        return false;
                    })
                    .on('click', '.map_curPop button', function(){//закрытие окна
                        if( !wnd.noClose && !$(this).hasClass('-disabled') )
                            wnd.close();
                    })
                    .on('click', '.map_curPop_move', function(){//перемещение
                        self.map.onClickTile(self.tileHover.tile, true);
                    });
            }
        }
    });
};


iMap.prototype.createChunk = function(data){
    var chunk = {};

    chunk.posCMC = {};
    chunk.posCMC.x = data.x;
    chunk.posCMC.y = data.y;

    chunk.posCMT = {};
    chunk.posCMT.x = chunk.posCMC.x * Chunk.sizeT.x;
    chunk.posCMT.y = chunk.posCMC.y * Chunk.sizeT.y;

    chunk.posCMpx = {};
    chunk.posCMpx.x = (chunk.posCMC.x - chunk.posCMC.y - 1) * Chunk.sizePx.x/2;
    chunk.posCMpx.y = (chunk.posCMC.x + chunk.posCMC.y) * Chunk.sizePx.y/2 - Tile.sizePxArr[0].y/2;


    chunk.tiles = data.cells||[];

    var oldChunk = this.getChunk(chunk.posCMC);

    for(var i = 0; i < chunk.tiles.length; i++){
        var tile = chunk.tiles[i];

        if( !tile )
            continue;

        Tile.init(tile);
        
        if( debug.params.roads && this.makeRoadBinByDirs ){
            if( tile[Tile.param.env] ){
                var newEnv = [];
                
                for(var env in tile[Tile.param.env]){
                    if( tile[Tile.param.env][env][0] != 0 && tile[Tile.param.env][env][0] != 5 ) // Не мост
                        newEnv.push(tile[Tile.param.env][env]);
                }
                
                tile[Tile.param.env] = newEnv;
            }
            
            if( debug.params.roads == 'water' )
                tile[Tile.param.road] = this.makeRoadBinByDirs([1,1,1,1,1,1,1,1,1,1]);
            else
                tile[Tile.param.road] = this.makeRoadBinByDirs([5,2,4,3,5,2,4,3,3,2]);
        }
        
        if( oldChunk && Tile.asRaw(tile, oldChunk.tiles[i]) ){
            oldChunk.tiles[i][Tile.param.actual] = true;

            chunk.tiles[i] = oldChunk.tiles[i];

            continue;
        }
        
        tile[Tile.param.actual] = false;

        Tile.calcPosTCT(tile, i);

        tile[Tile.param.posTMT] = {
            x: chunk.posCMT.x + tile[Tile.param.posTCT].x,
            y: chunk.posCMT.y + tile[Tile.param.posTCT].y
        };

        Tile.calcPosTCpx(tile);

        Tile.calcPosTMpx(tile, chunk);

        tile[Tile.param.dep] = tile[Tile.param.deposit];
        tile[Tile.param.terrain] = tile[Tile.param.terr];
        tile[Tile.param.i] = i;
        tile[Tile.param.layers] = {};
    }

    this.saveChunk(chunk);

    return chunk;
};

iMap.prototype.getCMCForTile = function(tile){
    return {
        x: Math.floor(tile[Tile.param.posTMT].x/Chunk.sizeT.x),
        y: Math.floor(tile[Tile.param.posTMT].y/Chunk.sizeT.y)
    };
};

iMap.prototype.getChunkForTile = function(tile){
    return this.getChunk(this.getCMCForTile(tile));
};

iMap.prototype.getChunk = function(posCMC){
    if( !iMap.chunks[iMap.chunksShift+posCMC.x] || !iMap.chunks[iMap.chunksShift+posCMC.x][iMap.chunksShift+posCMC.y] ) 
        return false;
    else
        return iMap.chunks[iMap.chunksShift+posCMC.x][iMap.chunksShift+posCMC.y];
};

iMap.prototype.saveChunk = function(chunk){
    if( iMap.chunks[iMap.chunksShift + chunk.posCMC.x] === undefined )
        iMap.chunks[iMap.chunksShift + chunk.posCMC.x] = [];

    chunk.upd = timeMgr.getNow();

    iMap.chunks[iMap.chunksShift + chunk.posCMC.x][iMap.chunksShift + chunk.posCMC.y] = chunk;
};


iMap.prototype.getTile = function(posTMT, chunk){
    if( !chunk ){
        var chunkCoords = this.getChunkCoordsForTile(posTMT.x, posTMT.y);

        chunk = this.getChunk(chunkCoords);
    }

    if( !chunk ) return;

    var tilePos = Chunk.getTilePos(posTMT, chunk);

    return chunk.tiles[tilePos];
};


iMap.prototype.getChunkCoordsForTile = function(x, y){
    return {x: Math.floor(x/Chunk.sizeT.x), y: Math.floor(y/Chunk.sizeT.y)};
};

iMap.prototype.getTileTMTByDir = function(posTMT, dir){
    posTMT = utils.clone(posTMT);

    if (dir < Tile.dirsMap.length) {
        var disp = Tile.dirsMap[dir];
        posTMT.x += disp.x;
        posTMT.y += disp.y;
    }

    return posTMT;
};

iMap.prototype.getTileByDir = function(posTMT, dir){
    posTMT = this.getTileTMTByDir(posTMT, dir);

    return this.getTile(posTMT);
};

iMap.prototype.genPosLink = function(posTMT){
    var o = posTMT.o;
    if(!o) o = this.posMWT.o;
    return 'o=' + o + '&x=' + posTMT.x + '&y=' + posTMT.y;
};


iMap.prototype.canReachTileByLand = function(tile){
    return tile[Tile.param.zone1] == wofh.town.zones.land;
};

iMap.prototype.canReachTileByWater = function(tile, useRivers){
    return utils.isArrsIntersects(wofh.town.zones.water, Tile.getWaterZones(tile, useRivers, this));
};

iMap.prototype.canReachTileByDeepWater = function(tile){
    return wofh.town.getType().hasBank && this.canReachTileByWater(tile, false);
};

iMap.prototype.canReachTile = function(tile){

    return this.canReachTileByLand(tile) || this.canReachTileByWater(tile);
};

iMap.prototype.canTradeTileByLand = function(tile){
    var dist = Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT]);
    return (dist < lib.trade.distance || Account.hasAbility(Science.ability.longTrade)) && this.canReachTileByLand(tile);
};

iMap.prototype.canTradeTileByWater = function(tile, useRivers){
    var dist = Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT]);
    return (dist < lib.trade.distance || Account.hasAbility(Science.ability.longTrade)) && this.canReachTileByWater(tile, useRivers);
};

iMap.prototype.canTradeTile = function(tile, useRivers){
    return this.canTradeTileByLand(tile) || this.canTradeTileByWater(tile, useRivers);
};


iMap.prototype.getFoundTownErrors = function(tile, skip) {
    var errors = {};

    if(wofh.town.army.own.getCount(Unit.ids.settler) < Town.getNewTownCost()) errors.colonists = true;//поселенцев хватает

    if(tile[Tile.param.town] != lib.town.notown) var error_otherTown = true;
    if(tile[Tile.param.dep] != lib.map.nodeposit) var error_deposite = true;
    if(tile[Tile.param.climate] == Tile.climateIds.water) var error_sea = true;
    if(tile[Tile.param.terrain] == Tile.terrainIds.mountains) var error_mountain = true;
    if(error_otherTown || error_deposite || error_sea || error_mountain) errors.complex = true;

    if(lib.map.colonizedistance < Trade.calcMapDistance(wofh.town.pos, tile[Tile.param.posTMT])) errors.dist = true;//расстояние

    if(!this.canReachTileByLand(tile) && !this.canReachTileByDeepWater(tile)) errors.cantReach = true;//невозможно добраться

    var wonder = wofh.town.slots.getWonder();

    if( wonder.id == Slot.ids.machuPicchu && wonder.isActive() && Tile.hasImpMain(tile) )
        errors.cantBuiidOnImp = true;

    //убираем лишние
    for(var i in skip){
        delete errors[i];
    }

    //возвращаем ошибки
    return utils.sizeOf(errors) == 0 ? false : errors;
};

iMap.prototype.prepareTileBaseInfo = function(tile){
    var data = new TileSelect();

    //ссылочка на объект
    data.tile = tile;

    //координаты(для проверки)
    data.posTMT = tile[Tile.param.posTMT];

    //климат
    data.climate = {
        id: tile[Tile.param.climate],
        name: Tile.climate[tile[Tile.param.climate]].title
    };
    //рельеф
    var terrain = Math.max(tile[Tile.param.terrain], 0);

    data.terrain = {
        id: terrain,
        name: Tile.terrain[terrain].title
    };
    //река
    if(Tile.tileRiverCount(tile)>1){
        data.river = true;
    }
    //город
    if(tile[Tile.param.town] != lib.town.notown){
        data.town = wofh.world.getTown(tile[Tile.param.town], true);
        data.town.relation = Account.calcRelation(Tile.getPlayerId(tile), Tile.getCountryId(tile));
    }
    //месторождение
    if(tile[Tile.param.dep] != lib.map.nodeposit){
        data.deposit = new Deposit(tile[Tile.param.dep], tile);

        if( data.town && data.town.id == wofh.town.id )
            data.deposit.strength = Deposit.calcStrength();
    }

    //улучшения
    data.improves = [];
    for(var i in tile[Tile.param.env]){
        data.improves.push(new MapImp(tile[Tile.param.env][i]));
    }

    data.mapImpUsers = utils.bitmapCount(tile[Tile.param.impMap]); //this.calcTileRel(tile, function(tile){return tile[Tile.param.town] != lib.town.notown? 1: 0});

    //чудо света
    if(tile[Tile.param.wonder] != lib.build.nobuild){
        data.wonder = Tile.getWonder(tile);
    }
    //страна
    var countryId = Tile.getCountryId(tile);
    if(countryId){
        data.country = wofh.world.getCountry(countryId);
    }
    //игрок/владелец
    var playerId = Tile.getPlayerId(tile);
    if(playerId || data.town){
        data.player = wofh.world.getAccount(playerId);
    }
    //ненападение
    if(data.town && !data.deposit){
        data.pigeon = data.town.defmoment;
    }

    //ссылка на тайл
    data.link = this.genPosLink(data.posTMT);

    data.hasCoast = Tile.hasCoast(tile, this);

    return data;
};                      

iMap.prototype.selectTile = function(tile, callback){
    var self = this;

    this.tileSelect = this.prepareTileBaseInfo(tile);
    this.tileSelect.posTMT = tile[Tile.param.posTMT];
    this.tileSelect.posTMT.o = this.posMWT.o;
    this.tileSelect.slots = tile[Tile.param.slots];

    this.tileSelect.dist = {
        air: Trade.calcMapDistance(wofh.town.pos, this.tileSelect.posTMT)
    };

    this.loadTileInfo(tile, function(resp){
        if( !utils.isEqual(Trade.movePointToMap(self.tileSelect.posTMT), resp.posTMT) )
            return;

        if( self.tileSelect.town ){
            if (resp.town.pos) {
                var posTMT = utils.clone(resp.town.pos);
            } else if ( resp.town.coordinates ){
                var posTMT = {
                    o: self.posMWT.o,
                    x: resp.town.coordinates[1],// - self.dispMMT.x,
                    y: resp.town.coordinates[2]// - self.dispMMT.y
                };
            };

            if( posTMT )
                self.tileSelect.town.linkPos = self.genPosLink(posTMT);

            self.tileSelect.town.pop = resp.town.pop;

            if( resp.town.distance )
                self.tileSelect.town.distance = utils.cloneInstance(resp.town.distance);

            if( !Town.hasDefMoment(resp.town.army) || resp.town.account == wofh.account.id ){
                self.tileSelect.town.showCursorButtons = true;
            }
            else
                self.tileSelect.town.defmoment = (resp.town.army||{}).defmoment;

            self.tileSelect.town.attacks = resp.town.attacks;
            //self.tileSelect.town.relation = resp.town.relation;
        }

        self.tileSelect.comment = '';
        self.tileSelect.comments = tile[Tile.param.comment];
        self.tileSelect.accounts = resp.accounts;
        for(var comment in self.tileSelect.comments){
            comment = self.tileSelect.comments[comment];

            if(comment.account.id == wofh.account.id)
                self.tileSelect.comment = comment.text;
        }

        self.tileSelect.dist = resp.path;

        if(callback)
            callback();

        if( ls.getMapCentering(false) )
            self.moveTo(self.tileSelect.posTMT);

        notifMgr.runEvent(Notif.ids.mapTileSelectInfo);
    });

    this.setHash();
};

iMap.prototype.updTileSelect = function(){
    if( !this.tileSelect || !this.tileSelect.posTMT )
        return;

    var tile = this.getTile(this.tileSelect.posTMT);

    if( !tile )
        return;

    this.selectTile(tile);
};

iMap.prototype.highlightTile = function(posMWT){
    this.tileHighlight = {
        posTMT: {
            x: +posMWT.x,
            y: +posMWT.y
        }
    };
};

iMap.prototype.findTilePaths = function(type, tile){
    this.tileRoutes = tile||this.tileSelect;

    this.setMode(this.mode.type==type ? iMap.mode.type.view : type);
};

iMap.prototype.loadTileInfo = function(tile, callback, noPath){
    var self = this;

    var pos = Trade.movePointToMap(tile[Tile.param.posTMT]), // Нормируем координаты
        path;

    if(!noPath){
        path = [+this.posMWT.o, 
            [wofh.town.pos.x, wofh.town.pos.y, pos.x, pos.y]
        ]; // Путь

        this.loadingTileState = true;
    }

    var town;
    if(tile[Tile.param.town]>=0){//город
        town = tile[Tile.param.town];
    }

    var mappost = [+this.posMWT.o, [pos.x, pos.y]];

    reqMgr.getTileData(mappost, path, town, function(resp){
        if( !self.tileSelect )
            return;

        resp.posTMT = pos;

        //город
        if( town )
            resp.town = resp.town[town];

        //комментарии
        if( resp.mappost ){
            resp.mappost = resp.mappost[pos.x][pos.y];

            tile[Tile.param.comment] = resp.mappost||[];
        }
        else
            delete tile[Tile.param.comment];

        if( !noPath ){
            //путь
            var path = self.extractPath(resp.path_, wofh.town.pos, pos);

            if( !path )
                return;

            resp.path = new Path({air: self.tileSelect.dist.air}).parse(path);

            resp.path.min = resp.path.calcMinDist();

            self.loadingTileState = false;
        }

        callback(resp);
    });
};

    iMap.prototype.extractPath = function(path, fromPos, toPos){
        if( !fromPos || !toPos )
            return false;

        path = path[fromPos.x];
        path = path[fromPos.y];
        path = path[toPos.x];
        path = path[toPos.y];

        return path;
    };

iMap.prototype.toggleLoadIndicator = function(state){
    if( this.loadingMapState != state ){
        var self = this;

        clearTimeout(this.to_loadIndicator);

        this.loadingMapState = state;

        if( state )
            this.getLoadIndicator().toggle(true);
        else{
            this.to_loadIndicator = this.setTimeout(function(){
                this.getLoadIndicator().toggle(false);
            }, 500);
        }
    }
};

iMap.prototype.canDisplay = function() {
    reqMgr.questComplete(new Quest(Quest.ids.map));

    // Открытие окна карты
    if (!wofh.account.email && !wofh.platform.noemail && !wofh.account.isAdmin() && !wofh.account.isAssistant()) {
        wndMgr.addAlert(tmplMgr.iMap.alert.noAccess());

        return false;
    }

    return true;
};

iMap.prototype.esc = function() {
    hashMgr.applyHash('#town');
};

iMap.prototype.toggleInterface = function(noNotif){
    wndMgr.$body.toggleClass('-clrMapScr');

    this.clrMapScr = !this.clrMapScr;

    if( !noNotif ){
        notifMgr.runEvent(Notif.ids.mapMoving);
        notifMgr.runEvent(Notif.ids.mapSettings);
    }
};

iMap.prototype.update = function(){
    for(var child in this.children){
        if( child == 'map' )
            notifMgr.runEvent(Notif.ids.updView);
        else
            this.children[child].show();
    }
};

iMap.prototype.getVersion = function(){
    return ls.getMapVersion(iMap.version.full);
};

iMap.prototype.getZoomPoints = function(){
    return iMap.isSimplified() ? this.zoomPointsSimplified : this.zoomPoints;
};