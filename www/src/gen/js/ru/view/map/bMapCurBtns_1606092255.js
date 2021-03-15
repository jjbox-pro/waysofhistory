bMapCurBtns = function(parent){
    this.name = 'cursorButtons';
	
    this.parent = parent;
	
    this.map = parent.map;
    
    bMapR.superclass.constructor.apply(this, arguments);
	
    this.options.resizeParent = false;
    this.options.inactive = true;
};

utils.extend(bMapCurBtns, Block);


bMapCurBtns.prototype.addNotif = function(){
    this.notif.show = [
                        Notif.ids.accBonus,
                        Notif.ids.mapRequestRoute,
                        Notif.ids.mapRouteReceived,
                        Notif.ids.mapTileSelect,
                        Notif.ids.mapTileSelectInfo,
                        Notif.ids.mapMoving,
                        Notif.ids.mapMode,
                        Notif.ids.mapZoom,
                        Notif.ids.mapIfResize
                    ];
};

bMapCurBtns.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('click', '.map_cursorBut.-type-depError, .map_cursorBut.-type-depColonize, .map_cursorBut.-type-depFree, .map_cursorBut.-type-spy, .map_cursorBut.-type-townFound, .map_cursorBut.-type-townError', function(){
            var className = $(this).data('action');

            self.map.showActionsPopup(className);
        })
        .on('click', '.-type-buildRoute', function(){
            if( wofh.account.isPremium() )
                self.map.findTilePaths($(this).data('type'));
            else
                wndMgr.addWnd(wNoPremium);
        })
        .on('click', '.mapButton.-type-tileRoute', function(){
            if( $(this).hasClass('-active') ) return;

            return self.changeRouteActivity(this);
        })
        .on('mouseenter', '.mapButton.-type-tileRoute', function(){
            if( $(this).hasClass('-active') ) return;

            return self.changeRouteActivity(this, true);
        })
        .on('mouseleave', '.mapButton.-type-tileRoute', function(){
            if( $(this).hasClass('-active') ) return;

            return self.changeRouteActivity($(this).siblings('.-type-tileRoute.-active'), true);
        })
        .on('click', '.js-routeModes', function(){
            $(this).closest('.map_cursorBut.-type-tileRoutes').toggleClass('-active');

            return false;
        })
        .on('click', '.js-changeRouteMode', function(){
            self.map.routeMode = Route.modes[+$(this).data('mode')];

            $(this).closest('.map_cursorBut.-type-tileRoutes').toggleClass('-active');

            self.cont.find('.map_cursorBut-routeMode-wrp').html(tmplMgr.iMap.back.cursorButtons.routeMode({routeMode:self.map.routeMode}));

            return false;
        })
        .on('click', '.map_cursorBut.-type-imp', function(){//улучшение - вкл/выкл
            var $this = $(this),
                link = self.parent.impLinks[$this.data('index')];

            var usesmapId = Math.pow(2, link.id),
                usesmap = wofh.town.usesmap,
                relTile = self.map.getTileByDir(self.map.tileSelect.posTMT, link.dir),
                usesmapRel = relTile[Tile.param.impMap];

            usesmap = link.isActive ? usesmap ^ usesmapId : usesmap | usesmapId;
            usesmapRel = link.isActive ? usesmapRel ^ usesmapId : usesmapRel | usesmapId;

            wofh.town.usesmap = usesmap;
            relTile[Tile.param.impMap] = usesmapRel;

            reqMgr.setUseMap(usesmap, function(resp){
                if( resp.error )
                    return;

                self.parent.calcImpLinks();

                link = self.parent.impLinks[$this.data('index')];

                $this.toggleClass('-type-inactive', !link.isActive);

                $this.attr('data-title', link.isActive ? 'Отключить использование улучшения' : 'Включить использование улучшения');

                tooltipMgr.hide();

                self.parent.drawHighCanvas();
            });
        });
};

