TownScreen = function(id, data){
	TownScreen.superclass.constructor.apply(this, arguments);
};

utils.extend(TownScreen, InfScreenWnd);

WndMgr.regWnd('town', TownScreen);


TownScreen.prototype.calcName = function(){
	return 'town';
};

TownScreen.prototype.addNotif = function(){
	this.notif.other[Notif.ids.mobTownChildren] = function(){
		this.reInitChildren = true;
		
		this.show();
	};
};

TownScreen.prototype.calcChildren = function(){
	this.children.loadIndicator = bLoadIndicator;
	
	this.children.town = ls.getOldTown(false) ? bckTownOld : bckTown;
	
	this.children.swapSlot = bSwapSlot;

	this.children.info = bTownInfo;
	
	this.children.bonus = bMMenu_bonus;
	
	this.children.luck = bMMenu_luck;
    
	this.children.defence = bMMenu_defence;
	
	this.children.stock = pStock;
	
	this.children.garrison = pGarrison;
	
	if( ls.getOldTown(false) )
		this.children.bldqueue = pBldQueue;
};

TownScreen.prototype.afterContSet = function(){
	this.$zoomWrp = this.$contWrp.find('.town-zoom-wrp');
};

TownScreen.prototype.makeResize = function(){
	TownScreen.superclass.makeResize.apply(this, arguments);
	
	this.resizeZoom();
};

    TownScreen.prototype.resizeZoom = function(){
        var town = this.children.town,
            widthRatio = this.$contWrp.width() / town.sizeO.x,
            heightRatio = this.$contWrp.height() / town.sizeO.y;

        this.zoom.min = town.getMinRatio(widthRatio, heightRatio);

        this.setZoom(ls.getTownZoom(this.zoom.min));
    };

TownScreen.prototype.afterShow = function(){
	this.zoom.val = 0;
	
	this.setZoom(ls.getTownZoom(this.zoom.min));
	
	this.centerView();
};


TownScreen.prototype.prepareScreen = function(data){
	TownScreen.superclass.prepareScreen.apply(this, arguments);
	
	this.zoom = {max: 2, min: 0.5, val: 0.5};
};

TownScreen.prototype.hideCont = function(){
	TownScreen.superclass.hideCont.apply(this, arguments);
	
	this.stopDrawTown();
};

TownScreen.prototype.getSwipeContWidth = function($cont){
	return $cont.outerWidth(true);
};


TownScreen.prototype.onSwipeStart = function(){
	this.stopDrawTown();
	
	TownScreen.superclass.onSwipeStart.apply(this, arguments);
};

TownScreen.prototype.onScroll = function(){
	TownScreen.superclass.onScroll.apply(this, arguments);
	
	this.clearTimeout(this.startDrawTownTO);
	
	var town = this.children.town;
	
	if( !town || town.touchMoved || town.modeSwap || town.zooming || town.smoothZooming )
		return;
	
	this.stopDrawTown();
	
	this.startDrawTownTO = this.setTimeout(function(){
		this.startDrawTown(true);
	}, 50);
};

TownScreen.prototype.onSwipeBack = function(){
	this.startDrawTown(true);
};

TownScreen.prototype.onSwipeReset = function(byTouch){
	this.startDrawTown(byTouch);
};

TownScreen.prototype.onTop = function(){
	TownScreen.superclass.onTop.apply(this, arguments);
	
	this.startDrawTown(true);
};

TownScreen.prototype.onSetted = function(){
	notifMgr.runEvent(Notif.ids.townStartDrawView);
};


TownScreen.prototype.stopDrawTown = function(){
	if( this.children.town )
		this.children.town.stopDrawView();
};
	
TownScreen.prototype.startDrawTown = function(resetMoment){
	if( this.children.town )
		this.children.town.startDrawView(resetMoment);
};

TownScreen.prototype.centerView = function(){
	utils.getElemSize(this.wrp, {getSize: function(){}, callback: function(){
		var offsetX = (this.$cont.outerWidth(true) - this.$contWrp.width()) * 0.5,
			offsetY = (this.$cont.outerHeight(true) - this.$contWrp.height()) * 0.5,
			contWrp = this.$contWrp.get(0);
			
		if( offsetX > 0 )
			contWrp.scrollLeft = offsetX;
		if( offsetY > 0 )
			contWrp.scrollTop = offsetY;
	}.bind(this)});
};

TownScreen.prototype.moveViewTo = function(pos){
	if( !pos )
		return;
	
	var contWrp = this.$contWrp.get(0);
	
	contWrp.scrollLeft = (pos.x * this.zoom.val) - (this.$contWrp.width() * 0.5);
	contWrp.scrollTop = (pos.y * this.zoom.val)  - (this.$contWrp.height() * 0.5);
};

TownScreen.prototype.setZoom = function(zoom, ignore){
	if( ignore === true ) return this.zoom.val;
	
//	console.log('----> zoom', zoom);
	
	zoom = zoom||this.zoom.val;
	
	zoom = Math.max(zoom, this.zoom.min);
	
	zoom = Math.min(zoom, this.zoom.max);
	
	if( this.zoom.val == zoom )
		return zoom;
	
	this.zoom.val = zoom;
	
	this.$zoomWrp.css({transform: 'scale('+ zoom +')'});
	
	var zoomRect = utils.getElemSize(this.$zoomWrp, {getSize: function($zoomWrp){
		return $zoomWrp.get(0).getBoundingClientRect();
	}});
	
	this.$cont.css({width: zoomRect.width, height: zoomRect.height});
	
    this.$zoomWrp.find('.town2-bldEvents').css('transform', 'scale(' + Math.max(1 + (1 - zoom), 1) +')');
    
	ls.setTownZoom(zoom);
	
	return zoom;
};

TownScreen.prototype.setMinZoom = function(){
	this.setZoom(this.zoom.min);
};

TownScreen.prototype.getInfo = function(){
    return this.children.info;
};
    
    TownScreen.prototype.getAttacks = function(){
        return this.getInfo().getAttacks();
    };


TownScreen.prototype.update = iTown.prototype.update;





bTownInfo = function(){
	bTownInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(bTownInfo, Block);
	

bTownInfo.prototype.calcName = function(){
	return 'info';
};

bTownInfo.prototype.calcChildren = function(){
	this.children.attacks = bMMenu_attacks;
	
	this.children.pop = bMMenu_pop;
};

bTownInfo.prototype.getAttacks = function(){
    return this.children.attacks;
};
