pMapFilters = function(parent){
	this.setMap(parent);
	
	pMapFilters.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapFilters, Panel);

utils.mix(pMapFilters, bMapFilters, {keepOwnProto: true});


pMapFilters.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

pMapFilters.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.optIcon(true));
};

pMapFilters.prototype.calcChildren = function(){
	this.children.aura = bMapFilterAura;
	this.children.iface = bMapFilterIFace;
	this.children.filter = bMapFilterFilter;
	this.children.zoom = bMapZoom;
};


pMapFilters.prototype.setMap = function(parent){
	this.map = parent.map.map;
};

pMapFilters.prototype.getSide = function(){
	return 'left';
};



bMapFilter = function(parent){
	this.setMap(parent);
	
	bMapFilter.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapFilter, Block);


bMapFilter.prototype.createCont = function(){
	var cont = bMapFilter.superclass.createCont.apply(this);
	
	return tmplMgr.panel.header({panel: this}) + snip.wrp('block-cont-wrp', cont, 'div');
};


bMapFilter.prototype.setMap = pMapFilter.prototype.setMap;

bMapFilter.prototype.getHeaderCont = Panel.prototype.getHeaderCont;

bMapFilter.prototype.hasHeader = Panel.prototype.getHeaderCont;



bMapFilterAura = function(parent){
	bMapFilterAura.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapFilterAura, bMapFilter);

utils.mix(bMapFilterAura, pMapFilterAura, {keepOwnProto: true});


bMapFilterAura.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapTL.filters.aura;
};


		
bMapFilterIFace = function(parent){
	bMapFilterIFace.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapFilterIFace, bMapFilter);

utils.mix(bMapFilterIFace, pMapFilterIFace, {keepOwnProto: true});


bMapFilterIFace.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapTL.filters.iface;
};


bMapFilterFilter = function(parent){
	bMapFilterFilter.superclass.constructor.apply(this, arguments);
};

utils.extend(bMapFilterFilter, bMapFilter);

utils.mix(bMapFilterFilter, pMapFilterFilter, {keepOwnProto: true});


bMapFilterFilter.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapTL.filters.filter;
};


bMapFilterFilter.prototype.bindEvent = function(){
	this.wrp.on('click', '.block-cont-wrp', function(){
		wndMgr.addWnd(wMapFilter);
	});
};





bMapZoom.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapTL.zoom;
};

bMapZoom.prototype.getSliderDir = function(){
	return -1;
};

bMapZoom.prototype.getSliderStep = function(){
	return -10;
};


bMapZoom.prototype.setZoom = function(){
	if( !this.$slider )
		return;
	
    var zoomLevel = Math.round(this.map.zoomLevel);

	this.$slider.slider('value', this.getSliderDir() * zoomLevel);
	
	this.$slider.find('a').html(zoomLevel);
};