bMapCurBtns.prototype.getTmplData = function(){
    if (
        !(
            this.map.mode.type == iMap.mode.type.view || 
            this.map.mode.type == iMap.mode.type.makeRoute
        ) ||
        !this.map.tileSelect || 
        this.map.isAnimated() || 
        this.map.loadingTileState ||
        this.map.clrMapScr
    ){
        return {};
    }

    this.displayDelay = 100;

    var data = {
        posTMT: this.map.tileSelect.posTMT,
        zoom: this.map.zoom - 1,
        show: {},
        dispY: this.parent.dispClimPx_y
    };

    // Получение данных по маршрутам
    if( this.map.mapRoutes && this.map.mapRoutes.dataLoading ){
        if( Trade.isPointsEqual(this.map.mapRoutes.to.posTMT, data.posTMT) ){
            this.displayDelay = 0;

            data.show.routesLoading = true;	
        }
    }

    if( this.map.mode.type == iMap.mode.type.makeRoute )
        return data;

    if(this.map.tileSelect.town) {
        data.town = this.map.tileSelect.town.id;

        if(!this.map.tileSelect.deposit){
            data.show.enter = this.map.tileSelect.player && ((wofh.account.isAdmin() && !this.map.tileSelect.player.getSpecial()) || (this.map.tileSelect.player.id == wofh.account.id));

            if( data.show.enter )
                data.acc = this.map.tileSelect.player.id;

            data.show.army = ((!wofh.town.army.own.isEmpty() && this.map.tileSelect.town.id != wofh.town.id) || Account.hasAbility(Science.ability.tactics)) && Quest.isAvail(lib.quest.ability.sendarmy) && !Town.hasDefMoment(this.map.tileSelect.town);

            if(this.map.tileSelect.town.id != wofh.town.id){
                if( this.map.canTradeTile(this.map.tileSelect.tile, this.map.tileSelect.town.hasWaterPathOnly()) ){
                    data.show.resSend = wofh.town.traders.count>0;
                    data.show.resStream = this.map.tileSelect.player && !this.map.tileSelect.player.isBarbarian() && Account.hasAbility(Science.ability.money);//не варвар 
                }
            }
        }
    }
    if ( this.map.tileSelect.deposit && !this.map.tileSelect.deposit.isEmpty() ){
        if( new Unit(Unit.ids.worker).isAvailAcc() ){
            if(this.map.tileSelect.town){
                data.show['dep' + (this.map.tileSelect.player.id == wofh.account.id? 'Free': 'Enemy')] = true;
            } else {

                this.map.tileSelect.btnErrors = this.map.tileSelect.deposit.calcColonizeErrors();
                data.show['dep'+(utils.sizeOf(this.map.tileSelect.btnErrors)? 'Error': 'Colonize')] = true;
            }
        }
        else
            data.show['depNo'] = true;
    }
    //шпионаж
    if(
        wofh.town.army.own.getCount(Unit.ids.spy) && 
        this.map.tileSelect.dist.air > lib.map.view.openmaxdistance && 
        (!this.map.tileSelect.town || this.map.tileSelect.deposit)
    ){
        data.show.spy = true;
    }

    if(
        this.map.tileSelect.climate.id != Tile.climateIds.water && 
        new Unit(Unit.ids.settler).isAvailAcc() && 
        !data.show.depNo && 
        !data.show.depFree && 
        !data.show.depEnemy && 
        !data.show.depError && 
        !data.show.depColonize && 
        !data.show.enter && 
        !this.map.tileSelect.town 
    ){
        if( !this.map.getFoundTownErrors(this.map.tileSelect.tile, {colonists: true}) )
            data.show.townFound = true;
        else
            data.show.townError = true;
    }
    
    if( Quest.isAvail(Quest.ids.makeOffer) && this.map.canRoute(this.map.tileSelect) ){
        data.show.tileRoutes = true;
        
        data.map = this.map;
    }
    
    if( this.map.mapRoutes && Trade.isPointsEqual(this.map.mapRoutes.to.posTMT, data.posTMT) ){
        data.show.mapRoutes = this.map.mapRoutes;

        data.map = this.map;
    }

    if( this.parent.impLinksType == 'town' && data.town && data.town == wofh.town.id ){
        var zoom = Math.min(1.5, this.parent.map.zoom),
            imgOffset = {x: 25, y: 25},
            dispY =  (data.dispY / this.parent.map.zoom) - imgOffset.y,
            tileWidth = utils.toInt(Tile.sizePxArr[0].x * 0.75 / zoom),
            tileHeight = utils.toInt(Tile.sizePxArr[0].y * 0.75 / zoom),
            tileWidthH = utils.toInt(Tile.sizePxArr[0].x * 1.5 / zoom),
            tileHeightV = utils.toInt(Tile.sizePxArr[0].y * 1.5 / zoom),
            impLinksDirs = this.calcImpLinksDirs(tileWidth, tileHeight, tileWidthH, tileHeightV, dispY, imgOffset),
            impLinks = {};

        for(var index in this.parent.impLinks){
            var link = this.parent.impLinks[index];
                impLinks[index] = {
                    index: index, 
                    dir: link.dir, 
                    pos: impLinksDirs[link.dir], 
                    isActive: link.isActive
                };
        }

        if( utils.sizeOf(impLinks) )
            data.show.impLinks = impLinks;
    }

    //ссылки
    data.linkPos = this.map.genPosLink(data.posTMT);

    return data;
};



