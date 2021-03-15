iMap.prototype.getMM = function(){
	return this.screen.children.minimap.children.minimap;
};

iMap.prototype.getLoadIndicator = function(){
	return this.screen.children.loadIndicator;
};

iMap.prototype.getRight = function(){
	return this.screen.children.right.children.right;
};

utils.overrideMethod(iMap, 'setHash', function __method__(){
	wndMgr.lockSwipe();
	
	hashMgr.parse(['map', this.getId()], true);
	
	wndMgr.unlockSwipe();
});

iMap.prototype.initSettingsRight = function(){
	this.settings.p_rgt = Quest.isActive(Quest.ids.mappost);
};

utils.overrideMethod(iMap, '_moveTo', function __method__(posMWT, opt){
	if( !ls.getSmoothMapScroll(true) ){
		__method__.origin.apply(this, arguments);
		
		return;
	}
	
	opt = opt||{};
	
	if( opt.highlight )
		this.highlightTile(posMWT);
	
	var map = this.map,
		drawBase = new Vector2D(map.calcDrawBase(map.getPosTMpxByPosTMT(posMWT)))
							.diffVector((new Vector2D(map.sizeVpx)).doMultScalar(0.5))
							.diffVector(new Vector2D(opt.offset));
	
	if( opt.onlyX )
		drawBase.y = 0;
	if( opt.onlyY )
		drawBase.x = 0;
	
	map.smoothMove(drawBase.doMultScalar(-this.zoom), {byDist: true, duration: opt.duration});
    
	notifMgr.runEvent(Notif.ids.mapMove);
});


iMap.prototype.changeZoom = function(delta){
	var newZoomLevel = this.zoomLevel + delta;
	
	return this.setZoom(newZoomLevel);
};

iMap.prototype.setZoom = function(zoomLevel){
	zoomLevel = zoomLevel||this.zoomLevel||this.getMaxZoom();
	
	zoomLevel = Math.max(zoomLevel, this.getMinZoom());
	
	zoomLevel = Math.min(zoomLevel, this.getMaxZoom());
	
	var zoom = 100 / zoomLevel,
		delta = this.zoom - zoom;
	
	this.zoomLevel = zoomLevel;
	
	this.zoom = zoom;
	
	this.settings.zoom = this.zoomLevel;
	
	this.setSettings();
	
	notifMgr.runEvent(Notif.ids.mapZoom, delta);
	
	return zoomLevel;
};
    
iMap.prototype.setMaxZoom = function(){
	this.setZoom(this.getMaxZoom());
};

iMap.prototype.setMinZoom = function(){
	this.setZoom(this.getMinZoom());
};

iMap.prototype.getMaxZoom = function(){
	return this.zoomLevelMax;
};

iMap.prototype.getNormZoom = function(){
	return this.zoomLevelNorm;
};

iMap.prototype.getMinZoom = function(){
	return this.zoomLevelMin;
};

iMap.prototype.isAnimated = function(){
    return this.isMoving || this.isZooming;
};





bMapCurBtns.prototype.allowShow = function(){
    var allow = bMapR.superclass.allowShow.apply(this, arguments);
    
    if( allow )
        allow = !this.map.isBarExpanding;
    
	return allow;
};