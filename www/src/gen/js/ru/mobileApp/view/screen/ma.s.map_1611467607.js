utils.overrideMethod(MapScreen, 'calcChildren', function __method__(){
	__method__.origin.apply(this, arguments);
	
    delete this.children.filters;
    
    delete this.children.right;
    
	delete this.children.version;
	
    delete this.children.nav;
    
	this.children.info = pMapInfo;
    
    this.children.infoExt = pMapInfoExt;
    
    this.children.towns = bMapTowns;
});

MapScreen.prototype.addNotif = function(){
	this.notif.other[Notif.ids.mapVersion] = function(){
        this.refresh(true);
    };
};

utils.overrideMethod(MapScreen, 'afterShow', function __method__(firstShow){
	__method__.origin.apply(this, arguments);
	
    if( !firstShow )
        return;
    
    var toggleArgs = [true, {duration: -1}];
    
    if( ls.getMiniMapOn(false) )
        notifMgr.runEvent(Notif.ids.mapToggleMapMini, toggleArgs);
    else if( ls.getMActionsOn(false) )
        notifMgr.runEvent(Notif.ids.mapToggleActions, toggleArgs);
});





iMap.prototype.initZoom = function(){
    this.zoomLevelMax = 100;
    this.zoomLevelNorm = 100;
    this.zoomLevelMin = 50;
};





utils.overrideMethod(bckMap, 'addNotif', function __method__(){
    __method__.origin.apply(this, arguments);
    
    this.notif.other[Notif.ids.mobAppMapRenderTile] = this.renderTile;
});

bckMap.prototype.renderTile = function(canvasCtx){
    if( !this.map.tileSelect || !canvasCtx )
        return;
    
    var oldZoom = {
            zoomPicLevel: this.zoomPicLevel,
            imgZoom: this.imgZoom,
            drawZoom: this.drawZoom,
            zoom: this.map.zoom,
            sizeTpx: this.sizeTpx,
            tileWide:  this.tileWide,
            tileExtraWide: this.tileExtraWide,
            dispTTpx: this.map.dispTTpx,
            zoomFlag: this.zoomFlag
        },
        canvasW = this.canvasW,
        posMWpx = this.posMWpx,
        posMWpx_draw = this.posMWpx_draw,
        sizeVpx = this.sizeVpx,
        filterImgAtDraw = this.filterImgAtDraw;
        
        
    this.map.zoom = 1.7;
    
    this.zoomPicLevel = 0;
    
    this.calcZoomParams();
    
    
    this.canvasW = canvasCtx;
    this.posMWpx = this.getPosTMpxByPosTMT(this.map.tileSelect.posTMT),
    this.posMWpx.x = (-this.posMWpx.x + canvasCtx.canvas.width + 10);
    this.posMWpx.y = (-this.posMWpx.y + canvasCtx.canvas.height * 0.5 - this.dispClimPx_y / this.map.zoom);
    this.sizeVpx = {x: canvasCtx.canvas.width, y: canvasCtx.canvas.height};
    
    this.filterImgAtDraw = function(){
        return bckMap.imgDisplay.show;
    };
    
    
    var layers = this.layers,
        depLinks = this.depLinks,
        createResTime = this.createResTime;
    
    this.createResTime = timeMgr.getNow();;
    
    this.calcImgLayers({
        iterateTiles: function(func){
            var selectedTile = this.map.tileSelect.tile,
                tile;
            
            for(var dir in Tile.dirsMap9){
                tile = this.map.getTileByDir(selectedTile[Tile.param.posTMT], dir);
                
                if( !tile )
                    continue;

                func(tile);
            }
        }
    });
    
    this.renderLayers();
    
    
    this.canvasW = canvasW;
    this.posMWpx = posMWpx;
    this.posMWpx_draw = posMWpx_draw;
    
    
    this.zoomPicLevel = oldZoom.zoomPicLevel;
    this.drawZoom = oldZoom.drawZoom;
    this.map.zoom = oldZoom.zoom;
    this.imgZoom = oldZoom.imgZoom;
    this.sizeTpx = oldZoom.sizeTpx;
    
    this.tileWide = oldZoom.tileWide;
    this.tileExtraWide = oldZoom.tileExtraWide;
    this.map.dispTTpx = oldZoom.dispTTpx;
    this.zoomFlag = oldZoom.zoomFlag;
    this.sizeVpx = sizeVpx;
    this.filterImgAtDraw = filterImgAtDraw;
    
    
    this.layers = layers;
    this.depLinks = depLinks;
    this.createResTime = createResTime;
};