bMapCurBtns.prototype.calcImpLinksDirs = function(tileWidth, tileHeight, tileWidthH, tileHeightV, dispY, imgOffset){
    return [
        {x: -tileWidth - imgOffset.x, y: -tileHeight + dispY},
        {x: -imgOffset.x, y: -tileHeightV + dispY},
        {x: tileWidth - imgOffset.x, y: -tileHeight + dispY},
        {x: tileWidthH - imgOffset.x, y: dispY},
        {x: tileWidth - imgOffset.x, y: tileHeight + dispY},
        {x: -imgOffset.x, y: tileHeightV + dispY},
        {x: -tileWidth - imgOffset.x, y: tileHeight + dispY},
        {x: -tileWidthH - imgOffset.x, y: dispY},
        {x: -imgOffset.x, y: dispY}
    ];
};

bMapCurBtns.prototype.afterDraw = function(){
    this.moveCursorButtons();

    this.showCursorButtons();
};

bMapCurBtns.prototype.showCursorButtons = function(){
    this.setTimeout(function(){
        this.wrp.find('.map_cursorButtons').addClass('effect-appear-run');
    }, this.displayDelay);
};

bMapCurBtns.prototype.moveCursorButtons = function(){
    if( !this.map.tileSelect )
        return;

    this.wrp.find('.map_cursorButtons').css({
        left: (this.map.tileSelect.tile[Tile.param.posTMpx].x + this.parent.posMWpx.x)/this.map.zoom + 2 + this.parent.sizeTpx.x/2 / this.parent.drawZoom,
        top: (this.map.tileSelect.tile[Tile.param.posTMpx].y + this.parent.posMWpx.y)/this.map.zoom + this.parent.sizeTpx.y/2 / this.parent.drawZoom
    });
};

bMapCurBtns.prototype.changeRouteActivity = function($el, hover){
    $el = $($el);

    if( !(this.map.mapRoutes.getLength() > 1) ) return false;

    if( !hover )
        this.cont.find('.-type-tileRoute').removeClass('-active').addClass('-disabled');

    var list = this.map.mapRoutes.getList();

    for(var route in list)
        list[route].active = false;

    this.map.mapRoutes.getRoute($el.data('type')).active = true;

    this.map.mapRoutes.sort(function(a, b){
        if( a.active == b.active )
            return b.getPath() - a.getPath();
        else
            return a.active > b.active ? 1 : -1;
    });

    if( !hover )
        $el.addClass('-active').removeClass('-disabled');

    notifMgr.runEvent(Notif.ids.mapShowRoute);
};