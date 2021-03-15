bMapR.C_MIN_BLOCK_HEIGHT = 80;
bMapR.C_FIT_FREE_HEIGHT = false;

bMapR.prototype.initOptions = function(){
	bMapR.superclass.initOptions.apply(this, arguments);
	
	this.options.resizeParent = false;
};

bMapR.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapR;
};

utils.overrideMethod(bMapR, 'addNotif', function __method__(){
    __method__.origin.apply(this, arguments);
    
    this.notif.other[Notif.ids.mapTileSelect] = function(){
		this.lastTMT = this.map.tileSelect.tile[Tile.param.posTMT];
	};
	this.notif.other[Notif.ids.mapTileHold] = function(holdPosTMT){
		var imap = this.map,
            posTMT = (imap.tileSelect||{}).posTMT;
		
        if( !holdPosTMT || !posTMT )
			return;
        
        holdPosTMT.o = posTMT.o;
        
        this.parent.newMapPosTMT = holdPosTMT;
        
        if( imap.mode.type == 'build' ){
            this.toggle(this.parent.isExpanded(), {callback: function(){
                imap.map.onClickTile(imap.getTile(holdPosTMT));
            }});
        }
		else if( posTMT.x == holdPosTMT.x && posTMT.y == holdPosTMT.y )
			this.toggle();
		else{
            imap.map.onClickTile(imap.getTile(holdPosTMT));
            
            this.toggle(true);
		}
	};
});

    utils.overrideMethod(bMapR, 'notifToggleAfterMapReady', function __method__(){
        if( this.map.tileSelect )
            this.parent.newMapPosTMT = this.map.tileSelect.posTMT;
        
        __method__.origin.apply(this, arguments);
    });

bMapR.prototype.calcChildren = function(){
    this.children.tile = bMapTile;
	this.children.towns = bMapTowns;
	this.children.comments = bMapComments;
};

bMapR.prototype.initScroll = function(){};

utils.overrideMethod(bMapR, '_doResize', function __method__(){
    var self = this;
    
	utils.getElemSize(this.wrp, {callback: function($wrp){
        __method__.origin.call(self);
    }});
});


bMapR.prototype.setMap = function(parent){
	this.map = parent.parent.map.map;
};

bMapR.prototype.toggle = function(expanded, opt){
	this.setTimeout(function(){
		this.parent.toggleExpand(expanded, opt);
		
		this.setSettings(expanded);
	}, 0);
};

bMapR.prototype.getAvailHeight = function(){
    return this.parent.parent.getContWrpSize().height;
};