bckMap.prototype.showTooltip = function(){};

bckMap.prototype.addMapROffset = function(){};

bckMap.prototype.calcImgLayers = function(opt){
    opt = opt||{};
    
    var self = this,
        now = timeMgr.getNow(),
        resLoadedLayers = {},
        tResFlag = self.tRes[0].flag,
        loadResOpt = {mark: 'calcImgLayers'},
        iterateTiles = opt.iterateTiles||this.iterateShownTiles;
        
    this.layers = utils.clone(this.layersBlank_tile);
    
    this.depLinks = {};
    
    iterateTiles.call(this, function(tile){
        /*
        if( debug.params.tile ){
            var coor = JSON.parse(debug.params.tile);

            if( !Tile.hasCoor(tile, coor[0], coor[1]) )
                return;
        }
        */
       
        self.addDepLine(tile);

        var layers = tile[Tile.param.layers];

        for(var layerName in layers){
            var layer = layers[layerName];

            if( tile[Tile.param.layersUpd] > self.createResTime ){
                var skip = true;

                for(var i = 0; i < layer.length; i++){
                    if( layer[i].tile )
                        self.layers[layerName].push(layer[i]);
                    else{
                        skip = false;
                        
                        break;
                    }
                }

                if( skip )
                    continue;
            }

            var resLoaded = resLoadedLayers[layerName];

            if( !resLoaded ){
                resLoaded = self.resLoaded[self.getSetForLayerName(layerName)][layerName];

                resLoadedLayers[layerName] = resLoaded;
            }

            if( layerName == 'flag' && !tResFlag[layer[0].type] )
                tResFlag[layer[0].type] = {url: reqMgr.prepareRequestUrl('/gen/flag/-'+layer[0].type+'.gif')};
            else if( layerName == 'hm' && !tile[Tile.param.layersUpd] && layer.length > 1 ){
                // Сортируем горы и холмы в зависимости от глубины
                if( self.calcBackgroundness(layer[0].x) < self.calcBackgroundness(layer[1].x) ){
                    var tmpElem = layer[0];
                    layer[0] = layer[1];
                    layer[1] = tmpElem;
                }
            }

            for(var i = 0; i < layer.length; i++){
                var res = layer[i];

                res.posTMT = tile[Tile.param.posTMT];
                res.posTMpx = tile[Tile.param.posTMpx];
                res.tile = tile;

                self.layers[layerName].push(res);

                if( !resLoaded[res.type] ){
                    self.loadResource(layerName, res.type, function(){
                        self.drawLoadResource();
                    }, loadResOpt);
                }
            }
        }

        tile[Tile.param.layersUpd] = now;
    });

    //вычисляем слой, для скрытия обрезков
    this.calcClearLayer();
};

bckMap.prototype.getZoomPicLevel = function(){
    return 0;
};





pMapInfo = function(){
	pMapInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapInfo, hPanel);


pMapInfo.prototype.calcName = function(){
	return 'info';
};

pMapInfo.prototype.calcTmplFolder = function(){
	return this.parent.tmpl[this.name];;
};

pMapInfo.prototype.initOptions = function(){
	pTownInfo.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

pMapInfo.prototype.addNotif = function(){
    this.notif.other[Notif.ids.mobAppMapToggleInfo] = this.toggleExpand;
    
    this.notif.other[Notif.ids.mapTileSelect] = 
    this.notif.other[Notif.ids.mapTileSelectInfo] = function(){
        this.toggleExpand(this.parent.inf.tileSelect && !this.parent.children.infoExt.isExpanded());
    };
};

pMapInfo.prototype.calcChildren = function(){
    this.children.tile = bMapTile;
    
//    this.children.towns = bMapTowns;
};

pMapInfo.prototype.bindEvent = function(){
	this.wrp.on('click', '.info-tile-wrp', function(){
        notifMgr.runEvent(Notif.ids.mobAppMapToggleInfoExt, true);
    });
};

pMapInfo.prototype.afterAllShow = Panel.superclass.afterAllShow;

pMapInfo.prototype.afterShow = function(){};


pMapInfo.prototype.getZoffset = function(){return 1;};

pMapInfo.prototype.getSide = function(){return 'top';};

pMapInfo.prototype.onToggleStart = function(){
    if( this.isReady() )
        this.children.tile.makeResize();
};

pMapInfo.prototype.onToggleEnd = function(){
    if( this.isReady() )
        notifMgr.runEvent(Notif.ids.mobAppMapInfoToggleEnd);
};


pMapInfo.prototype.getExpandDuration = function(duration){
    return duration||wndMgr.getWndSwipeTime();
};

pMapInfo.prototype.getContHeight = function(duration){
    if( !this.cont || !this.isExpanded() )
        return 0;
    
    return this.cont.outerHeight(true);
};



bMapTile.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.mapTileSelectInfo, Notif.ids.townCur];
};

