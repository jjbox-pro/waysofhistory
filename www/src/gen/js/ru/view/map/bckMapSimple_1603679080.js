bckMapSimple = function(){
	bckMapSimple.superclass.constructor.apply(this, arguments);
};

utils.extend(bckMapSimple, bckMap);


bckMapSimple.prototype.setMapCls = function(){
    wndMgr.$body.toggleClass('-simplifiedMap', true);
};

bckMapSimple.prototype.getDrawBaseDispClimPx_y = function(){
    return 0;
};

bckMapSimple.prototype.getTileWideArr = function(){
    return [
        {dispPx: {x: 0, y: -97}, sizePx: {x: 194,y: 194}},
        {dispPx: {x: 0, y: -49}, sizePx: {x: 98,y: 98}}
    ];
};

bckMapSimple.prototype.getDispPx = function(){
    return 13;
};

bckMapSimple.prototype.getImgSets = function(){
    return {
        c: 1,//климат
        cr: 1,//скругления климата
        h: 1,
        m: 1,
        mt: 1,
        dep: 10,
        imp: 20,
        ures: 1,
        fog: 1
    };
};

bckMapSimple.prototype.simplifyImgSets = function(){};

bckMapSimple.prototype.createResMap = function(){
    this.tRes = [];
    this.resLoaded = [];
    
    //доступные к загрузке ресурсы
    for(var zoom = 0; zoom < this.zoomPicLevels.length; zoom++){
        var picPath = 'https://test.waysofhistory.com/img/map2/',
            zoomSuff = zoom == 0 ? '100' : '50',
            size = zoom == 0 ? 100 : 50;

        var list = {
            c: {}, hm: {}, road: {},  
            resStack: {}, townres: {}, wonder: {}, 
            pike: {}, fog: {}, clear: {}, 
            focus: {}, road_bld: {}, env_bld: {}, 
            env_ph: {}
        };

        this.tRes.push(list);

        list.c[0] = {url: picPath+'climates-'+zoomSuff+'.png'};

        var mapImpList = MapImp.getAll().getSortList('getMapZ', true).getList();

        for(var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            list['imp'+imp] = {};
            for (var level = 1; level <= 3; level++){
                if (imp == MapImp.ids.bridge || imp == MapImp.ids.riverProd){
                    list['imp'+imp]['env'+imp+'_'+level] = {url: picPath+'improvement/improvement_'+imp+'_s_'+level+'.png', type: 'bridge', imgcls: 'imp'};
                } else if (imp == MapImp.ids.waterProd || imp == MapImp.ids.knowledgeWater || imp == MapImp.ids.skiResort){
                    list['imp'+imp]['env'+imp+'_'+level] = {url: picPath+'improvement/improvement_'+imp+'_a_'+level+'.png', imgcls: 'imp'};
                } else {
                    list['imp'+imp]['env'+imp+'_'+level] = {url: picPath+'improvement/improvement_'+imp+'_a_'+level+'.png', imgcls: 'imp'};
                }
            }
        }

        //дороги
        list.road = [];

        for (var type=0; type < this.roadData.length; type++){
            for(var dir=0; dir < Tile.dirsMap.length; dir++){
                list.road[''+type+dir] = {url: picPath+'road/road_'+type+'_'+((dir+4)%8)+'_a.png', imgcls: type==0?'river':'road', roadType: type, type: 'extrawide'};
            }
        }

        //горы и холмы 
        for(var clim=0; clim < utils.sizeOf(Tile.climate)-2; clim++){
            list.hm['h'+clim] = {url: picPath+'h'+clim+'-'+zoomSuff+'.png', type: 'wide', imgcls: 'hill'};
            list.hm['m'+clim] = {url: picPath+'m'+clim+'-'+zoomSuff+'.png', type: 'wide', imgcls: 'mount'};
            list.pike['m'+clim] = {url: picPath+'m'+clim+'-'+zoomSuff+'.png', type: 'wide', imgcls: 'mount'};
        }

        //города
        list.townres['tc'] = {url: picPath+'town/towncolor.png', type: 'wide', imgcls: 'town'};
        for(var sprite=0; sprite<this.townSizeData.length/this.spriteSizes.town; sprite++){
            list.townres['td'+sprite] = {url: picPath+'town/town_'+sprite+'_a.png', type: 'wide', imgcls: 'town'};
            list.townres['tb'+sprite] = {url: picPath+'town/town_'+sprite+'_b.png', type: 'wide', imgcls: 'town'};
        }
        //города - чудеса
        for(var wonder in WonderEffect.builds){
            list.wonder[wonder] = {url: picPath+'wonder/wonder_'+wonder+'.png', type: 'wide', imgcls: 'town', imgcls2: 'wonder'};
        }

        //ресурсы неизвестные
        list.townres['res_u'] = {url: picPath+'resource/resource_60_a.png', type: 'wide', imgcls: 'res', imgcls2: 'unknown'};
        //ресурсы известные
        for(var res=0; res< lib.map.deposit.length-1; res++){
            var num = utils.twoDigits(res);
            list.townres['res_'+num] = {url: picPath+'resource/resource_'+num+'_a.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }

        //строящиеся улучшения и города
        list.env_bld.town = {url: picPath+'town/town_0_p.png', type: 'wide'};

        for(var res=0; res< lib.map.deposit.length-1; res++){
            var num = utils.twoDigits(res);
            list.env_bld['res_'+utils.twoDigits(res+1)] = {url: picPath+'resource/resource_'+num+'_p.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }		

        for(var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            for (var level = 1; level <= 3; level++){
                list.env_bld['env'+imp+'_'+level] = {url: picPath+'improvement/improvement_'+imp+'_p_'+level+'.png'};
            }
        }

        list.road_bld = [];
        for (var type=1; type<this.roadData.length; type++){
            for(var dir=0; dir<Tile.dirsMap.length; dir++){
                list.road_bld[''+type+dir] = {url: picPath+'road/road_'+type+'_'+((dir+4)%8)+'_p.png', imgcls: 'road', type: 'extrawide'}
            }
        }

        //сетки
        list.grid = {
            cln: {url: 'https://test.waysofhistory.com/img/gui/map3/fltr_colonizing-'+zoomSuff+'.png'},
            imp: {url: 'https://test.waysofhistory.com/img/gui/map3/fltr_impmap-'+zoomSuff+'.png'},
            grd: {url: 'https://test.waysofhistory.com/img/gui/map3/net-'+zoomSuff+'.png'},
        };
        //все флаги в одном объекте
        list.flag = {};

        if( zoom > 0 )
            list.flag = this.tRes[0].flag;

        //отчистка области видимости
        list.clear.base = {url: [], type: 'clear',};

        //слой анимации

        //фокус
        list.focus[0] = {url: 'https://test.waysofhistory.com/img/gui/map3/focus-'+zoomSuff+'.png'};

        //фантомные улучшения - рабочие уже отправлены на строительство, но событие постройки ещё не произошло
        list.env_ph.town = {url: picPath+'town/town_0_f.png', type: 'wide'};
        list.env_ph.explore = {url: 'https://test.waysofhistory.com/img/gui/buttons/buttons_type2-a-1.png'};

        for(var res=0; res< lib.map.deposit.length-1; res++){
            var num = utils.twoDigits(res);
            list.env_ph['res_'+num] = {url: picPath+'resource/resource_'+num+'_f.png', type: 'wide', imgcls: 'res', imgcls2: 'known'};
        }

        for(var imp in mapImpList){
            imp = +mapImpList[imp].getId();

            for (var level = 1; level <= 3; level++){
                list.env_ph['env'+imp+'_'+level] = {url: picPath+'improvement/improvement_'+imp+'_f_'+level+'.png'};
            }
        }

        for (var type=1; type<this.roadData.length; type++){
            for(var dir=0; dir<Tile.dirsMap.length; dir++){
                list.env_ph[''+type+dir] = {url: picPath+'road/road_'+type+'_'+((dir+4)%8)+'_f.png', imgcls: 'road', type: 'extrawide'}
            }
        }


        //линии связей улучшений
        list.env_links = {
            link: {url: 'https://test.waysofhistory.com/img/gui/map2/improvement_links_lines-'+size+'.png'},
            border: {url: 'https://test.waysofhistory.com/img/gui/map2/improvement_links_border-'+size+'.png'},
        };

        //загруженные ресурсы
        var listLoaded = {};
        for(var layerName in list){
            listLoaded[layerName] = {};
            this.layersBlank_tile[layerName] = [];
            this.layersBlank_res[layerName] = [];
            for(var resName in list[layerName]){
                listLoaded[layerName][resName] = false;
            }
        }
        this.resLoaded.push(listLoaded);
    }
};

bckMapSimple.prototype.checkRiverEnds = function(tile){};

bckMapSimple.prototype.getDispClimPxMult = function(){
    return 2;
};


bckMapSimple.prototype.generateClimateAliasing = function(tile, layers, climRel, clim, dwAmbit, rid){};

bckMapSimple.prototype.allowTileBack = function(){
    return false;
};

bckMapSimple.prototype.getSpriteY = function(dwAmbit, clim){
    return dwAmbit%2 ? Tile.climateIds.deepwater - 1 : clim;;
};

bckMapSimple.prototype.generateHM = function(tile, layers, clim, rid){
    if(tile[Tile.param.terrain] == 1)
        layers.hm = [{type: 'h'+(clim-1), x: 0, y: 0}];
    else if(tile[Tile.param.terrain] == 2)
        layers.pike = [{type: 'm'+(clim-1), x: 0, y: 0}];
};

bckMapSimple.prototype.generateImp = function(tile, layers, imp, level, climate, accRel, rid){
    if( level )
        layers['imp'+imp.getId()] = [{type: 'env'+imp.getId()+'_'+(level||1), x: 0, y: 0, accRel: accRel, info: {mapimp: imp.getId()}}];
};

bckMapSimple.prototype.generateTownres = function(tile, layers, townColor, townLevel, player, wonder){
    var townSprite = utils.toInt(townLevel/this.spriteSizes.town),
        townIndex = townLevel%this.spriteSizes.town;
    
    layers.townres.push({type: 't'+(player != 0? 'd': 'b') + townSprite, x: townIndex, y: 0});
    
    if( townColor != 0 )
        layers.townres.push({type: 'tc', x: townColor-1, y: 0});
};

bckMapSimple.prototype.generateMatingDep = function(tile, layers){};

bckMapSimple.prototype.generateDep = function(tile, layers, dep, player){
    layers.townres.push({type: 'res_'+utils.twoDigits(dep-1), x: player ? 1 : 0, y: 0, info: {deposit: dep}});
};

bckMapSimple.prototype.generateUndefDep = function(tile, layers, dep, climate, rid){
    layers.townres.push({type: 'res_u', x: 0, y: 0, info: {deposit: dep}});
};

bckMapSimple.prototype.generateWaterDep = function(tile, layers, dep, climate, dataClim, rid){};

bckMapSimple.prototype.generateRoads = function(tile, layers, climate){
    var river = tile[Tile.param.climate] != Tile.climateIds.water && Tile.tileRiverCount(tile) > 1,
        roadDirs = tile[Tile.param.roads];

    for (var roadDir in roadDirs){
        var roadType = roadDirs[roadDir];
        if (roadType > 1 || (roadType == 1 && river)){
            var roads = [];
            layers.road.push({type: ''+(roadType-1)+((+roadDir+2)%8), x: 0, y: 0, roads: roads});

            if( roadType > 1 )
                this.calcTileRoad(tile, roadDirs, roadType-1, roads); // Для фильтра улучшения дорог текущего города
        }
        if (roadType == 1 && climate != Tile.climateIds.water){
            var roads = [];

            layers.road.push({type: ''+(roadType-1)+((+roadDir+2)%8), x: 0, y: 0, alpha: 0.3, roads: roads});
        }
    }
};

bckMapSimple.prototype.generateThickFog = function(tile, layers, fog, noCalcClear){};


bckMapSimple.prototype.cantRanderLayer = function(layerName){
    return false;
};

bckMapSimple.prototype.allowSecondPassRender = function(layerName){
    return false;
};


bckMapSimple.prototype.prepareRes = function(){};


bckMapSimple.prototype.drawConstructTileRoad = function(tile, drawBase, nextTile, drawBaseNext, dir, selDir, roadType, layerName, isMountainRoad){
    //имена слоя (выделенный или обычный), картинок
    if( isMountainRoad )
        roadType = Tile.isMountains(tile) ? Road.ids.tunnel : Road.ids.railway;

    var img1Name = ''+roadType+((dir+2)%8);

    if( isMountainRoad )
        roadType = Tile.isMountains(nextTile) ? Road.ids.tunnel : Road.ids.railway;

    var img2Name = ''+roadType+((dir+6)%8);

    //проверям, загруженные ли
    var img1 = this.getOrLoadRes(layerName, img1Name);
    var img2 = this.getOrLoadRes(layerName, img2Name);

    if ((!img1 || !img2) && selDir){//если не загружены картинки обычного слоя, пробуем картинки выделенного
        var img1 = this.getOrLoadRes('road_bld', img1Name);
        var img2 = this.getOrLoadRes('road_bld', img2Name);
    }

    if (img1 && img2){
        this.drawImage(
            this.canvas,
            img1,
            0,
            0,
            this.tileExtraWide.sizePx.x,
            this.tileExtraWide.sizePx.y,
            drawBase.x + (this.tileExtraWide.dispPx.x)/this.drawZoom-10/this.map.zoom,
            drawBase.y + (this.tileExtraWide.dispPx.y)/this.drawZoom-10/this.map.zoom,
            this.tileExtraWide.sizePx.x / this.drawZoom,
            this.tileExtraWide.sizePx.y / this.drawZoom);

        this.drawImage(
            this.canvas,
            img2,
            0,
            0,
            this.tileExtraWide.sizePx.x,
            this.tileExtraWide.sizePx.y,
            drawBaseNext.x + (this.tileExtraWide.dispPx.x)/this.drawZoom-10/this.map.zoom,
            drawBaseNext.y + (this.tileExtraWide.dispPx.y)/this.drawZoom-10/this.map.zoom,
            this.tileExtraWide.sizePx.x / this.drawZoom,
            this.tileExtraWide.sizePx.y / this.drawZoom);
    }
};

bckMapSimple.prototype.drawConstructRoad = function(canvas, tile, dir, roadType, layerName, drawBase, nextTile, drawBaseNext, isMountainRoad){
    //имена слоя (выделенный или обычный), картинок
    if( isMountainRoad )
        roadType = Tile.isMountains(tile) ? Road.ids.tunnel : Road.ids.railway;

    var img1Name = ''+roadType+((dir+2)%8);

    if( isMountainRoad )
        roadType = Tile.isMountains(nextTile) ? Road.ids.tunnel : Road.ids.railway;

    var img2Name = ''+roadType+((dir+6)%8);

    //проверям, загруженные ли
    var img1 = this.getOrLoadRes(layerName, img1Name);
    var img2 = this.getOrLoadRes(layerName, img2Name);

    /*
    if ((!img1 || !img2) && active){//если не загружены картинки обычного слоя, пробуем картинки выделенного
        var img1 = this.getOrLoadRes('road_bld', img1Name);
        var img2 = this.getOrLoadRes('road_bld', img2Name);
    }*/

    if (img1 && img2){
        this.drawImage(
            canvas,
            img1,
            0,
            0,
            this.tileExtraWide.sizePx.x,
            this.tileExtraWide.sizePx.y,
            drawBase.x + (this.tileExtraWide.dispPx.x)/this.drawZoom-10/this.map.zoom,
            drawBase.y + (this.tileExtraWide.dispPx.y)/this.drawZoom-10/this.map.zoom,
            this.tileExtraWide.sizePx.x / this.drawZoom,
            this.tileExtraWide.sizePx.y / this.drawZoom);

        this.drawImage(
            canvas,
            img2,
            0,
            0,
            this.tileExtraWide.sizePx.x,
            this.tileExtraWide.sizePx.y,
            drawBaseNext.x + (this.tileExtraWide.dispPx.x)/this.drawZoom-10/this.map.zoom,
            drawBaseNext.y + (this.tileExtraWide.dispPx.y)/this.drawZoom-10/this.map.zoom,
            this.tileExtraWide.sizePx.x / this.drawZoom,
            this.tileExtraWide.sizePx.y / this.drawZoom);
    }
};


bckMapSimple.prototype.allowImpClimate = function(){
    return false;
};

bckMapSimple.prototype.getDrawConstructDispPx = function(impCls){
    if( impCls=='town' || impCls=='dep' )
        return this.tileWide.dispPx;
    
    return {x: 0, y: 0};
};


bckMapSimple.prototype.calcBridgeDispTpx = function(from, to){
    return {x: 0, y: -Tile.sizePxArr[0].y};
};

bckMapSimple.prototype.getZoomPicLevel = function(){
    return 0;
};

bckMapSimple.prototype.getHillHeightOffset = function(){
    return 0;
};


bckMapSimple.prototype.calcRoadForTile = function(tile, road, roadType){};


bckMapSimple.prototype.getRouteLineWidth = function(){
    return 7;
};

bckMapSimple.prototype.drawRouteSegment = bckMap.prototype.drawRouteVector;


bckMapSimple.prototype.canPreCacheRoads = function(){
    return false;
};