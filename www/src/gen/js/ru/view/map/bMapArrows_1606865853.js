bMapArrows = function(parent){
	this.parent = parent;
	this.map = parent.map;
	
	bMapArrows.superclass.constructor.apply(this, arguments);
    
	this.options.resizeParent = false;
};

utils.extend(bMapArrows, Block);
    
    
bMapArrows.prototype.calcName = function(){
    return 'arrows';
};

bMapArrows.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.mapMoving, Notif.ids.mapIfResize];
};

bMapArrows.prototype.getTmplData = function(){
    this.data = {};

    if( !this.map.isAnimated() && !this.map.clrMapScr )
        this.data.arrows = this.calcArrows();

    return this.data;
};

bMapArrows.prototype.calcBorder = function(){
    //препятствия
    var cont = {x: this.parent.sizeVpx.x, y: this.parent.sizeVpx.y-5};
    var left = this.getRightBorder();
    var map = this.getMapBorder();
    var menu = this.getMenuBorder();

    //начинаем с левого верхнего угла и дальше по кругу
    var A = {x: 0, y: menu.y};
    var B = {x: cont.x-left.x, y: menu.y2};
    var C = {x: cont.x-left.x, y: cont.y};
    //обходим карту
    var D = {x: map.x, y: cont.y};
    var E = {x: map.x, y: cont.y-map.y};
    var F = {x: 0, y: this.parent.sizeVpx.y-map.y};

    var border = [A, B, C, D, E, F];
    return border;
};

bMapArrows.prototype.getRightBorder = function(){
    return this.map.settings.p_rgt ? {x: 210} : {x: 0};
};

bMapArrows.prototype.getMenuBorder = function(){
    return {y: 0, y2: 0};
};

bMapArrows.prototype.getMapBorder = function(){
    var minimap = this.map.getMM();

    return minimap && minimap.fullSize ? {x: 610, y: 460} : {x: 245, y: 205};
};

//выбираем точки, к которым будем показывать направления
bMapArrows.prototype.getTiles = function(){
    var tiles = [];

    if (this.map.tileSelect) {
        tiles.push({tile: this.map.tileSelect.tile, posTMT: this.map.tileSelect.posTMT})	
    }

    for (var town in wofh.towns) {
        town = wofh.towns[town];

        tiles.push({tile: this.map.getTile(town.pos), posTMT: town.pos, town: town});
    }

    return tiles;
};

//расчитываем точки, выкидываем видимые
bMapArrows.prototype.calcTiles = function(){
    var tilesRaw = this.getTiles();
    var tiles = [];

    for (var tile in tilesRaw) {
        tile = tilesRaw[tile];

        var posTMpx = this.parent.getPosTMpxByPosTMT(tile.posTMT);

        var drawBase = this.parent.calcDrawBase(posTMpx);
        if (!drawBase) return tiles;

        if (!this.parent.isTileVisible(drawBase)) {
            tile.posScr = drawBase;
            tiles.push(tile);
        }
    }

    return tiles;
};

bMapArrows.prototype.calcArrows = function(){
    var arrows = [];

    //центр из которого выпускаем луч
    var O = {x: this.parent.sizeVpx.x/2, y: this.parent.sizeVpx.y/2};

    //границы области
    var border = this.calcBorder();

    //города
    var tiles = this.calcTiles();	

    for (var tile in tiles){
        tile = tiles[tile];
        var pos = Trade.calcSegmPolygonIntersect(border, O, tile.posScr);
        if (pos) {
            var arrow = {};

            arrow.pos = pos;
            arrow.angle = Math.PI + Math.atan2(pos.y - O.y, pos.x - O.x);
            arrow.tile = tile;

            if (arrow.tile.town) {
                arrow.relation = Tile.relation.self;
            } else {
                arrow.relation = Account.calcRelation(Tile.getPlayerId(tile.tile), Tile.getCountryId(tile.tile));;
            }

            arrows.push(arrow);	
        }
    }

    return arrows;
};

bMapArrows.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('mouseover', '.map-arrow', function(event){
            var arrowId = $(this).data('id');
            var arrow = self.data.arrows[arrowId];

            if (arrow.tile.tile) {
                var ttData = self.map.prepareTileBaseInfo(arrow.tile.tile);
                if (!arrow.tile.town) {
                    ttData.selectedPlace = true;
                }
            } else {
                var ttData = {};
                ttData.posTMT = arrow.tile.posTMT;
                ttData.town = arrow.tile.town;
                ttData.player = ttData.town.account;
                ttData.country = ttData.player.country;
            }

            var cont = tmplMgr.iMap.tooltip(ttData);

            tooltipMgr.show(tmplMgr.iMap.tooltip(ttData), utils.getPosFromEvent(event), {voiceHelper: {$target: $(this), text: cont}});
        })
        .on('mouseout', '.map-arrow', function(){
            tooltipMgr.hide();
        });	
};