bMapTile.prototype.cacheCont = function(){
    this.cacheTrimmedCont();
};

    bMapTile.prototype.cacheTrimmedCont = function(){
        if( !this.data.tile ){
            delete this.$rowVary;
            
            return;
        }
        
        this.$rowVary = this.cont.find('.tile-row.-type-vary');
        this.$rowVary.$trimmedChildren = this.$rowVary.children();
        this.$rowVary.$trimmedElems = this.$rowVary.find('[class*=-snip-text]');
        
        if( !this.$rowVary.$trimmedElems.length )
            delete this.$rowVary;
    };

bMapTile.prototype.afterDraw = function(){};


bMapTile.prototype.setMap = function(parent){
	this.map = parent.parent.inf;
};

bMapTile.prototype.makeResize = function(){
    this.calcTrimmedElemLimWidth();
};


bMapTile.prototype.calcTrimmedElemLimWidth = function(){
    if( !this.$rowVary || !this.parent.isExpanded() )
        return;
    
    this.$rowVary.$trimmedElems.css('max-width', '');
    
    if( wndMgr.isLandscape() )
        return;
    
    var occupiedWidth = 0;
    
    this.$rowVary.$trimmedChildren.each(function(){
        occupiedWidth += $(this).outerWidth();
    });
    
    var overflowWidth = occupiedWidth - this.$rowVary.outerWidth();
    
    if( overflowWidth < 1 )
        return;
    
    var sumWidth = 0,
        minWidth = 9999,
        limWidth;
    
    this.$rowVary.$trimmedElems.each(function(){
        var width = $(this).outerWidth();
        
        minWidth = Math.min(minWidth, width);
        
        sumWidth += width;
    });
    
    limWidth = (sumWidth - overflowWidth) / this.$rowVary.$trimmedElems.length;
    
    limWidth += Math.max(0, limWidth - minWidth); // Дополняем лимит ширины остатком от ширины самого узкого блока
    
    this.$rowVary.$trimmedElems.css('max-width', limWidth);
};



bMapTowns.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.townCur, Notif.ids.accTowns];
};

bMapTowns.prototype.afterDraw = function(){};


bMapTowns.prototype.setMap = function(parent){
	this.map = parent.inf ? parent.inf : parent.parent.inf;
};






function pMapInfoExt(){
	pMapInfoExt.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapInfoExt, pMapInfo);


pMapInfoExt.prototype.calcName = function(){
	return 'infoExt';
};

pMapInfoExt.prototype.calcChildren = function(){
    this.children.tile = bMapTileExt;
    
    //this.children.towns = bMapTowns;
};

pMapInfoExt.prototype.addNotif = function(){
    this.notif.other[Notif.ids.mobAppMapToggleInfoExt] = this.toggleExpand;
    
	this.notif.other[Notif.ids.mapTileHold] = function(holdPosTMT){
		var imap = this.parent.inf,
            posTMT = (imap.tileSelect||{}).posTMT;
		
        if( !holdPosTMT || !posTMT )
			return;
        
        holdPosTMT.o = posTMT.o;
        
        this.newMapPosTMT = holdPosTMT;
        
        if( imap.mode.type == 'build' ){
            this.toggleExpand(this.isExpanded(), {callback: function(){
                imap.map.onClickTile(imap.getTile(holdPosTMT));
            }});
        }
		else if( posTMT.x == holdPosTMT.x && posTMT.y == holdPosTMT.y ){
            if( this.isExpanded() )
                delete this.newMapPosTMT;
            
			this.toggleExpand();
        }
        else{
            imap.map.onClickTile(imap.getTile(holdPosTMT));
            
            if( !this.isExpanded() )
                this.children.tile.showAndWaitData();
            
            this.toggleExpand(true);
		}
	};
};

