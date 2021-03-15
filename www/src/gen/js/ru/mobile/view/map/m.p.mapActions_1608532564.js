pMActions = function(){
	pMActions.superclass.constructor.apply(this, arguments);
};

utils.extend(pMActions, hPanel);


pMActions.prototype.calcName = function(){
	return 'actions';
};

pMActions.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

pMActions.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accResearch] = function(){
		if( !this.wasShown() )
			this.show();
	};
};

pMActions.prototype.canDisplay = function(){
	return Ability.mapBuild();
};

pMActions.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.deposit());
};

pMActions.prototype.calcChildren = function(){
	this.children.mode = bMapMode;
};


pMActions.prototype.getSide = function(){
	return 'top';
};

pMActions.prototype.doSwipe = function(pointDelta){
	if( !pointDelta || Math.abs(pointDelta.y||0) < 35 )
		return;
	
	if( pointDelta.y > 0 )
		this.toggleExpand();
};

pMActions.prototype.onToggleStart = function(){
	if( !this.parent.isReady() )
		return;
	
	this.setMapMode();
};


pMActions.prototype.setMapMode = function(){
	this.parent.inf.setMode(iMap.mode.type[this.isExpanded() ? 'build' : 'view']);
};





bMapMode.prototype.initOptions = Block.prototype.initOptions;

bMapMode.prototype.calcTmplFolder = function(){
	return tmplMgr.iMap.mapTL.mode;
};

utils.overrideMethod(bMapMode, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mapMode] = function(){
		if( this.map.mode.subtype || this.map.mode.type != 'build' || !this.map.tileSelect )
			return;
		
		this.wrp.find('.map_mode_imp_tab').first().trigger('click');
	};
});

bMapMode.prototype.modifyCont = function(){
	this.cont.removeClass('-hidden');
};


bMapMode.prototype.setMap = function(parent){
	this.map = parent.parent.map.map;
};

