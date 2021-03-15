MapScreen = function(id, data){
	MapScreen.superclass.constructor.apply(this, arguments);
};

utils.extend(MapScreen, InfScreenWnd);

WndMgr.regWnd('map', MapScreen);


MapScreen.prototype.calcName = function(){
	return 'map';
};

MapScreen.prototype.canDisplay = function(){
	var canDisplay = this.inf.canDisplay();
	
	if( !canDisplay )
		this.close();
	
	return canDisplay;
};

MapScreen.prototype.calcChildren = function(){
	this.children.map = iMap.getMapConstructor();
	this.children.loadIndicator = bLoadIndicator;
	this.children.filters = pMapFilters;
	this.children.actions = pMActions;
	this.children.right = pMapR;
	this.children.minimap = pMapMini;
	this.children.events = bMapEvents;
	this.children.nav = bMapNav;
	this.children.version = bMapVersion;
};

MapScreen.prototype.addNotif = function(){
	this.notif.other[Notif.ids.mapVersion] = function(){
        this.refresh(true);
    };
};

MapScreen.prototype.afterShow = function(){
	this.inf.toggleLoadIndicator(true);
};

MapScreen.prototype.refresh = function(allowRefresh){
    if( !allowRefresh )
        return;
	
    this.inf.refresh();
    
    this.reInitNotif =
    this.reInitChildren = true;
    
    this.show();
    
    this.showMap();
};


MapScreen.prototype.onIdChange = function(newId){
	return this.inf.onIdChange.apply(this.inf, arguments);
};

MapScreen.prototype.onSetted = function(){
	this.showMap();
};


MapScreen.prototype.bindBaseSwipe = function(){};

MapScreen.prototype.canScrollCont = function(){
	return false;
};


MapScreen.prototype.update = iMap.prototype.update;

MapScreen.prototype.showMap = function(){
	this.map.resize();
	
	this.inf.afterShow();
};



bMapEvents.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapR.events;
};


bMapEvents.prototype.setMap = function(parent){
	this.map = parent.inf;
};





bMapVersion = function(parent){
	this.setMap(parent);
	
	bMapVersion.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapVersion, Block);


bMapVersion.prototype.calcName = function(){
	return 'version';
};

bMapVersion.prototype.getTmplData = function(){
	var data = {};
	
	data.version = this.map.version;

	return data;
};
		
bMapVersion.prototype.bindEvent = function(){
	var self = this;

	//режимы карты
	this.wrp
		.on('click', '.btnMapMode', function(){
			var tab = $(this);

			if( tab.hasClass('map_mode_vers') )
				return;

			self.wrp.find('.btnMapMode').not(tab).removeClass('active');
			
			tab.addClass('active');
		})
		//переключение версий карты
		.on('click', '.map_mode_versBtn, .btnMapMode.-type-view', function(){
			self.wrp.find('.map_mode_versBtn').removeClass('-hidden');
			
			self.wrp.find('.map_mode_versWrp').toggleClass('-hidden');
		})
		.on('click', '.map_mode_vers', function(){
			ls.setMapVersion(iMap.isSimplified() ? iMap.version.full : iMap.version.simplified);
			
            iMap.clearChunks(function(){
                notifMgr.runEvent(Notif.ids.mapVersion);
            });
		});
};


bMapVersion.prototype.setMap = function(parent){
	this.map = parent.map.map;
};





bMapNav.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapR.nav;
};

utils.overrideMethod(bMapNav, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	var self = this;
	
	this.wrp
		.on('touchstart', '.map_nav', function(e){
			self.map.map.bindGuiTouchEvent(this, e.originalEvent||e);
		});
	
});


bMapNav.prototype.setMap = function(parent){
	this.map = parent.inf;
};


utils.overrideMethod(bMapNav, 'moveByDir', function __method__(dir){
	if( !ls.getSmoothMapScroll(true) ){
		__method__.origin.apply(this, arguments);
		
		return;
	}
	
	var map = this.map.map,
		vecMove = new Vector2D(Tile.dirsScr[dir]);
	
	this.map.map.smoothMove(vecMove.doMultScalar(-0.5 * Math.sqrt(map.sizeVpx.x * map.sizeVpx.x + map.sizeVpx.y * map.sizeVpx.y)), {byDist: true});
});