pMapInfoExt.prototype.afterShow = function(){};

pMapInfoExt.prototype.afterAllShow = function(){
	Panel.prototype.afterAllShow.apply(this, arguments);
    
    snip.yScrollHandler(this.$contWrp, this, {
        checkAbortSwipe: function(scrolling, dY){
            return !(scrolling.atBottom && dY > 0);
        }
    });
};

pMapInfoExt.prototype.getZoffset = function(){return 2;};


pMapInfoExt.prototype.abortSwipe = function(){
	this.$contBlk.trigger('swipeabort');
};

pMapInfoExt.prototype.onToggleStart = function(duration){
    pMapInfoExt.superclass.onToggleStart.apply(this, arguments);
    
    if( this.isReady() )
        notifMgr.runEvent(Notif.ids.mobAppMapToggleInfo, !this.isExpanded());
    
    this.centerMapOnNewPosTMT();
};

pMapInfoExt.prototype.onToggleCancel = function(){
    this.centerMapOnNewPosTMT();
};

    pMapInfoExt.prototype.centerMapOnNewPosTMT = function(duration){
        if( !this.newMapPosTMT )
            return;
        
        this.parent.inf.moveTo(this.newMapPosTMT, {
            duration: this.getExpandDuration(duration),
            forceMove: true
        });

        delete this.newMapPosTMT;
    };

pMapInfoExt.prototype.onToggleEnd = function(){};


pMapInfoExt.prototype.setSize = function(){
	this.$contWrp.css('max-height', this.parent.getContWrpSize().height - this.$footerWrp.outerHeight());
};



function bMapTileExt(parent){
    this.setMap(parent);
    
	pMapInfoExt.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapTileExt, bMapTile);


bMapTileExt.prototype.addNotif = function(){
    bMapTileExt.superclass.addNotif.apply(this, arguments);
    
    this.notif.other[Notif.ids.mapResLoaded] = function(){
        console.log('----> mapResLoaded');
        
        notifMgr.runEvent(Notif.ids.mobAppMapRenderTile, this.canvas);
    };
};

bMapTileExt.prototype.bindEvent = function(){
    var self = this;
    
    this.wrp.on('click', '.tile-shortcut', function(e){
        if( $(e.target).hasClass('tile-comments') )
            return;
       
       self.map.moveTo(self.map.tileSelect.posTMT); 
    });
};

bMapTileExt.prototype.cacheCont = function(){
    if( !this.$canvasTag ){
        this.canvasTag = document.createElement('canvas');
        this.canvas = this.canvasTag.getContext('2d');
        
        this.$canvasTag = $(this.canvasTag).addClass('tile-canvas');
    }
    
    this.cont.find('.tile-shortcut').prepend(this.$canvasTag);
    
    this.cacheTrimmedCont();
};

    bMapTileExt.prototype.cacheTrimmedCont = function(){
        if( !this.data.tile ){
            delete this.$ceilVary;
            
            return;
        }
        
        this.$ceilStatic = this.cont.find('.tile-cell.-type-static');
        this.$ceilVary = this.cont.find('.tile-cell.-type-vary');
        
        this.$ceilVary.$trimmedChildren = this.$ceilVary.find('.-type-trimmed');
        this.$ceilVary.$trimmedElems = this.$ceilVary.$trimmedChildren.find('[class*=-snip-text]');
        
        if( !this.$ceilVary.$trimmedElems.length )
            delete this.$ceilVary;
    };

bMapTileExt.prototype.afterDraw = function(){
    this.resizeCanvas();
    
    this.drawCanvas();
};


bMapTileExt.prototype.calcTrimmedElemLimWidth = function(){
    if( !this.$ceilVary || !this.parent.isExpanded() )
        return;
    
    this.$ceilVary.$trimmedElems.css('max-width', '');
    
    var availWidth = this.cont.outerWidth() - this.$ceilStatic.outerWidth() - 8, // 8 - паддинги
        $trimmedElems = this.$ceilVary.$trimmedElems,
        $trimmedElem,
        limWidth;
    
    this.$ceilVary.$trimmedChildren.each(function(){
        $trimmedElem = $(this).find($trimmedElems);
        
        limWidth = availWidth - ($(this).outerWidth() - $trimmedElem.outerWidth());
        
        $trimmedElem.css('max-width', limWidth);
    });
};


bMapTileExt.prototype.resizeCanvas = function(parent){
	this.canvasTag.width = this.$canvasTag.width();
    this.canvasTag.height = this.$canvasTag.height();
};

bMapTileExt.prototype.drawCanvas = function(){
	notifMgr.runEvent(Notif.ids.mobAppMapRenderTile, this.canvas);
};





pMapFilters.prototype.initOptions = function(){
	pMapFilters.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

utils.overrideMethod(pMapFilters, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mapToggleFilters] = this.toggleExpand;
});





pMapR.prototype.initOptions = function(){
	pMapR.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

utils.overrideMethod(pMapR, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mapToggleMapR] = this.toggleExpand;
});





utils.reExtend(pMapMini, Panel);


pMapMini.prototype.initOptions = function(){
	pMapMini.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

utils.overrideMethod(pMapMini, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mapToggleMapMini] = this.notifToggleExpand;
});


pMapMini.prototype.getSide = function(){
	return this.side||'right';
};

pMapMini.prototype.onToggleStart = function(){
	if( !this.parent.isReady() )
		return;
	
	ls.setMiniMapOn(this.isExpanded()||false);
	
	if( this.isExpanded() && this.parent.actions.isExpanded() )
		this.parent.actions.toggleExpand(false, {duration: wndMgr.swipeTime});
	
	notifMgr.runEvent(Notif.ids.mobAppMiniMapOnToggle);
};

pMapMini.prototype.doSwipe = function(pointDelta){
	if( !pointDelta || Math.abs(pointDelta.x||0) < 35 )
		return;
	
	if( pointDelta.x > 0 )
        this.setSide('left');
	else if( pointDelta.x < 0 )
        this.setSide('right');
	
	this.toggleExpand();
};


pMapMini.prototype.getExpandDuration = function(duration){
    return duration||wndMgr.getWndSwipeTime();
};


pMapMini.prototype.notifToggleExpand = function(args){
    this.toggleExpand.apply(this, args);
};





bMapMini.prototype.bindScrollEvent = function(){
	snip.xScrollHandler(this.wrp, this.parent, '.minimap-zoom-wrp');
};


bMapMini.prototype.calcFrameSize = function(){
	var frameSize = {},
		$ppContWrp = this.parent.parent.$contWrp;
	
	frameSize.x = $ppContWrp.width();
	frameSize.y = frameSize.x / (lib.map.size.x / lib.map.size.y);
	
	if( frameSize.y > $ppContWrp.height() ){
		frameSize.y = $ppContWrp.height();
		frameSize.x = frameSize.y * lib.map.size.x / lib.map.size.y;
	}
	
	return frameSize;
};

utils.overrideMethod(bMapMini, 'changeMMPos', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.parent.toggleExpand(false);
});





pMActions.prototype.initOptions = function(){
	pMActions.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

utils.overrideMethod(pMActions, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mapToggleActions] = this.notifToggleExpand;
    
//    this.notif.other[Notif.ids.mapChunkLoaded] = this.mapChunkLoaded;
});


utils.overrideMethod(pMActions, 'onToggleStart', function __method__(duration){
    if( !this.isReady() )
        return;
    
    this.parent.info.toggleExpand(!this.isExpanded(), {duration: duration});
    
    this.setMapMode();
    
	if( !this.parent.isReady() )
		return;
	
	ls.setMActionsOn(this.isExpanded()||false);
    
	if( this.isExpanded() && this.parent.minimap.isExpanded() )
		this.parent.minimap.toggleExpand(false, {duration: wndMgr.swipeTime});
	
	notifMgr.runEvent(Notif.ids.mobAppMActionsOnToggle);
});


pMActions.prototype.getExpandDuration = function(duration){
    return duration||wndMgr.getWndSwipeTime();
};


pMActions.prototype.notifToggleExpand = function(args){
    this.toggleExpand.apply(this, args);
};

/*
pMActions.prototype.mapChunkLoaded = function(){
    this.setTimeout(this.setMapMode, 0);
};
*/





utils.overrideMethod(bMapArrows, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.show.push(Notif.ids.mobAppMapInfoToggleEnd);
});

bMapArrows.prototype.getMenuBorder = function(){
    var parent = this.parent.parent,
        height = 0;
    
    if( !parent.isReady() )
        return {y: height, y2: height};
    
    height = Math.max(parent.children.info.getContHeight(), parent.children.infoExt.getContHeight());
    
	return {y: height, y2: height};
};